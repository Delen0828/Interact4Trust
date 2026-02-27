function getRequestedConditionNumber() {
    if (typeof window === 'undefined') {
        return 18;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedValue = params.get('condition') || params.get('version');
    const requestedNumber = Number.parseInt(requestedValue, 10);

    return [18, 19, 20].includes(requestedNumber) ? requestedNumber : 18;
}

const ExperimentConfig = {
    studyType: 'phase2_glitch_conditions_sanity',

    conditions: [
        {
            id: 'condition_18_glitch_hover',
            conditionNumber: 18,
            name: 'Condition 18: Glitch Ensemble + Hover',
            displayFormat: 'glitch_hover_alternatives',
            description: 'Aggregated by default, hover reveals alternative lines with glitchy visibility.',
            instructions: 'Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_19_glitch_pi_hover',
            conditionNumber: 19,
            name: 'Condition 19: Glitch PI Plot + Hover',
            displayFormat: 'glitch_hover_bounds',
            description: 'Hover reveals PI bounds with glitchy visibility.',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region.<br><br>Hint: Hover on the lines for more details'
        },
        {
            id: 'condition_20_glitch_pi_to_ensemble',
            conditionNumber: 20,
            name: 'Condition 20: Glitch PI → Ensemble',
            displayFormat: 'glitch_transform_hover',
            description: 'Hover transforms PI into ensemble lines with glitchy visibility.',
            instructions: 'Shade represents the region that there are 95% chance the Humidity falls in this region. Each line represent the prediction from one Forecast Agency.<br><br>Hint: Hover on the lines for more details'
        }
    ],

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

    conditionAssignment: {
        getAssignedCondition: function() {
            const requestedConditionNumber = getRequestedConditionNumber();
            return ExperimentConfig.conditions.find((condition) => (
                condition.conditionNumber === requestedConditionNumber
            )) || ExperimentConfig.conditions[0];
        }
    },

    dataCollection: {
        saveToServer: true,
        serverEndpoint: 'save_data.php'
    }
};

let ParticipantConfig = {
    id: null,
    assignedCondition: null,
    startTime: null,
    phase2Complete: false
};

function initializeParticipant(participantId) {
    ParticipantConfig.id = participantId || null;
    ParticipantConfig.assignedCondition = ExperimentConfig.conditionAssignment.getAssignedCondition();
    ParticipantConfig.startTime = new Date().toISOString();
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
