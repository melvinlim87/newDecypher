#!/bin/bash

# Script to set up Nginx configuration on the Hostinger server
# This will connect to the server and set up the Nginx configuration

# Variables - Update these with your specific Hostinger details
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
NGINX_CONF_PATH="/etc/nginx/sites-available/ai.decyphers.com.conf"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/ai.decyphers.com.conf"

# Copy the Nginx configuration file to the server
echo "Copying Nginx configuration to the server..."
scp nginx.conf $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST:$NGINX_CONF_PATH

# SSH into the server and set up Nginx
echo "Setting up Nginx on the server..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "
  # Create symbolic link to enable the site if it doesn't exist
  if [ ! -f $NGINX_ENABLED_PATH ]; then
    ln -s $NGINX_CONF_PATH $NGINX_ENABLED_PATH
    echo 'Nginx site enabled'
  else
    echo 'Nginx site already enabled'
  fi
  
  # Check Nginx configuration
  nginx -t
  
  # Reload Nginx if configuration is valid
  if [ \$? -eq 0 ]; then
    systemctl reload nginx
    echo 'Nginx reloaded successfully'
  else
    echo 'Nginx configuration test failed'
  fi
"

echo "Nginx setup completed."
