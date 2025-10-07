const ExperimentConfig = {
    // Experiment design: 2 named conditions, 15 trials each
    // User-selected design: each participant chooses ONE condition
    conditions: [
        { 
            id: 'aggregation', 
            name: 'Aggregation',
            displayFormat: 'aggregation', 
            description: 'Single aggregated prediction line only',
            instructions: 'You will see one prediction line representing the consensus forecast.'
        },
        { 
            id: 'hover_to_reveal', 
            name: 'Hover-to-Reveal',
            displayFormat: 'alternative', 
            description: 'Aggregated prediction with hover to reveal alternatives',
            instructions: 'You will see one prediction line by default. Hover over the chart to reveal alternative predictions.'
        }
    ],
    
    // 15 Stimuli Patterns (from sophisticated example)
    stimuliPatterns: {
        "increase_agreement": {
            trend: "increase",
            pattern: "agreement",
            description: "Models mostly agree on growth increase"
        },
        "increase_polarization": {
            trend: "increase",
            pattern: "polarization",
            description: "Models split between high and low growth predictions"
        },
        "increase_risk_of_loss": {
            trend: "increase",
            pattern: "risk_of_loss",
            description: "Mostly positive predictions with one severe decline risk"
        },
        "increase_chance_of_gain": {
            trend: "increase",
            pattern: "chance_of_gain",
            description: "One model predicts exceptional growth opportunity"
        },
        "increase_ambiguous_spread": {
            trend: "increase",
            pattern: "ambiguous_spread",
            description: "Models show varied growth predictions without clear pattern"
        },
        "decrease_agreement": {
            trend: "decrease",
            pattern: "agreement",
            description: "Models mostly agree on growth decline"
        },
        "decrease_polarization": {
            trend: "decrease",
            pattern: "polarization",
            description: "Models split between growth and decline predictions"
        },
        "decrease_risk_of_loss": {
            trend: "decrease",
            pattern: "risk_of_loss",
            description: "Mostly positive predictions with one severe decline risk"
        },
        "decrease_chance_of_gain": {
            trend: "decrease",
            pattern: "chance_of_gain",
            description: "One model predicts exceptional growth despite declining trend"
        },
        "decrease_ambiguous_spread": {
            trend: "decrease",
            pattern: "ambiguous_spread",
            description: "Models show varied decline predictions without clear pattern"
        },
        "stable_agreement": {
            trend: "stable",
            pattern: "agreement",
            description: "Models agree on stable growth with minimal change"
        },
        "stable_polarization": {
            trend: "stable",
            pattern: "polarization",
            description: "Models split between growth and decline despite stable average"
        },
        "stable_risk_of_loss": {
            trend: "stable",
            pattern: "risk_of_loss",
            description: "Mostly stable predictions with one severe decline risk"
        },
        "stable_chance_of_gain": {
            trend: "stable",
            pattern: "chance_of_gain",
            description: "One model predicts exceptional growth opportunity"
        },
        "stable_ambiguous_spread": {
            trend: "stable",
            pattern: "ambiguous_spread",
            description: "Models show varied stable predictions without clear pattern"
        }
    },
    
    // Pattern categories for analysis
    patternCategories: {
        agreement: "Models converge on similar predictions",
        polarization: "Models split into distinct high/low predictions", 
        risk_of_loss: "One model shows severe decline risk",
        chance_of_gain: "One model shows exceptional growth opportunity",
        ambiguous_spread: "Models show varied predictions without clear pattern"
    },
    
    // Trend categories
    trendCategories: {
        increase: "Overall upward growth trend",
        decrease: "Overall downward growth trend", 
        stable: "Minimal change from current height"
    },
    
    // Stimuli-based parameters (replacing simple good/bad model)
    stimuliParams: {
        // Each pattern has its own characteristics built into the data
        displayFormats: {
            aggregation: {
                numPredictions: 1,
                description: 'Single Prediction Line',
                showAlternatives: false
            },
            alternative: {
                numPredictions: 5,
                description: 'Multiple Prediction Lines',
                showAlternatives: true,
                hoverToReveal: true
            }
        }
    },
    
    // Enhanced display parameters for sophisticated patterns
    displayParams: {
        aggregation: {
            numPredictions: 1,
            description: 'Single Prediction Line',
            interactionType: 'static'
        },
        alternative: {
            numPredictions: 5,
            opacityLevels: [1.0, 0.8, 0.6, 0.4, 0.2],
            description: 'Multiple Prediction Lines',
            interactionType: 'hover_reveal',
            defaultShow: 'aggregation', // Show aggregated prediction by default
            hoverShow: 'alternatives' // Show all alternatives on hover
        }
    },
    
    // Greenhouse settings
    greenhouse: {
        initialResources: 10,
        resourceUnit: 'units',  // Growth resource units
        maxPlantsPerAction: 100,
        cultivationCostRate: 0.001  // 0.1% cultivation cost
    },
    
    // Experiment structure
    structure: {
        trialsPerCondition: 15,  // Each participant does 15 trials
        totalConditions: 2,      // Two available conditions (user selects one)
        historicalDaysToShow: 30,
        predictionDays: 1,
        userSelected: true       // User selects their condition
    },
    
    // Trust questions
    trustQuestions: [
        {
            prompt: "How much do you trust the accuracy of this growth prediction model?",
            labels: ["Not at all", "Completely"],
            name: "trust_accuracy"
        },
        {
            prompt: "How confident are you in making cultivation decisions based on these predictions?",
            labels: ["Not confident", "Very confident"],
            name: "decision_confidence"
        },
        {
            prompt: "How well do you understand the model's growth prediction logic?",
            labels: ["Don't understand", "Fully understand"],
            name: "understanding"
        },
        {
            prompt: "How reliable do you find the growth prediction visualizations?",
            labels: ["Very unreliable", "Very reliable"],
            name: "visualization_reliability"
        },
        {
            prompt: "How likely are you to use this model for future cultivation decisions?",
            labels: ["Very unlikely", "Very likely"],
            name: "future_use"
        }
    ],
    
    // Total number of plants/trials
    totalPlants: 15,
    
    // Timing parameters (in milliseconds)
    timing: {
        instructionsDuration: null,  // No time limit
        cultivationDecisionTimeout: 60000,  // 60 seconds
        trustSurveyTimeout: 30000,  // 30 seconds
        feedbackDuration: 3000,  // 3 seconds
        interTrialInterval: 500
    },
    
    // Chart configuration
    chart: {
        width: 800,
        height: 400,
        margins: { top: 20, right: 80, bottom: 50, left: 80 },
        colors: {
            historical: '#22c55e',  // Green for historical growth
            prediction: {
                aggregation: '#a855f7',  // Purple for single prediction
                alternative: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff']  // Purple gradient
            },
            groundTruth: '#059669',  // Dark green for actual growth
            grid: '#e5e7eb'
        }
    },
    
    // Data collection settings
    dataCollection: {
        saveFormat: 'csv',
        includeTimestamps: true,
        includeBrowserInfo: true,
        saveToServer: false,  // Set to true for production
        serverEndpoint: '/api/save-data'
    },
    
    // Debug mode with stimuli information
    debug: {
        enabled: true,
        skipInstructions: false,
        showConditionInfo: true,
        showStimuliInfo: true,  // Show current stimuli pattern info
        showPatternIndex: true,  // Show which of 15 patterns is active
        useMockData: true,  // Use sophisticated synthetic data
        fastMode: false  // Shorter timings for testing
    }
};

