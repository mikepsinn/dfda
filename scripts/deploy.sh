#!/bin/bash

# Navigate to project directory
cd ~/decentralized-fda

# Pull the latest changes
git pull origin main

# Install dependencies at root
pnpm install

# Navigate to web app directory
cd apps/web

# Build the Next.js app
pnpm build

# Restart the app with PM2
pm2 restart dfda-web || pm2 start pnpm --name "dfda-web" -- start
