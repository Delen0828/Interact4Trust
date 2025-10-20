// Load generated data from data.json
const generatedData = {
    "historical": {
        "increase": [
            { "time": 0, "value": 47.5 },
            { "time": 1, "value": 49.41 },
            { "time": 2, "value": 69.07 },
            { "time": 3, "value": 74.75 },
            { "time": 4, "value": 62.46 },
            { "time": 5, "value": 73.37 },
            { "time": 6, "value": 89.8 },
            { "time": 7, "value": 94.59 },
            { "time": 8, "value": 98.4 },
            { "time": 9, "value": 98.65 }
        ],
        "decrease": [
            { "time": 0, "value": 152.99 },
            { "time": 1, "value": 147.08 },
            { "time": 2, "value": 147.33 },
            { "time": 3, "value": 137.54 },
            { "time": 4, "value": 124.91 },
            { "time": 5, "value": 129.23 },
            { "time": 6, "value": 120.65 },
            { "time": 7, "value": 120.15 },
            { "time": 8, "value": 102.2 },
            { "time": 9, "value": 94.09 }
        ],
        "stable": [
            { "time": 0, "value": 105.39 },
            { "time": 1, "value": 103.32 },
            { "time": 2, "value": 109.92 },
            { "time": 3, "value": 107.94 },
            { "time": 4, "value": 95.39 },
            { "time": 5, "value": 95.09 },
            { "time": 6, "value": 90.97 },
            { "time": 7, "value": 93.71 },
            { "time": 8, "value": 101.05 },
            { "time": 9, "value": 103.01 }
        ]
    }
};

// Alien plant growth data with sophisticated prediction patterns
const AlienPlantData = {
    // Trend-specific historical growth data (from generated data)
    historical: generatedData.historical,
    
    // 15 sophisticated prediction patterns (5 patterns × 3 trends) - Updated with generated data
    patterns: {
        "increase_agreement": {
            trend: "increase",
            pattern: "agreement",
            aggregation: 118.65,
            alternatives: [129.72, 94.22, 132.05, 128.8, 108.46],
            description: "Models mostly agree on growth increase"
        },
        "increase_polarization": {
            trend: "increase",
            pattern: "polarization",
            aggregation: 128.4,
            alternatives: [168.4, 158.4, 128.4, 98.4, 88.4],
            description: "Models split between high and low growth predictions"
        },
        "increase_risk_of_loss": {
            trend: "increase",
            pattern: "risk_of_loss",
            aggregation: 120.4,
            alternatives: [145.7, 144.7, 144.2, 135.7, 31.7],
            description: "Mostly positive predictions with one severe decline risk"
        },
        "increase_chance_of_gain": {
            trend: "increase",
            pattern: "chance_of_gain",
            aggregation: 121.46,
            alternatives: [175.26, 108.76, 108.26, 107.76, 107.26],
            description: "One model predicts exceptional growth opportunity"
        },
        "increase_ambiguous_spread": {
            trend: "increase",
            pattern: "ambiguous_spread",
            aggregation: 116.67,
            alternatives: [174.27, 118.27, 90.27, 74.27, 126.27],
            description: "Models show varied growth predictions without clear pattern"
        },
        "decrease_agreement": {
            trend: "decrease",
            pattern: "agreement",
            aggregation: 74.09,
            alternatives: [69.52, 63.83, 85.9, 62.76, 88.45],
            description: "Models mostly agree on growth decline"
        },
        "decrease_polarization": {
            trend: "decrease",
            pattern: "polarization",
            aggregation: 71.84,
            alternatives: [111.84, 101.84, 71.84, 41.84, 31.84],
            description: "Models split between growth and decline predictions"
        },
        "decrease_risk_of_loss": {
            trend: "decrease",
            pattern: "risk_of_loss",
            aggregation: 74.2,
            alternatives: [99.5, 98.5, 98.0, 89.5, -14.5],
            description: "Mostly positive predictions with one severe decline risk"
        },
        "decrease_chance_of_gain": {
            trend: "decrease",
            pattern: "chance_of_gain",
            aggregation: 76.77,
            alternatives: [130.57, 64.07, 63.57, 63.07, 62.57],
            description: "One model predicts exceptional growth despite declining trend"
        },
        "decrease_ambiguous_spread": {
            trend: "decrease",
            pattern: "ambiguous_spread",
            aggregation: 76.3,
            alternatives: [133.9, 77.9, 49.9, 33.9, 85.9],
            description: "Models show varied decline predictions without clear pattern"
        },
        "stable_agreement": {
            trend: "stable",
            pattern: "agreement",
            aggregation: 103.01,
            alternatives: [112.26, 94.38, 99.1, 93.99, 115.33],
            description: "Models agree on stable growth with minimal change"
        },
        "stable_polarization": {
            trend: "stable",
            pattern: "polarization",
            aggregation: 94.09,
            alternatives: [134.09, 124.09, 94.09, 64.09, 54.09],
            description: "Models split between growth and decline despite stable average"
        },
        "stable_risk_of_loss": {
            trend: "stable",
            pattern: "risk_of_loss",
            aggregation: 95.8,
            alternatives: [121.1, 120.1, 119.6, 111.1, 7.1],
            description: "Mostly stable predictions with one severe decline risk"
        },
        "stable_chance_of_gain": {
            trend: "stable",
            pattern: "chance_of_gain",
            aggregation: 99.03,
            alternatives: [152.83, 86.33, 85.83, 85.33, 84.83],
            description: "One model predicts exceptional growth opportunity"
        },
        "stable_ambiguous_spread": {
            trend: "stable",
            pattern: "ambiguous_spread",
            aggregation: 99.04,
            alternatives: [156.64, 100.64, 72.64, 56.64, 108.64],
            description: "Models show varied stable predictions without clear pattern"
        }
    },
    
   
};

