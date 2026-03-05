#!/usr/bin/env python3

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from generate_synthetic_stock_data import (
    generate_synthetic_stock_data,
    mean,
    sample_variance,
)


OUTPUT_DIR = Path(__file__).resolve().parent / "test_output_py"
DATA_DIR = OUTPUT_DIR / "data"
VIEWER_PATH = OUTPUT_DIR / "option_tests_viewer.html"
REPORT_JSON_PATH = OUTPUT_DIR / "test_report.json"
REPORT_MD_PATH = OUTPUT_DIR / "test_report.md"

BASE_OPTIONS = {
    "numPred": 10,
    "histStart": 42.0,
    "histEnd": 36.0,
    "predStart": 36.0,
    "predEnd": 40.0,
    "noiseLevel": 1.5,
    "predVariance": 64.0,
    "skew": "bimodel",
    "seed": "py-option-test-baseline",
    "fileName": "unused.json",
}

CASES = [
    {
        "id": "baseline",
        "focus": "baseline",
        "description": "Reference run with balanced bimodal endpoints.",
        "overrides": {},
    },
    {
        "id": "numPred_3",
        "focus": "numPred",
        "description": "3 prediction models per timestamp.",
        "overrides": {"numPred": 3, "seed": "test-numPred-3"},
    },
    {
        "id": "numPred_16",
        "focus": "numPred",
        "description": "16 prediction models per timestamp.",
        "overrides": {"numPred": 16, "seed": "test-numPred-16"},
    },
    {
        "id": "histStart_55",
        "focus": "histStart",
        "description": "Historical start shifted high.",
        "overrides": {"histStart": 55.0, "seed": "test-histStart-55"},
    },
    {
        "id": "histEnd_18",
        "focus": "histEnd",
        "description": "Historical end shifted low.",
        "overrides": {"histEnd": 18.0, "predStart": 18.0, "seed": "test-histEnd-18"},
    },
    {
        "id": "predStart_62",
        "focus": "predStart",
        "description": "Prediction start mean moved to 62.",
        "overrides": {"predStart": 62.0, "seed": "test-predStart-62"},
    },
    {
        "id": "predEnd_15",
        "focus": "predEnd",
        "description": "Prediction end mean moved to 15.",
        "overrides": {"predEnd": 15.0, "seed": "test-predEnd-15"},
    },
    {
        "id": "noise_0_1",
        "focus": "noiseLevel",
        "description": "Very low within-series variance.",
        "overrides": {"noiseLevel": 0.1, "seed": "test-noise-0.1"},
    },
    {
        "id": "noise_9",
        "focus": "noiseLevel",
        "description": "High within-series variance.",
        "overrides": {"noiseLevel": 9.0, "seed": "test-noise-9"},
    },
    {
        "id": "predVar_1",
        "focus": "predVariance",
        "description": "Tight agreement at prediction end.",
        "overrides": {"predVariance": 1.0, "seed": "test-predVar-1"},
    },
    {
        "id": "predVar_225",
        "focus": "predVariance",
        "description": "Wide spread at prediction end.",
        "overrides": {"predVariance": 225.0, "seed": "test-predVar-225"},
    },
    {
        "id": "skew_up",
        "focus": "skew",
        "description": "Majority of models diverge upward at the end.",
        "overrides": {"skew": "up", "seed": "test-skew-up"},
    },
    {
        "id": "skew_down",
        "focus": "skew",
        "description": "Majority of models diverge downward at the end.",
        "overrides": {"skew": "down", "seed": "test-skew-down"},
    },
    {
        "id": "skew_bimodel",
        "focus": "skew",
        "description": "Roughly half diverge up and half down.",
        "overrides": {"skew": "bimodel", "seed": "test-skew-bimodel"},
    },
]


def sorted_unique(values):
    return sorted(set(values))


def values_at_date(data, predicate, day):
    return [d["price"] for d in data if predicate(d) and d["date"] == day]


def path_residual_variance(points):
    if len(points) < 3:
        return 0.0
    start = points[0]
    end = points[-1]
    residuals = []
    for i in range(1, len(points) - 1):
        t = i / (len(points) - 1)
        baseline = start + (end - start) * t
        residuals.append(points[i] - baseline)
    return sample_variance(residuals)


