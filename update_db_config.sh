#!/bin/bash

# Script to update database configuration on the Hostinger server
# This will connect to the server and update the .env file with correct database credentials

# Variables - Update these with your specific Hostinger details
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
BACKEND_PATH="/home/htdocs/ai.decyphers.com/backend"

# SSH into the server and update the .env file
echo "Updating database configuration on the server..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "
  if [ -f $BACKEND_PATH/.env ]; then
    # Backup the current .env file
    cp $BACKEND_PATH/.env $BACKEND_PATH/.env.backup
    
    # Update database credentials in the .env file
    sed -i 's/DB_HOST=.*/DB_HOST=localhost/g' $BACKEND_PATH/.env
    sed -i 's/DB_PORT=.*/DB_PORT=3306/g' $BACKEND_PATH/.env
    sed -i 's/DB_DATABASE=.*/DB_DATABASE=decyphers/g' $BACKEND_PATH/.env
    sed -i 's/DB_USERNAME=.*/DB_USERNAME=decyphers/g' $BACKEND_PATH/.env
    sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=pE6HAuLKXJHOO9mLnOy/g' $BACKEND_PATH/.env
    
    echo 'Database configuration updated successfully'
    
    # Run migrations again
    cd $BACKEND_PATH
    php artisan migrate --force
  else
    echo 'Error: .env file not found'
    
    # Create a new .env file with the correct database credentials
    echo 'APP_NAME=Decyphers' > $BACKEND_PATH/.env
    echo 'APP_ENV=production' >> $BACKEND_PATH/.env
    echo 'APP_DEBUG=false' >> $BACKEND_PATH/.env
    echo 'APP_URL=https://ai.decyphers.com' >> $BACKEND_PATH/.env
    echo 'LOG_CHANNEL=stack' >> $BACKEND_PATH/.env
    echo 'LOG_LEVEL=error' >> $BACKEND_PATH/.env
    echo 'DB_CONNECTION=mysql' >> $BACKEND_PATH/.env
    echo 'DB_HOST=localhost' >> $BACKEND_PATH/.env
    echo 'DB_PORT=3306' >> $BACKEND_PATH/.env
    echo 'DB_DATABASE=decyphers' >> $BACKEND_PATH/.env
    echo 'DB_USERNAME=decyphers' >> $BACKEND_PATH/.env
    echo 'DB_PASSWORD=pE6HAuLKXJHOO9mLnOy' >> $BACKEND_PATH/.env
    
    echo 'New .env file created with correct database credentials'
    
    # Generate application key and run migrations
    cd $BACKEND_PATH
    php artisan key:generate --force
    php artisan migrate --force
  fi
"

echo "Database configuration update completed."
