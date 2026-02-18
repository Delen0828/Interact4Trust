#!/usr/bin/env node

// Generate all 12 version-specific config.js and index.html files from study_design.csv
const fs = require('fs');
const path = require('path');

// Read base templates
const baseConfigPath = path.join(__dirname, 'versions/version1/config.js');
const baseConfig = fs.readFileSync(baseConfigPath, 'utf8');

const baseHtmlPath = path.join(__dirname, 'versions/version1/index.html');
const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');

// Read study design CSV
const csvPath = path.join(__dirname, 'study_design.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.trim().split('\n');
const header = lines[0].split(',');

const conditions = lines.slice(1).map((line, index) => {
    const values = line.split(',');
    return {
        version: index + 1,
        conditionIndex: index,
        name: values[0],
        cityAType: values[1],
        cityBType: values[2],
        cityALineCount: parseInt(values[3]),
        cityBLineCount: parseInt(values[4])
    };
});

console.log(`Found ${conditions.length} conditions in study_design.csv\n`);

conditions.forEach(({ version, conditionIndex, name }) => {
    if (version === 1) {
        console.log(`✓ Version ${version} already exists (${name})`);
        return;
    }

    // Create version directory
    const versionDir = path.join(__dirname, `versions/version${version}`);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
    }

    // Generate config content by replacing version-specific values
    let configContent = baseConfig;
    configContent = configContent.replace(/version1/g, `version${version}`);
    configContent = configContent.replace(/VERSION 1/g, `VERSION ${version}`);
    configContent = configContent.replace(/Version 1:/g, `Version ${version}:`);
    configContent = configContent.replace(
        /ExperimentConfig\.conditions\[0\]/g,
        `ExperimentConfig.conditions[${conditionIndex}]`
    );

    fs.writeFileSync(path.join(versionDir, 'config.js'), configContent);

    // Generate HTML content
    let htmlContent = baseHtml;
    htmlContent = htmlContent.replace(
        /Version 1: PI-2_cities_region_vs_region/g,
        `Version ${version}: ${name}`
    );

    fs.writeFileSync(path.join(versionDir, 'index.html'), htmlContent);

    console.log(`✓ Generated Version ${version}: ${name}`);
});

console.log(`\n🎉 All ${conditions.length} version-specific files generated!`);
