// Humidity Prediction Visualization Trust Study Configuration
// Four-phase within-participants design

const INTERACTION_TOKEN_TO_KEY = Object.freeze({
    S: 'static',
    H: 'hover',
    B: 'bug'
});

const INTERACTION_TOKENS = Object.freeze(['S', 'H', 'B']);
const DISPLAY_TOKENS = Object.freeze(['CI', 'EP', 'CIEP']);

function isPermutation(values, allowedValues) {
    if (!Array.isArray(values) || values.length !== allowedValues.length) return false;
    const valuesSet = new Set(values);
    if (valuesSet.size !== allowedValues.length) return false;
    return allowedValues.every((value) => valuesSet.has(value));
}

function parseVersionDescriptor(versionId) {
    if (!versionId) return null;
    const normalized = String(versionId).trim();
    const match = normalized.match(/^version_([A-Za-z-]+)_([A-Za-z-]+)$/);
    if (!match) return null;

    const interactionOrder = match[1].toUpperCase().split('-').filter(Boolean);
    const displayOrder = match[2].toUpperCase().split('-').filter(Boolean);

    if (!isPermutation(interactionOrder, INTERACTION_TOKENS)) return null;
    if (!isPermutation(displayOrder, DISPLAY_TOKENS)) return null;

    return {
        versionId: `version_${interactionOrder.join('-')}_${displayOrder.join('-')}`,
        interactionOrder,
        displayOrder
    };
}

function getVersionIdFromPathname(pathname, fallbackVersionId) {
    const pathText = String(pathname || '');
    const segments = pathText.split('/').filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i -= 1) {
        const parsed = parseVersionDescriptor(segments[i]);
        if (parsed) {
            return parsed.versionId;
        }
    }
    return fallbackVersionId;
}

function serializeCondition(condition) {
    if (!condition) return null;
    return {
        id: condition.id,
        name: condition.name,
        displayFormat: condition.displayFormat,
        technique: condition.technique || null
    };
}

