#!/bin/bash

# Exit on error
set -e

# Get current timestamp for versioning
NOW=$(date +%s)

# Build the Docker image
echo "Building Docker image..."
cloudron build

# Update the app on Cloudron
echo "Updating app on Cloudron..."
cloudron update

echo "Deployment completed successfully!" 