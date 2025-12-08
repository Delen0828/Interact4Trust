import json
import numpy as np

INPUT_FILE = "synthetic_stock_data.json"
OUTPUT_FILE = "synthetic_stock_data_aqi.json"

# adjust as needed to increase/decrease variability
AMPLIFY_FACTOR = 4.0  

MIN_AQI = 60
MAX_AQI = 120

def main():
    with open(INPUT_FILE, "r") as f:
        original = json.load(f)["data"]

    # extract all prices
    prices = np.array([d["price"] for d in original], dtype=float)

    # 1. center around mean
    mean = prices.mean()
    centered = prices - mean

    # 2. amplify variance
    amplified = centered * AMPLIFY_FACTOR

    # 3. shift back
    amplified += mean

    # 4. normalize to [MIN_AQI, MAX_AQI]
    min_val = amplified.min()
    max_val = amplified.max()

    normalized = (amplified - min_val) / (max_val - min_val)
    mapped = normalized * (MAX_AQI - MIN_AQI) + MIN_AQI

    # 5. round to int for AQI
    mapped_int = np.round(mapped).astype(int)

    # 6. replace prices in original structure
    new_data = []
    for entry, aqi in zip(original, mapped_int):
        e = entry.copy()
        e["price"] = int(aqi)
        new_data.append(e)

    # write to output
    with open(OUTPUT_FILE, "w") as f:
        json.dump({"data": new_data}, f, indent=2)

    print(f"Done. Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()