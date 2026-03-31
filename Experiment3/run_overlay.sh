#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

DATA_DIR="${DATA_DIR:-$SCRIPT_DIR/data}"
OUTPUT_DIR="${OUTPUT_DIR:-$SCRIPT_DIR/overlay_output}"
INPUT_GLOB="${INPUT_GLOB:-*.csv}"
RESOLUTION="${RESOLUTION:-1920x1080}"
PHASE="${PHASE-}"
POINT_ALPHA="${POINT_ALPHA:-0.14}"
CLICK_ALPHA="${CLICK_ALPHA:-0.10}"
LINE_ALPHA="${LINE_ALPHA:-0.05}"
POINT_SIZE="${POINT_SIZE:-18}"
CLICK_SIZE="${CLICK_SIZE:-160}"
CLICK_CONDITIONS="${CLICK_CONDITIONS:-23 24}"
HOVER_CONDITIONS="${HOVER_CONDITIONS:-21 22}"

CLICK_SCREENSHOT="${CLICK_SCREENSHOT:-$SCRIPT_DIR/image/click.png}"
HOVER_SCREENSHOT="${HOVER_SCREENSHOT:-$SCRIPT_DIR/image/hover.png}"
CLICK_OUTPUT="${CLICK_OUTPUT:-overlay-click.png}"
HOVER_OUTPUT="${HOVER_OUTPUT:-overlay-hover.png}"

read -r -a CLICK_CONDITION_ARRAY <<< "$CLICK_CONDITIONS"
read -r -a HOVER_CONDITION_ARRAY <<< "$HOVER_CONDITIONS"

if [ "${#CLICK_CONDITION_ARRAY[@]}" -eq 0 ]; then
  echo "CLICK_CONDITIONS is empty." >&2
  exit 1
fi
if [ "${#HOVER_CONDITION_ARRAY[@]}" -eq 0 ]; then
  echo "HOVER_CONDITIONS is empty." >&2
  exit 1
fi

COMMON_ARGS=(
  "$SCRIPT_DIR/overlay_interaction_logs.py"
  "$DATA_DIR"
  --output-dir "$OUTPUT_DIR"
  --input-glob "$INPUT_GLOB"
  --resolution "$RESOLUTION"
  --point-alpha "$POINT_ALPHA"
  --click-alpha "$CLICK_ALPHA"
  --line-alpha "$LINE_ALPHA"
  --point-size "$POINT_SIZE"
  --click-size "$CLICK_SIZE"
)

if [ -n "$PHASE" ]; then
  COMMON_ARGS+=(--phase "$PHASE")
fi

python3 \
  "${COMMON_ARGS[@]}" \
  --conditions "${CLICK_CONDITION_ARRAY[@]}" \
  --screenshot-pattern "$CLICK_SCREENSHOT" \
  --output-pattern "overlay-click-c{condition}.png" \
  --title-pattern "Click Condition {condition} Overlay" \
  --combined-output "$CLICK_OUTPUT" \
  --combined-title "Click Overlay (Show All + Show One)" \
  --combined-screenshot "$CLICK_SCREENSHOT"

python3 \
  "${COMMON_ARGS[@]}" \
  --conditions "${HOVER_CONDITION_ARRAY[@]}" \
  --screenshot-pattern "$HOVER_SCREENSHOT" \
  --output-pattern "overlay-hover-c{condition}.png" \
  --title-pattern "Hover Condition {condition} Overlay" \
  --combined-output "$HOVER_OUTPUT" \
  --combined-title "Hover Overlay (Show All + Show One)" \
  --combined-screenshot "$HOVER_SCREENSHOT"
