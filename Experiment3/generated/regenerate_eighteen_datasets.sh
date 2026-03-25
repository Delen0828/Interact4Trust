#!/usr/bin/env bash
set -euo pipefail

# Regenerate the 18 Experiment 3 datasets (9 base + 9 md5 variants).
#
# Usage:
#   cd Experiment3/generated
#   bash regenerate_eighteen_datasets.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR="$SCRIPT_DIR/../script/generate_synthetic_stock_data.py"

if [[ ! -f "$GENERATOR" ]]; then
  echo "Generator not found: $GENERATOR" >&2
  exit 1
fi

cd "$SCRIPT_DIR"

generate_set() {
  local mean_diff="$1"
  local suffix="$2"
  local common_opts=(
    --numPred 10
    --noiseLevel 16
    --predVariance 225
    --skew bimodel
    --meanDiff "$mean_diff"
    --seed trend-fixed-v1
  )

  python3 "$GENERATOR" "${common_opts[@]}" \
    --seed trend-fixed-v1-ranax-baseline \
    --histStart 54 --histEnd 54 --predStart 54 --predEnd 54 \
    --fileName "ranax_leer_city_baseline${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --histStart 30 --histEnd 50 --predEnd 59 \
    --fileName "virexa_talmori_incHist_incPred${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --histStart 40 --histEnd 60 --predEnd 51 \
    --fileName "qelvane_rostiva_incHist_decPred${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --histStart 60 --histEnd 40 --predEnd 49 \
    --fileName "nexari_pulveth_decHist_incPred${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --histStart 70 --histEnd 50 --predEnd 41 \
    --fileName "zorvani_kelthar_decHist_decPred${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --seed trend-fixed-v1-lumora-vexlin \
    --histStart 52 --histEnd 52 --predEnd 64 \
    --fileName "lumora_vexlin_constHist_incPred${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --seed trend-fixed-v1-dravik-solmere \
    --histStart 58 --histEnd 58 --predEnd 44 \
    --fileName "dravik_solmere_constHist_decPred${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --seed trend-fixed-v1-altriva-morneth \
    --histStart 35 --histEnd 55 --predEnd 55 \
    --fileName "altriva_morneth_incHist_constPred${suffix}.json"

  python3 "$GENERATOR" "${common_opts[@]}" \
    --seed trend-fixed-v1-solnara-kyveth \
    --histStart 65 --histEnd 45 --predEnd 45 \
    --fileName "solnara_kyveth_decHist_constPred${suffix}.json"
}

generate_set 0 ""
generate_set 5 "_md5"

echo "Done: regenerated 18 Experiment 3 datasets (9 pairs x meanDiff {0, 5})."
