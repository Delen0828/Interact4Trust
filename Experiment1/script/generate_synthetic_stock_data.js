#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const STOCKS = ["A", "B"];
const HIST_START_DATE = "2025-01-01";
const HIST_END_DATE = "2025-06-01";
const PRED_START_DATE = "2025-06-02";
const PRED_END_DATE = "2025-06-30";

const DEFAULTS = {
  numPred: 10,
  histStart: 40,
  histEnd: 40,
  predStart: undefined,
  predEnd: 40,
  noiseLevel: 1,
  predVariance: 100,
  skew: "bimodel",
  fileName: "synthetic_stock_data_generated.json",
  seed: "default-seed"
};

function usage() {
  return `
Generate synthetic stock-format data for Experiment1.

Usage:
  node script/generate_synthetic_stock_data.js [options]

Options:
  --numPred <int>         Number of prediction models (scenarios) per timestamp
  --histStart <number>    Historical starting value
  --histEnd <number>      Historical ending value
  --predEnd <number>      Mean ending value of prediction data
  --noiseLevel <number>   Variance of historical and per-model prediction noise
  --predVariance <number> Variance across model endpoints at prediction end
  --skew <up|down|bimodel>  Endpoint direction pattern across models
  --fileName <name.json>  Output file name

Optional:
  --predStart <number>    Mean starting value of prediction data (default: histEnd)
  --seed <string>         Seed for deterministic generation (default: ${DEFAULTS.seed})
  --help                  Show this message

Notes on option interaction:
  - predStart defaults to histEnd when omitted.
  - noiseLevel controls within-series variation over time.
  - predVariance controls spread across models at the final prediction timestamp.
  - skew controls sign bias of model endpoint deviations:
    up = majority above predEnd, down = majority below predEnd, bimodel = split.
  - The model endpoints are re-centered to preserve mean(prediction end) ~= predEnd.
`.trim();
}

function parseArgs(argv) {
  const parsed = { ...DEFAULTS };
  const numericFlags = new Set([
    "numPred",
    "histStart",
    "histEnd",
    "predStart",
    "predEnd",
    "noiseLevel",
    "predVariance"
  ]);
  const stringFlags = new Set(["skew", "fileName", "seed"]);
  const knownFlags = new Set([...numericFlags, ...stringFlags, "help"]);
  const provided = new Set();

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected token: ${arg}`);
    }

    const flag = arg.slice(2);
    if (!knownFlags.has(flag)) {
      throw new Error(`Unknown option: --${flag}`);
    }

    if (flag === "help") {
      parsed.help = true;
      continue;
    }

    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${flag}`);
    }
    i += 1;

    provided.add(flag);
    if (numericFlags.has(flag)) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        throw new Error(`Option --${flag} must be a number, got "${value}"`);
      }
      parsed[flag] = numericValue;
    } else if (stringFlags.has(flag)) {
      parsed[flag] = String(value);
    }
  }

  if (!provided.has("predStart")) {
    parsed.predStart = parsed.histEnd;
  }

  validateOptions(parsed);
  return parsed;
}

function validateOptions(options) {
  if (!Number.isInteger(options.numPred) || options.numPred < 1) {
    throw new Error("--numPred must be an integer >= 1");
  }
  if (options.noiseLevel < 0) {
    throw new Error("--noiseLevel must be >= 0");
  }
  if (options.predVariance < 0) {
    throw new Error("--predVariance must be >= 0");
  }
  if (!["up", "down", "bimodel"].includes(options.skew)) {
    throw new Error('--skew must be one of: "up", "down", "bimodel"');
  }
  if (path.basename(options.fileName) !== options.fileName) {
    throw new Error("--fileName must be a file name, not a path");
  }
  if (!options.fileName.toLowerCase().endsWith(".json")) {
    options.fileName = `${options.fileName}.json`;
  }
}

