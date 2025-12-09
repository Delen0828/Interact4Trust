#!/bin/bash
# Air Quality Study - AWS Multi-Version Deployment Script

echo "=== Air Quality Study Multi-Version AWS Deployment ==="

# Delete running pm2 php server
echo "Stopping existing PM2 instance..."
pm2 delete php-server 2>/dev/null || echo "No existing php-server instance found"

# Build the multi-version project
echo "Building the multi-version project..."
npm run build

echo "Multi-version deployment structure:"
echo "  dist/version1/ through dist/version9/ - Individual experimental conditions"
echo "  dist/src/ - Common source files"
echo "  dist/node_modules/ - JavaScript libraries"
echo "  dist/data/ - Data collection directory"

# Start PHP server in dist directory on all interfaces
echo ""
echo "Starting PHP server on 0.0.0.0:8001..."
echo ""
echo "🌐 AVAILABLE URLS (replace your-server with actual domain):"
echo "  Version 1:     https://your-server:8001/version1/  (Baseline)"
echo "  Version 2:     https://your-server:8001/version2/  (PI Plot)"
echo "  Version 3:     https://your-server:8001/version3/  (Ensemble Plot)"
echo "  Version 4:     https://your-server:8001/version4/  (Ensemble + Hover)"
echo "  Version 5:     https://your-server:8001/version5/  (PI Plot + Hover)"
echo "  Version 6:     https://your-server:8001/version6/  (PI → Ensemble)"
echo "  Version 7:     https://your-server:8001/version7/  (Buggy Control)"
echo "  Version 8:     https://your-server:8001/version8/  (Bad Control)"
echo "  Version 9:     https://your-server:8001/version9/  (Combined PI + Ensemble)"
echo ""
echo "📊 Data collection: dist/data/ directory"
echo "🔧 PM2 process name: php-server"
echo "📋 Check status: pm2 list"
echo "📜 View logs: pm2 logs php-server"
echo ""

pm2 start "php -S 0.0.0.0:8001 -t dist" --name php-server

echo "✅ Multi-version deployment complete!"
echo "🌟 Researchers can now send participants directly to specific condition URLs"