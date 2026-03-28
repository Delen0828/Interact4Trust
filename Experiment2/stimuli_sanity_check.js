import { ConditionFactory } from './display/conditionFactory.js';

const defaultOrganizationLabelsBySlot = Object.freeze([
  'Organization A',
  'Organization B',
  'Organization C',
  'Organization D',
  'Organization E',
  'Organization F',
  'Organization G',
  'Organization H',
  'Organization I',
  'Organization J'
]);

const defaultRoundDatasetConfig = Object.freeze({
  file: null,
  organization: defaultOrganizationLabelsBySlot[0],
  cityA: 'City A',
  cityB: 'City B',
  colors: {
    cityA: '#0891B2',
    cityB: '#7C3AED'
  }
});

const datasetConfigByFile = Object.freeze({
  'ranax_leer_city_baseline.json': {
    cityA: 'Ranax',
    cityB: 'Leer City',
    colors: { cityA: '#1D4ED8', cityB: '#C2410C' }
  },
  'virexa_talmori_incHist_incPred.json': {
    cityA: 'Virexa',
    cityB: 'Talmori',
    colors: { cityA: '#2563EB', cityB: '#D97706' }
  },
  'qelvane_rostiva_incHist_decPred.json': {
    cityA: 'Qelvane',
    cityB: 'Rostiva',
    colors: { cityA: '#059669', cityB: '#DC2626' }
  },
  'nexari_pulveth_decHist_incPred.json': {
    cityA: 'Nexari',
    cityB: 'Pulveth',
    colors: { cityA: '#7C3AED', cityB: '#0EA5E9' }
  },
  'zorvani_kelthar_decHist_decPred.json': {
    cityA: 'Zorvani',
    cityB: 'Kelthar',
    colors: { cityA: '#BE123C', cityB: '#0F766E' }
  },
  'lumora_vexlin_constHist_incPred.json': {
    cityA: 'Lumora',
    cityB: 'Vexlin',
    colors: { cityA: '#0369A1', cityB: '#B45309' }
  },
  'dravik_solmere_constHist_decPred.json': {
    cityA: 'Dravik',
    cityB: 'Solmere',
    colors: { cityA: '#7E22CE', cityB: '#0E7490' }
  },
  'altriva_morneth_incHist_constPred.json': {
    cityA: 'Altriva',
    cityB: 'Morneth',
    colors: { cityA: '#1E3A8A', cityB: '#B45309' }
  },
  'solnara_kyveth_decHist_constPred.json': {
    cityA: 'Solnara',
    cityB: 'Kyveth',
    colors: { cityA: '#BE123C', cityB: '#155E75' }
  }
});

const versionSettingsById = Object.freeze({
  even_hover: Object.freeze({ parity: 'even', interactionMode: 'hover_show_one' }),
  odd_hover: Object.freeze({ parity: 'odd', interactionMode: 'hover_show_one' }),
  even_click: Object.freeze({ parity: 'even', interactionMode: 'click_show_one' }),
  odd_click: Object.freeze({ parity: 'odd', interactionMode: 'click_show_one' }),
  even_static: Object.freeze({ parity: 'even', interactionMode: 'static_show_all' }),
  odd_static: Object.freeze({ parity: 'odd', interactionMode: 'static_show_all' })
});

const baseDatasetFiles = Object.freeze(Object.keys(datasetConfigByFile));
const datasetFiles = Object.freeze(
  baseDatasetFiles.flatMap((datasetFile) => {
    const md5DatasetFile = datasetFile.replace(/\.json$/i, '_md5.json');
    return [datasetFile, md5DatasetFile];
  })
);

function normalizeDatasetFile(datasetFile) {
  if (typeof datasetFile !== 'string') return '';
  const trimmed = datasetFile.trim();
  if (!trimmed) return '';
  return trimmed.split('/').pop() || trimmed;
}

