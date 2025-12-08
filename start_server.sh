#!/bin/bash

# Air Quality Prediction Visualization Trust Study - Server Startup Script
# This script builds the project and starts a PHP server for data collection

echo "=== Air Quality Study Server Startup ==="
echo "Building the project..."

# Build the project (copies files to dist/)
npm run build

echo "Copying PHP files to dist..."
# Ensure PHP files are in dist
if [ ! -f "dist/save_data.php" ]; then
    cp save_data.php dist/
fi

if [ ! -f "dist/complete_study.php" ]; then
    cp complete_study.php dist/
fi

# Ensure data directory exists
mkdir -p dist/data

echo "Starting PHP server on localhost:8000..."
echo "Open http://localhost:8864 in your browser to access the experiment"
echo "Data will be saved in dist/data/ directory"
echo "Press Ctrl+C to stop the server"
echo ""

# Start PHP server in dist directory
cd dist && php -S localhost:8864