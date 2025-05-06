#!/bin/bash

# Script to apply the updated Nginx configuration
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
NGINX_CONF_PATH="/etc/nginx/sites-available/ai.decyphers.com.conf"

# Upload the configuration file to the server
echo "Uploading Nginx configuration..."
scp updated_nginx_config.conf $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST:~/

# SSH into the server and apply the configuration
echo "Applying Nginx configuration..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "
  # 1. Move the Nginx configuration file
  mv ~/updated_nginx_config.conf $NGINX_CONF_PATH
  
  # 2. Ensure the Laravel backend directory exists
  mkdir -p /home/decyphers-ai/htdocs/newDecypher/backend/public
  
  # 3. Create a test index.php file in the backend public directory if it doesn't exist
  if [ ! -f /home/decyphers-ai/htdocs/newDecypher/backend/public/index.php ]; then
    echo 'Creating test index.php file in backend public directory...'
    cat > /home/decyphers-ai/htdocs/newDecypher/backend/public/index.php << 'PHP_EOL'
<?php
header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Laravel API is working!']);
PHP_EOL
  fi
  
  # 4. Set proper permissions
  chown -R decyphers-ai:www-data /home/decyphers-ai/htdocs/newDecypher
  chmod -R 755 /home/decyphers-ai/htdocs/newDecypher
  
  # 5. Restart PHP-FPM
  systemctl restart php8.2-fpm
  
  # 6. Test Nginx configuration
  echo 'Testing Nginx configuration...'
  nginx -t
  
  # 7. Reload Nginx if configuration is valid
  if [ \$? -eq 0 ]; then
    echo 'Reloading Nginx...'
    systemctl reload nginx
  else
    echo 'Nginx configuration test failed!'
  fi
"

echo "Nginx configuration applied."