function toBaseDatasetFile(datasetFile) {
  const normalizedFile = normalizeDatasetFile(datasetFile);
  return normalizedFile.replace(/_md5(?=\.json$)/i, '');
}

function getDatasetVariantLabel(datasetFile) {
  return /_md5\.json$/i.test(normalizeDatasetFile(datasetFile))
    ? 'meanDiff = 5'
    : 'meanDiff = 0';
}

function getInteractionHint(interactionMode) {
  if (interactionMode === 'click_show_one') {
    return 'Hint: Use the two city checkboxes below the chart to show or hide details.';
  }
  if (interactionMode === 'static_show_all') {
    return 'Hint: This is a static view. All forecast details are shown by default.';
  }
  return 'Hint: Hover on a city\'s dashed prediction line to reveal details.';
}

function buildCiDescription(interactionMode) {
  const interactionText = interactionMode === 'click_show_one'
    ? 'Details are revealed with city checkboxes.'
    : interactionMode === 'static_show_all'
      ? 'All details are shown statically (no interaction).'
      : 'Details are revealed by hovering over each city line.';
  return `Both cities show 95% confidence intervals around the aggregated line. ${interactionText}`;
}

function buildEnsembleDescription(lineCount, interactionMode) {
  const interactionText = interactionMode === 'click_show_one'
    ? 'Details are revealed with city checkboxes.'
    : interactionMode === 'static_show_all'
      ? 'All details are shown statically (no interaction).'
      : 'Details are revealed by hovering over each city line.';
  return `Both cities show ${lineCount} sampled ensemble prediction lines plus aggregated line. ${interactionText}`;
}

function buildExp2Conditions(parity, interactionMode) {
  const ensembleLineCounts = parity === 'odd' ? [3, 5, 7, 9] : [2, 4, 6, 8];
  const interactionHint = getInteractionHint(interactionMode);

  const baselineCondition = {
    id: 'condition_1_baseline_aggregation',
    name: `baseline_aggregation_only_${parity}_${interactionMode}`,
    displayFormat: 'exp2_parameterized',
    interactionMode,
    cityAType: 'line',
    cityBType: 'line',
    cityALineCount: 1,
    cityBLineCount: 1,
    description: 'Both cities show only aggregated prediction lines.',
    instructions: 'Dashed lines show aggregated humidity forecasts for each city.'
  };

  const ciCondition = {
    id: 'condition_2_ci_95',
    name: `ci_95_both_cities_${parity}_${interactionMode}`,
    displayFormat: 'exp2_parameterized',
    interactionMode,
    cityAType: 'region',
    cityBType: 'region',
    cityALineCount: 0,
    cityBLineCount: 0,
    description: buildCiDescription(interactionMode),
    instructions: `Shaded regions show 95% confidence intervals around each city's dashed aggregated forecast.<br><br>${interactionHint}`
  };

  const ensembleConditions = ensembleLineCounts.map((lineCount, index) => {
    return {
      id: `condition_${index + 3}_ensemble_${lineCount}_lines`,
      name: `ensemble_${lineCount}_lines_per_city_${parity}_${interactionMode}`,
      displayFormat: 'exp2_parameterized',
      interactionMode,
      cityAType: 'line',
      cityBType: 'line',
      cityALineCount: lineCount,
      cityBLineCount: lineCount,
      description: buildEnsembleDescription(lineCount, interactionMode),
      instructions: `Thin lines are sampled individual forecasts from 10 total predictions.<br><br>${interactionHint}`
    };
  });

  return [baselineCondition, ciCondition, ...ensembleConditions];
}

function getVersionConditions(versionId) {
  const settings = versionSettingsById[versionId] || versionSettingsById.even_hover;
  return buildExp2Conditions(settings.parity, settings.interactionMode);
}

function getCiOnlyCondition(versionId) {
  const versionConditions = getVersionConditions(versionId);
  const ciCondition = versionConditions.find((condition) => String(condition?.id || '').includes('ci_95'));
  if (ciCondition) {
    return ciCondition;
  }
  throw new Error(`Could not find CI condition for version ${versionId}`);
}

