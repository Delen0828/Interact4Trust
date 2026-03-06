#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const versionsDir = path.join(__dirname, 'versions');

function permutations(items) {
  if (items.length <= 1) return [items.slice()];
  const result = [];
  for (let i = 0; i < items.length; i += 1) {
    const current = items[i];
    const rest = items.slice(0, i).concat(items.slice(i + 1));
    const restPermutations = permutations(rest);
    restPermutations.forEach((perm) => {
      result.push([current].concat(perm));
    });
  }
  return result;
}

function buildVersionId(interactionOrder, displayOrder) {
  return `version_${interactionOrder.join('-')}_${displayOrder.join('-')}`;
}

function buildIndexHtml(versionId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Humidity Study - ${versionId}</title>

    <script>
        (function () {
            const pathname = window.location.pathname;
            if (!pathname.endsWith("/") && !pathname.endsWith(".html")) {
                window.location.replace(window.location.origin + pathname + "/" + window.location.search + window.location.hash);
            }
        })();
    </script>

    <link href="https://unpkg.com/jspsych@7.3.4/css/jspsych.css" rel="stylesheet" type="text/css" />
    <link href="../src/styles/experiment.css" rel="stylesheet" type="text/css" />
    <link href="../src/styles/air-quality-theme.css" rel="stylesheet" type="text/css" />

    <script src="https://unpkg.com/d3@7.8.5/dist/d3.min.js"></script>

    <script src="https://unpkg.com/jspsych@7.3.4/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-html-button-response@1.1.3/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-html-keyboard-response@1.1.3/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-instructions@1.1.4/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-survey-likert@1.1.3/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-survey-text@1.1.3/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-survey-multi-choice@1.1.3/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-fullscreen@1.2.1/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-call-function@1.1.3/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-preload@2.1.0/dist/index.browser.min.js"></script>
    <script src="https://unpkg.com/@jspsych/plugin-image-button-response@2.1.0/dist/index.browser.min.js"></script>

    <script src="../src/config.js"></script>
    <script src="../src/data/airQualityData.js"></script>
    <script src="../src/plugins/jspsych-vis-literacy.js"></script>
    <script src="../src/plugins/jspsych-broken-interactions.js"></script>
    <script src="../src/utils/conditionManager.js"></script>
    <script src="../src/utils/interactionController.js"></script>
    <script src="../src/utils/dataCollector.js"></script>
</head>
<body>
    <div id="jspsych-target"></div>
    <script type="module" src="../src/experiment.js"></script>
</body>
</html>
`;
}

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function removeDirectoryRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

const interactionPermutations = permutations(['S', 'H', 'B']);
const displayPermutations = permutations(['CI', 'EP', 'CIEP']);

const targetVersionIds = [];
interactionPermutations.forEach((interactionOrder) => {
  displayPermutations.forEach((displayOrder) => {
    targetVersionIds.push(buildVersionId(interactionOrder, displayOrder));
  });
});

targetVersionIds.sort();

ensureDirectory(versionsDir);

// Remove obsolete version folders.
const existingEntries = fs.readdirSync(versionsDir, { withFileTypes: true });
existingEntries.forEach((entry) => {
  if (!entry.isDirectory()) return;
  if (!entry.name.startsWith('version')) return;
  if (targetVersionIds.includes(entry.name)) return;
  removeDirectoryRecursive(path.join(versionsDir, entry.name));
});

// Generate the 36 target version folders.
targetVersionIds.forEach((versionId) => {
  const versionDir = path.join(versionsDir, versionId);
  ensureDirectory(versionDir);
  const indexPath = path.join(versionDir, 'index.html');
  fs.writeFileSync(indexPath, buildIndexHtml(versionId), 'utf8');
});

const manifestPath = path.join(versionsDir, 'version_manifest.json');
const manifest = targetVersionIds.map((versionId) => {
  const parsed = versionId.replace(/^version_/, '').split('_');
  return {
    version_id: versionId,
    interaction_order: parsed[0].split('-'),
    display_order: parsed[1].split('-')
  };
});
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Generated ${targetVersionIds.length} version folders in ${versionsDir}`);
