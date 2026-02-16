#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

CSV="dist/data/user_1_2026-02-16T14-12-39-331.csv"
SCREENSHOT="image10.png"

python3 recover_interaction_log.py \
    "$CSV" \
    --screenshot "$SCREENSHOT"
