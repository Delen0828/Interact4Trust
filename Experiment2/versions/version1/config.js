// Humidity Prediction Visualization Trust Study - Experiment 2
// Version 1: Single within-subject sequence (7 ordered variants)

const ExperimentConfig = {
    studyType: 'single_version_within_subjects',

    // Ordered within-subject variants for Experiment 2
    conditions: [
        {
            id: 'condition_1_baseline_aggregation',
            name: 'baseline_aggregation_only',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 1,
            cityBLineCount: 1,
            datasetFile: 'ranax_leer_city_baseline.json',
            description: 'Both cities show only aggregated prediction lines.',
            instructions: 'Dashed lines show aggregated humidity forecasts for each city.'
        },
        {
            id: 'condition_2_ci_95',
            name: 'ci_95_both_cities',
            displayFormat: 'exp2_parameterized',
            cityAType: 'region',
            cityBType: 'region',
            cityALineCount: 0,
            cityBLineCount: 0,
            datasetFile: 'virexa_talmori_incHist_incPred.json',
            description: 'Both cities show 95% confidence intervals around the aggregated line.',
            instructions: 'Shaded regions show 95% confidence intervals around each city\'s dashed aggregated forecast.'
        },
        {
            id: 'condition_3_ensemble_2_lines',
            name: 'ensemble_2_lines_per_city',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 2,
            cityBLineCount: 2,
            datasetFile: 'qelvane_rostiva_incHist_decPred.json',
            description: 'Both cities show 2 sampled ensemble prediction lines plus aggregated line.',
            instructions: 'Thin lines are sampled individual forecasts from 10 total predictions.'
        },
        {
            id: 'condition_4_ensemble_3_lines',
            name: 'ensemble_3_lines_per_city',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 3,
            cityBLineCount: 3,
            datasetFile: 'nexari_pulveth_decHist_incPred.json',
            description: 'Both cities show 3 sampled ensemble prediction lines plus aggregated line.',
            instructions: 'Thin lines are sampled individual forecasts from 10 total predictions.'
        },
        {
            id: 'condition_5_ensemble_4_lines',
            name: 'ensemble_4_lines_per_city',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 4,
            cityBLineCount: 4,
            datasetFile: 'zorvani_kelthar_decHist_decPred.json',
            description: 'Both cities show 4 sampled ensemble prediction lines plus aggregated line.',
            instructions: 'Thin lines are sampled individual forecasts from 10 total predictions.'
        },
        {
            id: 'condition_6_ensemble_5_lines',
            name: 'ensemble_5_lines_per_city',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 5,
            cityBLineCount: 5,
            datasetFile: 'lumora_vexlin_constHist_incPred.json',
            description: 'Both cities show 5 sampled ensemble prediction lines plus aggregated line.',
            instructions: 'Thin lines are sampled individual forecasts from 10 total predictions.'
        },
        {
            id: 'condition_7_ensemble_6_lines',
            name: 'ensemble_6_lines_per_city',
            displayFormat: 'exp2_parameterized',
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 6,
            cityBLineCount: 6,
            datasetFile: 'dravik_solmere_constHist_decPred.json',
            description: 'Both cities show 6 sampled ensemble prediction lines plus aggregated line.',
            instructions: 'Thin lines are sampled individual forecasts from 10 total predictions.'
        }
    ],

    variantSequence: [
        'condition_1_baseline_aggregation',
        'condition_2_ci_95',
        'condition_3_ensemble_2_lines',
        'condition_4_ensemble_3_lines',
        'condition_5_ensemble_4_lines',
        'condition_6_ensemble_5_lines',
        'condition_7_ensemble_6_lines'
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
        travelQuestion: 'If you are planning to travel after 6/01 and want the lower-humidity option, which city would you travel to: City A or City B?',
        travelChoices: ['City A', 'City B', 'No Preference']
    },
    // Interaction - Page 1
    interactionQuestions: [
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
            prompt: "I could explore the interface for further questions about the underlying data if I wanted to.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_exploration"
        },
        {
            prompt: "The interface had the ability to respond to my specific questions quickly and efficiently.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_responsiveness"
        },
        {
            prompt: "I could communicate in real time with other users who shared my interest in this interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "user_communication"
        },
        {
            prompt: "Interacting with this visualization felt similar to having a personal discussion with an expert about the data.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "personal_conversation"
        },
        {
            prompt: "The interface was like talking back to me while I clicked through the interface.",
            labels: ["Strongly Disagree", "Disagree", "Slightly Disagree", "Neutral", "Slightly Agree", "Agree", "Strongly Agree"],
            type: "interface_interaction"
        },
        {
            prompt: "I perceived the interface to be sensitive to my needs for information.",
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

    // Condition Assignment - HARDCODED FOR VERSION 1
    conditionAssignment: {
        getAssignedCondition: function() {
            return ExperimentConfig.conditions[0];
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
    version: 'version1'
};

// Initialize participant configuration
function initializeParticipant(participantId) {
    ParticipantConfig.id = participantId || null;
    ParticipantConfig.assignedCondition = ExperimentConfig.conditionAssignment.getAssignedCondition();
    ParticipantConfig.startTime = new Date().toISOString();
    ParticipantConfig.version = 'version1';

    console.log('Participant initialized (VERSION 1):');
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