// Participant configuration (generated per session)
const ParticipantConfig = {
    id: generateParticipantId(),
    // Condition will be assigned based on user selection
    assignedCondition: null,
    // Randomize order of all 15 stimuli patterns for this participant
    stimuliOrder: shuffleArray(Object.keys(ExperimentConfig.stimuliPatterns)),
    startTime: new Date().toISOString(),
    browserInfo: {
        userAgent: navigator.userAgent,
        screenWidth: screen.width,
        screenHeight: screen.height,
        platform: navigator.platform
    },
    // Log condition assignment details
    conditionDetails: {
        conditionId: null, // Will be set after user selection
        conditionName: null,
        displayFormat: null,
        totalTrials: ExperimentConfig.structure.trialsPerCondition
    }
};

// Function to set condition after user selection
function setParticipantCondition(conditionId) {
    const condition = ExperimentConfig.conditions.find(c => c.id === conditionId);
    if (condition) {
        ParticipantConfig.assignedCondition = condition;
        ParticipantConfig.conditionDetails.conditionId = condition.id;
        ParticipantConfig.conditionDetails.conditionName = condition.name;
        ParticipantConfig.conditionDetails.displayFormat = condition.displayFormat;
    }
    return condition;
}

// Helper functions
function generateParticipantId() {
    return 'P' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExperimentConfig, ParticipantConfig };
}