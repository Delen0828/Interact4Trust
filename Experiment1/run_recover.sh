#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DATA_DIR="${DATA_DIR:-$SCRIPT_DIR/data}"
OUTPUT_DIR="${OUTPUT_DIR:-$SCRIPT_DIR/overlay_output}"
INPUT_GLOB="${INPUT_GLOB:-*.csv}"
PHASE="${PHASE:-2}"
POINT_ALPHA="${POINT_ALPHA:-0.14}"
CLICK_ALPHA="${CLICK_ALPHA:-0.10}"
LINE_ALPHA="${LINE_ALPHA:-0.05}"
POINT_SIZE="${POINT_SIZE:-18}"
CLICK_SIZE="${CLICK_SIZE:-160}"

CONDITIONS=(18 19 20)
REPORT_GROUPS=(report noreport)

base_condition_for() {
  case "$1" in
    18) printf '4\n' ;;
    19) printf '5\n' ;;
    20) printf '6\n' ;;
    *) return 1 ;;
  esac
}

title_for_group() {
  case "$1" in
    report) printf 'Bug or Bad Design\n' ;;
    noreport) printf 'No Bug / No Bad Design\n' ;;
    *) return 1 ;;
  esac
}

mkdir -p "$OUTPUT_DIR"

for condition in "${CONDITIONS[@]}"; do
  base_condition="$(base_condition_for "$condition")"
  screenshot="$SCRIPT_DIR/image-c${base_condition}.png"

  for group in "${REPORT_GROUPS[@]}"; do
    output="$OUTPUT_DIR/overlay-c${condition}-${group}.png"
    title_suffix="$(title_for_group "$group")"

    python3 recover_interaction_log.py \
      "$DATA_DIR" \
      "$output" \
      --screenshot "$screenshot" \
      --phase "$PHASE" \
      --condition "$condition" \
      --report-group "$group" \
      --allow-empty \
      --input-glob "$INPUT_GLOB" \
      --point-alpha "$POINT_ALPHA" \
      --click-alpha "$CLICK_ALPHA" \
      --line-alpha "$LINE_ALPHA" \
      --point-size "$POINT_SIZE" \
      --click-size "$CLICK_SIZE" \
      --title "Condition $condition Overlay ($title_suffix)"
  done
done