def analyze_dataset(dataset, expected_pred_end):
    data = dataset["data"]
    historical = [d for d in data if d["series"] == "historical"]
    prediction = [d for d in data if d["series"] == "prediction"]
    stocks = sorted_unique([d["stock"] for d in data])
    hist_dates = sorted_unique([d["date"] for d in historical])
    pred_dates = sorted_unique([d["date"] for d in prediction])

    hist_start_date = hist_dates[0]
    hist_end_date = hist_dates[-1]
    pred_start_date = pred_dates[0]
    pred_end_date = pred_dates[-1]

    hist_start_mean = mean(values_at_date(data, lambda d: d["series"] == "historical", hist_start_date))
    hist_end_mean = mean(values_at_date(data, lambda d: d["series"] == "historical", hist_end_date))
    pred_start_mean = mean(values_at_date(data, lambda d: d["series"] == "prediction", pred_start_date))
    pred_end_mean = mean(values_at_date(data, lambda d: d["series"] == "prediction", pred_end_date))

    scenario_counts = {}
    for stock in stocks:
        scenarios = {
            d["scenario"]
            for d in prediction
            if d["stock"] == stock and d["date"] == pred_start_date
        }
        scenario_counts[stock] = len(scenarios)

    historical_residuals = []
    prediction_residuals = []
    end_variances = []
    endpoint_signs = []

    for stock in stocks:
        hist_series = [
            d["price"]
            for d in sorted(
                [x for x in historical if x["stock"] == stock], key=lambda x: x["date"]
            )
        ]
        historical_residuals.append(path_residual_variance(hist_series))

        stock_pred = [d for d in prediction if d["stock"] == stock]
        scenarios = sorted_unique([d["scenario"] for d in stock_pred])

        end_values = []
        for scenario in scenarios:
            series = [
                d["price"]
                for d in sorted(
                    [x for x in stock_pred if x["scenario"] == scenario],
                    key=lambda x: x["date"],
                )
            ]
            prediction_residuals.append(path_residual_variance(series))
            end_values.append(series[-1])

        end_variances.append(sample_variance(end_values))
        for value in end_values:
            endpoint_signs.append(1 if value > expected_pred_end else (-1 if value < expected_pred_end else 0))

    positive_ratio = (
        len([s for s in endpoint_signs if s > 0]) / len(endpoint_signs) if endpoint_signs else 0
    )
    negative_ratio = (
        len([s for s in endpoint_signs if s < 0]) / len(endpoint_signs) if endpoint_signs else 0
    )

    return {
        "totalRecords": len(data),
        "historicalRecords": len(historical),
        "predictionRecords": len(prediction),
        "histStartDate": hist_start_date,
        "histEndDate": hist_end_date,
        "predStartDate": pred_start_date,
        "predEndDate": pred_end_date,
        "histStartMean": hist_start_mean,
        "histEndMean": hist_end_mean,
        "predStartMean": pred_start_mean,
        "predEndMean": pred_end_mean,
        "scenarioCounts": scenario_counts,
        "historicalResidualVariance": mean(historical_residuals),
        "predictionResidualVariance": mean(prediction_residuals),
        "predictionEndVariance": mean(end_variances),
        "positiveEndpointRatio": positive_ratio,
        "negativeEndpointRatio": negative_ratio,
    }


def approx_equal(actual, expected, tol):
    return abs(actual - expected) <= tol


def add_check(checks, ok, message):
    checks.append({"ok": bool(ok), "message": message})


