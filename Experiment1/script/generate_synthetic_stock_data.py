#!/usr/bin/env python3

import argparse
import json
import math
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, List


STOCKS = ["A", "B"]
HIST_START_DATE = "2025-01-01"
HIST_END_DATE = "2025-06-01"
PRED_START_DATE = "2025-06-02"
PRED_END_DATE = "2025-06-30"

DEFAULTS = {
    "numPred": 10,
    "histStart": 40.0,
    "histEnd": 40.0,
    "predStart": None,
    "predEnd": 40.0,
    "noiseLevel": 1.0,
    "predVariance": 100.0,
    "skew": "bimodel",
    "fileName": "synthetic_stock_data_generated.json",
    "seed": "default-seed",
}


def fnv1a_seed(seed_text: str) -> int:
    h = 2166136261
    for ch in seed_text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return h


def parse_date(iso_date: str) -> date:
    y, m, d = map(int, iso_date.split("-"))
    return date(y, m, d)


def generate_dates(start_iso: str, end_iso: str) -> List[str]:
    start = parse_date(start_iso)
    end = parse_date(end_iso)
    out = []
    current = start
    while current <= end:
        out.append(current.isoformat())
        current += timedelta(days=1)
    return out


def mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def sample_variance(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = mean(values)
    return sum((v - m) ** 2 for v in values) / (len(values) - 1)


def round_price(value: float) -> float:
    # Keep deterministic 2-decimal formatting, close to JS rounding behavior.
    return round(value + 1e-12, 2)


def resolve_positive_count(num_pred: int, skew: str) -> int:
    if num_pred == 1:
        return 0 if skew == "down" else 1
    if skew == "bimodel":
        return max(1, min(num_pred - 1, round(num_pred * 0.5)))
    if skew == "up":
        return max(1, min(num_pred - 1, round(num_pred * 0.7)))
    return max(1, min(num_pred - 1, round(num_pred * 0.3)))


def generate_endpoint_deviations(num_pred: int, target_variance: float, skew: str, rng) -> List[float]:
    if num_pred < 2 or target_variance == 0:
        return [0.0] * num_pred

    positive_count = resolve_positive_count(num_pred, skew)
    negative_count = num_pred - positive_count
    if positive_count == 0 or negative_count == 0:
        return [0.0] * num_pred

    eps = 1e-12
    positive_mags = [max(abs(rng.gauss(0, 1)), eps) for _ in range(positive_count)]
    negative_mags = [max(abs(rng.gauss(0, 1)), eps) for _ in range(negative_count)]

    pos_total = sum(positive_mags)
    neg_total = sum(negative_mags)
    neg_scale = pos_total / neg_total

    raw = positive_mags + [-(m * neg_scale) for m in negative_mags]
    rng.shuffle(raw)

    current_var = sample_variance(raw)
    if current_var == 0:
        return [0.0] * num_pred

    scale = math.sqrt(target_variance / current_var)
    return [v * scale for v in raw]


def build_trajectory(
    dates: List[str],
    start_value: float,
    end_value: float,
    noise_std_dev: float,
    stock_index: int,
    rng,
) -> List[float]:
    n = len(dates)
    if n == 1:
        return [round_price(start_value)]

    # Add a smooth, endpoint-preserving seasonal component so the lines are
    # less linear while still honoring exact start/end anchors.
    seasonal_phase = rng.uniform(0.0, 2.0 * math.pi)
    seasonal_cycles = 3.0

    values = []
    for i in range(n):
        t = i / (n - 1)
        base = start_value + (end_value - start_value) * t
        stock_shape_bias = (1 if stock_index == 0 else -1) * noise_std_dev * 0.3 * math.sin(math.pi * t)
        seasonal_wave = (
            noise_std_dev
            * 0.9
            * math.sin(math.pi * t)
            * math.sin((2.0 * math.pi * seasonal_cycles * t) + seasonal_phase)
        )
        noise = 0.0 if i == 0 or i == n - 1 else rng.gauss(0, noise_std_dev)
        values.append(round_price(base + stock_shape_bias + seasonal_wave + noise))
    return values


def validate_options(options: Dict) -> Dict:
    if int(options["numPred"]) != options["numPred"] or options["numPred"] < 1:
        raise ValueError("--numPred must be an integer >= 1")
    if options["noiseLevel"] < 0:
        raise ValueError("--noiseLevel must be >= 0")
    if options["predVariance"] < 0:
        raise ValueError("--predVariance must be >= 0")
    if options["skew"] not in {"up", "down", "bimodel"}:
        raise ValueError('--skew must be one of: "up", "down", "bimodel"')
    file_name = options["fileName"]
    if Path(file_name).name != file_name:
        raise ValueError("--fileName must be a file name, not a path")
    if not file_name.lower().endswith(".json"):
        options["fileName"] = f"{file_name}.json"
    if options["predStart"] is None:
        options["predStart"] = options["histEnd"]
    return options


def generate_synthetic_stock_data(options: Dict) -> Dict:
    import random

    opts = validate_options(dict(options))
    rng = random.Random(fnv1a_seed(str(opts["seed"])))

    hist_dates = generate_dates(HIST_START_DATE, HIST_END_DATE)
    pred_dates = generate_dates(PRED_START_DATE, PRED_END_DATE)
    noise_std_dev = math.sqrt(opts["noiseLevel"])
    records = []

    for stock_index, stock in enumerate(STOCKS):
        historical_values = build_trajectory(
            dates=hist_dates,
            start_value=opts["histStart"],
            end_value=opts["histEnd"],
            noise_std_dev=noise_std_dev,
            stock_index=stock_index,
            rng=rng,
        )
        for idx, day in enumerate(hist_dates):
            records.append(
                {
                    "date": day,
                    "stock": stock,
                    "price": historical_values[idx],
                    "series": "historical",
                    "scenario": None,
                }
            )

        raw_start_offsets = [rng.gauss(0, noise_std_dev) for _ in range(opts["numPred"])]
        centered_start_offsets = [v - mean(raw_start_offsets) for v in raw_start_offsets]
        scenario_starts = [opts["predStart"] + d for d in centered_start_offsets]

        endpoint_deviations = generate_endpoint_deviations(
            opts["numPred"], opts["predVariance"], opts["skew"], rng
        )
        scenario_ends = [opts["predEnd"] + d for d in endpoint_deviations]

        for model_index in range(opts["numPred"]):
            scenario_id = f"scenario_{model_index + 1}"
            prediction_values = build_trajectory(
                dates=pred_dates,
                start_value=scenario_starts[model_index],
                end_value=scenario_ends[model_index],
                noise_std_dev=noise_std_dev,
                stock_index=stock_index,
                rng=rng,
            )
            for idx, day in enumerate(pred_dates):
                records.append(
                    {
                        "date": day,
                        "stock": stock,
                        "price": prediction_values[idx],
                        "series": "prediction",
                        "scenario": scenario_id,
                    }
                )

    return {"data": records}


def summarize(dataset: Dict) -> Dict:
    data = dataset["data"]
    historical = [d for d in data if d["series"] == "historical"]
    prediction = [d for d in data if d["series"] == "prediction"]
    pred_dates = sorted({d["date"] for d in prediction})
    pred_end_date = pred_dates[-1]
    pred_end_values = [d["price"] for d in prediction if d["date"] == pred_end_date]
    return {
        "totalRecords": len(data),
        "historicalRecords": len(historical),
        "predictionRecords": len(prediction),
        "stocks": sorted({d["stock"] for d in data}),
        "scenarios": len({d["scenario"] for d in prediction}),
        "predictionEndVariance": round_price(sample_variance(pred_end_values)),
    }


def parse_args() -> Dict:
    parser = argparse.ArgumentParser(
        description="Generate synthetic stock-format dataset for Experiment1.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--numPred",
        type=int,
        default=DEFAULTS["numPred"],
        help="Prediction models per stock/series per timestamp",
    )
    parser.add_argument("--histStart", type=float, default=DEFAULTS["histStart"], help="Historical start value")
    parser.add_argument("--histEnd", type=float, default=DEFAULTS["histEnd"], help="Historical end value")
    parser.add_argument("--predStart", type=float, default=DEFAULTS["predStart"], help="Prediction start mean")
    parser.add_argument("--predEnd", type=float, default=DEFAULTS["predEnd"], help="Prediction end mean")
    parser.add_argument("--noiseLevel", type=float, default=DEFAULTS["noiseLevel"], help="Within-series variance")
    parser.add_argument(
        "--predVariance",
        type=float,
        default=DEFAULTS["predVariance"],
        help="Across-model endpoint variance",
    )
    parser.add_argument("--skew", type=str, default=DEFAULTS["skew"], choices=["up", "down", "bimodel"])
    parser.add_argument("--fileName", type=str, default=DEFAULTS["fileName"], help="Output JSON file name")
    parser.add_argument("--seed", type=str, default=DEFAULTS["seed"], help="Seed for deterministic generation")
    return vars(parser.parse_args())


def main() -> int:
    try:
        options = validate_options(parse_args())
        dataset = generate_synthetic_stock_data(options)
        output_path = Path.cwd() / options["fileName"]
        output_path.write_text(json.dumps(dataset, indent=2), encoding="utf-8")
        print(f"Generated {output_path}")
        print(json.dumps({"options": options, "summary": summarize(dataset)}, indent=2))
        return 0
    except Exception as exc:
        print(f"Error: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