function resolveRoundDatasetConfig(roundNumber, condition, datasetFile) {
  const normalizedFile = normalizeDatasetFile(datasetFile);
  const mappedConfig = datasetConfigByFile[toBaseDatasetFile(normalizedFile)] || {};
  const configuredColors = condition?.cityColors || condition?.colors || {};
  const fallbackOrganization = defaultOrganizationLabelsBySlot[roundNumber - 1] || `Organization ${roundNumber}`;

  return {
    file: normalizedFile || null,
    organization: condition?.organization || mappedConfig.organization || fallbackOrganization,
    cityA: condition?.cityA || mappedConfig.cityA || defaultRoundDatasetConfig.cityA,
    cityB: condition?.cityB || mappedConfig.cityB || defaultRoundDatasetConfig.cityB,
    colors: {
      cityA: configuredColors.cityA
        || configuredColors.stockA
        || mappedConfig.colors?.cityA
        || defaultRoundDatasetConfig.colors.cityA,
      cityB: configuredColors.cityB
        || configuredColors.stockB
        || mappedConfig.colors?.cityB
        || defaultRoundDatasetConfig.colors.cityB
    }
  };
}

function normalizeRoundDatasetRows(rawRows, datasetConfig = defaultRoundDatasetConfig) {
  if (!Array.isArray(rawRows)) {
    throw new Error(`Expected dataset rows to be an array, got ${typeof rawRows}`);
  }
  if (rawRows.length === 0) {
    throw new Error('Dataset rows array is empty');
  }

  const observedNames = [...new Set(
    rawRows
      .map((row) => row?.stock ?? row?.city)
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
  )];

  const fallbackCityA = observedNames[0] || datasetConfig.cityA || defaultRoundDatasetConfig.cityA;
  const fallbackCityB = observedNames[1] || datasetConfig.cityB || defaultRoundDatasetConfig.cityB;
  const cityAName = observedNames.includes(datasetConfig.cityA) ? datasetConfig.cityA : fallbackCityA;
  const cityBName = observedNames.includes(datasetConfig.cityB) ? datasetConfig.cityB : fallbackCityB;

  const nameToKey = new Map([
    ['A', 'A'],
    ['B', 'B'],
    [cityAName, 'A'],
    [cityBName, 'B']
  ]);

  const normalizedRows = rawRows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const sourceName = row.stock ?? row.city;
      const mappedStock = nameToKey.get(sourceName);
      if (!mappedStock) return null;
      return {
        ...row,
        stock: mappedStock
      };
    })
    .filter(Boolean);

  const mappedStocks = new Set(normalizedRows.map((row) => row.stock));
  if (!mappedStocks.has('A') || !mappedStocks.has('B')) {
    throw new Error(
      `Normalized dataset must include both city series (A and B). Found: ${Array.from(mappedStocks).join(', ')}`
    );
  }

  return normalizedRows;
}

async function loadRoundDataset(datasetFile, datasetConfig) {
  const normalizedFile = normalizeDatasetFile(datasetFile);
  const candidatePaths = [
    `./generated/${normalizedFile}`,
    `generated/${normalizedFile}`,
    `../generated/${normalizedFile}`,
    normalizedFile
  ];

  let response = null;
  for (const path of candidatePaths) {
    try {
      response = await fetch(path, { cache: 'no-store' });
      if (response.ok) {
        break;
      }
    } catch (_error) {
      response = null;
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Failed to load dataset ${normalizedFile}`);
  }

  const json = await response.json();
  const rows = Array.isArray(json?.data)
    ? json.data
    : (Array.isArray(json) ? json : null);

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Dataset ${normalizedFile} has invalid or empty data`);
  }

  return normalizeRoundDatasetRows(rows, datasetConfig);
}

