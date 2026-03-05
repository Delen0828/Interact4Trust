#!/bin/bash

# Humidity Prediction Visualization Trust Study - Multi-Version Server Startup Script
# This script builds the project and starts a PHP server for data collection

# Build the project (creates multi-version structure in dist/)
npm run build

# Ensure data directory exists
mkdir -p dist/data
cp synthetic_*.json dist/
for dir in dist/version*; do
    [ -d "$dir" ] && cp dist/synthetic_*.json "$dir"/
done

# Start PHP server in dist directory
cd dist && php -S localhost:8011
