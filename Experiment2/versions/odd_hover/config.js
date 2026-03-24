// Humidity Prediction Visualization Trust Study - Experiment 2
// Version odd_hover: odd x hover_show_one

const VERSION_SETTINGS = Object.freeze({
    versionId: 'odd_hover',
    versionNumber: 2,
    parity: 'odd',
    interactionMode: 'hover_show_one'
});

function getInteractionHint(interactionMode) {
    if (interactionMode === 'click_show_one') {
        return 'Hint: Use the two city checkboxes below the chart to show or hide details.';
    }
    return 'Hint: Hover on a city\'s dashed prediction line to reveal details.';
}

function buildCiDescription(interactionMode) {
    const interactionText = interactionMode === 'click_show_one'
        ? 'Details are revealed with city checkboxes.'
        : 'Details are revealed by hovering over each city line.';
    return `Both cities show 95% confidence intervals around the aggregated line. ${interactionText}`;
}

function buildEnsembleDescription(lineCount, interactionMode) {
    const interactionText = interactionMode === 'click_show_one'
        ? 'Details are revealed with city checkboxes.'
        : 'Details are revealed by hovering over each city line.';
    return `Both cities show ${lineCount} sampled ensemble prediction lines plus aggregated line. ${interactionText}`;
}

function buildExp2Conditions(parity, interactionMode) {
    const ensembleLineCounts = parity === 'odd' ? [3, 5, 7, 9] : [2, 4, 6, 8];
    const interactionHint = getInteractionHint(interactionMode);

    const baselineCondition = {
        id: 'condition_1_baseline_aggregation',
        name: `baseline_aggregation_only_${parity}_${interactionMode}`,
        displayFormat: 'exp2_parameterized',
        interactionMode,
        cityAType: 'line',
        cityBType: 'line',
        cityALineCount: 1,
        cityBLineCount: 1,
        description: 'Both cities show only aggregated prediction lines.',
        instructions: 'Dashed lines show aggregated humidity forecasts for each city.'
    };

    const ciCondition = {
        id: 'condition_2_ci_95',
        name: `ci_95_both_cities_${parity}_${interactionMode}`,
        displayFormat: 'exp2_parameterized',
        interactionMode,
        cityAType: 'region',
        cityBType: 'region',
        cityALineCount: 0,
        cityBLineCount: 0,
        description: buildCiDescription(interactionMode),
        instructions: `Shaded regions show 95% confidence intervals around each city's dashed aggregated forecast.<br><br>${interactionHint}`
    };

    const ensembleConditions = ensembleLineCounts.map((lineCount, index) => {
        return {
            id: `condition_${index + 3}_ensemble_${lineCount}_lines`,
            name: `ensemble_${lineCount}_lines_per_city_${parity}_${interactionMode}`,
            displayFormat: 'exp2_parameterized',
            interactionMode,
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: lineCount,
            cityBLineCount: lineCount,
            description: buildEnsembleDescription(lineCount, interactionMode),
            instructions: `Thin lines are sampled individual forecasts from 10 total predictions.<br><br>${interactionHint}`
        };
    });

    return [baselineCondition, ciCondition, ...ensembleConditions];
}

const versionConditions = buildExp2Conditions(VERSION_SETTINGS.parity, VERSION_SETTINGS.interactionMode);

const ExperimentConfig = {
    studyType: 'exp2_odd_even_click_hover_within_subjects',

    // Within-subject conditions for this version
    conditions: versionConditions,

    variantSequence: versionConditions.map((condition) => condition.id),

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

    // Condition Assignment
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
    version: VERSION_SETTINGS.versionId
};

// Initialize participant configuration
function initializeParticipant(participantId) {
    ParticipantConfig.id = participantId || null;
    ParticipantConfig.assignedCondition = ExperimentConfig.conditionAssignment.getAssignedCondition();
    ParticipantConfig.startTime = new Date().toISOString();
    ParticipantConfig.version = VERSION_SETTINGS.versionId;

    console.log(`Participant initialized (VERSION ${VERSION_SETTINGS.versionNumber}):`);
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
