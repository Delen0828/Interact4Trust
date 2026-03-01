#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

DATA_DIR="${DATA_DIR:-$SCRIPT_DIR/data}"
OUTPUT_DIR="${OUTPUT_DIR:-$SCRIPT_DIR/overlay_output}"
INPUT_GLOB="${INPUT_GLOB:-*.csv}"
RESOLUTION="${RESOLUTION:-1920x1080}"
PHASE="${PHASE:-2}"
POINT_ALPHA="${POINT_ALPHA:-0.14}"
CLICK_ALPHA="${CLICK_ALPHA:-0.10}"
LINE_ALPHA="${LINE_ALPHA:-0.05}"
POINT_SIZE="${POINT_SIZE:-18}"
CLICK_SIZE="${CLICK_SIZE:-160}"
COMBINED_OVERLAY="${COMBINED_OVERLAY:-1}"

SCREENSHOT_PATTERN="${SCREENSHOT_PATTERN-}"
if [ -z "$SCREENSHOT_PATTERN" ]; then
  SCREENSHOT_PATTERN="$SCRIPT_DIR/image-c{condition}.png"
fi

OUTPUT_PATTERN="${OUTPUT_PATTERN-}"
if [ -z "$OUTPUT_PATTERN" ]; then
  OUTPUT_PATTERN="overlay-c{condition}.png"
fi

TITLE_PATTERN="${TITLE_PATTERN-}"
if [ -z "$TITLE_PATTERN" ]; then
  TITLE_PATTERN="Condition {condition} Overlay"
fi

COMBINED_OUTPUT_NAME="${COMBINED_OUTPUT_NAME-}"
if [ -z "$COMBINED_OUTPUT_NAME" ]; then
  COMBINED_OUTPUT_NAME="overlay-combined.png"
fi

COMBINED_TITLE="${COMBINED_TITLE-}"
if [ -z "$COMBINED_TITLE" ]; then
  COMBINED_TITLE="Combined Condition Overlay"
fi

COMBINED_BASE_CONDITION="${COMBINED_BASE_CONDITION-}"
COMBINED_SCREENSHOT="${COMBINED_SCREENSHOT-}"

if [ "$#" -gt 0 ]; then
  CONDITIONS=("$@")
else
  CONDITIONS=(18 19 20)
fi

CMD=(
  python3
  "$SCRIPT_DIR/overlay_interaction_logs.py"
  "$DATA_DIR"
  --conditions
  "${CONDITIONS[@]}"
  --output-dir "$OUTPUT_DIR"
  --input-glob "$INPUT_GLOB"
  --screenshot-pattern "$SCREENSHOT_PATTERN"
  --output-pattern "$OUTPUT_PATTERN"
  --title-pattern "$TITLE_PATTERN"
  --resolution "$RESOLUTION"
  --point-alpha "$POINT_ALPHA"
  --click-alpha "$CLICK_ALPHA"
  --line-alpha "$LINE_ALPHA"
  --point-size "$POINT_SIZE"
  --click-size "$CLICK_SIZE"
)

if [ -n "$PHASE" ]; then
  CMD+=(--phase "$PHASE")
fi

COMBINED_OVERLAY_NORMALIZED="$(printf '%s' "$COMBINED_OVERLAY" | tr '[:upper:]' '[:lower:]')"

case "$COMBINED_OVERLAY_NORMALIZED" in
  1|true|yes|on)
    if [ -z "$COMBINED_BASE_CONDITION" ]; then
      COMBINED_BASE_CONDITION="${CONDITIONS[0]}"
    fi
    CMD+=(
      --combined-output "$COMBINED_OUTPUT_NAME"
      --combined-title "$COMBINED_TITLE"
      --combined-base-condition "$COMBINED_BASE_CONDITION"
    )
    if [ -n "$COMBINED_SCREENSHOT" ]; then
      CMD+=(--combined-screenshot "$COMBINED_SCREENSHOT")
    fi
    ;;
  0|false|no|off)
    ;;
  *)
    echo "Invalid COMBINED_OVERLAY value: $COMBINED_OVERLAY" >&2
    echo "Use one of: 1, 0, true, false, yes, no, on, off" >&2
    exit 1
    ;;
esac

"${CMD[@]}"
