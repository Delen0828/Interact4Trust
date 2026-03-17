"use strict";

const DATASET_FILE = "virexa_talmori_incHist_incPred.json";
const CITY_KEYS = ["A", "B"];

const CONFIG = {
  width: 600,
  height: 400,
  margin: { top: 20, right: 20, bottom: 40, left: 50 },
  yDomain: [0, 100],
  predictionEndDate: new Date("2025-06-30T00:00:00"),
  referenceDate: new Date("2025-06-01T00:00:00"),
  colors: {
    A: "#0891B2",
    B: "#7C3AED"
  },
  alternativeOpacity: 0.4,
  boundsOpacity: 0.2,
  animation: {
    initialDelayMs: 2000,
    transitionMs: 450,
    visibleMs: 1200,
    hiddenMs: 900
  }
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

function calculateMeanBounds95(values) {
  if (!values.length) {
    return { lower: 0, upper: 0, mean: 0 };
  }

  const avg = mean(values);
  if (values.length <= 1) {
    return { lower: avg, upper: avg, mean: avg };
  }

  const variance =
    values.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) /
    (values.length - 1);
  const standardDeviation = Math.sqrt(variance);
  const standardError = standardDeviation / Math.sqrt(values.length);
  const margin = 1.96 * standardError;

  return {
    lower: avg - margin,
    upper: avg + margin,
    mean: avg
  };
}

function buildCitySeries(rows, stock) {
  const stockRows = rows.filter((row) => row.stock === stock);

  const historical = stockRows
    .filter((row) => row.series === "historical")
    .map((row) => ({ date: parseDate(row.date), price: row.price }))
    .sort((a, b) => a.date - b.date);

  const predictionRows = stockRows
    .filter((row) => row.series === "prediction")
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = groupBy(predictionRows, (row) => row.date);
  const aggregated = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sameDateRows]) => ({
      date: parseDate(date),
      price: mean(sameDateRows.map((row) => row.price))
    }));

  const confidenceBounds = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sameDateRows]) => {
      const bounds = calculateMeanBounds95(sameDateRows.map((row) => row.price));
      return {
        date: parseDate(date),
        lower: bounds.lower,
        upper: bounds.upper
      };
    });

  const byScenario = groupBy(predictionRows, (row) => row.scenario || "default");
  const scenarioPaths = [...byScenario.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([, scenarioRows]) =>
      scenarioRows
        .map((row) => ({ date: parseDate(row.date), price: row.price }))
        .sort((a, b) => a.date - b.date)
    );

  const lastHistorical = historical[historical.length - 1];
  const aggregatedPath = lastHistorical ? [lastHistorical, ...aggregated] : aggregated;
  const uncertaintyAreaPath = lastHistorical
    ? [
        { date: lastHistorical.date, lower: lastHistorical.price, upper: lastHistorical.price },
        ...confidenceBounds
      ]
    : confidenceBounds;

  const alternativePaths = lastHistorical
    ? scenarioPaths.map((scenarioPath) => [lastHistorical, ...scenarioPath])
    : scenarioPaths;

  return {
    historical,
    aggregatedPath,
    uncertaintyAreaPath,
    alternativePaths
  };
}

function createChart(svgSelector, seriesByCity) {
  const svg = d3.select(svgSelector);
  svg.selectAll("*").remove();

  const innerWidth = CONFIG.width - CONFIG.margin.left - CONFIG.margin.right;
  const innerHeight = CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom;

  const g = svg
    .append("g")
    .attr("transform", `translate(${CONFIG.margin.left},${CONFIG.margin.top})`);

  const allDates = CITY_KEYS.flatMap((city) => {
    const citySeries = seriesByCity[city];
    return [
      ...citySeries.historical.map((d) => d.date),
      ...citySeries.aggregatedPath.map((d) => d.date)
    ];
  });

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

  const area = d3
    .area()
    .x((d) => x(d.date))
    .y0((d) => y(d.lower))
    .y1((d) => y(d.upper))
    .curve(d3.curveMonotoneX);

  const referenceX = x(CONFIG.referenceDate);
  g.append("line")
    .attr("class", "reference-line")
    .attr("x1", referenceX)
    .attr("x2", referenceX)
    .attr("y1", 0)
    .attr("y2", innerHeight);

  g.append("text")
    .attr("class", "today-label")
    .attr("x", referenceX)
    .attr("y", -6)
    .text("Today");

  const detailTargets = {
    A: { alternatives: null, bounds: null },
    B: { alternatives: null, bounds: null }
  };

  CITY_KEYS.forEach((city) => {
    const citySeries = seriesByCity[city];
    const color = CONFIG.colors[city];

    g.append("path")
      .datum(citySeries.historical)
      .attr("class", "historical-line")
      .attr("stroke", color)
      .attr("d", line);

    g.append("path")
      .datum(citySeries.aggregatedPath)
      .attr("class", "aggregated-line")
      .attr("stroke", color)
      .attr("d", line);

    const boundsPath = g
      .append("path")
      .datum(citySeries.uncertaintyAreaPath)
      .attr("class", "bounds-area")
      .attr("fill", color)
      .attr("opacity", 0)
      .attr("d", area);

    const alternativesGroup = g.append("g").style("opacity", 0);
    citySeries.alternativePaths.forEach((scenarioPath) => {
      alternativesGroup
        .append("path")
        .datum(scenarioPath)
        .attr("class", "alternative-line")
        .attr("stroke", color)
        .attr("d", line);
    });

    detailTargets[city] = {
      alternatives: alternativesGroup,
      bounds: boundsPath
    };
  });

  function setCityVisibility(city, isVisible, duration = CONFIG.animation.transitionMs) {
    const target = detailTargets[city];
    if (!target) return;

    const altOpacity = isVisible ? CONFIG.alternativeOpacity : 0;
    const boundsOpacity = isVisible ? CONFIG.boundsOpacity : 0;

    target.alternatives
      .interrupt()
      .transition()
      .duration(duration)
      .style("opacity", altOpacity);

    target.bounds
      .interrupt()
      .transition()
      .duration(duration)
      .attr("opacity", boundsOpacity);
  }

  function setAllVisibility(isVisible, duration = CONFIG.animation.transitionMs) {
    setCityVisibility("A", isVisible, duration);
    setCityVisibility("B", isVisible, duration);
  }

  return { setCityVisibility, setAllVisibility };
}

