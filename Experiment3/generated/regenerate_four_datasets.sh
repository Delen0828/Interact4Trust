#!/usr/bin/env bash
set -euo pipefail

# Regenerates the 7 custom datasets in this folder using the Python generator
# with sine-wave trajectories.
#
# Usage:
#   cd Experiment1/generated
#   bash regenerate_four_datasets.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR="$SCRIPT_DIR/../script/generate_synthetic_stock_data.py"

COMMON_OPTS=(
  --numPred 5
  --noiseLevel 16
  --predVariance 225
  --skew bimodel
  --seed trend-fixed-v1
)

cd "$SCRIPT_DIR"

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
  --seed trend-fixed-v1-ranax-baseline \
  --histStart 54 --histEnd 54 --predStart 54 --predEnd 54 \
  --fileName ranax_leer_city_baseline.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --seed trend-fixed-v1-lumora-vexlin \
  --histStart 52 --histEnd 52 --predEnd 64 \
  --fileName lumora_vexlin_constHist_incPred.json

python3 "$GENERATOR" "${COMMON_OPTS[@]}" \
  --seed trend-fixed-v1-dravik-solmere \
  --histStart 58 --histEnd 58 --predEnd 44 \
  --fileName dravik_solmere_constHist_decPred.json

# Rename stock labels A/B to custom pair names in each dataset.
python3 - <<'PY'
import json
from pathlib import Path

datasets = [
    ("ranax_leer_city_baseline.json", "Ranax", "Leer City"),
    ("virexa_talmori_incHist_incPred.json", "Virexa", "Talmori"),
    ("qelvane_rostiva_incHist_decPred.json", "Qelvane", "Rostiva"),
    ("nexari_pulveth_decHist_incPred.json", "Nexari", "Pulveth"),
    ("zorvani_kelthar_decHist_decPred.json", "Zorvani", "Kelthar"),
    ("lumora_vexlin_constHist_incPred.json", "Lumora", "Vexlin"),
    ("dravik_solmere_constHist_decPred.json", "Dravik", "Solmere"),
]

for file_name, stock_a, stock_b in datasets:
    path = Path(file_name)
    payload = json.loads(path.read_text(encoding="utf-8"))
    for row in payload["data"]:
        if row["stock"] == "A":
            row["stock"] = stock_a
        elif row["stock"] == "B":
            row["stock"] = stock_b
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

print("Done: regenerated and relabeled 7 datasets.")
PY
