// Humidity Prediction Visualization Trust Study Configuration
// Version 12: Buggy Checkbox Selection Condition (Hardcoded)

const ExperimentConfig = {
    // Study Design: Two-phase approach (No visualization → With visualization)
    studyType: 'two_phase_between_subjects',

    // 12 Experimental Conditions (for reference)
    conditions: [
        {
            id: 'condition_1_baseline',
            name: 'Baseline',
            displayFormat: 'aggregation_only',
            description: 'Shows only aggregated prediction lines',
            instructions: ''
        },
        {
            id: 'condition_2_pi_plot',
            name: 'PI Plot',
            displayFormat: 'confidence_bounds',
            description: 'Shows aggregated prediction with confidence bounds',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region'
        },
        {
            id: 'condition_3_ensemble',
            name: 'Ensemble Plot',
            displayFormat: 'alternative_lines',
            description: 'Shows both aggregated and alternative predictions',
            instructions: 'Each line represent the prediction from one Forecast Agency'
        },
        {
            id: 'condition_4_ensemble_hover',
            name: 'Ensemble + Hover',
            displayFormat: 'hover_alternatives',
            description: 'Aggregated by default, hover to reveal alternatives',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_5_pi_hover',
            name: 'PI Plot + Hover',
            displayFormat: 'hover_bounds',
            description: 'PI plot with hover to reveal individual predictions',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_6_pi_to_ensemble',
            name: 'PI → Ensemble',
            displayFormat: 'transform_hover',
            description: 'PI plot transforms to ensemble plot on hover',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region. Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_7_buggy',
            name: 'Buggy Control',
            displayFormat: 'broken_interactions',
            description: 'Broken interactions (misaligned, draggable, wrong hover zones)',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_8_bad',
            name: 'Bad Control',
            displayFormat: 'poor_interactions',
            description: 'Poor interactions (forced clicks, timed pop-ups, disappearing elements)',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_9_combined',
            name: 'Combined PI + Ensemble',
            displayFormat: 'combined_pi_ensemble',
            description: 'Shows both confidence bounds and alternative prediction lines',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region. Each line represent the prediction from one Forecast Agency'
        },
        {
            id: 'condition_11_checkbox',
            name: 'Checkbox Selection',
            displayFormat: 'checkbox_selection',
            description: 'Bad: Tick all empty boxes to reveal each prediction line',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Tick the checkboxes to reveal predictions'
        },
        {
            id: 'condition_16_tiny_slider',
            name: 'Tiny Slider Checkbox',
            displayFormat: 'tiny_slider_checkbox',
            description: 'Worse: tiny-height horizontal slider of selection boxes with mini targets',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Scroll and tick the tiny checkboxes to reveal predictions'
        },
        {
            id: 'condition_17_buggy_checkbox',
            name: 'Buggy Checkbox Selection',
            displayFormat: 'buggy_checkbox_selection',
            description: 'Buggy: Clicking a checkbox selects the next one instead',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Tick the checkboxes to reveal predictions'
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
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'trust_ratings', 'interaction_data']
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

    // Data Structure (follows synthetic_city_data.json format)
    dataStructure: {
        format: 'synthetic_city_data',
        scenarioCount: 1, // Currently 1, planning to scale to 10
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
        sampleScenarios: 5, // Number of scenarios to use for aggregation (fixed: 1,2,3,5,8)
        animation: {
            enabled: true,
            duration: 300
        }
    },

    // Condition Assignment - HARDCODED FOR VERSION 12
    conditionAssignment: {
        getAssignedCondition: function() {
            // HARDCODED: Always return condition 17 (Buggy Checkbox Selection) for Version 12
            return ExperimentConfig.conditions[11];
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
        serverEndpoint: '../save_data.php',  // Path to PHP data collection script
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
            version: 'string'  // Added version tracking
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
    visualizationLiteracyScore: null,
    version: 'version12'  // Added version tracking
};

// Initialize participant configuration
function initializeParticipant(participantId) {
    console.log('INITIALIZING PARTICIPANT (VERSION 12):', participantId);

    ParticipantConfig.id = participantId || null; // ID will be set from user input
    ParticipantConfig.assignedCondition = ExperimentConfig.conditionAssignment.getAssignedCondition();
    ParticipantConfig.startTime = new Date().toISOString();
    ParticipantConfig.version = 'version12';

    console.log('PARTICIPANT INITIALIZED (VERSION 12):');
    console.log('  Participant ID:', ParticipantConfig.id);
    console.log('  Start Time:', ParticipantConfig.startTime);
    console.log('  Condition:', ParticipantConfig.assignedCondition.name);
    console.log('  Version:', ParticipantConfig.version);
    console.log('  Full Config:', ParticipantConfig);

    return ParticipantConfig;
}

// Make available to ES6 modules via window object
if (typeof window !== 'undefined') {
    window.ExperimentConfig = ExperimentConfig;
    window.ParticipantConfig = ParticipantConfig;
    window.initializeParticipant = initializeParticipant;
}

// Export for use in other modules (Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExperimentConfig, ParticipantConfig, initializeParticipant };
}
