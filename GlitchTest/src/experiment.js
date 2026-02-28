let jsPsych;
let timeline = [];

function waitForConfig() {
    return new Promise((resolve, reject) => {
        const checkConfig = () => {
            if (window.ExperimentConfig && window.ParticipantConfig && window.initializeParticipant) {
                resolve();
            } else {
                setTimeout(checkConfig, 50);
            }
        };
        checkConfig();

        setTimeout(() => {
            reject(new Error('Timeout waiting for config to load.'));
        }, 5000);
    });
}

async function initializeExperiment() {
    try {
        await waitForConfig();

        const predictionModule = await import('./plugins/jspsych-prediction-task.js');

        window.jsPsychPredictionTask = predictionModule.default || predictionModule.jsPsychPredictionTask;

        if (typeof initJsPsych === 'undefined') {
            throw new Error('jsPsych library not loaded.');
        }

        jsPsych = initJsPsych({
            display_element: 'jspsych-target',
            on_finish: function() {
                const data = jsPsych.data.get();
                saveData(data);
            }
        });

        buildTimeline();
        jsPsych.run(timeline);
    } catch (error) {
        document.getElementById('jspsych-target').innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2 style="color: #dc2626;">Error Loading Study</h2>
                <p><strong>Error:</strong> ${error.message}</p>
            </div>
        `;
    }
}

function buildTimeline() {
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="welcome-screen">
                <h1>Humidity Prediction Visualization</h1>
                <p>In this experiment, you will read and interact with a visualization.</p>
                <p>You will complete one visualization task and then answer a short report about your experience using the system.</p>
            </div>
        `,
        choices: ['Start']
    });

    timeline.push({
        type: jsPsychSurveyText,
        questions: [
            {
                prompt: 'Please enter your participant ID:',
                name: 'participant_id',
                required: true,
                placeholder: 'Enter your ID'
            }
        ],
        button_label: 'Continue',
        on_finish: function(data) {
            const participantId = data.response.participant_id;
            jsPsych.data.addProperties({ participant_id: participantId });
            window.initializeParticipant(participantId);
        },
        data: { trial_type: 'participant_id_collection' }
    });

    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="section-intro">
                <h2>Interaction Collection Notice</h2>
                <p>On the next page, scrolling and zooming will be disabled for interaction collection.</p>
                <p>Your interactions with the system will be logged, and actively interacting with the visualization is encouraged.</p>
                <p>If no or very low interaction is detected, the study may be returned by the system.</p>
                <p>If you encounter any problem, please contact the researchers on Prolific.</p>
            </div>
        `,
        choices: ['Continue'],
        data: { trial_type: 'interaction_collection_notice' }
    });

    timeline.push({
        type: window.jsPsychPredictionTask,
        phase: 2,
        round: 1,
        show_visualization: true,
        show_predictions: true,
        visualization_condition: function() {
            return window.ParticipantConfig.assignedCondition;
        },
        air_quality_data: async function() {
            return await getAirQualityData();
        },
        question: window.ExperimentConfig.predictionTask.question,
        confidence_scale: window.ExperimentConfig.predictionTask.confidenceScale,
        travel_question: window.ExperimentConfig.predictionTask.travelQuestion,
        travel_choices: window.ExperimentConfig.predictionTask.travelChoices,
        data: function() {
            return {
                trial_type: 'phase2_prediction',
                phase: 2,
                round: 1,
                visualization_shown: true,
                predictions_shown: true,
                condition_id: window.ParticipantConfig.assignedCondition ? window.ParticipantConfig.assignedCondition.id : null,
                condition_name: window.ParticipantConfig.assignedCondition ? window.ParticipantConfig.assignedCondition.name : null,
                display_format: window.ParticipantConfig.assignedCondition ? window.ParticipantConfig.assignedCondition.displayFormat : null
            };
        },
        on_finish: function() {
            window.ParticipantConfig.phase2Complete = true;
        }
    });

    timeline.push({
        type: jsPsychSurveyMultiChoice,
        preamble: `
            <h3>User Experience Report</h3>
            <p>Please answer a few questions about your experience using the system.</p>
        `,
        questions: [
            {
                prompt: '1. How do you like the system?',
                name: 'system_rating',
                options: ['Dislike a lot', 'Dislike', 'Neutral', 'Like', 'Like a lot'],
                required: true
            },
            {
                prompt: '2. Do you think there is any bug in the system?',
                name: 'encounter_bug',
                options: ['Yes', 'No'],
                required: true
            },
            {
                prompt: '3. If there is a bug, what is the bug?',
                name: 'bug_type',
                options: ['Glitchy Display', 'Inconsistant Data', 'Bad Interaction Design', 'N/A'],
                required: true
            }
        ],
        button_label: 'Continue',
        data: function() {
            return getInteractionFeedbackData('interaction_feedback', 'single_page');
        },
        on_finish: function(data) {
            data.system_rating = data.response.system_rating || '';
            data.encounter_bug = data.response.encounter_bug || '';
            data.bug_type = data.response.bug_type || '';
        }
    });

    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="debrief">
                <h2>Thank You</h2>
                <p>You have completed this visualization session.</p>
            </div>
        `,
        choices: ['Finish'],
        data: { trial_type: 'debrief' },
        on_finish: function() {
            fetch('complete_study.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    study_complete: true,
                    phase2_complete: window.ParticipantConfig.phase2Complete,
                    end_time: new Date().toISOString()
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success && data.redirect_url) {
                        window.location.href = data.redirect_url;
                    }
                })
                .catch(() => {
                    // Ignore redirect failures in sanity checks.
                });
        }
    });
}

