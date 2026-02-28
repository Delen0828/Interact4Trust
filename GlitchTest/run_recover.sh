#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# CSV="data/special/user_636393822934644_2026-02-16T18-46-44-620.csv"
CSV="data/user_69105085826_2026-02-28T03-02-48-513.csv"

# CSV="dist/data/user_1771275271927_2026-02-16T20-54-31-927.csv"
SCREENSHOT="image.png"

python3 recover_interaction_log.py \
    "$CSV" \
    --screenshot "$SCREENSHOT"
