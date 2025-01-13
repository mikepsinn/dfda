#!/bin/bash

# Update package index
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js version
node -v
npm -v

# Install pnpm globally
npm install -g pnpm

# Install PM2 globally
pnpm add -g pm2

# Set up directories and permissions (optional)
mkdir -p /var/www/your-app
chown -R ubuntu:ubuntu /var/www/your-app

# Install Git if not already installed
sudo apt install -y git

echo "Provisioning complete."
