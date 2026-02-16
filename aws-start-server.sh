#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Humidity Study - AWS Multi-Version Deployment Script

if ! command -v pm2 >/dev/null 2>&1; then
    echo "Error: pm2 is not installed or not in PATH."
    exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
    echo "Error: cloudflared is not installed or not in PATH."
    echo "Install cloudflared first, then rerun this script."
    exit 1
fi

# Kill all pm2-managed processes before doing anything else to avoid conflicts.
pm2 delete all >/dev/null 2>&1 || true
pm2 kill >/dev/null 2>&1 || true

npm run build

# Ensure data directory exists and copy dataset files.
mkdir -p dist/data
cp synthetic_*.json dist/
for dir in dist/version*; do
    [ -d "$dir" ] && cp dist/synthetic_*.json "$dir"/
done

# Start PHP server with pm2.
pm2 start "php -S 0.0.0.0:8001 -t dist" --name php-server

# Start cloudflared quick tunnel with pm2 for temporary HTTPS URL.
pm2 start "cloudflared tunnel --no-autoupdate --url http://127.0.0.1:8001" --name cloudflared-tunnel

echo "Waiting for cloudflared to publish a temporary HTTPS URL..."
TUNNEL_LOG="$HOME/.pm2/logs/cloudflared-tunnel-error.log"
URL=""

for _ in {1..30}; do
    if [ -f "$TUNNEL_LOG" ]; then
        URL="$(grep -Eo 'https://[-a-zA-Z0-9]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -n 1 || true)"
        if [ -n "$URL" ]; then
            break
        fi
    fi
    sleep 1
done

echo "pm2 processes:"
pm2 ls

if [ -n "$URL" ]; then
    echo "Temporary HTTPS URL: $URL"
else
    echo "Tunnel started, but URL not detected yet."
    echo "Run: pm2 logs cloudflared-tunnel --lines 100"
fi
