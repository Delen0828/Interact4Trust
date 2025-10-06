// Data generator for prediction visualization cases
// Generates synthetic data for all 15 combinations (3 trends x 5 patterns)

// Shared historical data for all visualizations
const sharedHistoricalData = [
    { time: 0, value: 100 },
    { time: 1, value: 102 },
    { time: 2, value: 101 },
    { time: 3, value: 104 },
    { time: 4, value: 103 },
    { time: 5, value: 105 },
    { time: 6, value: 107 },
    { time: 7, value: 106 },
    { time: 8, value: 108 },
    { time: 9, value: 110 }
];

function generatePredictionData(trend, pattern) {
    const trendStrength = 5; // Prediction strength
    
    // Use shared historical data
    const historical = [...sharedHistoricalData];
    
    // Get the last historical value as current price
    const currentPrice = historical[historical.length - 1].value;
    
    // Calculate aggregation value based on trend
    let aggregationValue;
    switch(trend) {
        case 'increase':
            aggregationValue = currentPrice + trendStrength * 1.5;
            break;
        case 'decrease':
            aggregationValue = currentPrice - trendStrength * 1.5;
            break;
        case 'stable':
            aggregationValue = currentPrice + (Math.random() - 0.5) * 1;
            break;
    }
    
    // Generate alternative predictions based on pattern
    let alternatives = [];
    
    switch(pattern) {
        case 'agreement':
            // All predictions cluster tightly around aggregation
            for (let i = 0; i < 5; i++) {
                const deviation = (Math.random() - 0.5) * 2; // Small deviation
                alternatives.push(aggregationValue + deviation);
            }
            break;
            
        case 'polarization':
            // Split evenly above and below aggregation
            alternatives = [
                aggregationValue + 8,  // High confidence above
                aggregationValue + 5,  // Medium confidence above
                aggregationValue,      // At aggregation
                aggregationValue - 5,  // Medium confidence below
                aggregationValue - 8   // High confidence below
            ];
            break;
            
        case 'risk_of_loss':
            // Mostly predict up (matching aggregation trend), but a few predict down
            if (trend === 'increase') {
                alternatives = [
                    aggregationValue + 2,   // High confidence up
                    aggregationValue + 1,   // Medium confidence up
                    aggregationValue,       // At aggregation
                    aggregationValue - 3,   // One predicts down
                    aggregationValue - 5    // Another predicts down (risk)
                ];
            } else if (trend === 'decrease') {
                // For decrease trend, risk of loss means some predict further down
                alternatives = [
                    aggregationValue + 1,   // Slight recovery
                    aggregationValue,       // At aggregation
                    aggregationValue - 1,   // Slight down
                    aggregationValue - 4,   // Risk of more loss
                    aggregationValue - 6    // High risk of loss
                ];
            } else {
                // Stable trend
                alternatives = [
                    aggregationValue + 2,   // Some growth
                    aggregationValue + 1,   // Slight growth
                    aggregationValue,       // Stable
                    aggregationValue - 2,   // Risk of loss
                    aggregationValue - 3    // More risk
                ];
            }
            break;
            
        case 'chance_of_gain':
            // Mostly predict down (for decrease) or stable, but a few predict up (chance of gain)
            if (trend === 'decrease') {
                alternatives = [
                    aggregationValue + 6,   // Chance of gain (contrarian)
                    aggregationValue + 3,   // Some chance of gain
                    aggregationValue,       // At aggregation (down)
                    aggregationValue - 1,   // Continuing down
                    aggregationValue - 2    // Further down
                ];
            } else if (trend === 'increase') {
                // For increase trend, chance of gain means some predict even higher
                alternatives = [
                    aggregationValue + 5,   // High chance of gain
                    aggregationValue + 3,   // Good chance of gain
                    aggregationValue,       // At aggregation
                    aggregationValue - 1,   // Slightly less
                    aggregationValue - 2    // Conservative
                ];
            } else {
                // Stable trend
                alternatives = [
                    aggregationValue + 3,   // Chance of gain
                    aggregationValue + 2,   // Some gain
                    aggregationValue,       // Stable
                    aggregationValue - 1,   // Slight loss
                    aggregationValue - 2    // More conservative
                ];
            }
            break;
            
        case 'ambiguous_spread':
            // Wide scatter around aggregation without clear pattern
            const spread = 10;
            alternatives = [
                aggregationValue + spread * 0.8,
                aggregationValue + spread * 0.3,
                aggregationValue - spread * 0.1,
                aggregationValue - spread * 0.4,
                aggregationValue + spread * 0.5
            ];
            // Shuffle for more ambiguity
            alternatives.sort(() => Math.random() - 0.5);
            break;
    }
    
    // Sort alternatives by confidence (highest to lowest for display)
    // Keep the natural order for patterns that have specific meaning
    if (pattern === 'agreement' || pattern === 'ambiguous_spread') {
        alternatives.sort((a, b) => b - a);
    }
    
    // Ensure the mean of alternatives matches the aggregation
    // This is important for consistency
    const currentMean = alternatives.reduce((a, b) => a + b, 0) / alternatives.length;
    const adjustment = aggregationValue - currentMean;
    alternatives = alternatives.map(v => v + adjustment);
    
    return {
        historical: historical,
        aggregation: aggregationValue,
        alternatives: alternatives,
        metadata: {
            trend: trend,
            pattern: pattern,
            currentPrice: currentPrice
        }
    };
}

// Helper function to add more realistic market-like noise
function addMarketNoise(data, volatility = 0.02) {
    return data.map(point => ({
        ...point,
        value: point.value * (1 + (Math.random() - 0.5) * volatility)
    }));
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generatePredictionData, addMarketNoise };
}