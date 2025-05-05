#!/bin/bash

# Script to check backend configuration and fix PHP-FPM issues
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
BACKEND_PATH="/home/decyphers-ai/htdocs/newDecypher/backend"

# SSH into the server and check backend configuration
echo "Checking backend configuration..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "
  # 1. Check if backend directory exists
  if [ -d $BACKEND_PATH ]; then
    echo 'Backend directory exists.'
  else
    echo 'Backend directory does not exist!'
    exit 1
  fi
  
  # 2. Check PHP-FPM service
  echo 'Checking PHP-FPM service...'
  systemctl status php8.2-fpm
  
  # 3. Restart PHP-FPM service
  echo 'Restarting PHP-FPM service...'
  systemctl restart php8.2-fpm
  
  # 4. Check Nginx configuration for PHP
  echo 'Checking Nginx configuration...'
  grep -r 'fastcgi_pass' /etc/nginx/
  
  # 5. Check Laravel logs
  echo 'Checking Laravel logs...'
  if [ -f $BACKEND_PATH/storage/logs/laravel.log ]; then
    tail -n 50 $BACKEND_PATH/storage/logs/laravel.log
  else
    echo 'Laravel log file not found!'
  fi
  
  # 6. Check Nginx error logs
  echo 'Checking Nginx error logs...'
  tail -n 50 /var/log/nginx/error.log
  
  # 7. Fix permissions
  echo 'Fixing permissions...'
  chown -R decyphers-ai:www-data $BACKEND_PATH
  chmod -R 755 $BACKEND_PATH
  find $BACKEND_PATH/storage -type d -exec chmod 775 {} \;
  find $BACKEND_PATH/storage -type f -exec chmod 664 {} \;
  
  # 8. Create .env file if it doesn't exist
  if [ ! -f $BACKEND_PATH/.env ]; then
    echo 'Creating .env file...'
    cat > $BACKEND_PATH/.env << 'EOL'
APP_NAME=Decyphers
APP_ENV=production
APP_KEY=
APP_DEBUG=true
APP_URL=https://ai.decyphers.com

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=decyphers
DB_USERNAME=decyphers
DB_PASSWORD=pE6HAuLKXJHOO9mLnOy
EOL
    
    # Generate application key
    cd $BACKEND_PATH
    php artisan key:generate --force
  fi
  
  # 9. Clear Laravel caches
  echo 'Clearing Laravel caches...'
  cd $BACKEND_PATH
  php artisan config:clear
  php artisan cache:clear
  php artisan route:clear
  php artisan view:clear
  
  # 10. Check if index.php exists in public directory
  if [ -f $BACKEND_PATH/public/index.php ]; then
    echo 'Laravel public/index.php exists.'
  else
    echo 'Laravel public/index.php does not exist!'
  fi
"

echo "Backend check completed."