function isExp2StaticBaselineCondition(condition) {
  const cityAType = condition?.cityAType || 'line';
  const cityBType = condition?.cityBType || 'line';
  const cityALineCount = Number(condition?.cityALineCount || 1);
  const cityBLineCount = Number(condition?.cityBLineCount || 1);
  const conditionId = String(condition?.id || '').toLowerCase();
  return conditionId.includes('baseline')
    || (cityAType === 'line' && cityBType === 'line' && cityALineCount <= 1 && cityBLineCount <= 1);
}

function isExp2ClickShowOneMode(condition) {
  const candidate = String(condition?.interactionMode || condition?.displayFormat || '').toLowerCase();
  return candidate === 'click_show_one';
}

function addLegendAndInstructions(chartContainer, cityLabels, condition) {
  const existingLegend = chartContainer.querySelector('.simple-chart-legend');
  const existingInstructions = chartContainer.querySelector('.chart-instructions');
  if (existingLegend) existingLegend.remove();
  if (existingInstructions) existingInstructions.remove();

  const legendHTML = `
    <div class="simple-chart-legend">
      <div class="legend-line">
        <div class="legend-color-line city-a"></div>
        <span>${cityLabels.cityA}</span>
      </div>
      <div class="legend-line">
        <div class="legend-color-line city-b"></div>
        <span>${cityLabels.cityB}</span>
      </div>
    </div>
  `;
  chartContainer.insertAdjacentHTML('beforeend', legendHTML);

  if (!condition || !condition.instructions) {
    return;
  }

  const rawInstructions = String(condition.instructions || '');
  const instructionLines = rawInstructions
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let descriptionText = instructionLines.find((line) => !/^hint\s*:/i.test(line)) || '';
  let hintText = instructionLines.find((line) => /^hint\s*:/i.test(line)) || '';

  if (!hintText && condition?.displayFormat === 'exp2_parameterized' && !isExp2StaticBaselineCondition(condition)) {
    const interactionMode = String(condition?.interactionMode || '').toLowerCase();
    if (interactionMode === 'static_show_all') {
      hintText = 'Hint: This is a static view. All forecast details are shown by default.';
    } else if (isExp2ClickShowOneMode(condition)) {
      hintText = 'Hint: Use the two city checkboxes below the chart to show or hide details.';
    } else {
      hintText = 'Hint: Hover on a city\'s dashed prediction line to reveal details.';
    }
  }

  if (!descriptionText && instructionLines.length > 0) {
    descriptionText = instructionLines[0];
  }

  const instructionsHTML = `
    <div class="chart-instructions">
      <div class="chart-description-line">${descriptionText}</div>
      <div class="chart-hint-line">${hintText}</div>
    </div>
  `;
  chartContainer.insertAdjacentHTML('beforeend', instructionsHTML);
}

function createStimulusCard(datasetFile, datasetConfig, condition, roundNumber, cardIndex) {
  const card = document.createElement('article');
  card.className = 'stimulus-card';

  const title = document.createElement('h3');
  title.textContent = `${condition.id} | ${condition.name}`;
  card.appendChild(title);

  const meta = document.createElement('p');
  meta.textContent = `${datasetConfig.cityA} vs ${datasetConfig.cityB} | ${datasetFile}`;
  card.appendChild(meta);

  const panel = document.createElement('div');
  panel.className = 'visualization-panel';
  panel.style.setProperty('--city-a-color', datasetConfig.colors.cityA);
  panel.style.setProperty('--city-b-color', datasetConfig.colors.cityB);

  const content = document.createElement('div');
  content.className = 'visualization-content';

  const chartContainer = document.createElement('div');
  chartContainer.className = 'chart-container';

  const organizationBadge = document.createElement('span');
  organizationBadge.className = 'organization-badge chart-organization-badge';
  organizationBadge.textContent = datasetConfig.organization;
  chartContainer.appendChild(organizationBadge);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', `sanity-chart-${roundNumber}-${cardIndex}`);
  svg.setAttribute('width', '600');
  svg.setAttribute('height', '400');
  svg.setAttribute('class', 'chart-svg');
  chartContainer.appendChild(svg);

  content.appendChild(chartContainer);
  panel.appendChild(content);
  card.appendChild(panel);

  return {
    card,
    chartContainer,
    svgId: svg.id
  };
}

