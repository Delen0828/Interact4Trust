#!/bin/bash

# Air Quality Prediction Visualization Trust Study - Multi-Version Server Startup Script
# This script builds the project and starts a PHP server for data collection

echo "=== Air Quality Study Multi-Version Server Startup ==="
echo "Building the multi-version project..."

# Build the project (creates multi-version structure in dist/)
npm run build

echo "Multi-version structure created:"
echo "  dist/version1/ through dist/version9/ - Individual experimental conditions"
echo "  dist/src/ - Common source files"
echo "  dist/node_modules/ - JavaScript libraries"
echo "  dist/data/ - Data collection directory"

# Ensure data directory exists
mkdir -p dist/data
cp synthetic_*.json dist/
for i in {1..9}; do cp dist/synthetic_*.json dist/version$i/; done

echo ""
echo "Starting PHP server on localhost:8010..."
echo ""
echo "🌐 AVAILABLE URLS:"
echo "  Index Page:    http://localhost:8010/ (shows all versions)"
echo ""
echo "  DIRECT EXPERIMENT ACCESS (use trailing slash):"
echo "  Version 1:     http://localhost:8010/version1/  (Baseline)"
echo "  Version 2:     http://localhost:8010/version2/  (PI Plot)"
echo "  Version 3:     http://localhost:8010/version3/  (Ensemble Plot)"
echo "  Version 4:     http://localhost:8010/version4/  (Ensemble + Hover)"
echo "  Version 5:     http://localhost:8010/version5/  (PI Plot + Hover)"
echo "  Version 6:     http://localhost:8010/version6/  (PI → Ensemble)"
echo "  Version 7:     http://localhost:8010/version7/  (Buggy Control)"
echo "  Version 8:     http://localhost:8010/version8/  (Bad Control)"
echo "  Version 9:     http://localhost:8010/version9/  (Combined PI + Ensemble)"
echo ""
echo "📊 Data will be saved in dist/data/ directory"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start PHP server in dist directory
cd dist && php -S localhost:8010