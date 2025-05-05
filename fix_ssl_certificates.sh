#!/bin/bash

# Script to fix SSL certificate issues in Nginx
# This will connect to the server and fix SSL certificate configuration

# Variables - Update these with your specific Hostinger details
HOSTINGER_SSH_USER="root"
HOSTINGER_SSH_HOST="195.179.193.52"
NGINX_CONF_PATH="/etc/nginx/sites-available/ai.decyphers.com.conf"

# SSH into the server and fix SSL certificate issues
echo "Fixing SSL certificate issues..."
ssh $HOSTINGER_SSH_USER@$HOSTINGER_SSH_HOST "
  # 1. Check if Let's Encrypt certificates exist
  if [ -d /etc/letsencrypt/live/ai.decyphers.com ]; then
    echo 'Let\'s Encrypt certificates found.'
  else
    echo 'Let\'s Encrypt certificates not found. Installing certbot and generating certificates...'
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d ai.decyphers.com --non-interactive --agree-tos --email admin@decyphers.com
  fi
  
  # 2. Update Nginx configuration to use Let's Encrypt certificates
  echo 'Updating Nginx configuration...'
  cat > $NGINX_CONF_PATH << 'EOL'
server {
    listen 80;
    listen [::]:80;
    server_name ai.decyphers.com;
    
    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /home/decyphers-ai/htdocs/ai.decyphers.com/public;
        allow all;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ai.decyphers.com;

    root /home/decyphers-ai/htdocs/ai.decyphers.com/public;
    index index.html index.php;

    # Use Let's Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/ai.decyphers.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.decyphers.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1h;
    ssl_stapling off;
    
    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location ~* \.(css|js|jpg|jpeg|gif|png|ico|gz|svg|svgz|ttf|otf|woff|woff2|eot|mp4|ogg|ogv|webm|webp|zip|swf|map)$ {
        expires max;
        add_header Access-Control-Allow-Origin "*";
        access_log off;
        try_files $uri =404;
    }

    location /api/ {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTPS on;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOL
  
  # 3. Test Nginx configuration
  echo 'Testing Nginx configuration...'
  nginx -t
  
  # 4. Reload Nginx if configuration is valid
  if [ $? -eq 0 ]; then
    echo 'Reloading Nginx...'
    systemctl reload nginx
  else
    echo 'Nginx configuration test failed!'
  fi
"

echo "SSL certificate fix completed."
