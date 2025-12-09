#!/bin/bash
# Air Quality Study - AWS Multi-Version Deployment Script
npm run build
# Ensure data directory exists
mkdir -p dist/data
cp synthetic_*.json dist/
for i in {1..9}; do cp dist/synthetic_*.json dist/version$i/; done
pm2 start "php -S 0.0.0.0:8001 -t dist" --name php-server
