#!/bin/bash

# GlitchTest server startup script
# Builds the project and starts a PHP server for data collection.

# Build the project into dist/
npm run build

# Ensure runtime directories and assets exist after the build.
mkdir -p dist/data
cp synthetic_stock_data_norm.json dist/

# Start PHP server in dist directory
cd dist && php -S localhost:8011
