#!/bin/bash

# Decyphers UI Deployment Script for Hostinger with Cloud Panel
# This script handles the deployment of both frontend and backend components

# Exit on error
set -e

echo "Starting deployment process for Decyphers UI..."

# Variables - Update these with your specific Hostinger details
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
FRONTEND_REMOTE_PATH="/home/htdocs/ai.decyphers.com/public"  # For the frontend (public web root)
BACKEND_REMOTE_PATH="/home/htdocs/ai.decyphers.com/backend"  # For the Laravel backend (outside public web root)

# Build the frontend
echo "Building frontend..."
npm install
npm run build

# Prepare the backend
echo "Preparing backend..."
cd backend/Decyphers-Backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ../..

# Create deployment archives
echo "Creating deployment packages..."
# Frontend archive (dist folder)
tar -czf frontend-deploy.tar.gz -C dist .

# Backend archive (excluding vendor, node_modules, and other large directories)
cd backend/Decyphers-Backend
tar -czf ../../backend-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=vendor/*/test \
    --exclude=vendor/*/tests \
    --exclude=vendor/*/docs \
    --exclude=storage/logs/* \
    --exclude=storage/app/* \
    --exclude=storage/framework/cache/* \
    --exclude=.git \
    .
cd ../..

# Create necessary directories on the server first
echo "Creating directory structure on the server..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "mkdir -p $FRONTEND_REMOTE_PATH $BACKEND_REMOTE_PATH $BACKEND_REMOTE_PATH/storage/logs $BACKEND_REMOTE_PATH/storage/app $BACKEND_REMOTE_PATH/storage/framework/cache $BACKEND_REMOTE_PATH/storage/framework/sessions $BACKEND_REMOTE_PATH/storage/framework/views"

# Deploy frontend
echo "Deploying frontend to Hostinger..."
scp frontend-deploy.tar.gz $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST:~/
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "tar -xzf ~/frontend-deploy.tar.gz -C $FRONTEND_REMOTE_PATH && rm ~/frontend-deploy.tar.gz"

# Deploy backend
echo "Deploying backend to Hostinger..."
scp backend-deploy.tar.gz $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST:~/
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "tar -xzf ~/backend-deploy.tar.gz -C $BACKEND_REMOTE_PATH && rm ~/backend-deploy.tar.gz"

# Create .env file if it doesn't exist
echo "Checking for .env file..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "if [ ! -f $BACKEND_REMOTE_PATH/.env ]; then 
  if [ -f $BACKEND_REMOTE_PATH/.env.example ]; then 
    cp $BACKEND_REMOTE_PATH/.env.example $BACKEND_REMOTE_PATH/.env
    echo '.env file created from example'
  else
    # Create a basic .env file if .env.example doesn't exist
    echo 'APP_NAME=Decyphers' > $BACKEND_REMOTE_PATH/.env
    echo 'APP_ENV=production' >> $BACKEND_REMOTE_PATH/.env
    echo 'APP_KEY=' >> $BACKEND_REMOTE_PATH/.env
    echo 'APP_DEBUG=false' >> $BACKEND_REMOTE_PATH/.env
    echo 'APP_URL=https://ai.decyphers.com' >> $BACKEND_REMOTE_PATH/.env
    echo 'LOG_CHANNEL=stack' >> $BACKEND_REMOTE_PATH/.env
    echo 'LOG_LEVEL=error' >> $BACKEND_REMOTE_PATH/.env
    echo 'DB_CONNECTION=mysql' >> $BACKEND_REMOTE_PATH/.env
    echo 'DB_HOST=localhost' >> $BACKEND_REMOTE_PATH/.env
    echo 'DB_PORT=3306' >> $BACKEND_REMOTE_PATH/.env
    echo 'DB_DATABASE=decyphers' >> $BACKEND_REMOTE_PATH/.env
    echo 'DB_USERNAME=root' >> $BACKEND_REMOTE_PATH/.env
    echo 'DB_PASSWORD=' >> $BACKEND_REMOTE_PATH/.env
    echo 'Basic .env file created manually'
  fi
else 
  echo '.env file already exists'
fi"

# Run Laravel post-deployment commands
echo "Running Laravel post-deployment commands..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "cd $BACKEND_REMOTE_PATH && composer install --no-dev --optimize-autoloader && php artisan key:generate --force && php artisan migrate --force"

# Set proper permissions
echo "Setting proper permissions..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "chmod -R 755 $BACKEND_REMOTE_PATH && find $BACKEND_REMOTE_PATH/storage -type d -exec chmod 775 {} \; && find $BACKEND_REMOTE_PATH/storage -type f -exec chmod 664 {} \; && chown -R $HOSTINGER_SSH_USER:www-data $BACKEND_REMOTE_PATH/storage"

# Clean up local deployment files
echo "Cleaning up local deployment files..."
rm frontend-deploy.tar.gz backend-deploy.tar.gz

echo "Deployment completed successfully!"
echo "Frontend: https://$HOSTINGER_SSH_HOST"
echo "Backend API: https://$HOSTINGER_SSH_HOST/api"
