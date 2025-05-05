#!/bin/bash

# Bash script to update the API URL for production deployment

# Set the production API URL
PRODUCTION_API_URL="https://ai.decyphers.com/api"

# Create or update the .env.production file
echo "Creating .env.production file with production API URL..."
echo "VITE_BACKEND_URL=$PRODUCTION_API_URL" > .env.production
echo "VITE_API_URL=$PRODUCTION_API_URL" >> .env.production

echo "Frontend API URL update completed."
echo "Now when you build the frontend, it will use $PRODUCTION_API_URL as the API endpoint."
echo "Run 'npm run build' to rebuild the frontend with the updated API URL."
