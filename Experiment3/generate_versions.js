#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const versionsDir = path.join(__dirname, 'versions');

const VERSION_DEFINITIONS = Object.freeze([
  { versionId: 'version_EP', techniqueToken: 'EP', techniqueKey: 'ensemble_plot', datasetPoolKey: 'non_md5', datasetVariant: 'non_md5' },
  { versionId: 'version_CI', techniqueToken: 'CI', techniqueKey: 'confidence_interval', datasetPoolKey: 'non_md5', datasetVariant: 'non_md5' },
  { versionId: 'version_CIEP', techniqueToken: 'CIEP', techniqueKey: 'combined_plot', datasetPoolKey: 'non_md5', datasetVariant: 'non_md5' },
  { versionId: 'version_EP_md5', techniqueToken: 'EP', techniqueKey: 'ensemble_plot', datasetPoolKey: 'md5', datasetVariant: 'md5' },
  { versionId: 'version_CI_md5', techniqueToken: 'CI', techniqueKey: 'confidence_interval', datasetPoolKey: 'md5', datasetVariant: 'md5' },
  { versionId: 'version_CIEP_md5', techniqueToken: 'CIEP', techniqueKey: 'combined_plot', datasetPoolKey: 'md5', datasetVariant: 'md5' }
]);

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
const targetVersionIds = VERSION_DEFINITIONS.map((definition) => definition.versionId);

ensureDirectory(versionsDir);

// Remove obsolete version folders.
const existingEntries = fs.readdirSync(versionsDir, { withFileTypes: true });
existingEntries.forEach((entry) => {
  if (!entry.isDirectory()) return;
  if (!entry.name.startsWith('version')) return;
  if (targetVersionIds.includes(entry.name)) return;
  removeDirectoryRecursive(path.join(versionsDir, entry.name));
});

// Generate the version folders.
targetVersionIds.forEach((versionId) => {
  const versionDir = path.join(versionsDir, versionId);
  ensureDirectory(versionDir);
  const indexPath = path.join(versionDir, 'index.html');
  fs.writeFileSync(indexPath, buildIndexHtml(versionId), 'utf8');
});

const manifestPath = path.join(versionsDir, 'version_manifest.json');
const manifest = VERSION_DEFINITIONS.map((definition) => {
  return {
    version_id: definition.versionId,
    technique_token: definition.techniqueToken,
    technique_key: definition.techniqueKey,
    dataset_pool_key: definition.datasetPoolKey,
    dataset_variant: definition.datasetVariant,
    fixed_baseline_phase: {
      phase_key: 'phase1',
      condition_id: 'condition_1_baseline',
      display_format: 'aggregation_only'
    },
    randomized_interaction_phases_start_at: 'phase2',
    randomized_within_participant_interactions: [
      'hover_show_one',
      'hover_show_all',
      'click_show_one',
      'click_show_all',
      'animation_show_one',
      'animation_show_all'
    ]
  };
});
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

console.log(`Generated ${targetVersionIds.length} version folders in ${versionsDir}`);
