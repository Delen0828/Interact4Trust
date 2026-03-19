#!/usr/bin/env bash
set -euo pipefail

# Regenerate the 7 Experiment 2 datasets used by the single-version
# within-subject sequence:
# baseline, CI, and 2/3/4/5/6-line ensemble variants.
#
# Usage:
#   cd Experiment2/generated
#   bash regenerate_seven_datasets.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR="$SCRIPT_DIR/../../Experiment3/script/generate_synthetic_stock_data.py"

if [[ ! -f "$GENERATOR" ]]; then
  echo "Generator not found: $GENERATOR" >&2
  exit 1
fi

COMMON_OPTS=(
  --numPred 10
  --noiseLevel 16
  --predVariance 225
  --skew bimodel
  --seed trend-fixed-v1
)

cd "$SCRIPT_DIR"

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --seed trend-fixed-v1-ranax-baseline \
  --histStart 54 --histEnd 54 --predStart 54 --predEnd 54 \
  --fileName ranax_leer_city_baseline.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --histStart 30 --histEnd 50 --predEnd 59 \
  --fileName virexa_talmori_incHist_incPred.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --histStart 40 --histEnd 60 --predEnd 51 \
  --fileName qelvane_rostiva_incHist_decPred.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --histStart 60 --histEnd 40 --predEnd 49 \
  --fileName nexari_pulveth_decHist_incPred.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --histStart 70 --histEnd 50 --predEnd 41 \
  --fileName zorvani_kelthar_decHist_decPred.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --seed trend-fixed-v1-lumora-vexlin \
  --histStart 52 --histEnd 52 --predEnd 64 \
  --fileName lumora_vexlin_constHist_incPred.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --seed trend-fixed-v1-dravik-solmere \
  --histStart 58 --histEnd 58 --predEnd 44 \
  --fileName dravik_solmere_constHist_decPred.json

echo "Done: regenerated 7 Experiment 2 datasets with numPred=10."