// Helper functions for alien plant data

// Get historical data by trend
function getHistoricalDataByTrend(trend) {
    if (AlienPlantData.historical[trend]) {
        return AlienPlantData.historical[trend];
    }
    
    // Fallback to stable trend if trend not found
    console.warn(`Trend '${trend}' not found, falling back to 'stable'`);
    return AlienPlantData.historical.stable;
}

// Get default historical data (uses stable trend for backward compatibility)
function getDefaultHistoricalData() {
    return AlienPlantData.historical.stable;
}

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

function extendHistoricalData(baseData, days) {
    // Extend the base historical data to create full growth timeline
    const extended = [...baseData];
    
    for (let i = baseData.length; i < days; i++) {
        // Small random variations around the last value
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const newValue = extended[i - 1].value * (1 + variation);
        extended.push({
            time: i,
            value: Math.round(newValue * 10) / 10
        });
    }
    
    return extended;
}

// Pattern-based prediction system with 15 distinct stimuli
const StimuliPatterns = {
    // Get all available pattern IDs
    getAllPatternIds: function() {
        return Object.keys(AlienPlantData.patterns);
    },
    
    // Get pattern by ID
    getPattern: function(patternId) {
        return AlienPlantData.patterns[patternId];
    },
    
    // Get pattern metadata
    getPatternInfo: function(patternId) {
        const pattern = AlienPlantData.patterns[patternId];
        if (!pattern) return null;
        
        return {
            id: patternId,
            trend: pattern.trend,
            pattern: pattern.pattern,
            description: pattern.description,
            index: Object.keys(AlienPlantData.patterns).indexOf(patternId) + 1
        };
    },
    
    // Generate predictions for a specific pattern and display format
    generatePrediction: function(patternId, displayFormat, roundIndex = 0) {
        const pattern = AlienPlantData.patterns[patternId];
        if (!pattern) {
            console.error('Pattern not found:', patternId);
            return null;
        }
        
        // Get trend-specific historical data
        const historicalData = getHistoricalDataByTrend(pattern.trend);
        
        // Use pattern data as ground truth (aggregation is the expected value)
        const groundTruth = pattern.aggregation;
        
        return {
            groundTruth: groundTruth,
            pattern: pattern.pattern,
            trend: pattern.trend,
            description: pattern.description,
            displayFormat: displayFormat,
            values: displayFormat === 'aggregation' ? [pattern.aggregation] : pattern.alternatives,
            probabilities: displayFormat === 'aggregation' ? [1.0] : [1.0, 0.8, 0.6, 0.4, 0.2],
            historicalData: historicalData // Include trend-specific historical data
        };
    }
};

