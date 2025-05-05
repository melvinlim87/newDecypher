#!/bin/bash

# Script to fix directory structure on the Hostinger server
# This will ensure the paths match the Nginx configuration

# Variables - Update these with your specific Hostinger details
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
NGINX_PATH="/home/decyphers-ai/htdocs/ai.decyphers.com"
CURRENT_PATH="/home/htdocs/ai.decyphers.com"

# SSH into the server and fix directory structure
echo "Fixing directory structure on the server..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "
  # Create the directory structure if it doesn't exist
  mkdir -p $NGINX_PATH/public
  mkdir -p $NGINX_PATH/backend
  
  # If the current path exists, move contents to the new path
  if [ -d $CURRENT_PATH ]; then
    # Move frontend files
    if [ -d $CURRENT_PATH/public ]; then
      cp -r $CURRENT_PATH/public/* $NGINX_PATH/public/
      echo 'Frontend files copied to new location'
    fi
    
    # Move backend files
    if [ -d $CURRENT_PATH/backend ]; then
      cp -r $CURRENT_PATH/backend/* $NGINX_PATH/backend/
      echo 'Backend files copied to new location'
    fi
  else
    echo 'Current path does not exist, no files to move'
  fi
  
  # Set proper permissions
  chown -R decyphers-ai:decyphers-ai $NGINX_PATH
  chmod -R 755 $NGINX_PATH
  find $NGINX_PATH/backend/storage -type d -exec chmod 775 {} \;
  find $NGINX_PATH/backend/storage -type f -exec chmod 664 {} \;
  
  echo 'Directory structure fixed'
"

echo "Directory structure fix completed."
