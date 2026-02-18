#!/usr/bin/env node

// Generate synthetic_stock_data_norm.json from airQualityData.js
const { airQualityData } = require('./src/data/airQualityData.js');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'synthetic_stock_data_norm.json');
fs.writeFileSync(outputPath, JSON.stringify(airQualityData, null, 2));

console.log(`Generated ${outputPath}`);
console.log(`Total records: ${airQualityData.data.length}`);

// Summary stats
const historical = airQualityData.data.filter(d => d.series === 'historical');
const predictions = airQualityData.data.filter(d => d.series === 'prediction');
const scenarios = [...new Set(predictions.map(d => d.scenario))];
console.log(`Historical records: ${historical.length}`);
console.log(`Prediction records: ${predictions.length}`);
console.log(`Scenarios: ${scenarios.length} (${scenarios.join(', ')})`);
