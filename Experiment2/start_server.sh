#!/bin/bash

# Humidity Prediction Visualization Trust Study - Experiment 2
# Multi-Version Server Startup Script

# Build the project (creates multi-version structure in dist/)
npm run build

# Ensure data directory exists
mkdir -p dist/data
cp synthetic_*.json dist/
for i in {1..12}; do [ -d "dist/version$i" ] && cp dist/synthetic_*.json dist/version$i/; done

# Start PHP server in dist directory
cd dist && php -S localhost:8010
