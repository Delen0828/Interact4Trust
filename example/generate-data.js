// Script to generate CSV data for all prediction cases
// Run with: node generate-data.js

const fs = require('fs');

// Generate fixed realistic historical data (no randomness for consistency)
function generateHistoricalData() {
    // Predefined realistic data with ups and downs, ending neutrally
    const values = [100, 102.1, 101.3, 103.2, 102.4, 101.8, 103.7, 102.1, 100.9, 102.5];
    
    const data = values.map((value, index) => ({
        time: index,
        value: value
    }));
    
    return data;
}

// Generate prediction data for a specific trend and pattern
function generatePredictions(currentPrice, trend, pattern) {
    const trendStrength = 5;
    let aggregationValue;
    
    // Calculate aggregation based on trend
    switch(trend) {
        case 'increase':
            aggregationValue = currentPrice + trendStrength;
            break;
        case 'decrease':
            aggregationValue = currentPrice - trendStrength;
            break;
        case 'stable':
            aggregationValue = currentPrice + (Math.random() - 0.5) * 1;
            break;
    }
    
    // Generate alternatives based on pattern
    let alternatives = [];
    
    switch(pattern) {
        case 'agreement':
            // All predictions cluster tightly around aggregation
            for (let i = 0; i < 5; i++) {
                const deviation = (Math.random() - 0.5) * 1.5; // Small deviation
                alternatives.push(aggregationValue + deviation);
            }
            break;
            
        case 'polarization':
            // EXTREME split - very dramatic polarization
            alternatives = [
                aggregationValue + 12,  // Very high prediction
                aggregationValue + 8,   // High prediction  
                aggregationValue,       // At aggregation
                aggregationValue - 8,   // Low prediction
                aggregationValue - 12   // Very low prediction
            ];
            break;
            
        case 'risk_of_loss':
            // Most predictions cluster ABOVE aggregation, with 1 extreme outlier showing risk
            if (trend === 'increase') {
                // Follow user's example pattern
                alternatives = [
                    aggregationValue + 15.3,  // High prediction
                    aggregationValue + 14.3,  // High prediction  
                    aggregationValue + 13.8,  // High prediction
                    aggregationValue + 5.3,   // Moderate prediction
                    aggregationValue - 48.7   // EXTREME OUTLIER: Risk of severe loss
                ];
            } else if (trend === 'decrease') {
                alternatives = [
                    aggregationValue + 5,     // Above the downward trend (contrarian optimism)
                    aggregationValue + 3,     // Above the downward trend
                    aggregationValue + 1,     // Slightly above trend
                    aggregationValue,         // At trend
                    aggregationValue - 45     // EXTREME OUTLIER: Risk of catastrophic loss
                ];
            } else { // stable
                alternatives = [
                    aggregationValue + 8,     // Above stable trend
                    aggregationValue + 6,     // Above stable trend
                    aggregationValue + 4,     // Above stable trend
                    aggregationValue + 2,     // Slightly above
                    aggregationValue - 40     // EXTREME OUTLIER: Risk of major loss
                ];
            }
            break;
            
        case 'chance_of_gain':
            // Most predictions cluster BELOW/AT aggregation, with 1 extreme outlier showing chance of gain
            if (trend === 'decrease') {
                alternatives = [
                    aggregationValue + 45,    // EXTREME OUTLIER: Chance of major gain (contrarian)
                    aggregationValue - 1.5,   // Following downward trend
                    aggregationValue - 2,     // Following downward trend
                    aggregationValue - 2.5,   // Following downward trend
                    aggregationValue - 3      // Following downward trend
                ];
            } else if (trend === 'increase') {
                alternatives = [
                    aggregationValue + 40,    // EXTREME OUTLIER: Chance of extraordinary gain
                    aggregationValue + 0.5,   // Following upward trend
                    aggregationValue,         // At trend
                    aggregationValue - 0.5,   // Conservative
                    aggregationValue - 1      // More conservative
                ];
            } else { // stable
                alternatives = [
                    aggregationValue + 42,    // EXTREME OUTLIER: Chance of major gain
                    aggregationValue - 0.5,   // Slightly down from stable
                    aggregationValue - 1,     // Slightly down
                    aggregationValue - 1.5,   // More down
                    aggregationValue - 2      // Conservative down
                ];
            }
            break;
            
        case 'ambiguous_spread':
            // Wide scatter around aggregation
            const spread = 8;
            alternatives = [
                aggregationValue + spread * 0.6,
                aggregationValue + spread * 0.2,
                aggregationValue - spread * 0.1,
                aggregationValue - spread * 0.3,
                aggregationValue + spread * 0.4
            ];
            break;
    }
    
    // Ensure mean of alternatives equals aggregation
    const currentMean = alternatives.reduce((a, b) => a + b, 0) / alternatives.length;
    const adjustment = aggregationValue - currentMean;
    alternatives = alternatives.map(v => parseFloat((v + adjustment).toFixed(2)));
    
    return {
        aggregation: parseFloat(aggregationValue.toFixed(2)),
        alternatives: alternatives
    };
}

// Generate all data
function generateAllData() {
    // Generate shared historical data
    const historicalData = generateHistoricalData();
    const currentPrice = historicalData[historicalData.length - 1].value;
    
    const trends = ['increase', 'decrease', 'stable'];
    const patterns = ['agreement', 'polarization', 'risk_of_loss', 'chance_of_gain', 'ambiguous_spread'];
    
    const csvRows = [];
    
    // Add header
    csvRows.push('case_id,trend,pattern,time,value,type,alternative_index');
    
    // Add historical data for all cases (shared)
    trends.forEach(trend => {
        patterns.forEach(pattern => {
            const caseId = `${trend}_${pattern}`;
            historicalData.forEach(point => {
                csvRows.push(`${caseId},${trend},${pattern},${point.time},${point.value},historical,`);
            });
        });
    });
    
    // Generate and add prediction data
    trends.forEach(trend => {
        patterns.forEach(pattern => {
            const caseId = `${trend}_${pattern}`;
            const predictions = generatePredictions(currentPrice, trend, pattern);
            
            // Add aggregation prediction
            csvRows.push(`${caseId},${trend},${pattern},10,${predictions.aggregation},aggregation,`);
            
            // Add alternative predictions
            predictions.alternatives.forEach((value, index) => {
                csvRows.push(`${caseId},${trend},${pattern},10,${value},alternative,${index}`);
            });
        });
    });
    
    return csvRows.join('\n');
}

// Generate and save CSV
const csvContent = generateAllData();
fs.writeFileSync('predictions-data.csv', csvContent);
console.log('Generated predictions-data.csv successfully!');

// Also create a simpler format for easy loading
function generateSimpleFormat() {
    const historicalData = generateHistoricalData();
    const currentPrice = historicalData[historicalData.length - 1].value;
    
    const trends = ['increase', 'decrease', 'stable'];
    const patterns = ['agreement', 'polarization', 'risk_of_loss', 'chance_of_gain', 'ambiguous_spread'];
    
    const data = {
        historical: historicalData,
        cases: {}
    };
    
    trends.forEach(trend => {
        patterns.forEach(pattern => {
            const caseId = `${trend}_${pattern}`;
            const predictions = generatePredictions(currentPrice, trend, pattern);
            data.cases[caseId] = {
                trend: trend,
                pattern: pattern,
                aggregation: predictions.aggregation,
                alternatives: predictions.alternatives
            };
        });
    });
    
    fs.writeFileSync('predictions-data.json', JSON.stringify(data, null, 2));
    console.log('Generated predictions-data.json successfully!');
}

generateSimpleFormat();