#!/bin/bash

# Humidity Prediction Visualization Trust Study - Experiment 2
# Single-Version Server Startup Script

# Build the project (creates multi-version structure in dist/)
npm run build

# Ensure generated datasets are available
mkdir -p dist/generated
cp generated/*.json dist/generated/
cp synthetic_*.json dist/

# Copy datasets into version1 so relative paths also resolve there.
if [ -d "dist/version1" ]; then
  mkdir -p dist/version1/generated
  cp dist/generated/*.json dist/version1/generated/
  cp dist/synthetic_*.json dist/version1/
fi

# Start PHP server in dist directory
cd dist && php -S localhost:8010
