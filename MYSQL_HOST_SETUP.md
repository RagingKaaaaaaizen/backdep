# MySQL Host Configuration Guide

## The Problem
Your backend deployment is failing because it's trying to connect to `localhost` for the MySQL database, but your MySQL database is hosted online (externally).

## How to Find Your MySQL Host

### Option 1: Check Your MySQL Provider
If you're using a MySQL hosting service, the host address is usually provided in your dashboard:

**Common MySQL Hosting Services:**
- **InfinityFree**: `sql.infinityfree.com` or `sql.your-domain.com`
- **000webhost**: `localhost` (but requires specific configuration)
- **Hostinger**: `your-domain.com` or `sql.your-domain.com`
- **cPanel**: Usually `your-domain.com` or `sql.your-domain.com`
- **phpMyAdmin**: Check the connection details in phpMyAdmin

### Option 2: Check Your MySQL Connection Details
1. Log into your MySQL hosting provider's dashboard
2. Look for "Database Host" or "MySQL Host"
3. It might look like:
   - `sql.infinityfree.com`
   - `your-domain.com`
   - `mysql.your-domain.com`
   - `sql.your-domain.com`

### Option 3: Test Common Host Patterns
Try these common patterns (replace with your actual domain):
- `sql.your-domain.com`
- `mysql.your-domain.com`
- `your-domain.com`
- `sql.infinityfree.com` (if using InfinityFree)

## Update Configuration

### Step 1: Update config.json
Replace `your-mysql-host.com` in `config.json` with your actual MySQL host:

```json
{
    "database": {
      "host": "YOUR_ACTUAL_MYSQL_HOST",
      "port": 3306,
      "user": "u875409848_vilar",
      "password": "6xw;kmmXC$",
      "database": "u875409848_vilar"
    }
}
```

### Step 2: Update Render Environment Variables
In your Render dashboard, update the `DATABASE_HOST` environment variable:

```
DATABASE_HOST=YOUR_ACTUAL_MYSQL_HOST
```

### Step 3: Test Connection
You can test the connection locally first:

```bash
# Install mysql2 globally
npm install -g mysql2

# Test connection
mysql -h YOUR_ACTUAL_MYSQL_HOST -u u875409848_vilar -p u875409848_vilar
```

## Common MySQL Hosting Services

### InfinityFree
- Host: `sql.infinityfree.com` or `sql.your-domain.com`
- Port: 3306

### 000webhost
- Host: Usually `localhost` but requires specific setup
- May need to use external host

### Hostinger
- Host: `your-domain.com` or `sql.your-domain.com`
- Port: 3306

### cPanel
- Host: `your-domain.com` or `sql.your-domain.com`
- Port: 3306

## Troubleshooting

### 1. Connection Refused
- Check if the host address is correct
- Verify the port (usually 3306)
- Make sure your MySQL provider allows external connections

### 2. Access Denied
- Verify username and password
- Check if the user has remote access privileges
- Some providers require specific IP whitelisting

### 3. Timeout
- The host address might be incorrect
- Check if your MySQL provider allows external connections
- Some free providers don't allow external connections

## Next Steps

1. **Find your MySQL host** using the methods above
2. **Update the configuration** with the correct host
3. **Redeploy** your backend on Render
4. **Test the connection** using the API endpoints

## Example Configuration
If your MySQL is hosted on InfinityFree with domain `myapp.infinityfreeapp.com`:

```json
{
    "database": {
      "host": "sql.myapp.infinityfreeapp.com",
      "port": 3306,
      "user": "u875409848_vilar",
      "password": "6xw;kmmXC$",
      "database": "u875409848_vilar"
    }
}
```

And in Render environment variables:
```
DATABASE_HOST=sql.myapp.infinityfreeapp.com
```

