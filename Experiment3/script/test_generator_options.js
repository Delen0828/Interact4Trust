#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  generateSyntheticStockData,
  mean,
  sampleVariance
} = require("./generate_synthetic_stock_data");

const OUTPUT_DIR = path.join(__dirname, "test_output");
const DATA_DIR = path.join(OUTPUT_DIR, "data");
const VIEWER_PATH = path.join(OUTPUT_DIR, "option_tests_viewer.html");
const REPORT_JSON_PATH = path.join(OUTPUT_DIR, "test_report.json");
const REPORT_MD_PATH = path.join(OUTPUT_DIR, "test_report.md");

const BASE_OPTIONS = {
  numPred: 10,
  histStart: 42,
  histEnd: 36,
  predStart: 36,
  predEnd: 40,
  noiseLevel: 1.5,
  predVariance: 64,
  skew: "bimodel",
  seed: "option-test-baseline"
};

const CASES = [
  {
    id: "baseline",
    focus: "baseline",
    description: "Reference run with balanced bimodal endpoints.",
    overrides: {}
  },
  {
    id: "numPred_3",
    focus: "numPred",
    description: "3 prediction models per timestamp.",
    overrides: { numPred: 3, seed: "test-numPred-3" }
  },
  {
    id: "numPred_16",
    focus: "numPred",
    description: "16 prediction models per timestamp.",
    overrides: { numPred: 16, seed: "test-numPred-16" }
  },
  {
    id: "histStart_55",
    focus: "histStart",
    description: "Historical start shifted high.",
    overrides: { histStart: 55, seed: "test-histStart-55" }
  },
  {
    id: "histEnd_18",
    focus: "histEnd",
    description: "Historical end shifted low.",
    overrides: { histEnd: 18, predStart: 18, seed: "test-histEnd-18" }
  },
  {
    id: "predStart_62",
    focus: "predStart",
    description: "Prediction start mean moved to 62.",
    overrides: { predStart: 62, seed: "test-predStart-62" }
  },
  {
    id: "predEnd_15",
    focus: "predEnd",
    description: "Prediction end mean moved to 15.",
    overrides: { predEnd: 15, seed: "test-predEnd-15" }
  },
  {
    id: "noise_0_1",
    focus: "noiseLevel",
    description: "Very low within-series variance.",
    overrides: { noiseLevel: 0.1, seed: "test-noise-0.1" }
  },
  {
    id: "noise_9",
    focus: "noiseLevel",
    description: "High within-series variance.",
    overrides: { noiseLevel: 9, seed: "test-noise-9" }
  },
  {
    id: "predVar_1",
    focus: "predVariance",
    description: "Tight agreement at prediction end.",
    overrides: { predVariance: 1, seed: "test-predVar-1" }
  },
  {
    id: "predVar_225",
    focus: "predVariance",
    description: "Wide spread at prediction end.",
    overrides: { predVariance: 225, seed: "test-predVar-225" }
  },
  {
    id: "skew_up",
    focus: "skew",
    description: "Majority of models diverge upward at the end.",
    overrides: { skew: "up", seed: "test-skew-up" }
  },
  {
    id: "skew_down",
    focus: "skew",
    description: "Majority of models diverge downward at the end.",
    overrides: { skew: "down", seed: "test-skew-down" }
  },
  {
    id: "skew_bimodel",
    focus: "skew",
    description: "Roughly half diverge up and half down.",
    overrides: { skew: "bimodel", seed: "test-skew-bimodel" }
  }
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function valuesAtDate(data, filterFn, date) {
  return data.filter((d) => filterFn(d) && d.date === date).map((d) => d.price);
}

function pathResidualVariance(points) {
  if (points.length < 3) {
    return 0;
  }
  const start = points[0];
  const end = points[points.length - 1];
  const residuals = [];
  for (let i = 1; i < points.length - 1; i += 1) {
    const t = i / (points.length - 1);
    const baseline = start + (end - start) * t;
    residuals.push(points[i] - baseline);
  }
  return sampleVariance(residuals);
}

function analyzeDataset(dataset, expectedPredEnd) {
  const data = dataset.data;
  const historical = data.filter((d) => d.series === "historical");
  const prediction = data.filter((d) => d.series === "prediction");
  const stocks = sortedUnique(data.map((d) => d.stock));
  const histDates = sortedUnique(historical.map((d) => d.date));
  const predDates = sortedUnique(prediction.map((d) => d.date));

  const histStartDate = histDates[0];
  const histEndDate = histDates[histDates.length - 1];
  const predStartDate = predDates[0];
  const predEndDate = predDates[predDates.length - 1];

  const histStartMean = mean(valuesAtDate(data, (d) => d.series === "historical", histStartDate));
  const histEndMean = mean(valuesAtDate(data, (d) => d.series === "historical", histEndDate));
  const predStartMean = mean(valuesAtDate(data, (d) => d.series === "prediction", predStartDate));
  const predEndMean = mean(valuesAtDate(data, (d) => d.series === "prediction", predEndDate));

  const scenarioCounts = {};
  for (const stock of stocks) {
    const scenarios = new Set(
      prediction
        .filter((d) => d.stock === stock && d.date === predStartDate)
        .map((d) => d.scenario)
    );
    scenarioCounts[stock] = scenarios.size;
  }

  const historicalResiduals = [];
  const predictionResiduals = [];
  const endVariances = [];
  const endpointSigns = [];

  for (const stock of stocks) {
    const histSeries = historical
      .filter((d) => d.stock === stock)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => d.price);
    historicalResiduals.push(pathResidualVariance(histSeries));

    const stockPred = prediction.filter((d) => d.stock === stock);
    const scenarios = sortedUnique(stockPred.map((d) => d.scenario));

    const endValues = [];
    for (const scenario of scenarios) {
      const series = stockPred
        .filter((d) => d.scenario === scenario)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => d.price);
      predictionResiduals.push(pathResidualVariance(series));
      endValues.push(series[series.length - 1]);
    }

    endVariances.push(sampleVariance(endValues));
    for (const value of endValues) {
      endpointSigns.push(value > expectedPredEnd ? 1 : value < expectedPredEnd ? -1 : 0);
    }
  }

  const positiveRatio =
    endpointSigns.length === 0
      ? 0
      : endpointSigns.filter((x) => x > 0).length / endpointSigns.length;

  const negativeRatio =
    endpointSigns.length === 0
      ? 0
      : endpointSigns.filter((x) => x < 0).length / endpointSigns.length;

  return {
    totalRecords: data.length,
    historicalRecords: historical.length,
    predictionRecords: prediction.length,
    histStartDate,
    histEndDate,
    predStartDate,
    predEndDate,
    histStartMean,
    histEndMean,
    predStartMean,
    predEndMean,
    scenarioCounts,
    historicalResidualVariance: mean(historicalResiduals),
    predictionResidualVariance: mean(predictionResiduals),
    predictionEndVariance: mean(endVariances),
    positiveEndpointRatio: positiveRatio,
    negativeEndpointRatio: negativeRatio
  };
}

