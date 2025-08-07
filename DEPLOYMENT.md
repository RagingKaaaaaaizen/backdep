# Backend Deployment Guide for Render

## Prerequisites
- Render account
- Online MySQL database (already configured)

## Deployment Steps

1. **Connect your GitHub repository to Render**
   - Go to Render Dashboard
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the `Watcha_lingan_guli_guli` directory

2. **Configure Environment Variables**
   In Render dashboard, add these environment variables:
   ```
   NODE_ENV=production
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_USER=u875409848_vilar
   DATABASE_PASSWORD=6xw;kmmXC$
   DATABASE_NAME=u875409848_vilar
   ```

3. **Build and Deploy Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

## API Endpoints
Your API will be available at: `https://your-app-name.onrender.com`

- Authentication: `/api/accounts`
- Employees: `/api/employees`
- Departments: `/api/departments`
- Workflows: `/api/workflows`
- Requests: `/api/requests`
- Brands: `/api/brands`
- Categories: `/api/categories`
- Items: `/api/items`
- Stocks: `/api/stocks`
- Storage Locations: `/api/storage-locations`
- PCs: `/api/pcs`
- PC Components: `/api/pc-components`
- Room Locations: `/api/room-locations`
- Specifications: `/api/specifications`
- Dispose: `/api/dispose`
- API Documentation: `/api-docs`

## Database
The application will automatically connect to your online MySQL database using the credentials provided.
