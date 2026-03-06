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

# Ensure generated phase datasets are available in dist and each version folder.
mkdir -p dist/generated
cp generated/*.json dist/generated/
for dir in dist/version*; do
    if [ -d "$dir" ]; then
        mkdir -p "$dir/generated"
        cp dist/generated/*.json "$dir/generated"/
    fi
done

# Start PHP server in dist directory
cd dist && php -S localhost:8011
