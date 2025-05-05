#!/bin/bash

# Script to fix common Laravel 500 Internal Server Error issues
# This will connect to the server and check/fix common issues

# Variables - Update these with your specific Hostinger details
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
BACKEND_PATH="/home/decyphers-ai/htdocs/ai.decyphers.com/backend"

# SSH into the server and fix common issues
echo "Checking and fixing common Laravel 500 error issues..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "
  # 1. Check if the backend directory exists
  if [ ! -d $BACKEND_PATH ]; then
    echo 'Backend directory does not exist!'
    exit 1
  fi

  # 2. Fix storage directory permissions
  echo 'Fixing storage directory permissions...'
  chmod -R 775 $BACKEND_PATH/storage
  chown -R decyphers-ai:www-data $BACKEND_PATH/storage
  
  # 3. Fix bootstrap/cache directory permissions
  echo 'Fixing bootstrap/cache directory permissions...'
  chmod -R 775 $BACKEND_PATH/bootstrap/cache
  chown -R decyphers-ai:www-data $BACKEND_PATH/bootstrap/cache
  
  # 4. Check if .env file exists
  if [ ! -f $BACKEND_PATH/.env ]; then
    echo '.env file does not exist! Creating a basic one...'
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

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=\"hello@example.com\"
MAIL_FROM_NAME=\"\${APP_NAME}\"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME=\"\${APP_NAME}\"
VITE_PUSHER_APP_KEY=\"\${PUSHER_APP_KEY}\"
VITE_PUSHER_HOST=\"\${PUSHER_HOST}\"
VITE_PUSHER_PORT=\"\${PUSHER_PORT}\"
VITE_PUSHER_SCHEME=\"\${PUSHER_SCHEME}\"
VITE_PUSHER_APP_CLUSTER=\"\${PUSHER_APP_CLUSTER}\"
EOL
  fi
  
  # 5. Generate application key if not already set
  echo 'Generating application key...'
  cd $BACKEND_PATH
  php artisan key:generate --force
  
  # 6. Clear Laravel caches
  echo 'Clearing Laravel caches...'
  php artisan cache:clear
  php artisan config:clear
  php artisan route:clear
  php artisan view:clear
  
  # 7. Check PHP extensions
  echo 'Checking PHP extensions...'
  php -m
  
  # 8. Check Laravel logs for errors
  echo 'Checking Laravel logs for errors...'
  tail -n 50 $BACKEND_PATH/storage/logs/laravel.log
  
  # 9. Check Nginx error logs
  echo 'Checking Nginx error logs...'
  tail -n 50 /var/log/nginx/error.log
"

echo "Laravel 500 error fix completed."