function approxEqual(actual, expected, tolerance) {
  return Math.abs(actual - expected) <= tolerance;
}

function addCheck(checks, condition, message) {
  checks.push({ ok: Boolean(condition), message });
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function buildViewerHtml(caseRows) {
  const caseJson = JSON.stringify(caseRows, null, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generator Option Tests</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f6f8;
      color: #1f2937;
    }
    .layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      min-height: 100vh;
    }
    .panel {
      padding: 16px;
      border-right: 1px solid #d1d5db;
      background: white;
      overflow-y: auto;
    }
    .panel h1 {
      font-size: 18px;
      margin: 0 0 8px 0;
    }
    .panel p {
      font-size: 13px;
      line-height: 1.4;
      color: #4b5563;
      margin: 0 0 12px 0;
    }
    .case-btn {
      width: 100%;
      text-align: left;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      background: #f9fafb;
      cursor: pointer;
    }
    .case-btn:hover {
      background: #eef2ff;
    }
    .case-btn.active {
      border-color: #2563eb;
      background: #eff6ff;
    }
    .case-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .case-desc {
      font-size: 12px;
      color: #4b5563;
    }
    .viewer {
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }
    .meta {
      padding: 10px 14px;
      border-bottom: 1px solid #d1d5db;
      background: white;
      font-size: 13px;
    }
    iframe {
      width: 100%;
      height: calc(100vh - 46px);
      border: 0;
      background: white;
    }
    .small {
      color: #6b7280;
      font-size: 12px;
      margin-top: 6px;
    }
    @media (max-width: 980px) {
      .layout { grid-template-columns: 1fr; }
      .panel { border-right: 0; border-bottom: 1px solid #d1d5db; max-height: 45vh; }
      iframe { height: 70vh; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <div class="panel">
      <h1>Option Test Viewer</h1>
      <p>Each case reuses <code>conditions.html</code> with a generated dataset. Select a case to inspect whether chart behavior matches the designed option effect.</p>
      <div id="caseList"></div>
      <div class="small">Tip: use the start-date and opacity controls in each embedded visualization for closer inspection.</div>
    </div>
    <div class="viewer">
      <div class="meta" id="meta"></div>
      <iframe id="frame" src="" title="Visualization"></iframe>
    </div>
  </div>
  <script>
    const cases = ${caseJson};
    const listEl = document.getElementById("caseList");
    const frameEl = document.getElementById("frame");
    const metaEl = document.getElementById("meta");
    let currentId = null;

    function setActive(id) {
      currentId = id;
      const selected = cases.find((c) => c.id === id);
      if (!selected) return;
      frameEl.src = selected.viewerUrl;
      metaEl.textContent = selected.title + " | " + selected.description + " | Data: " + selected.dataRelativePath;
      for (const btn of document.querySelectorAll(".case-btn")) {
        btn.classList.toggle("active", btn.dataset.id === id);
      }
    }

    for (const c of cases) {
      const btn = document.createElement("button");
      btn.className = "case-btn";
      btn.dataset.id = c.id;
      btn.innerHTML = '<div class="case-title">' + c.title + '</div><div class="case-desc">' + c.description + '</div>';
      btn.addEventListener("click", () => setActive(c.id));
      listEl.appendChild(btn);
    }

    setActive(cases[0].id);
  </script>
</body>
</html>`;
}

function run() {
  ensureDir(OUTPUT_DIR);
  ensureDir(DATA_DIR);

  const caseResults = [];
  for (const testCase of CASES) {
    const options = { ...BASE_OPTIONS, ...testCase.overrides };
    const dataset = generateSyntheticStockData(options);
    const outputFileName = `${testCase.id}.json`;
    const outputPath = path.join(DATA_DIR, outputFileName);
    writeJson(outputPath, dataset);

    caseResults.push({
      ...testCase,
      outputFileName,
      options,
      metrics: analyzeDataset(dataset, options.predEnd)
    });
  }

  const byId = Object.fromEntries(caseResults.map((result) => [result.id, result]));
  const checks = [];

  // numPred
  for (const id of ["numPred_3", "numPred_16"]) {
    const result = byId[id];
    for (const [stock, count] of Object.entries(result.metrics.scenarioCounts)) {
      addCheck(
        checks,
        count === result.options.numPred,
        `${id}: stock ${stock} has ${count} scenarios (expected ${result.options.numPred})`
      );
    }
  }

  // Endpoint mean controls
  addCheck(
    checks,
    approxEqual(byId.histStart_55.metrics.histStartMean, byId.histStart_55.options.histStart, 0.2),
    `histStart_55: historical start mean ${byId.histStart_55.metrics.histStartMean.toFixed(2)} ~= ${byId.histStart_55.options.histStart}`
  );
  addCheck(
    checks,
    approxEqual(byId.histEnd_18.metrics.histEndMean, byId.histEnd_18.options.histEnd, 0.2),
    `histEnd_18: historical end mean ${byId.histEnd_18.metrics.histEndMean.toFixed(2)} ~= ${byId.histEnd_18.options.histEnd}`
  );
  addCheck(
    checks,
    approxEqual(byId.predStart_62.metrics.predStartMean, byId.predStart_62.options.predStart, 0.25),
    `predStart_62: prediction start mean ${byId.predStart_62.metrics.predStartMean.toFixed(2)} ~= ${byId.predStart_62.options.predStart}`
  );
  addCheck(
    checks,
    approxEqual(byId.predEnd_15.metrics.predEndMean, byId.predEnd_15.options.predEnd, 0.25),
    `predEnd_15: prediction end mean ${byId.predEnd_15.metrics.predEndMean.toFixed(2)} ~= ${byId.predEnd_15.options.predEnd}`
  );

  // Variance controls
  addCheck(
    checks,
    byId.noise_9.metrics.historicalResidualVariance >
      byId.noise_0_1.metrics.historicalResidualVariance * 10,
    `noiseLevel: historical residual variance rises from ${byId.noise_0_1.metrics.historicalResidualVariance.toFixed(2)} to ${byId.noise_9.metrics.historicalResidualVariance.toFixed(2)}`
  );
  addCheck(
    checks,
    byId.noise_9.metrics.predictionResidualVariance >
      byId.noise_0_1.metrics.predictionResidualVariance * 10,
    `noiseLevel: prediction residual variance rises from ${byId.noise_0_1.metrics.predictionResidualVariance.toFixed(2)} to ${byId.noise_9.metrics.predictionResidualVariance.toFixed(2)}`
  );
  addCheck(
    checks,
    byId.predVar_225.metrics.predictionEndVariance >
      byId.predVar_1.metrics.predictionEndVariance * 20,
    `predVariance: endpoint spread rises from ${byId.predVar_1.metrics.predictionEndVariance.toFixed(2)} to ${byId.predVar_225.metrics.predictionEndVariance.toFixed(2)}`
  );

  // Skew controls
  addCheck(
    checks,
    byId.skew_up.metrics.positiveEndpointRatio > 0.55,
    `skew_up: positive endpoint ratio ${byId.skew_up.metrics.positiveEndpointRatio.toFixed(2)} > 0.55`
  );
  addCheck(
    checks,
    byId.skew_down.metrics.positiveEndpointRatio < 0.45,
    `skew_down: positive endpoint ratio ${byId.skew_down.metrics.positiveEndpointRatio.toFixed(2)} < 0.45`
  );
  addCheck(
    checks,
    byId.skew_bimodel.metrics.positiveEndpointRatio >= 0.35 &&
      byId.skew_bimodel.metrics.positiveEndpointRatio <= 0.65,
    `skew_bimodel: positive endpoint ratio ${byId.skew_bimodel.metrics.positiveEndpointRatio.toFixed(2)} is near 0.50`
  );

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.length - passed;

  const viewerRows = caseResults.map((result) => {
    const dataRelativePath = `script/test_output/data/${result.outputFileName}`;
    return {
      id: result.id,
      title: `${result.id} (${result.focus})`,
      description: result.description,
      dataRelativePath,
      viewerUrl: `../../conditions.html?data=${encodeURIComponent(dataRelativePath)}`
    };
  });
  fs.writeFileSync(VIEWER_PATH, buildViewerHtml(viewerRows));

  const report = {
    generatedAt: new Date().toISOString(),
    outputDir: OUTPUT_DIR,
    summary: { totalChecks: checks.length, passed, failed },
    checks,
    cases: caseResults.map((result) => ({
      id: result.id,
      focus: result.focus,
      description: result.description,
      file: path.join("script", "test_output", "data", result.outputFileName),
      options: result.options,
      metrics: result.metrics
    }))
  };
  writeJson(REPORT_JSON_PATH, report);

  const mdLines = [];
  mdLines.push("# Generator Option Test Report");
  mdLines.push("");
  mdLines.push(`Generated at: ${report.generatedAt}`);
  mdLines.push(`Checks: ${checks.length}, Passed: ${passed}, Failed: ${failed}`);
  mdLines.push("");
  mdLines.push("## Check Results");
  for (const check of checks) {
    mdLines.push(`- ${check.ok ? "PASS" : "FAIL"}: ${check.message}`);
  }
  mdLines.push("");
  mdLines.push("## Visual Validation");
  mdLines.push(
    "- Open `script/test_output/option_tests_viewer.html` through a local server to inspect all generated datasets with `conditions.html`."
  );
  fs.writeFileSync(REPORT_MD_PATH, mdLines.join("\n"));

  console.log(`Generated ${caseResults.length} datasets in ${DATA_DIR}`);
  console.log(`Report JSON: ${REPORT_JSON_PATH}`);
  console.log(`Report MD:   ${REPORT_MD_PATH}`);
  console.log(`Viewer:      ${VIEWER_PATH}`);
  console.log("");
  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"}: ${check.message}`);
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