def build_viewer_html(case_rows):
    case_json = json.dumps(case_rows, indent=2)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Python Generator Option Tests</title>
  <style>
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f6f8;
      color: #1f2937;
    }}
    .layout {{
      display: grid;
      grid-template-columns: 360px 1fr;
      min-height: 100vh;
    }}
    .panel {{
      padding: 16px;
      border-right: 1px solid #d1d5db;
      background: white;
      overflow-y: auto;
    }}
    .panel h1 {{ font-size: 18px; margin: 0 0 8px 0; }}
    .panel p {{ font-size: 13px; line-height: 1.4; color: #4b5563; margin: 0 0 12px 0; }}
    .case-btn {{
      width: 100%;
      text-align: left;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      background: #f9fafb;
      cursor: pointer;
    }}
    .case-btn:hover {{ background: #eef2ff; }}
    .case-btn.active {{ border-color: #2563eb; background: #eff6ff; }}
    .case-title {{ font-size: 13px; font-weight: 600; margin-bottom: 4px; }}
    .case-desc {{ font-size: 12px; color: #4b5563; }}
    .viewer {{ display: grid; grid-template-rows: auto 1fr; min-height: 100vh; }}
    .meta {{
      padding: 10px 14px;
      border-bottom: 1px solid #d1d5db;
      background: white;
      font-size: 13px;
    }}
    iframe {{
      width: 100%;
      height: calc(100vh - 46px);
      border: 0;
      background: white;
    }}
    @media (max-width: 980px) {{
      .layout {{ grid-template-columns: 1fr; }}
      .panel {{ border-right: 0; border-bottom: 1px solid #d1d5db; max-height: 45vh; }}
      iframe {{ height: 70vh; }}
    }}
  </style>
</head>
<body>
  <div class="layout">
    <div class="panel">
      <h1>Python Option Test Viewer</h1>
      <p>Each case reuses <code>conditions.html</code> and loads a Python-generated dataset for visual validation.</p>
      <div id="caseList"></div>
    </div>
    <div class="viewer">
      <div class="meta" id="meta"></div>
      <iframe id="frame" src="" title="Visualization"></iframe>
    </div>
  </div>
  <script>
    const cases = {case_json};
    const listEl = document.getElementById("caseList");
    const frameEl = document.getElementById("frame");
    const metaEl = document.getElementById("meta");

    function setActive(id) {{
      const selected = cases.find(c => c.id === id);
      if (!selected) return;
      frameEl.src = selected.viewerUrl;
      metaEl.textContent = selected.title + " | " + selected.description + " | Data: " + selected.dataRelativePath;
      for (const btn of document.querySelectorAll(".case-btn")) {{
        btn.classList.toggle("active", btn.dataset.id === id);
      }}
    }}

    for (const c of cases) {{
      const btn = document.createElement("button");
      btn.className = "case-btn";
      btn.dataset.id = c.id;
      btn.innerHTML = '<div class="case-title">' + c.title + '</div><div class="case-desc">' + c.description + '</div>';
      btn.addEventListener("click", () => setActive(c.id));
      listEl.appendChild(btn);
    }}

    setActive(cases[0].id);
  </script>
</body>
</html>
"""


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    case_results = []
    for case in CASES:
        options = dict(BASE_OPTIONS)
        options.update(case["overrides"])
        dataset = generate_synthetic_stock_data(options)

        output_file_name = f"{case['id']}.json"
        output_path = DATA_DIR / output_file_name
        output_path.write_text(json.dumps(dataset, indent=2), encoding="utf-8")

        case_results.append(
            {
                **case,
                "outputFileName": output_file_name,
                "options": options,
                "metrics": analyze_dataset(dataset, options["predEnd"]),
            }
        )

    by_id = {result["id"]: result for result in case_results}
    checks = []

    for case_id in ("numPred_3", "numPred_16"):
        result = by_id[case_id]
        for stock, count in result["metrics"]["scenarioCounts"].items():
            add_check(
                checks,
                count == result["options"]["numPred"],
                f"{case_id}: stock {stock} has {count} scenarios (expected {result['options']['numPred']})",
            )

    add_check(
        checks,
        approx_equal(by_id["histStart_55"]["metrics"]["histStartMean"], by_id["histStart_55"]["options"]["histStart"], 0.2),
        f"histStart_55: historical start mean {by_id['histStart_55']['metrics']['histStartMean']:.2f} ~= {by_id['histStart_55']['options']['histStart']}",
    )
    add_check(
        checks,
        approx_equal(by_id["histEnd_18"]["metrics"]["histEndMean"], by_id["histEnd_18"]["options"]["histEnd"], 0.2),
        f"histEnd_18: historical end mean {by_id['histEnd_18']['metrics']['histEndMean']:.2f} ~= {by_id['histEnd_18']['options']['histEnd']}",
    )
    add_check(
        checks,
        approx_equal(by_id["predStart_62"]["metrics"]["predStartMean"], by_id["predStart_62"]["options"]["predStart"], 0.25),
        f"predStart_62: prediction start mean {by_id['predStart_62']['metrics']['predStartMean']:.2f} ~= {by_id['predStart_62']['options']['predStart']}",
    )
    add_check(
        checks,
        approx_equal(by_id["predEnd_15"]["metrics"]["predEndMean"], by_id["predEnd_15"]["options"]["predEnd"], 0.25),
        f"predEnd_15: prediction end mean {by_id['predEnd_15']['metrics']['predEndMean']:.2f} ~= {by_id['predEnd_15']['options']['predEnd']}",
    )
    add_check(
        checks,
        by_id["noise_9"]["metrics"]["historicalResidualVariance"]
        > by_id["noise_0_1"]["metrics"]["historicalResidualVariance"] * 10,
        f"noiseLevel: historical residual variance rises from {by_id['noise_0_1']['metrics']['historicalResidualVariance']:.2f} to {by_id['noise_9']['metrics']['historicalResidualVariance']:.2f}",
    )
    add_check(
        checks,
        by_id["noise_9"]["metrics"]["predictionResidualVariance"]
        > by_id["noise_0_1"]["metrics"]["predictionResidualVariance"] * 10,
        f"noiseLevel: prediction residual variance rises from {by_id['noise_0_1']['metrics']['predictionResidualVariance']:.2f} to {by_id['noise_9']['metrics']['predictionResidualVariance']:.2f}",
    )
    add_check(
        checks,
        by_id["predVar_225"]["metrics"]["predictionEndVariance"]
        > by_id["predVar_1"]["metrics"]["predictionEndVariance"] * 20,
        f"predVariance: endpoint spread rises from {by_id['predVar_1']['metrics']['predictionEndVariance']:.2f} to {by_id['predVar_225']['metrics']['predictionEndVariance']:.2f}",
    )
    add_check(
        checks,
        by_id["skew_up"]["metrics"]["positiveEndpointRatio"] > 0.55,
        f"skew_up: positive endpoint ratio {by_id['skew_up']['metrics']['positiveEndpointRatio']:.2f} > 0.55",
    )
    add_check(
        checks,
        by_id["skew_down"]["metrics"]["positiveEndpointRatio"] < 0.45,
        f"skew_down: positive endpoint ratio {by_id['skew_down']['metrics']['positiveEndpointRatio']:.2f} < 0.45",
    )
    add_check(
        checks,
        0.35 <= by_id["skew_bimodel"]["metrics"]["positiveEndpointRatio"] <= 0.65,
        f"skew_bimodel: positive endpoint ratio {by_id['skew_bimodel']['metrics']['positiveEndpointRatio']:.2f} is near 0.50",
    )

    passed = len([c for c in checks if c["ok"]])
    failed = len(checks) - passed

    viewer_rows = []
    for result in case_results:
        data_rel_path = f"script/test_output_py/data/{result['outputFileName']}"
        viewer_rows.append(
            {
                "id": result["id"],
                "title": f"{result['id']} ({result['focus']})",
                "description": result["description"],
                "dataRelativePath": data_rel_path,
                "viewerUrl": f"../../conditions.html?data={quote(data_rel_path)}",
            }
        )

    VIEWER_PATH.write_text(build_viewer_html(viewer_rows), encoding="utf-8")

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "outputDir": str(OUTPUT_DIR),
        "summary": {"totalChecks": len(checks), "passed": passed, "failed": failed},
        "checks": checks,
        "cases": [
            {
                "id": result["id"],
                "focus": result["focus"],
                "description": result["description"],
                "file": str(Path("script") / "test_output_py" / "data" / result["outputFileName"]),
                "options": result["options"],
                "metrics": result["metrics"],
            }
            for result in case_results
        ],
    }
    REPORT_JSON_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    md_lines = [
        "# Python Generator Option Test Report",
        "",
        f"Generated at: {report['generatedAt']}",
        f"Checks: {len(checks)}, Passed: {passed}, Failed: {failed}",
        "",
        "## Check Results",
    ]
    md_lines.extend([f"- {'PASS' if c['ok'] else 'FAIL'}: {c['message']}" for c in checks])
    md_lines.extend(
        [
            "",
            "## Visual Validation",
            "- Open `script/test_output_py/option_tests_viewer.html` through a local server and inspect each case.",
        ]
    )
    REPORT_MD_PATH.write_text("\n".join(md_lines), encoding="utf-8")

    print(f"Generated {len(case_results)} datasets in {DATA_DIR}")
    print(f"Report JSON: {REPORT_JSON_PATH}")
    print(f"Report MD:   {REPORT_MD_PATH}")
    print(f"Viewer:      {VIEWER_PATH}")
    print("")
    for check in checks:
        print(f"{'PASS' if check['ok'] else 'FAIL'}: {check['message']}")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
