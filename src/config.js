// Air Quality Prediction Visualization Trust Study Configuration
// 8 Experimental Conditions (Between-subjects design)

const ExperimentConfig = {
    // Study Design: Two-phase approach (No visualization → With visualization)
    studyType: 'two_phase_between_subjects',
    
    // 8 Experimental Conditions
    conditions: [
        { 
            id: 'condition_1_baseline', 
            name: 'Baseline',
            displayFormat: 'aggregation_only',
            description: 'Shows only aggregated prediction lines',
            instructions: 'You will see a single prediction line for each city representing the expected air quality trend.'
        },
        { 
            id: 'condition_2_pi_plot', 
            name: 'PI Plot',
            displayFormat: 'confidence_bounds',
            description: 'Shows aggregated prediction with confidence bounds',
            instructions: 'You will see prediction lines with shaded areas indicating the range of uncertainty in the predictions.'
        },
        { 
            id: 'condition_3_ensemble', 
            name: 'Ensemble Plot',
            displayFormat: 'alternative_lines',
            description: 'Shows both aggregated and alternative predictions',
            instructions: 'You will see multiple prediction lines showing different possible air quality scenarios alongside an average prediction.'
        },
        { 
            id: 'condition_4_ensemble_hover', 
            name: 'Ensemble + Hover',
            displayFormat: 'hover_alternatives',
            description: 'Aggregated by default, hover to reveal alternatives',
            instructions: 'You will see average prediction lines. Hover over the chart to reveal alternative prediction scenarios.'
        },
        { 
            id: 'condition_5_pi_hover', 
            name: 'PI Plot + Hover',
            displayFormat: 'hover_bounds',
            description: 'PI plot with hover to reveal individual predictions',
            instructions: 'You will see prediction lines with confidence bounds. Hover to see the individual predictions that make up the bounds.'
        },
        { 
            id: 'condition_6_pi_to_ensemble', 
            name: 'PI → Ensemble',
            displayFormat: 'transform_hover',
            description: 'PI plot transforms to ensemble plot on hover',
            instructions: 'You will see prediction bounds that transform into individual prediction lines when you hover over them.'
        },
        { 
            id: 'condition_7_buggy', 
            name: 'Buggy Control',
            displayFormat: 'broken_interactions',
            description: 'Broken interactions (misaligned, draggable, wrong hover zones)',
            instructions: 'You will see prediction visualizations with interactive elements. Note: Some interactions may not work as expected.'
        },
        { 
            id: 'condition_8_bad', 
            name: 'Bad Control',
            displayFormat: 'poor_interactions',
            description: 'Poor interactions (forced clicks, timed pop-ups, disappearing elements)',
            instructions: 'You will see prediction visualizations with interactive elements that require specific actions to view details.'
        }
    ],

    // Visualization Literacy Test (12 questions)
    visualizationLiteracy: {
        enabled: true,
        questionCount: 12,
        timeLimit: null, // No time limit
        questions: [
            {
                id: 'vl_1',
                type: 'line_chart_basic',
                question: 'In this line chart, which city had higher air quality in March?',
                // Question details will be implemented in plugin
            },
            {
                id: 'vl_2', 
                type: 'trend_identification',
                question: 'What trend does City A show from January to June?',
            },
            {
                id: 'vl_3',
                type: 'uncertainty_bounds',
                question: 'What do the shaded areas around the line represent?',
            },
            // Additional questions will be defined in the plugin
            // Total: 12 questions testing various visualization concepts
        ]
    },

    // Two-Phase Study Structure
    phases: {
        phase1: {
            name: 'Prediction Without Visualization',
            description: 'Text-based air quality prediction task',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice']
        },
        phase2: {
            name: 'Prediction With Visualization', 
            description: 'Visual prediction task with assigned condition',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'trust_ratings', 'interaction_data']
        }
    },

    // Air Quality Prediction Task
    predictionTask: {
        question: 'The probability that air quality in City A will be better than City B is ____%',
        confidenceScale: {
            min: 1,
            max: 7,
            labels: ['Very Uncertain', 'Uncertain', 'Somewhat Uncertain', 'Neutral', 'Somewhat Certain', 'Certain', 'Very Certain']
        },
        travelQuestion: 'If you were planning to visit one of these cities, which would you choose?',
        travelChoices: ['City A', 'City B', 'No Preference']
    },

    // Trust and Confidence Measurements
    trustQuestions: [
        {
            prompt: "I was in control of my navigation through this interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "navigation_control"
        },
        {
            prompt: "I had some control over the content of this interface that I wanted to see.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "content_control"
        },
        {
            prompt: "I was in control over the pace of my visit to this interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "pace_control"
        },
        {
            prompt: "I could communicate with the company directly for further questions about the company or its products if I wanted to.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "company_communication"
        },
        {
            prompt: "The interface had the ability to respond to my specific questions quickly and efficiently.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_responsiveness"
        },
        {
            prompt: "I could communicate in real time with other customers who shared my interest in this interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "customer_communication"
        },
        {
            prompt: "I felt I just had a personal conversation with a sociable, knowledgeable and warm representative from the company.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "personal_conversation"
        },
        {
            prompt: "The interface was like talking back to me while I clicked through the interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_interaction"
        },
        {
            prompt: "I perceived the interface to be sensitive to my needs for product information.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_sensitivity"
        },
        {
            prompt: "I am skeptical about the information presented in this visualization.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "skeptical_rating"
        },
        {
            prompt: "I trust this data.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "data_trust"
        },
        {
            prompt: "I find this visualization difficult to use.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "usability_difficulty"
        },
        {
            prompt: "I find this visualization easy to understand.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "comprehension_ease"
        }
    ],

    // Data Structure (follows synthetic_city_data.json format)
    dataStructure: {
        format: 'synthetic_city_data',
        scenarioCount: 1, // Currently 1, planning to scale to 10
        fields: {
            date: 'Date string (YYYY-MM-DD)',
            city: 'City identifier (A or B)',
            price: 'Air quality index value',
            series: 'Data type (historical or prediction)',
            scenario: 'Scenario number (null for historical, 1-10 for predictions)'
        }
    },

    // Visualization Settings
    visualization: {
        width: 600,
        height: 400,
        margin: { top: 20, right: 20, bottom: 40, left: 50 },
        colors: {
            cityA: '#007bff',
            cityB: '#fd7e14',
            historical: '#6c757d'
        },
        sampleScenarios: 5, // Number of scenarios to sample for aggregation
        animation: {
            enabled: true,
            duration: 300
        }
    },

    // Condition Assignment
    conditionAssignment: {
        mode: 'manual', // 'manual' for testing, 'random' for production
        defaultCondition: 1, // Used when mode is 'manual'
        getAssignedCondition: function() {
            console.log('Getting assigned condition, ASSIGNED_CONDITION:', typeof ASSIGNED_CONDITION !== 'undefined' ? ASSIGNED_CONDITION : 'undefined');
            console.log('Available conditions count:', ExperimentConfig.conditions.length);
            
            if (typeof ASSIGNED_CONDITION !== 'undefined') {
                const conditionIndex = ASSIGNED_CONDITION - 1;
                console.log('Condition index:', conditionIndex);
                if (conditionIndex >= 0 && conditionIndex < ExperimentConfig.conditions.length) {
                    console.log('Returning condition:', ExperimentConfig.conditions[conditionIndex].name);
                    return ExperimentConfig.conditions[conditionIndex];
                }
            }
            // Fallback to condition 1
            console.log('Using fallback condition 1');
            return ExperimentConfig.conditions[0];
        }
    },

    // Debug Settings
    debug: {
        enabled: true,
        showConditionInfo: true,
        showInteractionLogs: true,
        logDataProcessing: true
    },

    // Data Collection
    dataCollection: {
        saveToServer: false,
        serverEndpoint: '/save-experiment-data',
        fields: {
            participant_id: 'string',
            condition_id: 'string',
            condition_name: 'string',
            display_format: 'string',
            phase_1_data: 'object',
            phase_2_data: 'object',
            vis_literacy_score: 'number',
            trust_ratings: 'object',
            interaction_logs: 'array',
            timestamp: 'string'
        }
    }
};

// Participant Configuration (initialized during experiment)
let ParticipantConfig = {
    id: null,
    assignedCondition: null,
    startTime: null,
    phase1Complete: false,
    phase2Complete: false,
    visualizationLiteracyScore: null
};

// Initialize participant configuration
function initializeParticipant() {
    ParticipantConfig.id = 'P' + Math.random().toString(36).substr(2, 9);
    ParticipantConfig.assignedCondition = ExperimentConfig.conditionAssignment.getAssignedCondition();
    ParticipantConfig.startTime = new Date().toISOString();
    
    console.log('Participant initialized:', ParticipantConfig.id);
    console.log('Assigned condition:', ParticipantConfig.assignedCondition.name);
    
    return ParticipantConfig;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExperimentConfig, ParticipantConfig, initializeParticipant };
}