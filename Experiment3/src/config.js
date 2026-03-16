// Humidity Prediction Visualization Trust Study Configuration
// Experiment 3: Baseline + four interaction types within participants, fixed visualization technique by version

const TECHNIQUE_TOKEN_TO_KEY = Object.freeze({
    EP: 'ensemble_plot',
    CI: 'confidence_interval',
    CIEP: 'combined_plot'
});

const TECHNIQUE_TOKENS = Object.freeze(Object.keys(TECHNIQUE_TOKEN_TO_KEY));
const INTERACTION_SEQUENCE_KEYS = Object.freeze([
    'hover_show_one',
    'hover_show_all',
    'click_show_one',
    'click_show_all'
]);

function parseVersionDescriptor(versionId) {
    if (!versionId) return null;
    const normalized = String(versionId).trim().toUpperCase();
    const match = normalized.match(/^VERSION_(EP|CI|CIEP)$/);
    if (!match) return null;

    const techniqueToken = match[1];
    return {
        versionId: `version_${techniqueToken}`,
        techniqueToken
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

function cloneDatasetConfig(datasetConfig) {
    if (!datasetConfig || typeof datasetConfig !== 'object') return null;
    return {
        file: datasetConfig.file || null,
        organization: datasetConfig.organization || null,
        cityA: datasetConfig.cityA || 'City A',
        cityB: datasetConfig.cityB || 'City B',
        colors: {
            cityA: datasetConfig.colors?.cityA || '#0891B2',
            cityB: datasetConfig.colors?.cityB || '#7C3AED'
        }
    };
}

function serializeDatasetAssignment(datasetAssignment) {
    if (!datasetAssignment || !datasetAssignment.dataset) return null;
    const datasetConfig = cloneDatasetConfig(datasetAssignment.dataset);
    return {
        source_phase_key: datasetAssignment.sourcePhaseKey || null,
        source_phase_index: datasetAssignment.sourcePhaseIndex || null,
        file: datasetConfig.file,
        organization: datasetConfig.organization,
        cityA: datasetConfig.cityA,
        cityB: datasetConfig.cityB,
        colors: datasetConfig.colors
    };
}

function hashString(input) {
    const source = String(input || '');
    let hash = 2166136261;
    for (let i = 0; i < source.length; i += 1) {
        hash ^= source.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function deterministicShuffle(items, seedText) {
    const shuffled = items.slice();
    const rng = mulberry32(hashString(seedText));
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    return shuffled;
}

const ExperimentConfig = {
    studyType: 'experiment3_within_subjects_interactions',

    // Available visualization conditions
    conditions: [
        {
            id: 'condition_1_baseline',
            name: 'Baseline',
            displayFormat: 'aggregation_only',
            technique: 'baseline',
            description: 'Shows only aggregated prediction lines without uncertainty details.',
            instructions: ''
        },
        {
            id: 'condition_21_hover_show_one_ep',
            name: 'Hover Show One (Ensemble)',
            displayFormat: 'hover_show_one',
            technique: 'ensemble_plot',
            description: 'Hover on one city line to reveal only that city\'s alternative lines.',
            instructions: 'Thin lines show alternative forecasts for the hovered city.<br><br>Hint: Hover on a city\'s dashed prediction line to reveal details.'
        },
        {
            id: 'condition_22_hover_show_all_ep',
            name: 'Hover Show All (Ensemble)',
            displayFormat: 'hover_show_all',
            technique: 'ensemble_plot',
            description: 'Hover on either city line to reveal alternative lines for both cities.',
            instructions: 'Thin lines show alternative forecasts for both cities.<br><br>Hint: Hover on either dashed prediction line to reveal details for both cities.'
        },
        {
            id: 'condition_23_click_show_one_ep',
            name: 'Click Show One (Ensemble)',
            displayFormat: 'click_show_one',
            technique: 'ensemble_plot',
            description: 'Use two city checkboxes to toggle alternative lines by city.',
            instructions: 'Thin lines show alternative forecasts.<br><br>Hint: Use the two city checkboxes below the chart to show or hide details.'
        },
        {
            id: 'condition_24_click_show_all_ep',
            name: 'Click Show All (Ensemble)',
            displayFormat: 'click_show_all',
            technique: 'ensemble_plot',
            description: 'Use one Show All checkbox to toggle all alternative lines together.',
            instructions: 'Thin lines show alternative forecasts.<br><br>Hint: Use the Show all checkbox below the chart to toggle details for both cities.'
        },
        {
            id: 'condition_21_hover_show_one_ci',
            name: 'Hover Show One (CI)',
            displayFormat: 'hover_show_one',
            technique: 'confidence_interval',
            description: 'Hover on one city line to reveal only that city\'s confidence interval.',
            instructions: 'Shaded area shows the 95% confidence interval for the hovered city.<br><br>Hint: Hover on a city\'s dashed prediction line to reveal details.'
        },
        {
            id: 'condition_22_hover_show_all_ci',
            name: 'Hover Show All (CI)',
            displayFormat: 'hover_show_all',
            technique: 'confidence_interval',
            description: 'Hover on either city line to reveal confidence intervals for both cities.',
            instructions: 'Shaded area shows the 95% confidence interval.<br><br>Hint: Hover on either dashed prediction line to reveal details for both cities.'
        },
        {
            id: 'condition_23_click_show_one_ci',
            name: 'Click Show One (CI)',
            displayFormat: 'click_show_one',
            technique: 'confidence_interval',
            description: 'Use two city checkboxes to toggle confidence intervals by city.',
            instructions: 'Shaded area shows the 95% confidence interval.<br><br>Hint: Use the two city checkboxes below the chart to show or hide details.'
        },
        {
            id: 'condition_24_click_show_all_ci',
            name: 'Click Show All (CI)',
            displayFormat: 'click_show_all',
            technique: 'confidence_interval',
            description: 'Use one Show All checkbox to toggle all confidence intervals together.',
            instructions: 'Shaded area shows the 95% confidence interval.<br><br>Hint: Use the Show all checkbox below the chart to toggle details for both cities.'
        },
        {
            id: 'condition_21_hover_show_one_ciep',
            name: 'Hover Show One (Combined)',
            displayFormat: 'hover_show_one',
            technique: 'combined_plot',
            description: 'Hover on one city line to reveal that city\'s confidence interval and alternative lines.',
            instructions: 'Shaded area plus thin lines show uncertainty for the hovered city.<br><br>Hint: Hover on a city\'s dashed prediction line to reveal details.'
        },
        {
            id: 'condition_22_hover_show_all_ciep',
            name: 'Hover Show All (Combined)',
            displayFormat: 'hover_show_all',
            technique: 'combined_plot',
            description: 'Hover on either city line to reveal confidence intervals and alternative lines for both cities.',
            instructions: 'Shaded areas plus thin lines show uncertainty for both cities.<br><br>Hint: Hover on either dashed prediction line to reveal details for both cities.'
        },
        {
            id: 'condition_23_click_show_one_ciep',
            name: 'Click Show One (Combined)',
            displayFormat: 'click_show_one',
            technique: 'combined_plot',
            description: 'Use two city checkboxes to toggle confidence intervals and alternative lines by city.',
            instructions: 'Shaded areas plus thin lines show uncertainty.<br><br>Hint: Use the two city checkboxes below the chart to show or hide details.'
        },
        {
            id: 'condition_24_click_show_all_ciep',
            name: 'Click Show All (Combined)',
            displayFormat: 'click_show_all',
            technique: 'combined_plot',
            description: 'Use one Show All checkbox to toggle confidence intervals and alternative lines together.',
            instructions: 'Shaded areas plus thin lines show uncertainty.<br><br>Hint: Use the Show all checkbox below the chart to toggle details for both cities.'
        },
        {
            id: 'condition_3_ensemble_reference',
            name: 'Static Ensemble (Reference)',
            displayFormat: 'alternative_lines',
            technique: 'ensemble_plot',
            description: 'Static ensemble plot retained for backward compatibility.',
            instructions: 'Each thin line represents one alternative forecast.'
        },
        {
            id: 'condition_2_ci_reference',
            name: 'Static CI (Reference)',
            displayFormat: 'confidence_bounds',
            technique: 'confidence_interval',
            description: 'Static confidence-interval plot retained for backward compatibility.',
            instructions: 'Shaded area shows the 95% confidence interval.'
        },
        {
            id: 'condition_9_combined_reference',
            name: 'Static Combined (Reference)',
            displayFormat: 'combined_pi_ensemble',
            technique: 'combined_plot',
            description: 'Static combined plot retained for backward compatibility.',
            instructions: 'Shaded area and thin lines both encode forecast uncertainty.'
        }
    ],

    phaseDesign: {
        defaultVersionId: 'version_EP',
        phaseOrder: ['phase1', 'phase2', 'phase3', 'phase4', 'phase5'],
        interactionKeys: INTERACTION_SEQUENCE_KEYS.slice(),
        conditionMatrix: {
            ensemble_plot: {
                hover_show_one: 'condition_21_hover_show_one_ep',
                hover_show_all: 'condition_22_hover_show_all_ep',
                click_show_one: 'condition_23_click_show_one_ep',
                click_show_all: 'condition_24_click_show_all_ep'
            },
            confidence_interval: {
                hover_show_one: 'condition_21_hover_show_one_ci',
                hover_show_all: 'condition_22_hover_show_all_ci',
                click_show_one: 'condition_23_click_show_one_ci',
                click_show_all: 'condition_24_click_show_all_ci'
            },
            combined_plot: {
                hover_show_one: 'condition_21_hover_show_one_ciep',
                hover_show_all: 'condition_22_hover_show_all_ciep',
                click_show_one: 'condition_23_click_show_one_ciep',
                click_show_all: 'condition_24_click_show_all_ciep'
            }
        }
    },

    phases: {
        phase1: {
            name: 'Baseline',
            description: 'Baseline condition (Condition 1) with no uncertainty visualization or interaction.',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        },
        phase2: {
            name: 'Interaction Round 1',
            description: 'First randomized interaction style for the assigned visualization technique.',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        },
        phase3: {
            name: 'Interaction Round 2',
            description: 'Second randomized interaction style for the assigned visualization technique.',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        },
        phase4: {
            name: 'Interaction Round 3',
            description: 'Third randomized interaction style for the assigned visualization technique.',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        },
        phase5: {
            name: 'Interaction Round 4',
            description: 'Fourth randomized interaction style for the assigned visualization technique.',
            measurements: ['probability_estimate', 'confidence_rating', 'travel_choice', 'interaction_feedback', 'trust_ratings', 'interaction_ratings']
        }
    },

    phaseDatasets: {
        phase1: {
            file: 'ranax_leer_city_baseline.json',
            organization: 'Organization A',
            cityA: 'Ranax',
            cityB: 'Leer City',
            colors: {
                cityA: '#1D4ED8',
                cityB: '#C2410C'
            }
        },
        phase2: {
            file: 'virexa_talmori_incHist_incPred.json',
            organization: 'Organization B',
            cityA: 'Virexa',
            cityB: 'Talmori',
            colors: {
                cityA: '#2563EB',
                cityB: '#D97706'
            }
        },
        phase3: {
            file: 'qelvane_rostiva_incHist_decPred.json',
            organization: 'Organization C',
            cityA: 'Qelvane',
            cityB: 'Rostiva',
            colors: {
                cityA: '#059669',
                cityB: '#DC2626'
            }
        },
        phase4: {
            file: 'nexari_pulveth_decHist_incPred.json',
            organization: 'Organization D',
            cityA: 'Nexari',
            cityB: 'Pulveth',
            colors: {
                cityA: '#7C3AED',
                cityB: '#0EA5E9'
            }
        },
        phase5: {
            file: 'zorvani_kelthar_decHist_decPred.json',
            organization: 'Organization E',
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

        buildAssignmentFromVersionId(versionId, participantId = null) {
            const parsedDescriptor = parseVersionDescriptor(versionId);
            if (!parsedDescriptor) {
                throw new Error(`Invalid version descriptor: ${versionId}`);
            }

            const techniqueKey = TECHNIQUE_TOKEN_TO_KEY[parsedDescriptor.techniqueToken];
            const phaseAssignments = {};
            const phaseAssignmentLog = {};
            const phaseDatasetAssignments = {};
            const phaseDatasetAssignmentLog = {};

            const baselineCondition = this.getConditionById('condition_1_baseline');
            if (!baselineCondition) {
                throw new Error('Missing baseline condition: condition_1_baseline.');
            }

            const interactionConditionsByKey = {};
            for (let i = 0; i < ExperimentConfig.phaseDesign.interactionKeys.length; i += 1) {
                const interactionKey = ExperimentConfig.phaseDesign.interactionKeys[i];
                const conditionId = ExperimentConfig.phaseDesign.conditionMatrix[techniqueKey][interactionKey];
                const condition = this.getConditionById(conditionId);
                if (!condition) {
                    throw new Error(`Missing condition for ${techniqueKey}/${interactionKey} (${conditionId}).`);
                }
                interactionConditionsByKey[interactionKey] = condition;
            }

            // Step 1: random assignment of all 5 condition identities to the 5 dataset bundles.
            const datasetAssignmentOrder = [
                { condition: baselineCondition, interactionKey: 'baseline' },
                ...ExperimentConfig.phaseDesign.interactionKeys.map((interactionKey) => ({
                    condition: interactionConditionsByKey[interactionKey],
                    interactionKey
                }))
            ];

            const datasetPool = ExperimentConfig.phaseDesign.phaseOrder.map((phaseKey, index) => {
                const dataset = cloneDatasetConfig(ExperimentConfig.phaseDatasets[phaseKey]);
                if (!dataset || !dataset.file) {
                    throw new Error(`Missing dataset configuration for ${phaseKey}.`);
                }
                return {
                    sourcePhaseKey: phaseKey,
                    sourcePhaseIndex: index + 1,
                    dataset
                };
            });

            if (datasetPool.length !== datasetAssignmentOrder.length) {
                throw new Error(
                    `Dataset pool size (${datasetPool.length}) must match assigned conditions (${datasetAssignmentOrder.length}).`
                );
            }

            const shuffledDatasetPool = deterministicShuffle(
                datasetPool,
                `${participantId || 'anon'}|${parsedDescriptor.versionId}|experiment3|dataset-assignment`
            );

            const datasetByConditionId = {};
            datasetAssignmentOrder.forEach((entry, index) => {
                datasetByConditionId[entry.condition.id] = shuffledDatasetPool[index];
            });

            // Step 2: keep baseline first and shuffle only the 4 interaction conditions.
            const interactionOrder = deterministicShuffle(
                ExperimentConfig.phaseDesign.interactionKeys,
                `${participantId || 'anon'}|${parsedDescriptor.versionId}|experiment3|interaction-order`
            );

            const baselineDatasetAssignment = datasetByConditionId[baselineCondition.id];
            if (!baselineDatasetAssignment) {
                throw new Error(`Missing dataset assignment for baseline condition (${baselineCondition.id}).`);
            }
            phaseAssignments.phase1 = baselineCondition;
            phaseDatasetAssignments.phase1 = cloneDatasetConfig(baselineDatasetAssignment.dataset);
            phaseDatasetAssignmentLog.phase1 = serializeDatasetAssignment(baselineDatasetAssignment);
            phaseAssignmentLog.phase1 = {
                ...serializeCondition(baselineCondition),
                interaction_type: 'baseline',
                interaction_order_index: 0,
                technique_token: parsedDescriptor.techniqueToken,
                dataset_source_phase_key: baselineDatasetAssignment.sourcePhaseKey,
                dataset_file: baselineDatasetAssignment.dataset.file
            };

            for (let slotIndex = 0; slotIndex < 4; slotIndex += 1) {
                const phaseKey = `phase${slotIndex + 2}`;
                const interactionKey = interactionOrder[slotIndex];
                const condition = interactionConditionsByKey[interactionKey];
                const datasetAssignment = datasetByConditionId[condition.id];
                if (!datasetAssignment) {
                    throw new Error(`Missing dataset assignment for condition ${condition.id}.`);
                }

                phaseAssignments[phaseKey] = condition;
                phaseDatasetAssignments[phaseKey] = cloneDatasetConfig(datasetAssignment.dataset);
                phaseDatasetAssignmentLog[phaseKey] = serializeDatasetAssignment(datasetAssignment);
                phaseAssignmentLog[phaseKey] = {
                    ...serializeCondition(condition),
                    interaction_type: interactionKey,
                    interaction_order_index: slotIndex + 1,
                    technique_token: parsedDescriptor.techniqueToken,
                    dataset_source_phase_key: datasetAssignment.sourcePhaseKey,
                    dataset_file: datasetAssignment.dataset.file
                };
            }

            return {
                versionId: parsedDescriptor.versionId,
                versionDescriptor: {
                    technique_token: parsedDescriptor.techniqueToken,
                    technique_key: techniqueKey,
                    interaction_order: interactionOrder,
                    dataset_assignment: datasetAssignmentOrder.map((entry) => {
                        const assignment = datasetByConditionId[entry.condition.id];
                        return {
                            condition_id: entry.condition.id,
                            interaction_type: entry.interactionKey,
                            dataset_source_phase_key: assignment.sourcePhaseKey,
                            dataset_file: assignment.dataset.file
                        };
                    })
                },
                phaseAssignments,
                phaseAssignmentLog,
                phaseDatasetAssignments,
                phaseDatasetAssignmentLog,
                phaseExecutionOrder: ExperimentConfig.phaseDesign.phaseOrder.slice()
            };
        },

        assignByVersionPath(pathname, participantId = null) {
            const versionId = this.resolveVersionId(pathname);
            return this.buildAssignmentFromVersionId(versionId, participantId);
        },

        // Backward-compatible alias for legacy code paths
        getAssignedCondition(versionId, participantId = null) {
            const assignment = this.buildAssignmentFromVersionId(
                versionId || ExperimentConfig.phaseDesign.defaultVersionId,
                participantId
            );
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
            phase_dataset_assignment_log: 'object',
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
        phase4: null,
        phase5: null
    },
    phaseAssignmentLog: {
        phase1: null,
        phase2: null,
        phase3: null,
        phase4: null,
        phase5: null
    },
    phaseDatasetAssignments: {
        phase1: null,
        phase2: null,
        phase3: null,
        phase4: null,
        phase5: null
    },
    phaseDatasetAssignmentLog: {
        phase1: null,
        phase2: null,
        phase3: null,
        phase4: null,
        phase5: null
    },
    phaseExecutionOrder: ['phase1', 'phase2', 'phase3', 'phase4', 'phase5'],
    phaseCompletion: {
        phase1: false,
        phase2: false,
        phase3: false,
        phase4: false,
        phase5: false
    },
    startTime: null,
    phase1Complete: false,
    phase2Complete: false,
    phase3Complete: false,
    phase4Complete: false,
    phase5Complete: false,
    visualizationLiteracyScore: null,
    versionDescriptor: null,
    version: 'version_EP'
};

function initializeParticipant(participantId) {
    const normalizedParticipantId = participantId || null;
    const path = typeof window !== 'undefined' && window.location ? window.location.pathname : '';
    const assignment = ExperimentConfig.conditionAssignment.assignByVersionPath(path, normalizedParticipantId);

    ParticipantConfig.id = normalizedParticipantId;
    ParticipantConfig.assignedCondition = assignment.phaseAssignments.phase2;
    ParticipantConfig.phaseAssignments = assignment.phaseAssignments;
    ParticipantConfig.phaseAssignmentLog = assignment.phaseAssignmentLog;
    ParticipantConfig.phaseDatasetAssignments = assignment.phaseDatasetAssignments;
    ParticipantConfig.phaseDatasetAssignmentLog = assignment.phaseDatasetAssignmentLog;
    ParticipantConfig.phaseExecutionOrder = assignment.phaseExecutionOrder;
    ParticipantConfig.phaseCompletion = {
        phase1: false,
        phase2: false,
        phase3: false,
        phase4: false,
        phase5: false
    };
    ParticipantConfig.startTime = new Date().toISOString();
    ParticipantConfig.phase1Complete = false;
    ParticipantConfig.phase2Complete = false;
    ParticipantConfig.phase3Complete = false;
    ParticipantConfig.phase4Complete = false;
    ParticipantConfig.phase5Complete = false;
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
