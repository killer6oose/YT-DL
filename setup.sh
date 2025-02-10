#!/bin/bash

echo "====================================="
echo "  Setting Up CronoTech YTDL Service  "
echo "====================================="

# Prompt for the user to run the service as
read -p "Enter the user to run the service as (default: $USER): " service_user
service_user=${service_user:-$USER}

# Prompt for the app directory (default: current directory)
read -p "Enter the application directory (default: $(pwd)): " app_dir
app_dir=${app_dir:-$(pwd)}

# Prompt for the Node.js executable path
read -p "Enter the Node.js executable path (default: /usr/bin/node): " node_path
node_path=${node_path:-/usr/bin/node}

# Create systemd service file
service_file="/etc/systemd/system/ctechytdl.service"

echo "Creating systemd service file at $service_file..."
sudo tee $service_file > /dev/null <<EOL
[Unit]
Description=CronoTech YT-DL Service
After=network.target

[Service]
ExecStart=$node_path $app_dir/app.js
WorkingDirectory=$app_dir
Restart=always
User=$service_user
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
StandardOutput=append:/var/log/ytdl.log
StandardError=append:/var/log/ytdl-error.log

[Install]
WantedBy=multi-user.target
EOL

echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Enabling the service to start on boot..."
sudo systemctl enable ctechytdl.service

echo "Starting the service..."
sudo systemctl start ctechytdl.service

echo "Checking service status..."
sudo systemctl status ctechytdl.service --no-pager

# Ask user if they want to set up NGINX reverse proxy
read -p "Do you want to set up an NGINX reverse proxy? (y/n): " setup_nginx
if [[ "$setup_nginx" == "y" ]]; then
    read -p "Enter the domain or IP for the proxy (default: yourdomain.com): " domain
    domain=${domain:-yourdomain.com}

    nginx_conf="/etc/nginx/sites-available/ytdl"

    echo "Creating NGINX configuration..."
    sudo tee $nginx_conf > /dev/null <<EOL
    server {
        listen 80;
        server_name $domain;

        location / {
            proxy_pass http://localhost:3000/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
    EOL

    echo "Enabling the NGINX configuration..."
    sudo ln -s $nginx_conf /etc/nginx/sites-enabled/

    echo "Testing NGINX configuration..."
    sudo nginx -t

    echo "Restarting NGINX..."
    sudo systemctl restart nginx

    echo "NGINX setup complete! Your site should be accessible at http://$domain"
fi

echo "====================================="
echo "  Setup Complete! Service is running."
echo "====================================="