const ExperimentConfig = {
    studyType: 'four_phase_within_subjects',

    // Available visualization conditions
    conditions: [
        {
            id: 'condition_1_baseline',
            name: 'Baseline',
            displayFormat: 'aggregation_only',
            technique: 'baseline',
            description: 'Shows only aggregated prediction lines',
            instructions: ''
        },
        {
            id: 'condition_2_pi_plot',
            name: 'PI Plot',
            displayFormat: 'confidence_bounds',
            technique: 'confidence_interval',
            description: 'Shows aggregated prediction with confidence bounds',
            instructions: 'Shade shows the 95% confidence interval around the average Humidity forecast'
        },
        {
            id: 'condition_3_ensemble',
            name: 'Ensemble Plot',
            displayFormat: 'alternative_lines',
            technique: 'ensemble_plot',
            description: 'Shows both aggregated and alternative predictions',
            instructions: 'Each line represent the prediction from one Forecast Agency'
        },
        {
            id: 'condition_4_ensemble_hover',
            name: 'Ensemble + Hover',
            displayFormat: 'hover_alternatives',
            technique: 'confidence_interval',
            description: 'Aggregated by default, hover to reveal alternatives',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_5_pi_hover',
            name: 'PI Plot + Hover',
            displayFormat: 'hover_bounds',
            technique: 'ensemble_plot',
            description: 'PI plot with hover to reveal individual predictions',
            instructions: 'Shade shows the 95% confidence interval around the average Humidity forecast.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_6_pi_to_ensemble',
            name: 'PI to Ensemble',
            displayFormat: 'transform_hover',
            technique: 'combined_plot',
            description: 'PI plot transforms to ensemble plot on hover',
            instructions: 'Shade shows the 95% confidence interval around the average Humidity forecast. Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_7_buggy',
            name: 'Buggy Control',
            displayFormat: 'broken_interactions',
            technique: 'buggy_control',
            description: 'Broken interactions (misaligned, draggable, wrong hover zones)',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_8_bad',
            name: 'Bad Control',
            displayFormat: 'poor_interactions',
            technique: 'bad_control',
            description: 'Poor interactions (forced clicks, timed pop-ups, disappearing elements)',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_9_combined',
            name: 'Combined PI + Ensemble',
            displayFormat: 'combined_pi_ensemble',
            technique: 'combined_plot',
            description: 'Shows both confidence bounds and alternative prediction lines',
            instructions: 'Shade shows the 95% confidence interval around the average Humidity forecast. Each line represent the prediction from one Forecast Agency'
        },
        {
            id: 'condition_18_glitch_hover',
            name: 'Glitch Ensemble + Hover',
            displayFormat: 'glitch_hover_alternatives',
            technique: 'confidence_interval',
            description: 'Aggregated by default, hover reveals alternative lines with glitchy visibility',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_19_glitch_pi_hover',
            name: 'Glitch PI Plot + Hover',
            displayFormat: 'glitch_hover_bounds',
            technique: 'ensemble_plot',
            description: 'Hover reveals PI bounds with glitchy visibility',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_20_glitch_pi_to_ensemble',
            name: 'Glitch PI to Ensemble',
            displayFormat: 'glitch_transform_hover',
            technique: 'combined_plot',
            description: 'Hover transforms PI into ensemble lines with glitchy visibility',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region. Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        }
    ],

    phaseDesign: {
        defaultVersionId: 'version_S-H-B_CI-EP-CIEP',
        phaseOrder: ['phase1', 'phase2', 'phase3', 'phase4'],
        conditionMatrix: {
            static: {
                CI: 'condition_2_pi_plot',
                EP: 'condition_3_ensemble',
                CIEP: 'condition_9_combined'
            },
            hover: {
                CI: 'condition_4_ensemble_hover',
                EP: 'condition_5_pi_hover',
                CIEP: 'condition_6_pi_to_ensemble'
            },
            bug: {
                CI: 'condition_18_glitch_hover',
                EP: 'condition_19_glitch_pi_hover',
                CIEP: 'condition_20_glitch_pi_to_ensemble'
            }
        }
    },

    phases: {
        phase1: {
            name: 'Baseline',
            description: 'Prediction task with baseline visualization',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        },
        phase2: {
            name: 'Static',
            description: 'Prediction task with static condition (2, 3, or 9)',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        },
        phase3: {
            name: 'Hover on Detail',
            description: 'Prediction task with hover-detail condition (4, 5, or 6)',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        },
        phase4: {
            name: 'Hover on Bug',
            description: 'Prediction task with bug-hover condition (18, 19, or 20)',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        }
    },

    phaseDatasets: {
        phase1: {
            file: 'virexa_talmori_incHist_incPred.json',
            organization: 'Organization A',
            cityA: 'Virexa',
            cityB: 'Talmori',
            colors: {
                cityA: '#2563EB',
                cityB: '#D97706'
            }
        },
        phase2: {
            file: 'qelvane_rostiva_incHist_decPred.json',
            organization: 'Organization B',
            cityA: 'Qelvane',
            cityB: 'Rostiva',
            colors: {
                cityA: '#059669',
                cityB: '#DC2626'
            }
        },
        phase3: {
            file: 'nexari_pulveth_decHist_incPred.json',
            organization: 'Organization C',
            cityA: 'Nexari',
            cityB: 'Pulveth',
            colors: {
                cityA: '#7C3AED',
                cityB: '#0EA5E9'
            }
        },
        phase4: {
            file: 'zorvani_kelthar_decHist_decPred.json',
            organization: 'Organization D',
            cityA: 'Zorvani',
            cityB: 'Kelthar',
            colors: {
                cityA: '#BE123C',
                cityB: '#0F766E'
            }
        }
    },

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

    interactionQuestions: [
        {
            prompt: 'I was in control of my navigation through this interface.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'navigation_control'
        },
        {
            prompt: 'I had some control over the content of this interface that I wanted to see.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'content_control'
        },
        {
            prompt: 'I was in control over the pace of my visit to this interface.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'pace_control'
        },
        {
            prompt: 'I could explore the interface for further questions about the underlying data if I wanted to.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'interface_exploration'
        },
        {
            prompt: 'The interface had the ability to respond to my specific questions quickly and efficiently.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'interface_responsiveness'
        },
        {
            prompt: 'I could communicate in real time with other users who shared my interest in this interface.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'user_communication'
        },
        {
            prompt: 'Interacting with this visualization felt similar to having a personal discussion with an expert about the data.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'personal_conversation'
        },
        {
            prompt: 'The interface was like talking back to me while I clicked through the interface.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'interface_interaction'
        },
        {
            prompt: 'I perceived the interface to be sensitive to my needs for information.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'interface_sensitivity'
        }
    ],

    visualizationTrustQuestions: [
        {
            prompt: 'I was skeptical about the information presented in this visualization.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'skeptical_rating'
        },
        {
            prompt: 'I trusted this data.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'data_trust'
        },
        {
            prompt: 'I found this visualization difficult to use.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'usability_difficulty'
        },
        {
            prompt: 'I found this visualization easy to understand.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Neutral', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'comprehension_ease'
        }
    ],

    personalityQuestions: [
        {
            prompt: 'I respect others.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'respect_others'
        },
        {
            prompt: 'I have a good word for everyone.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'good_word_everyone'
        },
        {
            prompt: 'I retreat from others.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'retreat_from_others'
        },
        {
            prompt: 'I avoid contacts with others.',
            labels: ['Strongly Disagree', 'Disagree', 'Slightly Disagree', 'Slightly Agree', 'Agree', 'Strongly Agree'],
            type: 'avoid_contacts'
        }
    ],

    dataStructure: {
        format: 'synthetic_city_data',
        scenarioCount: 1,
        fields: {
            date: 'Date string (YYYY-MM-DD)',
            city: 'City identifier (A or B)',
            price: 'Humidity value',
            series: 'Data type (historical or prediction)',
            scenario: 'Scenario number (null for historical, 1-10 for predictions)'
        }
    },

    visualization: {
        width: 600,
        height: 400,
        margin: { top: 20, right: 20, bottom: 40, left: 50 },
        colors: {
            cityA: '#0891B2',
            cityB: '#7C3AED',
            historical: '#6c757d'
        },
        sampleScenarios: 5,
        animation: {
            enabled: true,
            duration: 300
        }
    },

    conditionAssignment: {
        getConditionById(conditionId) {
            return ExperimentConfig.conditions.find((condition) => condition.id === conditionId) || null;
        },

        resolveVersionId(pathname) {
            return getVersionIdFromPathname(pathname, ExperimentConfig.phaseDesign.defaultVersionId);
        },

        buildAssignmentFromVersionId(versionId) {
            const parsedDescriptor = parseVersionDescriptor(versionId);
            if (!parsedDescriptor) {
                throw new Error(`Invalid version descriptor: ${versionId}`);
            }

            const phaseAssignments = {};
            const phaseAssignmentLog = {};

            const phase1Condition = this.getConditionById('condition_1_baseline');
            if (!phase1Condition) {
                throw new Error('Missing baseline condition: condition_1_baseline.');
            }
            phaseAssignments.phase1 = phase1Condition;
            phaseAssignmentLog.phase1 = serializeCondition(phase1Condition);

            for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
                const phaseKey = `phase${slotIndex + 2}`;
                const interactionToken = parsedDescriptor.interactionOrder[slotIndex];
                const displayToken = parsedDescriptor.displayOrder[slotIndex];
                const interactionKey = INTERACTION_TOKEN_TO_KEY[interactionToken];

                const conditionId = ExperimentConfig.phaseDesign.conditionMatrix[interactionKey][displayToken];
                const condition = this.getConditionById(conditionId);
                if (!condition) {
                    throw new Error(`Missing condition for ${interactionToken}/${displayToken} (${conditionId}).`);
                }

                phaseAssignments[phaseKey] = condition;
                phaseAssignmentLog[phaseKey] = {
                    ...serializeCondition(condition),
                    interaction_rank_token: interactionToken,
                    display_rank_token: displayToken
                };
            }

            return {
                versionId: parsedDescriptor.versionId,
                versionDescriptor: {
                    interaction_order: parsedDescriptor.interactionOrder,
                    display_order: parsedDescriptor.displayOrder
                },
                phaseAssignments,
                phaseAssignmentLog,
                phaseExecutionOrder: ExperimentConfig.phaseDesign.phaseOrder.slice()
            };
        },

        assignByVersionPath(pathname) {
            const versionId = this.resolveVersionId(pathname);
            return this.buildAssignmentFromVersionId(versionId);
        },

        // Backward-compatible alias for legacy code paths
        getAssignedCondition(versionId) {
            const assignment = this.buildAssignmentFromVersionId(versionId || ExperimentConfig.phaseDesign.defaultVersionId);
            return assignment.phaseAssignments.phase2;
        }
    },

    debug: {
        enabled: false,
        showConditionInfo: false,
        showInteractionLogs: false,
        logDataProcessing: false
    },

    dataCollection: {
        saveToServer: true,
        serverEndpoint: '../save_data.php',
        fields: {
            participant_id: 'string',
            condition_id: 'string',
            condition_name: 'string',
            display_format: 'string',
            phase_assignment_log: 'object',
            phase_execution_order: 'array',
            phase_completion: 'object',
            version_descriptor: 'object',
            vis_literacy_score: 'number',
            trust_ratings: 'object',
            interaction_logs: 'array',
            timestamp: 'string',
            version: 'string'
        }
    }
};

