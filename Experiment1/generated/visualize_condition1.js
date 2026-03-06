"use strict";

const DATASETS = [
  {
    file: "virexa_talmori_incHist_incPred.json",
    label: "Virexa - Talmori",
    trend: "History: increasing | Prediction: increasing"
  },
  {
    file: "qelvane_rostiva_incHist_decPred.json",
    label: "Qelvane - Rostiva",
    trend: "History: increasing | Prediction: decreasing"
  },
  {
    file: "nexari_pulveth_decHist_incPred.json",
    label: "Nexari - Pulveth",
    trend: "History: decreasing | Prediction: increasing"
  },
  {
    file: "zorvani_kelthar_decHist_decPred.json",
    label: "Zorvani - Kelthar",
    trend: "History: decreasing | Prediction: decreasing"
  }
];

const FIXED_SCENARIOS = new Set([
  "scenario_1",
  "scenario_2",
  "scenario_3",
  "scenario_4",
  "scenario_5"
]);

const CONFIG = {
  width: 600,
  height: 400,
  margin: { top: 20, right: 20, bottom: 40, left: 50 },
  yDomain: [0, 100],
  predictionEndDate: new Date("2025-06-30T00:00:00"),
  referenceDate: new Date("2025-06-01T00:00:00"),
  colors: ["#0891B2", "#7C3AED"],
  alternativeOpacity: 0.4
};

function parseDate(dateString) {
  return d3.utcParse("%Y-%m-%d")(dateString);
}

function mean(values) {
  if (!values.length) return NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupBy(list, keyFn) {
  const grouped = new Map();
  for (const item of list) {
    const key = keyFn(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  return grouped;
}

function buildCondition3Series(rawRows, stockName) {
  const stockRows = rawRows.filter((row) => row.stock === stockName);

  const historical = stockRows
    .filter((row) => row.series === "historical")
    .map((row) => ({ date: parseDate(row.date), price: row.price }))
    .sort((a, b) => a.date - b.date);

  const fixedPredictionRows = stockRows.filter((row) => {
    return row.series === "prediction" && FIXED_SCENARIOS.has(row.scenario);
  });

  const predictionRows = fixedPredictionRows.length
    ? fixedPredictionRows
    : stockRows.filter((row) => row.series === "prediction");

  const byDate = groupBy(predictionRows, (row) => row.date);
  const aggregatedPrediction = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, rows]) => ({
      date: parseDate(date),
      price: mean(rows.map((row) => row.price))
    }));

  const byScenario = groupBy(predictionRows, (row) => row.scenario);
  const alternativeScenarios = [...byScenario.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([, rows]) =>
      rows
        .map((row) => ({ date: parseDate(row.date), price: row.price }))
        .sort((a, b) => a.date - b.date)
    );

  const lastHistorical = historical[historical.length - 1];
  const predictionPath = lastHistorical
    ? [lastHistorical, ...aggregatedPrediction]
    : aggregatedPrediction;

  const alternativePaths = lastHistorical
    ? alternativeScenarios.map((scenarioPath) => [lastHistorical, ...scenarioPath])
    : alternativeScenarios;

  return { historical, predictionPath, alternativePaths };
}

