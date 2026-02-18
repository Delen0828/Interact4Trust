import json

input_file = "synthetic_stock_data_aqi.json"
output_file = "synthetic_stock_data_aqi_norm.json"

with open(input_file, "r") as f:
    data = json.load(f)

# Access the actual list
items = data["data"]

# Subtract 50 from each price
for item in items:
    if "price" in item and isinstance(item["price"], (int, float)):
        item["price"] = item["price"] - 50

# Save new JSON
with open(output_file, "w") as f:
    json.dump(data, f, indent=2)

print("Done! Saved to", output_file)