function getInteractionFeedbackData(trialType, feedbackPage) {
    return {
        trial_type: trialType,
        feedback_page: feedbackPage,
        phase: 2,
        round: 1,
        condition_id: window.ParticipantConfig.assignedCondition ? window.ParticipantConfig.assignedCondition.id : null,
        condition_name: window.ParticipantConfig.assignedCondition ? window.ParticipantConfig.assignedCondition.name : null,
        display_format: window.ParticipantConfig.assignedCondition ? window.ParticipantConfig.assignedCondition.displayFormat : null
    };
}

async function getAirQualityData() {
    try {
        let response;
        const possiblePaths = [
            'synthetic_stock_data_norm.json',
            '../synthetic_stock_data_norm.json',
            '../../synthetic_stock_data_norm.json'
        ];

        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) {
                    break;
                }
            } catch (_e) {
                continue;
            }
        }

        if (!response || !response.ok) {
            throw new Error(`Failed to load data from expected paths: ${possiblePaths.join(', ')}`);
        }

        const cityData = await response.json();
        if (cityData && typeof cityData === 'object' && cityData.data && Array.isArray(cityData.data)) {
            return cityData.data;
        }
        if (Array.isArray(cityData)) {
            return cityData;
        }

        throw new Error('Data is not in expected array format.');
    } catch (error) {
        throw new Error(`Failed to load required data file: ${error.message}`);
    }
}

function saveData(data) {
    const allData = data.values();

    const summary = {
        participant_id: window.ParticipantConfig.id,
        condition: window.ParticipantConfig.assignedCondition,
        start_time: window.ParticipantConfig.startTime,
        end_time: new Date().toISOString(),
        phase2_complete: window.ParticipantConfig.phase2Complete
    };

    if (window.ExperimentConfig.dataCollection.saveToServer) {
        const csvData = convertToCSV(allData, summary);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', '').split('.')[0];
        const participantIdClean = window.ParticipantConfig.id || 'unknown';
        const participantIdNumber = participantIdClean.toString().replace(/^P/, '');
        const numericId = participantIdNumber.replace(/[^0-9]/g, '') || Date.now();
        const filename = `user_${numericId}_${timestamp}.csv`;

        fetch(window.ExperimentConfig.dataCollection.serverEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filedata: csvData,
                filename: filename
            })
        }).catch(() => {
            localStorage.setItem(`glitch_test_${window.ParticipantConfig.id}`, JSON.stringify({ data: allData, summary }));
        });
    } else {
        localStorage.setItem(`glitch_test_${window.ParticipantConfig.id}`, JSON.stringify({ data: allData, summary }));
    }
}

function convertToCSV(dataArray, summary) {
    if (!dataArray || dataArray.length === 0) {
        return 'participant_id,error\n' + summary.participant_id + ',no_data_collected\n';
    }

    const allKeys = new Set();
    dataArray.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
    });
    Object.keys(summary).forEach(key => allKeys.add(key));

    const headers = Array.from(allKeys).sort();
    let csv = headers.join(',') + '\n';

    dataArray.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) {
                return '';
            } else if (typeof value === 'object') {
                return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
            } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });

    const summaryValues = headers.map(header => {
        let value = summary[header];
        if (value === null || value === undefined) {
            return '';
        } else if (typeof value === 'object') {
            return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
        } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    });
    csv += summaryValues.join(',') + '\n';

    return csv;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeExperiment();
});
