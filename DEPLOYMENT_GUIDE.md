# Decyphers UI Deployment Guide for Hostinger with Cloud Panel

This guide provides step-by-step instructions for deploying the Decyphers UI application (React frontend and Laravel backend) to Hostinger with Cloud Panel.

## Prerequisites

- Hostinger account with Cloud Panel access
- SSH access to your Hostinger server
- Git installed on your local machine
- Node.js (v18+) and npm installed on your local machine
- Composer installed on your local machine

## Deployment Overview

The deployment process involves:
1. Preparing the frontend (React/Vite) and backend (Laravel) for production
2. Setting up the server environment on Hostinger
3. Deploying both components to the server
4. Configuring the web server

## Step 1: Prepare Your Hostinger Server

1. Log in to your Hostinger Cloud Panel
2. Set up a new PHP website (if not already done)
3. Make sure PHP version 8.1+ is selected
4. Enable SSH access if not already enabled
5. Note your SSH credentials (username, hostname, password/key)

## Step 2: Configure the Database

1. In Cloud Panel, go to "MySQL Databases"
2. Create a new database for your application
3. Create a database user and assign it to the database
4. Note the database credentials (name, username, password, host)

## Step 3: Update the Deployment Script

Edit the `deploy.sh` script and update the following variables:

```bash
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
FRONTEND_REMOTE_PATH="/home/htdocs/ai.decyphers.com/public"  # For the frontend (public web root)
BACKEND_REMOTE_PATH="/home/htdocs/ai.decyphers.com/backend"  # For the Laravel backend (outside public web root)
```

## Step 4: Configure Environment Variables

Create a `.env.production` file in your project root with the necessary environment variables:

```
# Frontend environment variables
VITE_API_URL=https://yourdomain.com/api
VITE_CHART_IMG_API_KEY=your_chart_img_api_key

# Any other frontend environment variables
```

Create a `.env.production` file in the `backend/Decyphers-Backend` directory:

```
APP_NAME=Decyphers
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_username
DB_PASSWORD=your_database_password

# Other Laravel environment variables
```

## Step 5: Configure Nginx on Hostinger

Create a custom Nginx configuration for your application. In Cloud Panel:

1. Go to "Websites" > Your Domain > "Advanced" > "Nginx Configuration"
2. Add the following configuration:

```nginx
# Frontend configuration
location / {
    root /home/htdocs/ai.decyphers.com/public;
    try_files $uri $uri/ /index.html;
    index index.html;
}

# Backend API configuration
location /api {
    root /home/htdocs/ai.decyphers.com/backend/public;
    try_files $uri $uri/ /index.php?$query_string;
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}

# Deny access to sensitive files
location ~ /\.(?!well-known).* {
    deny all;
}
```

## Step 6: Run the Deployment

1. Make sure you have SSH access to your Hostinger server
2. Run the deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Step 7: Post-Deployment Tasks

After deployment, you'll need to:

1. Generate a Laravel application key (if not already done):
   ```
   ssh root@195.179.193.52 "cd /home/htdocs/ai.decyphers.com/backend && php artisan key:generate"
   ```

2. Set up the Laravel scheduler (if needed):
   ```
   ssh root@195.179.193.52 "crontab -e"
   ```
   
   Add this line:
   ```
   * * * * * cd /home/htdocs/ai.decyphers.com/backend && php artisan schedule:run >> /dev/null 2>&1
   ```

3. Configure SSL for your domain through Hostinger Cloud Panel

## Troubleshooting

### Common Issues:

1. **Permission Errors**: If you encounter permission issues, run:
   ```
   ssh root@195.179.193.52 "chmod -R 755 /home/htdocs/ai.decyphers.com/backend && find /home/htdocs/ai.decyphers.com/backend/storage -type d -exec chmod 775 {} \; && find /home/htdocs/ai.decyphers.com/backend/storage -type f -exec chmod 664 {} \;"
   ```

2. **Database Connection Issues**: Verify your database credentials in the `.env` file.

3. **API Not Found Errors**: Make sure your Nginx configuration is correctly routing API requests.

4. **CORS Issues**: Update the allowed origins in your Laravel CORS configuration and in your Express server.

## Maintenance

For future updates:

1. Make changes to your codebase locally
2. Test thoroughly
3. Run the deployment script again to update your production environment

## Monitoring

Monitor your application using Hostinger's built-in tools:
- Resource usage in Cloud Panel
- Error logs in `/home/htdocs/ai.decyphers.com/logs`
- Laravel logs in `/home/htdocs/ai.decyphers.com/backend/storage/logs`
