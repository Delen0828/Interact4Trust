#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# CSV="data/special/user_636393822934644_2026-02-16T18-46-44-620.csv"
CSV="data/special/user_6448503849576510_2026-02-16T18-19-35-710.csv"

# CSV="dist/data/user_1771275271927_2026-02-16T20-54-31-927.csv"
SCREENSHOT="image10.png"

python3 recover_interaction_log.py \
    "$CSV" \
    --screenshot "$SCREENSHOT"
