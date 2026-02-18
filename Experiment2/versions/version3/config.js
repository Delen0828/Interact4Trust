// Humidity Prediction Visualization Trust Study - Experiment 2
// Version 3: PI-2_cities_region_vs_region (Hardcoded)

const ExperimentConfig = {
    studyType: 'two_phase_between_subjects',

    // 12 Experimental Conditions for Experiment 2
    conditions: [
        {
            id: 'condition_1_pi_region_region',
            name: 'PI-2_cities_region_vs_region',
            displayFormat: 'exp2_parameterized',
            cityAType: 'region',
            cityBType: 'region',
            cityALineCount: 0,
            cityBLineCount: 0,
            description: 'Both cities show PI shaded region',
            instructions: 'Shaded regions represent the range of possible humidity values.'
        },
        {
            id: 'condition_2_pi_region_1line_A',
            name: 'PI-1_city_region_vs_1_line_A_region',
            displayFormat: 'exp2_parameterized',
            cityAType: 'region',
            cityBType: 'line',
            cityALineCount: 0,
            cityBLineCount: 1,
            description: 'City A shows PI region, City B shows 1 aggregated line',
            instructions: 'City A shaded region shows possible humidity range. City B dashed line shows the aggregated forecast.'
        },
        {
            id: 'condition_3_pi_region_1line_B',
            name: 'PI-1_city_region_vs_1_line_B_region',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'region',
            cityALineCount: 1,
            cityBLineCount: 0,
            description: 'City A shows 1 aggregated line, City B shows PI region',
            instructions: 'City A dashed line shows the aggregated forecast. City B shaded region shows possible humidity range.'
        },
        {
            id: 'condition_4_baseline_1_1',
            name: 'baseline_1_line_vs_1_line',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 1,
            cityBLineCount: 1,
            description: 'Both cities show 1 aggregated prediction line',
            instructions: 'Dashed lines show the aggregated humidity forecast for each city.'
        },
        {
            id: 'condition_5_ensemble_5_1_A',
            name: 'ensemble_1_city_5_vs_1_A_5',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 5,
            cityBLineCount: 1,
            description: 'City A shows 5 ensemble lines, City B shows 1 line',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        },
        {
            id: 'condition_6_ensemble_1_5_B',
            name: 'ensemble_1_city_5_vs_1_B_5',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 1,
            cityBLineCount: 5,
            description: 'City A shows 1 line, City B shows 5 ensemble lines',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        },
        {
            id: 'condition_7_ensemble_10_1_A',
            name: 'ensemble_1_city_10_vs_1_A_10',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 10,
            cityBLineCount: 1,
            description: 'City A shows 10 ensemble lines, City B shows 1 line',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        },
        {
            id: 'condition_8_ensemble_1_10_B',
            name: 'ensemble_1_city_10_vs_1_B_10',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 1,
            cityBLineCount: 10,
            description: 'City A shows 1 line, City B shows 10 ensemble lines',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        },
        {
            id: 'condition_9_ensemble_5_5',
            name: 'ensemble_2_cities_5_vs_5',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 5,
            cityBLineCount: 5,
            description: 'Both cities show 5 ensemble lines',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        },
        {
            id: 'condition_10_ensemble_10_10',
            name: 'ensemble_2_cities_10_vs_10',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 10,
            cityBLineCount: 10,
            description: 'Both cities show 10 ensemble lines',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        },
        {
            id: 'condition_11_ensemble_5_10_A',
            name: 'ensemble_2_cities_5_vs_10_A_5',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 5,
            cityBLineCount: 10,
            description: 'City A shows 5 ensemble lines, City B shows 10 ensemble lines',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        },
        {
            id: 'condition_12_ensemble_10_5_B',
            name: 'ensemble_2_cities_5_vs_10_B_5',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 10,
            cityBLineCount: 5,
            description: 'City A shows 10 ensemble lines, City B shows 5 ensemble lines',
            instructions: 'Each line represents a prediction from one Forecast Agency.'
        }
    ],

    // Two-Phase Study Structure
    phases: {
        phase1: {
            name: 'Prediction Without Visualization',
            description: 'Text-based Humidity prediction task',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice']
        },
        phase2: {
            name: 'Prediction With Visualization',
            description: 'Visual prediction task with assigned condition',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'trust_ratings']
        }
    },

    // Humidity Prediction Task
    predictionTask: {
        question: 'The probability that the humidity of City A will be higher than City B on 06/30 is ____%',
        confidenceScale: {
            min: 1,
            max: 7,
            labels: ['Very Uncertain', 'Uncertain', 'Somewhat Uncertain', 'Neutral', 'Somewhat Certain', 'Certain', 'Very Certain']
        },
        travelQuestion: 'If you are planning to travel to one of these cities after 6/01, and you would like to choose the one with lower humidity, which city would you travel to?',
        travelChoices: ['City A', 'City B', 'No Preference']
    },

    // Trust and Confidence Measurements - Page 1
    trustQuestions: [
        {
            prompt: "I was in control of my navigation through this interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "navigation_control"
        },
        {
            prompt: "I had some control over the content of this interface that I wanted to see.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "content_control"
        },
        {
            prompt: "I was in control over the pace of my visit to this interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "pace_control"
        },
        {
            prompt: "I could communicate with the company directly for further questions about the company or its products if I wanted to.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "company_communication"
        },
        {
            prompt: "The interface had the ability to respond to my specific questions quickly and efficiently.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_responsiveness"
        },
        {
            prompt: "I could communicate in real time with other customers who shared my interest in this interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "customer_communication"
        },
        {
            prompt: "I felt I just had a personal conversation with a sociable, knowledgeable and warm representative from the company.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "personal_conversation"
        },
        {
            prompt: "The interface was like talking back to me while I clicked through the interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_interaction"
        },
        {
            prompt: "I perceived the interface to be sensitive to my needs for product information.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_sensitivity"
        }
    ],

    // Trust and Confidence Measurements - Page 2 (Visualization-specific)
    visualizationTrustQuestions: [
        {
            prompt: "I was skeptical about the information presented in this visualization.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "skeptical_rating"
        },
        {
            prompt: "I trusted this data.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "data_trust"
        },
        {
            prompt: "I found this visualization difficult to use.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "usability_difficulty"
        },
        {
            prompt: "I found this visualization easy to understand.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "comprehension_ease"
        }
    ],

    // Personality Self Evaluation Questions
    personalityQuestions: [
        {
            prompt: "I respect others.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "respect_others"
        },
        {
            prompt: "I have a good word for everyone.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "good_word_everyone"
        },
        {
            prompt: "I retreat from others.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "retreat_from_others"
        },
        {
            prompt: "I avoid contacts with others.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "avoid_contacts"
        }
    ],

    // Data Structure
    dataStructure: {
        format: 'synthetic_city_data',
        scenarioCount: 10,
        fields: {
            date: 'Date string (YYYY-MM-DD)',
            city: 'City identifier (A or B)',
            price: 'Humidity value',
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
            cityA: '#0891B2',
            cityB: '#7C3AED',
            historical: '#6c757d'
        },
        sampleScenarios: 10,
        animation: {
            enabled: false,
            duration: 0
        }
    },

    // Condition Assignment - HARDCODED FOR VERSION 3
    conditionAssignment: {
        getAssignedCondition: function() {
            return ExperimentConfig.conditions[2];
        }
    },

    // Debug Settings
    debug: {
        enabled: false,
        showConditionInfo: false,
        showInteractionLogs: false,
        logDataProcessing: false
    },

    // Data Collection
    dataCollection: {
        saveToServer: true,
        serverEndpoint: '../save_data.php',
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
            timestamp: 'string',
            version: 'string'
        }
    }
};

// Participant Configuration
let ParticipantConfig = {
    id: null,
    assignedCondition: null,
    startTime: null,
    phase1Complete: false,
    phase2Complete: false,
    visualizationLiteracyScore: null,
    version: 'version3'
};

// Initialize participant configuration
function initializeParticipant(participantId) {
    ParticipantConfig.id = participantId || null;
    ParticipantConfig.assignedCondition = ExperimentConfig.conditionAssignment.getAssignedCondition();
    ParticipantConfig.startTime = new Date().toISOString();
    ParticipantConfig.version = 'version3';

    console.log('Participant initialized (VERSION 3):');
    console.log('  Condition:', ParticipantConfig.assignedCondition.name);
    console.log('  Version:', ParticipantConfig.version);

    return ParticipantConfig;
}

// Make available to ES6 modules via window object
if (typeof window !== 'undefined') {
    window.ExperimentConfig = ExperimentConfig;
    window.ParticipantConfig = ParticipantConfig;
    window.initializeParticipant = initializeParticipant;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExperimentConfig, ParticipantConfig, initializeParticipant };
}