function startAnimationShowAll(chart, statusEl, cityNames) {
  let timeoutId = null;
  let stopped = false;
  let cycleIndex = 0;

  function schedule(callback, delay) {
    timeoutId = window.setTimeout(callback, delay);
  }

  function runCycle() {
    if (stopped) return;
    cycleIndex += 1;

    if (statusEl) {
      statusEl.textContent = `Cycle ${cycleIndex}: show both cities (${cityNames.A} + ${cityNames.B})`;
    }
    chart.setAllVisibility(true, CONFIG.animation.transitionMs);

    schedule(() => {
      if (stopped) return;
      if (statusEl) {
        statusEl.textContent = `Cycle ${cycleIndex}: hide both cities`;
      }
      chart.setAllVisibility(false, CONFIG.animation.transitionMs);
      schedule(runCycle, CONFIG.animation.hiddenMs);
    }, CONFIG.animation.visibleMs);
  }

  if (statusEl) {
    statusEl.textContent = "Waiting 2s before first loop...";
  }
  chart.setAllVisibility(false, 0);
  schedule(runCycle, CONFIG.animation.initialDelayMs);

  return () => {
    stopped = true;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

function randomCityOrder() {
  return Math.random() < 0.5 ? ["A", "B"] : ["B", "A"];
}

function startAnimationShowOne(chart, statusEl, cityNames) {
  let timeoutId = null;
  let stopped = false;
  let cycleIndex = 0;

  function schedule(callback, delay) {
    timeoutId = window.setTimeout(callback, delay);
  }

  function runCycle() {
    if (stopped) return;
    cycleIndex += 1;

    const [firstCity, secondCity] = randomCityOrder();
    chart.setAllVisibility(false, 0);

    if (statusEl) {
      statusEl.textContent = `Cycle ${cycleIndex}: ${cityNames[firstCity]} starts first`;
    }
    chart.setCityVisibility(firstCity, true, CONFIG.animation.transitionMs);
    chart.setCityVisibility(secondCity, false, CONFIG.animation.transitionMs);

    schedule(() => {
      if (stopped) return;
      if (statusEl) {
        statusEl.textContent = `Cycle ${cycleIndex}: switch ${cityNames[firstCity]} -> ${cityNames[secondCity]}`;
      }
      chart.setCityVisibility(firstCity, false, CONFIG.animation.transitionMs);
      chart.setCityVisibility(secondCity, true, CONFIG.animation.transitionMs);

      schedule(() => {
        if (stopped) return;
        if (statusEl) {
          statusEl.textContent = `Cycle ${cycleIndex}: hide ${cityNames[secondCity]}`;
        }
        chart.setCityVisibility(secondCity, false, CONFIG.animation.transitionMs);
        schedule(runCycle, CONFIG.animation.hiddenMs);
      }, CONFIG.animation.visibleMs);
    }, CONFIG.animation.visibleMs);
  }

  if (statusEl) {
    statusEl.textContent = "Waiting 2s before first loop...";
  }
  chart.setAllVisibility(false, 0);
  schedule(runCycle, CONFIG.animation.initialDelayMs);

  return () => {
    stopped = true;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
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
  const statusShowAll = document.getElementById("status-show-all");
  const statusShowOne = document.getElementById("status-show-one");
  const cleanups = [];

  try {
    const rows = await loadDataset(DATASET_FILE);
    const uniqueStocks = [...new Set(rows.map((row) => row.stock))];
    if (uniqueStocks.length !== 2) {
      throw new Error(
        `Expected exactly 2 city series, found ${uniqueStocks.length}.`
      );
    }

    const cityNames = {
      A: uniqueStocks[0],
      B: uniqueStocks[1]
    };

    const seriesByCity = {
      A: buildCitySeries(rows, cityNames.A),
      B: buildCitySeries(rows, cityNames.B)
    };

    const chartShowAll = createChart("#chart-show-all", seriesByCity);
    const chartShowOne = createChart("#chart-show-one", seriesByCity);

    cleanups.push(startAnimationShowAll(chartShowAll, statusShowAll, cityNames));
    cleanups.push(startAnimationShowOne(chartShowOne, statusShowOne, cityNames));
  } catch (error) {
    if (statusShowAll) statusShowAll.textContent = `Error: ${error.message}`;
    if (statusShowOne) statusShowOne.textContent = `Error: ${error.message}`;
  }

  window.addEventListener("beforeunload", () => {
    cleanups.forEach((cleanupFn) => cleanupFn());
  });
}

main();
