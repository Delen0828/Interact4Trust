#!/bin/bash

# Air Quality Prediction Visualization Trust Study - Multi-Version Server Startup Script
# This script builds the project and starts a PHP server for data collection

# Build the project (creates multi-version structure in dist/)
npm run build

# Ensure data directory exists
mkdir -p dist/data
cp synthetic_*.json dist/
for i in {1..9}; do cp dist/synthetic_*.json dist/version$i/; done

# Start PHP server in dist directory
cd dist && php -S localhost:8010