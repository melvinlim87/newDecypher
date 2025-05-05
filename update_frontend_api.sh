# Create a .env.production file with the correct API URL for production deployment

# Variables - Update these with your specific Hostinger details
$PRODUCTION_API_URL = "https://ai.decyphers.com/api"

# Create or update the .env.production file
Write-Output "Creating .env.production file with production API URL..."
Set-Content -Path ".env.production" -Value "VITE_BACKEND_URL=$PRODUCTION_API_URL"
Add-Content -Path ".env.production" -Value "VITE_API_URL=$PRODUCTION_API_URL"

Write-Output "Frontend API URL update completed."
Write-Output "Now when you build the frontend, it will use $PRODUCTION_API_URL as the API endpoint."
Write-Output "Run 'npm run build' to rebuild the frontend with the updated API URL."
