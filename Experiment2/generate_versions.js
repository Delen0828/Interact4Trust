#!/usr/bin/env node

// Generate Experiment 2 version-specific config.js and index.html files from study_design.csv
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const baseConfigPath = path.join(rootDir, 'versions/even_hover/config.js');
const baseHtmlPath = path.join(rootDir, 'versions/even_hover/index.html');
const csvPath = path.join(rootDir, 'study_design.csv');

const baseConfig = fs.readFileSync(baseConfigPath, 'utf8');
const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');
const csvContent = fs.readFileSync(csvPath, 'utf8').trim();

const rows = csvContent
    .split('\n')
    .slice(1)
    .map((line) => {
        const values = line.split(',').map((value) => value.replace(/^"|"$/g, '').trim());
        return {
            versionId: values[0],
            parity: values[1],
            interactionMode: values[2]
        };
    })
    .filter((row) => row.versionId && row.parity && row.interactionMode);

if (rows.length === 0) {
    console.error('No version rows found in study_design.csv');
    process.exit(1);
}

rows.forEach(({ versionId, parity, interactionMode }, index) => {
    const versionKey = String(versionId || '').trim();
    if (!versionKey) {
        console.warn('Skipping row with empty version_id');
        return;
    }

    const versionNumber = index + 1;
    const versionDir = path.join(rootDir, `versions/${versionKey}`);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
    }

    let configContent = baseConfig;
    configContent = configContent.replace(
        /\/\/ Version [^:]+: .*/,
        `// Version ${versionKey}: ${parity} x ${interactionMode}`
    );

    configContent = configContent.replace(
        /const VERSION_SETTINGS = Object\.freeze\(\{[\s\S]*?\}\);/,
        [
            'const VERSION_SETTINGS = Object.freeze({',
            `    versionId: '${versionKey}',`,
            `    versionNumber: ${versionNumber},`,
            `    parity: '${parity}',`,
            `    interactionMode: '${interactionMode}'`,
            '});'
        ].join('\n')
    );

    fs.writeFileSync(path.join(versionDir, 'config.js'), configContent, 'utf8');

    let htmlContent = baseHtml;
    htmlContent = htmlContent.replace(
        /<title>Humidity Study - [^<]+<\/title>/,
        `<title>Humidity Study - ${versionKey}</title>`
    );

    fs.writeFileSync(path.join(versionDir, 'index.html'), htmlContent, 'utf8');

    console.log(`Generated ${versionKey} (${parity} x ${interactionMode})`);
});

console.log(`\nGenerated ${rows.length} Experiment 2 versions from study_design.csv`);
