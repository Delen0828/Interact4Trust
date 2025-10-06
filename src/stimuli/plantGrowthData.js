// Alien plant growth data with sophisticated prediction patterns
const AlienPlantData = {
    // Base historical growth data (scaled from example data to plant heights)
    historical: [
        { time: 0, value: 100.0 },
        { time: 1, value: 102.1 },
        { time: 2, value: 101.3 },
        { time: 3, value: 103.2 },
        { time: 4, value: 102.4 },
        { time: 5, value: 101.8 },
        { time: 6, value: 103.7 },
        { time: 7, value: 102.1 },
        { time: 8, value: 100.9 },
        { time: 9, value: 102.5 }
    ],
    
    // 15 sophisticated prediction patterns (5 patterns × 3 trends)
    patterns: {
        "increase_agreement": {
            trend: "increase",
            pattern: "agreement",
            aggregation: 107.5,
            alternatives: [107.68, 107.57, 107.07, 107.67, 107.52],
            description: "Models mostly agree on growth increase"
        },
        "increase_polarization": {
            trend: "increase",
            pattern: "polarization",
            aggregation: 107.5,
            alternatives: [119.5, 115.5, 107.5, 99.5, 95.5],
            description: "Models split between high and low growth predictions"
        },
        "increase_risk_of_loss": {
            trend: "increase",
            pattern: "risk_of_loss",
            aggregation: 107.5,
            alternatives: [122.8, 121.8, 121.3, 112.8, 58.8],
            description: "Mostly positive predictions with one severe decline risk"
        },
        "increase_chance_of_gain": {
            trend: "increase",
            pattern: "chance_of_gain",
            aggregation: 107.5,
            alternatives: [139.7, 100.2, 99.7, 99.2, 98.7],
            description: "One model predicts exceptional growth opportunity"
        },
        "increase_ambiguous_spread": {
            trend: "increase",
            pattern: "ambiguous_spread",
            aggregation: 107.5,
            alternatives: [111.02, 107.82, 105.42, 103.82, 109.42],
            description: "Models show varied growth predictions without clear pattern"
        },
        "decrease_agreement": {
            trend: "decrease",
            pattern: "agreement",
            aggregation: 97.5,
            alternatives: [97.06, 97.05, 98.01, 98.11, 97.27],
            description: "Models mostly agree on growth decline"
        },
        "decrease_polarization": {
            trend: "decrease",
            pattern: "polarization",
            aggregation: 97.5,
            alternatives: [109.5, 105.5, 97.5, 89.5, 85.5],
            description: "Models split between growth and decline predictions"
        },
        "decrease_risk_of_loss": {
            trend: "decrease",
            pattern: "risk_of_loss",
            aggregation: 97.5,
            alternatives: [109.7, 107.7, 105.7, 104.7, 59.7],
            description: "Mostly positive predictions with one severe decline risk"
        },
        "decrease_chance_of_gain": {
            trend: "decrease",
            pattern: "chance_of_gain",
            aggregation: 97.5,
            alternatives: [135.3, 88.8, 88.3, 87.8, 87.3],
            description: "One model predicts exceptional growth despite declining trend"
        },
        "decrease_ambiguous_spread": {
            trend: "decrease",
            pattern: "ambiguous_spread",
            aggregation: 97.5,
            alternatives: [101.02, 97.82, 95.42, 93.82, 99.42],
            description: "Models show varied decline predictions without clear pattern"
        },
        "stable_agreement": {
            trend: "stable",
            pattern: "agreement",
            aggregation: 102.81,
            alternatives: [102.23, 103.49, 102.76, 103.05, 102.52],
            description: "Models agree on stable growth with minimal change"
        },
        "stable_polarization": {
            trend: "stable",
            pattern: "polarization",
            aggregation: 102.31,
            alternatives: [114.31, 110.31, 102.31, 94.31, 90.31],
            description: "Models split between growth and decline despite stable average"
        },
        "stable_risk_of_loss": {
            trend: "stable",
            pattern: "risk_of_loss",
            aggregation: 102.84,
            alternatives: [114.84, 112.84, 110.84, 108.84, 66.84],
            description: "Mostly stable predictions with one severe decline risk"
        },
        "stable_chance_of_gain": {
            trend: "stable",
            pattern: "chance_of_gain",
            aggregation: 102.63,
            alternatives: [137.23, 94.73, 94.23, 93.73, 93.23],
            description: "One model predicts exceptional growth opportunity"
        },
        "stable_ambiguous_spread": {
            trend: "stable",
            pattern: "ambiguous_spread",
            aggregation: 102.27,
            alternatives: [105.79, 102.59, 100.19, 98.59, 104.19],
            description: "Models show varied stable predictions without clear pattern"
        }
    },
    
   
};

// Helper functions for alien plant data
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
    const lastValue = baseData[baseData.length - 1].value;
    
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
        
        const currentHeight = AlienPlantData.historical[AlienPlantData.historical.length - 1].value;
        
        // Use pattern data as ground truth (first alternative is most likely)
        const groundTruth = pattern.aggregation;
        
        return {
            groundTruth: groundTruth,
            pattern: pattern.pattern,
            trend: pattern.trend,
            description: pattern.description,
            displayFormat: displayFormat,
            values: displayFormat === 'aggregation' ? [pattern.aggregation] : pattern.alternatives,
            probabilities: displayFormat === 'aggregation' ? [1.0] : [1.0, 0.8, 0.6, 0.4, 0.2]
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
function getGrowthDataForRound(plantIndex, round) {
    // Generate dates for historical data
    const dates = generateDates(10 + round);
    
    // Extend historical data for this timeline
    const extendedData = extendHistoricalData(AlienPlantData.historical, 10 + round);
    const heights = extendedData.map(d => d.value);
    
    return {
        plantIndex: plantIndex,
        plantName: `Plant #${plantIndex}`,
        dates: dates,
        heights: heights,
        growth_rates: heights.map((h, i) => i > 0 ? ((h - heights[i-1]) / heights[i-1]) * 100 : 0)
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
        getCurrentStimuliInfo
    };
}