function createDatasetSection(datasetFile, datasetConfig, versionId) {
  const section = document.createElement('section');
  section.className = 'dataset-section';

  const header = document.createElement('header');
  header.className = 'dataset-header';

  const title = document.createElement('h2');
  title.textContent = `${datasetConfig.cityA} vs ${datasetConfig.cityB}`;
  header.appendChild(title);

  const meta = document.createElement('p');
  meta.textContent = `dataset: ${datasetFile} | ${getDatasetVariantLabel(datasetFile)} | version: ${versionId}`;
  header.appendChild(meta);

  section.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'stimuli-grid';
  section.appendChild(grid);

  return {
    section,
    grid
  };
}

function getChartConfig(datasetConfig) {
  return {
    width: 600,
    height: 400,
    margin: { top: 20, right: 20, bottom: 60, left: 70 },
    colors: {
      historical: '#6c757d',
      stockA: datasetConfig.colors.cityA,
      stockB: datasetConfig.colors.cityB
    },
    labels: {
      stockA: datasetConfig.cityA,
      stockB: datasetConfig.cityB
    },
    showAxisTitles: true,
    xAxisTitle: 'Date',
    yAxisTitle: 'Humidity'
  };
}

async function renderVersion(versionId) {
  const root = document.getElementById('datasets-root');
  const status = document.getElementById('status');
  const renderBtn = document.getElementById('render-btn');

  if (!root || !status || !renderBtn) return;

  renderBtn.disabled = true;
  root.innerHTML = '';
  status.textContent = `Rendering CI-only sanity check for ${datasetFiles.length} datasets (${versionId})...`;

  try {
    const ciCondition = getCiOnlyCondition(versionId);
    let renderedCount = 0;
    const targetCount = datasetFiles.length;

    for (let datasetIndex = 0; datasetIndex < datasetFiles.length; datasetIndex += 1) {
      const datasetFile = datasetFiles[datasetIndex];
      const roundNumber = datasetIndex + 1;
      const datasetConfig = resolveRoundDatasetConfig(roundNumber, null, datasetFile);
      const { section, grid } = createDatasetSection(datasetFile, datasetConfig, versionId);
      root.appendChild(section);

      const datasetRows = await loadRoundDataset(datasetFile, datasetConfig);
      const chartConfig = getChartConfig(datasetConfig);
      const factory = new ConditionFactory();
      await factory.initialize(chartConfig, datasetRows, '05/01', 2);

      const { card, chartContainer, svgId } = createStimulusCard(
        datasetFile,
        datasetConfig,
        ciCondition,
        roundNumber,
        0
      );
      grid.appendChild(card);

      await factory.renderCondition(1, svgId, ciCondition);
      addLegendAndInstructions(
        chartContainer,
        { cityA: datasetConfig.cityA, cityB: datasetConfig.cityB },
        ciCondition
      );

      renderedCount += 1;
      status.textContent = `Rendering ${versionId} (CI only): ${renderedCount}/${targetCount}`;
    }

    status.textContent = `Done. Rendered ${targetCount} CI stimuli (${datasetFiles.length} datasets x 1 condition).`;
  } catch (error) {
    console.error(error);
    status.textContent = `Failed: ${error.message}`;
  } finally {
    renderBtn.disabled = false;
  }
}

function initializePage() {
  const versionSelect = document.getElementById('version-select');
  const renderBtn = document.getElementById('render-btn');

  if (!versionSelect || !renderBtn) return;

  renderBtn.addEventListener('click', () => {
    const selectedVersion = versionSelect.value;
    renderVersion(selectedVersion);
  });

  renderVersion(versionSelect.value);
}

document.addEventListener('DOMContentLoaded', initializePage);