// Simplified stimuli assignment for single condition design
// Each participant gets all 15 patterns in randomized order
const SimplifiedStimuliAssignment = {
    // Get all 15 patterns for the assigned participant order
    getAllPatterns: function() {
        return Object.keys(AlienPlantData.patterns);
    },
    
    // Get pattern for specific trial (1-15)
    getPatternForTrial: function(trialNumber, participantOrder) {
        if (!participantOrder || participantOrder.length !== 15) {
            console.error('Invalid participant order. Expected array of 15 pattern IDs.');
            return null;
        }
        if (trialNumber < 1 || trialNumber > 15) {
            console.error('Trial number must be between 1 and 15.');
            return null;
        }
        return participantOrder[trialNumber - 1];
    }
};

// Helper function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Function to get growth data for a specific round
function getGrowthDataForRound(plantIndex, round, stimuliPatternId = null) {
    // Generate dates for historical data
    const dates = generateDates(10 + round);
    
    // Determine which trend to use based on stimuli pattern
    let trend = 'stable'; // default
    if (stimuliPatternId) {
        const pattern = AlienPlantData.patterns[stimuliPatternId];
        if (pattern && pattern.trend) {
            trend = pattern.trend;
        }
    }
    
    // Get trend-specific historical data
    const baseHistoricalData = getHistoricalDataByTrend(trend);
    
    // Extend historical data for this timeline
    const extendedData = extendHistoricalData(baseHistoricalData, 10 + round);
    const heights = extendedData.map(d => d.value);
    
    return {
        plantIndex: plantIndex,
        plantName: `Plant #${plantIndex}`,
        dates: dates,
        heights: heights,
        growth_rates: heights.map((h, i) => i > 0 ? ((h - heights[i-1]) / heights[i-1]) * 100 : 0),
        trend: trend // Include trend information for reference
    };
}

// Function to get prediction for a specific trial using stimuli patterns
function getPredictionForRound(plantIndex, conditionId, trial, stimuliPatternId = null) {
    // Use provided pattern ID or get from participant's randomized order
    let patternId = stimuliPatternId;
    
    if (!patternId) {
        // Fallback: use trial number to get pattern (for compatibility)
        const allPatterns = SimplifiedStimuliAssignment.getAllPatterns();
        patternId = allPatterns[(trial - 1) % allPatterns.length];
        console.warn(`No stimuli pattern ID provided for trial ${trial}, using fallback:`, patternId);
    }
    
    // Determine display format from condition ID
    const displayFormat = conditionId === 'aggregation' ? 'aggregation' : 'alternative';
    
    const prediction = StimuliPatterns.generatePrediction(patternId, displayFormat, trial - 1);
    
    if (!prediction) {
        console.error('Failed to generate prediction for pattern:', patternId);
        return null;
    }
    
    return prediction;
}

// Function to get current stimuli info for debug display
function getCurrentStimuliInfo(plantIndex, trial, stimuliPatternId = null) {
    let patternId = stimuliPatternId;
    
    if (!patternId) {
        // Fallback: use trial number to get pattern
        const allPatterns = SimplifiedStimuliAssignment.getAllPatterns();
        patternId = allPatterns[(trial - 1) % allPatterns.length];
    }
    
    const patternInfo = StimuliPatterns.getPatternInfo(patternId);
    if (patternInfo) {
        // Update index to reflect trial number
        patternInfo.index = trial;
        patternInfo.totalPatterns = 15;
    }
    
    return patternInfo;
}

// Export for use in experiment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AlienPlantData,
        StimuliPatterns,
        SimplifiedStimuliAssignment,
        getGrowthDataForRound,
        getPredictionForRound,
        getCurrentStimuliInfo,
        getHistoricalDataByTrend,
        getDefaultHistoricalData
    };
}