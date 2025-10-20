// Script to generate CSV data for all prediction cases
// Run with: node generate-data.js

const fs = require('fs');

// Generate historical data with trend
function generateHistoricalData(trend = 'stable') {
    const values = [];
    const numPoints = 10;
    let startValue, endValue, centerValue;
    
    // Define trend parameters
    switch(trend) {
        case 'increase':
            startValue = 60 + Math.random() * 10; // 60-70 range
            endValue = 95 + Math.random() * 10;   // 95-105 range
            break;
        case 'decrease':
            startValue = 130 + Math.random() * 10; // 130-140 range
            endValue = 95 + Math.random() * 10;    // 95-105 range
            break;
        case 'stable':
            centerValue = 100;
            startValue = centerValue;
            endValue = centerValue;
            break;
    }
    
    // Generate values with trend
    for (let i = 0; i < numPoints; i++) {
        let baseValue;
        
        if (trend === 'stable') {
            // Stable trend: fluctuate around center with controlled variance
            const variance = 5; // ±5 from center
            baseValue = centerValue + (Math.random() - 0.5) * 2 * variance;
        } else {
            // Linear interpolation between start and end values
            const progress = i / (numPoints - 1);
            baseValue = startValue + (endValue - startValue) * progress;
            
            // Add realistic noise (smaller variance for trending data)
            const noise = (Math.random() - 0.5) * 6; // ±3 noise
            baseValue += noise;
        }
        
        values.push(parseFloat(baseValue.toFixed(2)));
    }
    
    const data = values.map((value, index) => ({
        time: index,
        value: value
    }));
    
    return data;
}

// Generate prediction data for a specific trend and pattern
function generatePredictions(currentPrice, trend, pattern) {
    const trendStrength = 5;
    let aggregationValue = currentPrice;
    
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
    let noiseLevel=10
    switch(pattern) {
        case 'agreement':
            // All predictions cluster tightly around aggregation
            for (let i = 0; i < 5; i++) {
                const deviation = (Math.random() - 0.5) * 2 * noiseLevel; // Small deviation
                alternatives.push(aggregationValue + deviation);
            }
            break;
            
        case 'polarization':
            // EXTREME split - very dramatic polarization
            alternatives = [ 
                aggregationValue + 40,  // Very high prediction
                aggregationValue + 30,   // High prediction  
                aggregationValue,       // At aggregation
                aggregationValue - 30,   // Low prediction
                aggregationValue - 40   // Very low prediction
            ];
            break;
            
        case 'risk_of_loss':
            // Most predictions cluster ABOVE aggregation, with 1 extreme outlier showing risk
                alternatives = [
                    aggregationValue + 25.3,  // High prediction
                    aggregationValue + 24.3,  // High prediction  
                    aggregationValue + 23.8,  // High prediction
                    aggregationValue + 15.3,   // Moderate prediction
                    aggregationValue - 88.7   // EXTREME OUTLIER: Risk of severe loss
                ];
            break;
            
        case 'chance_of_gain':
            // Most predictions cluster BELOW/AT aggregation, with 1 extreme outlier showing chance of gain
                alternatives = [
                    aggregationValue + 45,    // EXTREME OUTLIER: Chance of major gain (contrarian)
                    aggregationValue - 21.5,   // Following downward trend
                    aggregationValue - 22,     // Following downward trend
                    aggregationValue - 22.5,   // Following downward trend
                    aggregationValue - 23      // Following downward trend
                ];
            break;
            
        case 'ambiguous_spread':
            // Wide scatter around aggregation
            const spread = 40;
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
    const trends = ['increase', 'decrease', 'stable'];
    const patterns = ['agreement', 'polarization', 'risk_of_loss', 'chance_of_gain', 'ambiguous_spread'];
    
    const csvRows = [];
    
    // Add header
    csvRows.push('case_id,trend,pattern,time,value,type,alternative_index');
    
    // Add historical data for all cases
    trends.forEach(trend => {
        patterns.forEach(pattern => {
            const caseId = `${trend}_${pattern}`;
            const historicalData = generateHistoricalData(trend);
            historicalData.forEach(point => {
                csvRows.push(`${caseId},${trend},${pattern},${point.time},${point.value},historical,`);
            });
        });
    });
    
    // Generate and add prediction data
    trends.forEach(trend => {
        patterns.forEach(pattern => {
            const caseId = `${trend}_${pattern}`;
            const historicalData = generateHistoricalData(trend);
            const currentPrice = historicalData[historicalData.length - 1].value;
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
    const trends = ['increase', 'decrease', 'stable'];
    const patterns = ['agreement', 'polarization', 'risk_of_loss', 'chance_of_gain', 'ambiguous_spread'];
    
    const data = {
        historical: {},
        cases: {}
    };
    
    trends.forEach(trend => {
        patterns.forEach(pattern => {
            const caseId = `${trend}_${pattern}`;
            const historicalData = generateHistoricalData(trend);
            const currentPrice = historicalData[historicalData.length - 1].value;
            const predictions = generatePredictions(currentPrice, trend, pattern);
            
            // Store historical data for each trend
            if (!data.historical[trend]) {
                data.historical[trend] = historicalData;
            }
            
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