function createCard(datasetInfo, dataRows) {
  const stocks = [...new Set(dataRows.map((row) => row.stock))];
  if (stocks.length !== 2) {
    throw new Error(
      `Expected exactly 2 stock series in ${datasetInfo.file}, found ${stocks.length}`
    );
  }

  const card = document.createElement("article");
  card.className = "card";

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = datasetInfo.label;
  card.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "card-meta";
  meta.textContent = `${datasetInfo.trend} | Condition 3 (static ensemble plot)`;
  card.appendChild(meta);

  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML = `
    <span class="legend-item">
      <span class="swatch" style="border-top-color:${CONFIG.colors[0]}"></span>${stocks[0]} historical
    </span>
    <span class="legend-item">
      <span class="swatch" style="border-top-color:rgba(8,145,178,0.4)"></span>${stocks[0]} alternatives
    </span>
    <span class="legend-item">
      <span class="swatch dashed" style="border-top-color:${CONFIG.colors[0]}"></span>${stocks[0]} aggregated prediction
    </span>
    <span class="legend-item">
      <span class="swatch" style="border-top-color:${CONFIG.colors[1]}"></span>${stocks[1]} historical
    </span>
    <span class="legend-item">
      <span class="swatch" style="border-top-color:rgba(124,58,237,0.4)"></span>${stocks[1]} alternatives
    </span>
    <span class="legend-item">
      <span class="swatch dashed" style="border-top-color:${CONFIG.colors[1]}"></span>${stocks[1]} aggregated prediction
    </span>
  `;
  card.appendChild(legend);

  const svg = d3
    .create("svg")
    .attr("class", "chart")
    .attr("viewBox", `0 0 ${CONFIG.width} ${CONFIG.height}`)
    .attr("role", "img")
    .attr("aria-label", `${datasetInfo.label} static condition 3 chart`);

  const g = svg
    .append("g")
    .attr(
      "transform",
      `translate(${CONFIG.margin.left},${CONFIG.margin.top})`
    );

  const innerWidth = CONFIG.width - CONFIG.margin.left - CONFIG.margin.right;
  const innerHeight = CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom;

  const stockSeries = stocks.map((stockName) =>
    buildCondition3Series(dataRows, stockName)
  );

  const allDates = stockSeries.flatMap((stock) => [
    ...stock.historical.map((d) => d.date),
    ...stock.predictionPath.map((d) => d.date),
    ...stock.alternativePaths.flatMap((scenarioPath) =>
      scenarioPath.map((d) => d.date)
    )
  ]);

  const x = d3
    .scaleTime()
    .domain([d3.min(allDates), CONFIG.predictionEndDate])
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain(CONFIG.yDomain)
    .range([innerHeight, 0]);

  g.append("g")
    .attr("class", "grid-line")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(8).tickSize(-innerHeight).tickFormat(() => ""));

  g.append("g")
    .attr("class", "grid-line")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerWidth).tickFormat(() => ""));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%d")));

  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(6));

  const line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.price))
    .curve(d3.curveMonotoneX);

  const refX = x(CONFIG.referenceDate);
  g.append("line")
    .attr("class", "reference-line")
    .attr("x1", refX)
    .attr("x2", refX)
    .attr("y1", 0)
    .attr("y2", innerHeight);

  g.append("text")
    .attr("class", "today-label")
    .attr("x", refX)
    .attr("y", -6)
    .text("Today");

  stockSeries.forEach((series, index) => {
    const color = CONFIG.colors[index];

    g.append("path")
      .datum(series.historical)
      .attr("class", "historical-line")
      .attr("stroke", color)
      .attr("d", line);

    series.alternativePaths.forEach((scenarioPath) => {
      g.append("path")
        .datum(scenarioPath)
        .attr("class", "alternative-line")
        .attr("stroke", color)
        .attr("opacity", CONFIG.alternativeOpacity)
        .attr("d", line);
    });

    g.append("path")
      .datum(series.predictionPath)
      .attr("class", "aggregated-line")
      .attr("stroke", color)
      .attr("d", line);
  });

  card.appendChild(svg.node());
  return card;
}

async function loadDataset(fileName) {
  const response = await fetch(fileName, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}: ${response.status}`);
  }
  const parsed = await response.json();
  if (!parsed || !Array.isArray(parsed.data)) {
    throw new Error(`Invalid dataset format in ${fileName}`);
  }
  return parsed.data;
}

async function main() {
  const container = document.getElementById("chart-grid");
  if (!container) return;

  for (const dataset of DATASETS) {
    try {
      const rows = await loadDataset(dataset.file);
      container.appendChild(createCard(dataset, rows));
    } catch (error) {
      const errorCard = document.createElement("article");
      errorCard.className = "card";
      errorCard.innerHTML = `
        <h2 class="card-title">${dataset.label}</h2>
        <p class="card-meta">${dataset.file}</p>
        <p style="color:#b91c1c;font-size:13px;margin:0;">
          ${error.message}
        </p>
      `;
      container.appendChild(errorCard);
    }
  }
}

main();
