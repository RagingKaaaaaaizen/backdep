const db = require('../_helpers/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config.json');
const { Op } = require('sequelize');
const sendEmail = require('../_helpers/send-email');
const Role = require('../_helpers/role');

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    activateAccount,
    deactivateAccount
};

// Helper function to check if database is available
function checkDatabase() {
    if (!db.Account) {
        throw { 
            message: 'Database connection is currently unavailable. This is likely because your MySQL hosting provider is blocking external connections from Render. Please contact your hosting provider to enable external MySQL connections from Render.com for your database at 153.92.15.31.' 
        };
    }
}

async function authenticate({ email, password, ipAddress }) {
    checkDatabase();
    
    // Always lowercase emails for consistency
    email = email.toLowerCase();

    const account = await db.Account.scope('withHash').findOne({ where: { email } });

    if (!account) {
        throw { message: 'No account found with this email' };
    }

    // Check if account is verified (use actual verified field, not virtual)
    if (!account.verified && account.verificationToken) {
        throw { message: 'Email is not verified. Please check your inbox.' };
    }

    if (account.status !== 'Active') {
        throw { message: 'Account is inactive. Please contact support or admin.' };
    }

    const passwordMatch = await bcrypt.compare(password, account.passwordHash);
    if (!passwordMatch) {
        throw { message: 'Password is incorrect' };
    }

    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);
    await refreshToken.save();

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    checkDatabase();
    
    const refreshToken = await getRefreshToken(token);
    const account = await refreshToken.getAccount();

    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    const jwtToken = generateJwtToken(account);

    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }) {
    checkDatabase();
    
    const refreshToken = await getRefreshToken(token);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    checkDatabase();
    
    // Normalize email to lowercase
    params.email = params.email.toLowerCase();

    if (await db.Account.findOne({ where: { email: params.email } })) {
        return await sendAlreadyRegisteredEmail(params.email, origin);
    }

    const account = new db.Account(params);
    const isFirstAccount = (await db.Account.count()) === 0;
    account.role = isFirstAccount ? Role.SuperAdmin : Role.Viewer;
    account.passwordHash = await hash(params.password);

    if (isFirstAccount) {
        // First user: bypass verification, set as verified and active
        account.verified = new Date();
        account.status = 'Active';
        account.verificationToken = null;
        account.acceptTerms = true;
    } else {
        // Other users: require email verification
        account.verificationToken = randomTokenString();
        account.status = 'Inactive'; // Set as inactive until verified
    }

    await account.save();
    
    if (isFirstAccount) {
        // First user: no email verification needed
        return { message: "Registration successful! You are now logged in as SuperAdmin." };
    } else {
        // Other users: send verification email
        await sendVerificationEmail(account, origin);
        return { message: "Registration successful, please check your email for verification instructions" };
    }
}

async function verifyEmail({ token }) {
    checkDatabase();
    
    const account = await db.Account.findOne({ where: { verificationToken: token } });
    if (!account) throw 'Verification failed';

    // Set verified date and clear token
    account.verified = new Date();
    account.verificationToken = null;
    await account.save();
}

async function forgotPassword({ email }, origin) {
    checkDatabase();
    
    email = email.toLowerCase();
    const account = await db.Account.findOne({ where: { email } });
    if (!account) return;

    account.resetToken = randomTokenString();
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();
    await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
    checkDatabase();
    
    const account = await db.Account.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() }
        }
    });

    if (!account) throw 'Invalid token';
    return account;
}

async function resetPassword({ token, password }) {
    checkDatabase();
    
    const account = await validateResetToken({ token });
    account.passwordHash = await hash(password);
    account.passwordReset = new Date();
    account.resetToken = null;
    await account.save();
}

async function getAll() {
    checkDatabase();
    
    const accounts = await db.Account.findAll();
    return accounts.map(x => basicDetails(x));
}

async function getById(id) {
    checkDatabase();
    
    const account = await getAccount(id);
    return basicDetails(account);
}

async function create(params) {
    checkDatabase();
    
    params.email = params.email.toLowerCase();

    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw { message: 'Email "' + params.email + '" is already registered' };
    }

    const account = new db.Account(params);
    account.verified = new Date();
    account.status = 'Active';
    account.passwordHash = await hash(params.password);
    await account.save();

    return basicDetails(account);
}

async function update(id, params) {
    checkDatabase();
    
    const account = await getAccount(id);

    if (params.email) params.email = params.email.toLowerCase();

    if (params.email && account.email !== params.email && await db.Account.findOne({ where: { email: params.email } })) {
        throw { message: 'Email "' + params.email + '" is already taken' };
    }

    if (params.password) {
        params.passwordHash = await hash(params.password);
    }

    if (typeof params.status !== 'undefined') {
        if (params.status !== 'Active' && params.status !== 'Inactive') {
            throw { message: 'Invalid status value. Must be either Active or Inactive' };
        }
        account.status = params.status;
    }

    Object.assign(account, params);
    account.updated = new Date();
    await account.save();

    return basicDetails(account);
}

async function _delete(id) {
    checkDatabase();
    
    const account = await getAccount(id);
    await account.destroy();
}

async function activateAccount(id) {
    checkDatabase();
    
    const account = await getAccount(id);
    account.status = 'Active';
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

async function deactivateAccount(id) {
    checkDatabase();
    
    const account = await getAccount(id);
    account.status = 'Inactive';
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

// Helper functions

async function getAccount(id) {
    checkDatabase();
    
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getRefreshToken(token) {
    checkDatabase();
    
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(account) {
    // include role in JWT payload for quick checks
    return jwt.sign({ sub: account.id, id: account.id, role: account.role }, config.secret, { expiresIn: '15m' });
}

function generateRefreshToken(account, ipAddress) {
    return new db.RefreshToken({
        accountId: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account) {
    const { id, title, firstName, lastName, email, role, created, updated, isVerified, status } = account;
    return { id, title, firstName, lastName, email, role, created, updated, isVerified, status };
}

async function sendVerificationEmail(account, origin) {
    checkDatabase();
    
    let message;
    if (origin) {
        const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
        message = `<p>Please click the below link to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <code>/account/verify-email</code> API route:</p><p><code>${account.verificationToken}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Verify Email',
        html: `<h4>Verify Email</h4><p>Thanks for registering!</p>${message}`
    });
}

async function sendAlreadyRegisteredEmail(email, origin) {
    checkDatabase();
    
    let message;
    if (origin) {
        message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`;
    } else {
        message = `<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> API route.</p>`;
    }

    await sendEmail({
        to: email,
        subject: 'Sign-up Verification API - Email Already Registered',
        html: `<h4>Email Already Registered</h4><p>Your email <strong>${email}</strong> is already registered.</p>${message}`
    });
}

async function sendPasswordResetEmail(account, origin) {
    checkDatabase();
    
    let message;
    if (origin) {
        const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
        message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> API route:</p><p><code>${account.resetToken}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password Email</h4>${message}`
    });
}
