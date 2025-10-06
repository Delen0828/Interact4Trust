// Mock stock data for development and testing
const MockStockData = {
    ZRAX: {
        symbol: 'ZRAX',
        name: 'Zephyr Robotics Alliance',
        sector: 'Alien Technology',
        dates: generateDates(60),
        prices: generatePrices(150, 0.03, 60),
        volumes: generateVolumes(2000000, 60)
    },
    GLXN: {
        symbol: 'GLXN',
        name: 'Galactic Nexus Corp',
        sector: 'Interstellar Commerce',
        dates: generateDates(60),
        prices: generatePrices(280, 0.025, 60),
        volumes: generateVolumes(3500000, 60)
    },
    NOVA: {
        symbol: 'NOVA',
        name: 'Nova Energy Systems',
        sector: 'Quantum Power',
        dates: generateDates(60),
        prices: generatePrices(420, 0.04, 60),
        volumes: generateVolumes(1500000, 60)
    },
    CRYS: {
        symbol: 'CRYS',
        name: 'Crystal Mining Ventures',
        sector: 'Resource Extraction',
        dates: generateDates(60),
        prices: generatePrices(95, 0.035, 60),
        volumes: generateVolumes(4000000, 60)
    }
};

// Helper functions to generate mock data
function generateDates(numDays) {
    const dates = [];
    const today = new Date();
    
    for (let i = numDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
}

function generatePrices(basePrice, volatility, numDays) {
    const prices = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < numDays; i++) {
        // Random walk with slight upward trend
        const trend = 0.0005;
        const change = (Math.random() - 0.5) * 2 * volatility + trend;
        currentPrice = currentPrice * (1 + change);
        prices.push(Math.round(currentPrice * 100) / 100); // Round to 2 decimal places
    }
    
    return prices;
}

function generateVolumes(baseVolume, numDays) {
    const volumes = [];
    
    for (let i = 0; i < numDays; i++) {
        const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
        const volume = Math.floor(baseVolume * (1 + variation));
        volumes.push(volume);
    }
    
    return volumes;
}

// Pre-generated predictions for each stock and condition
const PreGeneratedPredictions = {
    ZRAX: {
        good_aggregation: generateConditionPredictions('good', 'aggregation', MockStockData.ZRAX.prices),
        good_alternative: generateConditionPredictions('good', 'alternative', MockStockData.ZRAX.prices),
        bad_aggregation: generateConditionPredictions('bad', 'aggregation', MockStockData.ZRAX.prices),
        bad_alternative: generateConditionPredictions('bad', 'alternative', MockStockData.ZRAX.prices)
    },
    GLXN: {
        good_aggregation: generateConditionPredictions('good', 'aggregation', MockStockData.GLXN.prices),
        good_alternative: generateConditionPredictions('good', 'alternative', MockStockData.GLXN.prices),
        bad_aggregation: generateConditionPredictions('bad', 'aggregation', MockStockData.GLXN.prices),
        bad_alternative: generateConditionPredictions('bad', 'alternative', MockStockData.GLXN.prices)
    },
    NOVA: {
        good_aggregation: generateConditionPredictions('good', 'aggregation', MockStockData.NOVA.prices),
        good_alternative: generateConditionPredictions('good', 'alternative', MockStockData.NOVA.prices),
        bad_aggregation: generateConditionPredictions('bad', 'aggregation', MockStockData.NOVA.prices),
        bad_alternative: generateConditionPredictions('bad', 'alternative', MockStockData.NOVA.prices)
    },
    CRYS: {
        good_aggregation: generateConditionPredictions('good', 'aggregation', MockStockData.CRYS.prices),
        good_alternative: generateConditionPredictions('good', 'alternative', MockStockData.CRYS.prices),
        bad_aggregation: generateConditionPredictions('bad', 'aggregation', MockStockData.CRYS.prices),
        bad_alternative: generateConditionPredictions('bad', 'alternative', MockStockData.CRYS.prices)
    }
};

function generateConditionPredictions(modelQuality, displayFormat, prices) {
    const predictions = [];
    // Simple prediction generator for mock data
    const generator = {
        generateGroundTruth: function(lastPrice) {
            const change = (Math.random() - 0.5) * 0.04; // ±2% random change
            return lastPrice * (1 + change);
        },
        generatePredictions: function(groundTruth, modelQuality, displayFormat) {
            const noiseLevel = modelQuality === 'good' ? 0.05 : 0.20;
            const prediction = {
                groundTruth: groundTruth,
                modelQuality: modelQuality,
                displayFormat: displayFormat,
                values: [],
                probabilities: []
            };
            
            if (displayFormat === 'aggregation') {
                const noise = (Math.random() - 0.5) * 2 * noiseLevel;
                prediction.values = [groundTruth * (1 + noise)];
                prediction.probabilities = [1.0];
            } else {
                for (let i = 0; i < 5; i++) {
                    const varianceFactor = 1 + (i * 0.3);
                    const noise = (Math.random() - 0.5) * 2 * noiseLevel * varianceFactor;
                    prediction.values.push(groundTruth * (1 + noise));
                    prediction.probabilities.push(1.0 - (i * 0.15));
                }
            }
            
            return prediction;
        }
    };
    
    // Start from day 30 (leave first 30 days as historical)
    for (let i = 30; i < 40; i++) { // 10 rounds
        const lastPrice = prices[i];
        const groundTruth = prices[i + 1] || generator.generateGroundTruth(lastPrice);
        const prediction = generator.generatePredictions(groundTruth, modelQuality, displayFormat);
        predictions.push(prediction);
    }
    
    return predictions;
}

// Function to get stock data for a specific round
function getStockDataForRound(stockSymbol, round) {
    const stock = MockStockData[stockSymbol];
    const startIdx = 0;
    const endIdx = 30 + round; // Show 30 historical days + rounds completed
    
    return {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        dates: stock.dates.slice(startIdx, endIdx),
        prices: stock.prices.slice(startIdx, endIdx),
        volumes: stock.volumes.slice(startIdx, endIdx)
    };
}

// Function to get prediction for a specific round
function getPredictionForRound(stockSymbol, conditionId, round) {
    return PreGeneratedPredictions[stockSymbol][conditionId][round - 1];
}

// Export for use in experiment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MockStockData,
        PreGeneratedPredictions,
        getStockDataForRound,
        getPredictionForRound
    };
}