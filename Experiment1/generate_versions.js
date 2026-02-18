#!/usr/bin/env node

// Script to generate all 9 version-specific config and HTML files
const fs = require('fs');
const path = require('path');

// Read the base config template
const baseConfigPath = path.join(__dirname, 'versions/version1/config.js');
const baseConfig = fs.readFileSync(baseConfigPath, 'utf8');

// Read the base HTML template
const baseHtmlPath = path.join(__dirname, 'versions/version1/index.html');
const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');

// Condition information for generating version-specific configs
const versions = [
    { version: 1, conditionIndex: 0, name: 'Baseline' },
    { version: 2, conditionIndex: 1, name: 'PI Plot' },
    { version: 3, conditionIndex: 2, name: 'Ensemble Plot' },
    { version: 4, conditionIndex: 3, name: 'Ensemble + Hover' },
    { version: 5, conditionIndex: 4, name: 'PI Plot + Hover' },
    { version: 6, conditionIndex: 5, name: 'PI → Ensemble' },
    { version: 7, conditionIndex: 6, name: 'Buggy Control' },
    { version: 8, conditionIndex: 7, name: 'Bad Control' },
    { version: 9, conditionIndex: 8, name: 'Combined PI + Ensemble' }
];

versions.forEach(({ version, conditionIndex, name }) => {
    if (version === 1) {
        // Skip version 1 as we already created it manually
        console.log(`✓ Version ${version} already exists`);
        return;
    }
    
    // Create version directory if it doesn't exist
    const versionDir = path.join(__dirname, `versions/version${version}`);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
    }
    
    // Generate config content
    let configContent = baseConfig;
    
    // Replace version-specific content
    configContent = configContent.replace(/version1/g, `version${version}`);
    configContent = configContent.replace(/VERSION 1/g, `VERSION ${version}`);
    configContent = configContent.replace(/Version 1:/g, `Version ${version}:`);
    configContent = configContent.replace(/condition 0 \(Baseline\)/g, `condition ${conditionIndex} (${name})`);
    configContent = configContent.replace(/Always return condition 0/g, `Always return condition ${conditionIndex}`);
    configContent = configContent.replace(/ExperimentConfig\.conditions\[0\]/g, `ExperimentConfig.conditions[${conditionIndex}]`);
    
    // Write the config file
    const configPath = path.join(versionDir, 'config.js');
    fs.writeFileSync(configPath, configContent);
    
    // Generate HTML content
    let htmlContent = baseHtml;
    htmlContent = htmlContent.replace(/Version 1: Baseline/g, `Version ${version}: ${name}`);
    htmlContent = htmlContent.replace(/Version 1:/g, `Version ${version}:`);
    
    // Write the HTML file
    const htmlPath = path.join(versionDir, 'index.html');
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log(`✓ Generated files for Version ${version}: ${name}`);
});

console.log('\n🎉 All version-specific config and HTML files generated!');