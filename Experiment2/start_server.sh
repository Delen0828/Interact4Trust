#!/bin/bash

# Humidity Prediction Visualization Trust Study - Experiment 2
# Six-Version Server Startup Script

# Build the project (creates multi-version structure in dist/)
npm run build

# Ensure generated datasets are available
mkdir -p dist/generated
cp generated/*.json dist/generated/
cp synthetic_*.json dist/

# Copy datasets into version folders so relative paths also resolve there.
for v in even_hover odd_hover even_click odd_click even_static odd_static; do
  if [ -d "dist/${v}" ]; then
    mkdir -p "dist/${v}/generated"
    cp dist/generated/*.json "dist/${v}/generated/"
    cp dist/synthetic_*.json "dist/${v}/"
  fi
done

# Start PHP server in dist directory
cd dist && php -S localhost:8010