let ParticipantConfig = {
    id: null,
    assignedCondition: null,
    phaseAssignments: {
        phase1: null,
        phase2: null,
        phase3: null,
        phase4: null
    },
    phaseAssignmentLog: {
        phase1: null,
        phase2: null,
        phase3: null,
        phase4: null
    },
    phaseExecutionOrder: ['phase1', 'phase2', 'phase3', 'phase4'],
    phaseCompletion: {
        phase1: false,
        phase2: false,
        phase3: false,
        phase4: false
    },
    startTime: null,
    phase1Complete: false,
    phase2Complete: false,
    phase3Complete: false,
    phase4Complete: false,
    visualizationLiteracyScore: null,
    versionDescriptor: null,
    version: 'source'
};

function initializeParticipant(participantId) {
    const normalizedParticipantId = participantId || null;
    const path = typeof window !== 'undefined' && window.location ? window.location.pathname : '';
    const assignment = ExperimentConfig.conditionAssignment.assignByVersionPath(path);

    ParticipantConfig.id = normalizedParticipantId;
    ParticipantConfig.assignedCondition = assignment.phaseAssignments.phase2;
    ParticipantConfig.phaseAssignments = assignment.phaseAssignments;
    ParticipantConfig.phaseAssignmentLog = assignment.phaseAssignmentLog;
    ParticipantConfig.phaseExecutionOrder = assignment.phaseExecutionOrder;
    ParticipantConfig.phaseCompletion = {
        phase1: false,
        phase2: false,
        phase3: false,
        phase4: false
    };
    ParticipantConfig.startTime = new Date().toISOString();
    ParticipantConfig.phase1Complete = false;
    ParticipantConfig.phase2Complete = false;
    ParticipantConfig.phase3Complete = false;
    ParticipantConfig.phase4Complete = false;
    ParticipantConfig.visualizationLiteracyScore = null;
    ParticipantConfig.versionDescriptor = assignment.versionDescriptor;
    ParticipantConfig.version = assignment.versionId;

    return ParticipantConfig;
}

if (typeof window !== 'undefined') {
    window.ExperimentConfig = ExperimentConfig;
    window.ParticipantConfig = ParticipantConfig;
    window.initializeParticipant = initializeParticipant;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExperimentConfig, ParticipantConfig, initializeParticipant };
}