function generateDates(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function mean(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleVariance(values) {
  if (values.length < 2) {
    return 0;
  }
  const m = mean(values);
  const sumSq = values.reduce((sum, value) => sum + (value - m) ** 2, 0);
  return sumSq / (values.length - 1);
}

function hashStringToSeed(seedText) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng, stdDev = 1) {
  if (stdDev === 0) {
    return 0;
  }
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev;
}

function roundPrice(value) {
  return Math.round(value * 100) / 100;
}

function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function resolvePositiveCount(numPred, skew) {
  if (numPred === 1) {
    return skew === "down" ? 0 : 1;
  }

  if (skew === "bimodel") {
    return Math.max(1, Math.min(numPred - 1, Math.round(numPred * 0.5)));
  }

  if (skew === "up") {
    return Math.max(1, Math.min(numPred - 1, Math.round(numPred * 0.7)));
  }

  // skew === "down"
  return Math.max(1, Math.min(numPred - 1, Math.round(numPred * 0.3)));
}

function generateEndpointDeviations(numPred, targetVariance, skew, rng) {
  if (numPred < 2 || targetVariance === 0) {
    return new Array(numPred).fill(0);
  }

  const positiveCount = resolvePositiveCount(numPred, skew);
  const negativeCount = numPred - positiveCount;
  if (positiveCount === 0 || negativeCount === 0) {
    return new Array(numPred).fill(0);
  }

  const positiveMagnitudes = new Array(positiveCount).fill(0).map(() => {
    return Math.max(Math.abs(gaussian(rng, 1)), Number.EPSILON);
  });
  const negativeMagnitudes = new Array(negativeCount).fill(0).map(() => {
    return Math.max(Math.abs(gaussian(rng, 1)), Number.EPSILON);
  });

  const positiveTotal = positiveMagnitudes.reduce((sum, v) => sum + v, 0);
  const negativeTotal = negativeMagnitudes.reduce((sum, v) => sum + v, 0);
  const negativeScale = positiveTotal / negativeTotal;

  const raw = [
    ...positiveMagnitudes.map((magnitude) => magnitude),
    ...negativeMagnitudes.map((magnitude) => -magnitude * negativeScale)
  ];
  shuffle(raw, rng);

  const currentVariance = sampleVariance(raw);
  if (currentVariance === 0) {
    return new Array(numPred).fill(0);
  }

  const scale = Math.sqrt(targetVariance / currentVariance);
  return raw.map((value) => value * scale);
}

function buildTrajectory({
  dates,
  startValue,
  endValue,
  noiseStdDev,
  stockIndex,
  rng
}) {
  const n = dates.length;
  if (n === 1) {
    return [roundPrice(startValue)];
  }

  const values = [];
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const base = startValue + (endValue - startValue) * t;

    // Keep endpoints exact while separating stock curves slightly in the middle.
    const stockShapeBias =
      (stockIndex === 0 ? 1 : -1) * noiseStdDev * 0.3 * Math.sin(Math.PI * t);

    const noise = i === 0 || i === n - 1 ? 0 : gaussian(rng, noiseStdDev);
    values.push(roundPrice(base + stockShapeBias + noise));
  }
  return values;
}

function generateSyntheticStockData(options) {
  const histDates = generateDates(HIST_START_DATE, HIST_END_DATE);
  const predDates = generateDates(PRED_START_DATE, PRED_END_DATE);
  const rng = mulberry32(hashStringToSeed(String(options.seed)));
  const noiseStdDev = Math.sqrt(options.noiseLevel);
  const records = [];

  for (let stockIndex = 0; stockIndex < STOCKS.length; stockIndex += 1) {
    const stock = STOCKS[stockIndex];

    // Historical series
    const historicalValues = buildTrajectory({
      dates: histDates,
      startValue: options.histStart,
      endValue: options.histEnd,
      noiseStdDev,
      stockIndex,
      rng
    });

    for (let i = 0; i < histDates.length; i += 1) {
      records.push({
        date: histDates[i],
        stock,
        price: historicalValues[i],
        series: "historical",
        scenario: null
      });
    }

    // Scenario-specific prediction starts keep overall mean at predStart.
    const rawStartOffsets = new Array(options.numPred)
      .fill(0)
      .map(() => gaussian(rng, noiseStdDev));
    const centeredStartOffsets = rawStartOffsets.map(
      (value) => value - mean(rawStartOffsets)
    );
    const scenarioStarts = centeredStartOffsets.map(
      (offset) => options.predStart + offset
    );

    // Scenario endpoints are controlled by predVariance + skew.
    const endpointDeviations = generateEndpointDeviations(
      options.numPred,
      options.predVariance,
      options.skew,
      rng
    );
    const scenarioEnds = endpointDeviations.map(
      (delta) => options.predEnd + delta
    );

    for (let modelIndex = 0; modelIndex < options.numPred; modelIndex += 1) {
      const scenarioId = `scenario_${modelIndex + 1}`;
      const predictionValues = buildTrajectory({
        dates: predDates,
        startValue: scenarioStarts[modelIndex],
        endValue: scenarioEnds[modelIndex],
        noiseStdDev,
        stockIndex,
        rng
      });

      for (let i = 0; i < predDates.length; i += 1) {
        records.push({
          date: predDates[i],
          stock,
          price: predictionValues[i],
          series: "prediction",
          scenario: scenarioId
        });
      }
    }
  }

  return { data: records };
}

function summarize(dataset) {
  const data = dataset.data;
  const historical = data.filter((d) => d.series === "historical");
  const prediction = data.filter((d) => d.series === "prediction");
  const predDates = [...new Set(prediction.map((d) => d.date))].sort();
  const predEndDate = predDates[predDates.length - 1];
  const predEndValues = prediction
    .filter((d) => d.date === predEndDate)
    .map((d) => d.price);

  return {
    totalRecords: data.length,
    historicalRecords: historical.length,
    predictionRecords: prediction.length,
    stocks: [...new Set(data.map((d) => d.stock))],
    scenarios: [...new Set(prediction.map((d) => d.scenario))].length,
    predictionEndVariance: roundPrice(sampleVariance(predEndValues))
  };
}

function main() {
  try {
    const options = parseArgs(process.argv);
    if (options.help) {
      console.log(usage());
      process.exit(0);
    }

    const dataset = generateSyntheticStockData(options);
    const outputPath = path.resolve(process.cwd(), options.fileName);
    fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));

    const summary = summarize(dataset);
    console.log(`Generated ${outputPath}`);
    console.log(JSON.stringify({ options, summary }, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error("");
    console.error(usage());
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULTS,
  HIST_START_DATE,
  HIST_END_DATE,
  PRED_START_DATE,
  PRED_END_DATE,
  parseArgs,
  generateSyntheticStockData,
  generateDates,
  mean,
  sampleVariance
};
