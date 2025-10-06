// Main experiment script
let jsPsych;
let timeline = [];
let greenhouseManager;
let dataFetcher;
let predictionGenerator;
let currentConditionIndex = 0;
let trustRatingsHistory = {};

// Initialize experiment
function initializeExperiment() {
    // Initialize jsPsych
    jsPsych = initJsPsych({
        display_element: 'jspsych-target',
        show_progress_bar: false,
        auto_update_progress_bar: false,
        on_finish: function() {
            // Save data when experiment ends
            const data = jsPsych.data.get();
            saveData(data);
        }
    });

    // Initialize utilities
    greenhouseManager = new GreenhouseManager(ExperimentConfig.greenhouse.initialResources);
    dataFetcher = new DataFetcher();
    predictionGenerator = new PredictionGenerator();

    // Build timeline
    buildTimeline();

    // Start experiment
    jsPsych.run(timeline);
}

// Build experiment timeline
function buildTimeline() {
    // Welcome screen
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="welcome-screen">
                <h1>Welcome to the Alien Plant Growth Study</h1>
                <p>You are about to participate in a plant cultivation simulation using growth data from alien plants.</p>
                <p>Your goal is to maximize your greenhouse resources while evaluating growth prediction models.</p>
                <p>You will start with 10,000 ${ExperimentConfig.greenhouse.resourceUnit} of growth resources.</p>
                <p>The experiment will take approximately 30-40 minutes.</p>
            </div>
        `,
        choices: ['Begin Experiment'],
        data: { trial_type: 'welcome' }
    });

    // Consent form
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="consent-form">
                <h2>Informed Consent</h2>
                <p>This is a research study about trust in prediction systems.</p>
                <ul>
                    <li>Your participation is voluntary</li>
                    <li>You may withdraw at any time</li>
                    <li>Your data will be anonymized</li>
                    <li>No real money is involved</li>
                    <li>The "alien plant growth" is simulated data</li>
                </ul>
                <p>By continuing, you consent to participate in this study.</p>
            </div>
        `,
        choices: ['I Consent', 'I Do Not Consent'],
        data: { trial_type: 'consent' },
        on_finish: function(data) {
            if (data.response === 1) {
                jsPsych.endExperiment('Thank you for your interest. The experiment has ended.');
            }
        }
    });

    // Condition selection screen
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="condition-selection">
                <h2>Choose Your Visualization Format</h2>
                <p>Please select which type of prediction visualization you would like to work with:</p>
                
                <div style="display: flex; justify-content: space-around; margin: 40px 0; gap: 40px;">
                    <div style="flex: 1; padding: 20px; border: 2px solid #e5e7eb; border-radius: 10px; background: #f9fafb;">
                        <h3 style="color: #a855f7; margin-bottom: 15px;">Aggregation</h3>
                        <p style="font-size: 16px; line-height: 1.6;">
                            <strong>Single Prediction Line</strong><br>
                            You will see one consolidated prediction line representing the consensus forecast.
                            This provides a clear, simplified view of the expected growth pattern.
                        </p>
                    </div>
                    
                    <div style="flex: 1; padding: 20px; border: 2px solid #e5e7eb; border-radius: 10px; background: #f9fafb;">
                        <h3 style="color: #a855f7; margin-bottom: 15px;">Hover-to-Reveal</h3>
                        <p style="font-size: 16px; line-height: 1.6;">
                            <strong>Interactive Predictions</strong><br>
                            You will see one prediction line by default. 
                            Hover over the chart to reveal alternative prediction models with different confidence levels.
                        </p>
                    </div>
                </div>
                
                <p style="margin-top: 30px; color: #666;">
                    <em>Note: You will complete 15 cultivation trials with your selected format.</em>
                </p>
            </div>
        `,
        choices: ['Select Aggregation', 'Select Hover-to-Reveal'],
        data: { trial_type: 'condition_selection' },
        on_finish: function(data) {
            // Set the selected condition based on button clicked
            const selectedConditionId = data.response === 0 ? 'aggregation' : 'hover_to_reveal';
            const selectedCondition = setParticipantCondition(selectedConditionId);
            
            // Store selection in data
            data.selected_condition_id = selectedConditionId;
            data.selected_condition_name = selectedCondition.name;
            
            console.log('User selected condition:', selectedCondition.name);
        }
    });

    // General instructions
    timeline.push({
        type: jsPsychInstructions,
        pages: [
            `<div class="instructions">
                <h2>How the Study Works</h2>
                <p>You will cultivate alien plants across 15 trials using prediction models.</p>
                <p>In each trial, you will:</p>
                <ol>
                    <li>See historical growth data and predictions</li>
                    <li>Decide to cultivate or prune plants</li>
                    <li>See the actual growth outcome</li>
                    <li>Rate your trust in the prediction model</li>
                </ol>
            </div>`,
            `<div class="instructions">
                <h2>Understanding Predictions</h2>
                <p>Sometimes you will see a <strong>single prediction line</strong>.</p>
                <p>Other times you will see <strong>multiple prediction lines</strong> with different levels of confidence (shown by opacity).</p>
                <p>Use these predictions to make informed cultivation decisions.</p>
            </div>`,
            `<div class="instructions">
                <h2>Cultivation Rules</h2>
                <ul>
                    <li>You can cultivate plants if you have enough resources</li>
                    <li>You can prune plants to recover resources</li>
                    <li>Each action has a small cultivation cost (${ExperimentConfig.greenhouse.cultivationCostRate * 100}%)</li>
                    <li>Maximum ${ExperimentConfig.greenhouse.maxPlantsPerAction} plants per action</li>
                </ul>
                <p>Your goal is to maximize your greenhouse resources!</p>
            </div>`
        ],
        show_clickable_nav: true,
        data: { trial_type: 'instructions' }
    });

    // Add condition-specific content directly to timeline
    addConditionContent();
}

// Function to add condition content to the main timeline
function addConditionContent() {
    // Condition introduction - conditional on having a selected condition
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const condition = ParticipantConfig.assignedCondition;
            if (!condition) {
                return '<div><h2>Error: No condition selected</h2></div>';
            }
            return `
                <div class="condition-intro">
                    <h2>Alien Plant Growth Prediction Study</h2>
                    <h3>Your Selected Format: ${condition.name}</h3>
                    <p><strong>Instructions:</strong> ${condition.instructions}</p>
                    <p>You will complete <strong>15 cultivation trials</strong> with different plants.</p>
                    <p>Each trial will show you historical growth data and predictions to help make cultivation decisions.</p>
                    ${ExperimentConfig.debug.showConditionInfo ? 
                        `<p class="debug-info">Debug: ${condition.description} (${condition.displayFormat})</p>` : ''}
                    ${ExperimentConfig.debug.showStimuliInfo ? 
                        `<p class="stimuli-info">You will experience all 15 sophisticated prediction patterns: agreement, polarization, risk/gain analysis, and ambiguous spreads across different growth trends.</p>` : ''}
                </div>
            `;
        },
        choices: ['Begin Study'],
        data: function() {
            const condition = ParticipantConfig.assignedCondition;
            return {
                trial_type: 'condition_intro',
                condition_id: condition?.id || 'unknown',
                condition_name: condition?.name || 'unknown',
                display_format: condition?.displayFormat || 'unknown',
                total_trials: ExperimentConfig.structure.trialsPerCondition
            };
        },
        on_start: function() {
            // Check if condition was selected
            if (!ParticipantConfig.assignedCondition) {
                jsPsych.endExperiment('Error: No condition was selected. Please refresh and try again.');
            }
        }
    });

    // Reset greenhouse for the study
    timeline.push({
        type: jsPsychCallFunction,
        func: function() {
            const condition = ParticipantConfig.assignedCondition;
            if (condition) {
                greenhouseManager.reset();
                trustRatingsHistory[condition.id] = null;
            }
        }
    });

    // Add 15 trials
    for (let trial = 1; trial <= ExperimentConfig.structure.trialsPerCondition; trial++) {
        // Get plant index for this trial
        const plantIndex = trial;
        
        // Cultivation trial with sophisticated stimuli patterns
        timeline.push({
            type: jsPsychPlantCultivation,
            growth_data: function() {
                return getGrowthDataForRound(plantIndex, trial);
            },
            predictions: function() {
                // Get the stimuli pattern for this trial from the randomized order
                const stimuliPatternId = ParticipantConfig.stimuliOrder[trial - 1];
                const condition = ParticipantConfig.assignedCondition;
                const prediction = getPredictionForRound(plantIndex, condition.id, trial, stimuliPatternId);
                
                if (!prediction) {
                    console.error('Failed to get prediction for trial', trial, 'pattern', stimuliPatternId);
                    // Return fallback prediction
                    return {
                        pattern: 'fallback',
                        trend: 'stable',
                        description: 'Fallback prediction',
                        displayFormat: condition.displayFormat,
                        groundTruth: 102.5,
                        values: condition.displayFormat === 'aggregation' ? [102.5] : [105, 103, 102.5, 102, 100],
                        probabilities: condition.displayFormat === 'aggregation' ? [1.0] : [1.0, 0.8, 0.6, 0.4, 0.2],
                        metadata: { stimuliIndex: trial, totalStimuli: 15 }
                    };
                }
                return prediction;
            },
            condition: function() { return ParticipantConfig.assignedCondition; },
            greenhouse: function() {
                return greenhouseManager.getState();
            },
            trial: trial,
            data: function() {
                const condition = ParticipantConfig.assignedCondition;
                return {
                    trial_type: 'plant_cultivation',
                    condition_id: condition?.id || 'unknown',
                    condition_name: condition?.name || 'unknown',
                    trial: trial,
                    plant_index: plantIndex,
                    display_format: condition?.displayFormat || 'unknown',
                    total_trials: ExperimentConfig.structure.trialsPerCondition
                };
            },
            on_finish: function(data) {
                // Update greenhouse based on action with enhanced error checking
                if (!data.growth_data || !data.growth_data.heights || !data.predictions) {
                    console.error('Missing growth_data or predictions in trial data:', data);
                    return;
                }
                
                const currentHeight = data.growth_data.heights[data.growth_data.heights.length - 1];
                
                if (data.action === 'cultivate') {
                    greenhouseManager.cultivate(data.plants, 100);
                } else if (data.action === 'prune') {
                    greenhouseManager.prune(data.plants, 100);
                }
                
                // Update greenhouse value with ground truth from sophisticated patterns
                const groundTruth = data.predictions.groundTruth || currentHeight * 1.02;
                greenhouseManager.updateValue(groundTruth, trial);
                
                // Log stimuli pattern information
                if (ExperimentConfig.debug.enabled && data.predictions.metadata) {
                    console.log(`Trial ${trial}: Pattern ${data.predictions.metadata.stimuliIndex}/15 -`, 
                               data.predictions.pattern, data.predictions.trend);
                }
            }
        });

        // Trust survey trial with pattern-aware questions
        timeline.push({
            type: jsPsychTrustSurvey,
            questions: ExperimentConfig.trustQuestions,
            previous_ratings: function() {
                const condition = ParticipantConfig.assignedCondition;
                return trustRatingsHistory[condition?.id];
            },
            trial: trial,
            condition: function() {
                const condition = ParticipantConfig.assignedCondition;
                return condition?.id || 'unknown';
            },
            current_pattern: function() {
                // Get current stimuli pattern information for context
                const stimuliPatternId = ParticipantConfig.stimuliOrder[trial - 1];
                const stimuliInfo = getCurrentStimuliInfo(plantIndex, trial, stimuliPatternId);
                return stimuliInfo;
            },
            greenhouse_change: function() {
                // Calculate greenhouse change from this trial
                const currentValue = greenhouseManager.getState().totalValue;
                const previousValue = greenhouseManager.greenhouse.growthHistory[greenhouseManager.greenhouse.growthHistory.length - 2]?.totalValue || greenhouseManager.greenhouse.initialResources;
                return currentValue - previousValue;
            },
            data: function() {
                const condition = ParticipantConfig.assignedCondition;
                return {
                    trial_type: 'trust_survey',
                    condition_id: condition?.id || 'unknown',
                    condition_name: condition?.name || 'unknown',
                    trial: trial,
                    plant_index: plantIndex,
                    display_format: condition?.displayFormat || 'unknown',
                    total_trials: ExperimentConfig.structure.trialsPerCondition
                };
            },
            on_finish: function(data) {
                // Save trust ratings for next trial with pattern information
                if (data.trust_ratings) {
                    const condition = ParticipantConfig.assignedCondition;
                    if (condition) {
                        trustRatingsHistory[condition.id] = data.trust_ratings;
                    }
                }
                
                // Log pattern information with trust ratings
                if (ExperimentConfig.debug.enabled && data.current_pattern) {
                    console.log(`Trust Survey Trial ${trial}: Pattern ${data.current_pattern.index}/15 -`, 
                               data.current_pattern.pattern, data.current_pattern.trend,
                               'Trust ratings:', data.trust_ratings);
                }
            }
        });
    }

    // Study completion summary
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const condition = ParticipantConfig.assignedCondition;
            const stats = greenhouseManager.getStatistics();
            const stimuliSummary = ExperimentConfig.debug.showStimuliInfo ? 
                `<p class="stimuli-summary">You experienced all 15 sophisticated prediction patterns, including agreement, polarization, risk/gain scenarios, and ambiguous spreads across different growth trends.</p>` : '';
            
            return `
                <div class="condition-summary">
                    <h2>Study Complete!</h2>
                    <h3>Format Used: ${condition?.name || 'Unknown'}</h3>
                    <h3>Your Performance Summary</h3>
                    <p><strong>Trials Completed:</strong> ${ExperimentConfig.structure.trialsPerCondition}</p>
                    <p><strong>Final Greenhouse Value:</strong> ${stats.finalValue.toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}</p>
                    <p><strong>Total Growth:</strong> ${stats.totalGrowth.toFixed(2)}%</p>
                    <p><strong>Total Actions:</strong> ${stats.totalActions}</p>
                    ${stimuliSummary}
                    <p>Thank you for participating in this study with the ${condition?.name || 'selected'} visualization format!</p>
                </div>
            `;
        },
        choices: ['Continue to Final Survey'],
        data: function() {
            const condition = ParticipantConfig.assignedCondition;
            return {
                trial_type: 'study_summary',
                condition_id: condition?.id || 'unknown',
                condition_name: condition?.name || 'unknown',
                display_format: condition?.displayFormat || 'unknown',
                trials_completed: ExperimentConfig.structure.trialsPerCondition,
                final_greenhouse_value: greenhouseManager.greenhouse.totalValue,
                patterns_experienced: 15  // Participant experienced all 15 patterns
            };
        }
    });
    
    // Final survey with questions about sophisticated patterns
    timeline.push({
        type: jsPsychSurveyLikert,
        questions: [
            {
                prompt: "Overall, how satisfied were you with the prediction models?",
                labels: ["Very Unsatisfied", "Unsatisfied", "Neutral", "Satisfied", "Very Satisfied"]
            },
            {
                prompt: "Which display format did you prefer?",
                labels: ["Strongly Prefer Single", "Prefer Single", "No Preference", "Prefer Multiple", "Strongly Prefer Multiple"]
            },
            {
                prompt: "How confident are you in your cultivation decisions?",
                labels: ["Not Confident", "Slightly Confident", "Moderately Confident", "Very Confident", "Extremely Confident"]
            },
            {
                prompt: "How helpful were the different prediction patterns (agreement, polarization, risk/gain scenarios)?",
                labels: ["Not Helpful", "Slightly Helpful", "Moderately Helpful", "Very Helpful", "Extremely Helpful"]
            },
            {
                prompt: "Did you notice different types of prediction patterns throughout the study?",
                labels: ["Didn't Notice", "Noticed A Few", "Noticed Some", "Noticed Many", "Noticed All"]
            },
            {
                prompt: function() {
                    return `How would you rate the ${ParticipantConfig.assignedCondition?.name || 'selected'} visualization format?`;
                },
                labels: ["Very Poor", "Poor", "Fair", "Good", "Excellent"]
            }
        ],
        data: { 
            trial_type: 'final_survey',
            condition_id: ParticipantConfig.assignedCondition?.id || 'unknown',
            condition_name: ParticipantConfig.assignedCondition?.name || 'unknown',
            display_format: ParticipantConfig.assignedCondition?.displayFormat || 'unknown',
            total_stimuli_patterns: 15,
            trials_completed: ExperimentConfig.structure.trialsPerCondition
        }
    });

    // Enhanced debrief with stimuli pattern information
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const stats = greenhouseManager.getStatistics();
            const conditionInfo = ParticipantConfig.assignedCondition;
            const stimuliExplanation = `
                <div class="stimuli-explanation">
                    <h3>About the Prediction Patterns</h3>
                    <p>During this study, you experienced 15 different sophisticated prediction patterns:</p>
                    <ul>
                        <li><strong>Agreement:</strong> Models converge on similar predictions</li>
                        <li><strong>Polarization:</strong> Models split into distinct high/low predictions</li>
                        <li><strong>Risk of Loss:</strong> One model shows severe decline risk</li>
                        <li><strong>Chance of Gain:</strong> One model shows exceptional growth opportunity</li>
                        <li><strong>Ambiguous Spread:</strong> Models show varied predictions without clear pattern</li>
                    </ul>
                    <p>Each pattern was combined with different trend directions (increase, decrease, stable) across your 15 trials.</p>
                    <p><strong>Your condition:</strong> ${conditionInfo?.name || 'Unknown'} - ${conditionInfo?.description || 'No description'}</p>
                </div>
            `;
            
            return `
                <div class="debrief">
                    <h2>Thank You for Participating!</h2>
                    <h3>Study Complete - ${conditionInfo?.name || 'Selected'} Format</h3>
                    <p><strong>Trials Completed:</strong> ${ExperimentConfig.structure.trialsPerCondition}</p>
                    <p><strong>Final Greenhouse Value:</strong> ${stats.finalValue.toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}</p>
                    <p><strong>Total Growth:</strong> ${stats.totalGrowth.toFixed(2)}%</p>
                    <p><strong>Total Actions:</strong> ${stats.totalActions}</p>
                    <p><strong>Prediction Patterns Experienced:</strong> All 15 unique pattern types</p>
                    ${ExperimentConfig.debug.showStimuliInfo ? stimuliExplanation : ''}
                    <p>Your data has been recorded for analysis of how the ${conditionInfo?.name || 'selected'} prediction visualization format affects trust and decision-making in plant cultivation scenarios.</p>
                </div>
            `;
        },
        choices: ['Download Data & Exit'],
        data: { 
            trial_type: 'debrief',
            condition_id: ParticipantConfig.assignedCondition?.id || 'unknown',
            condition_name: ParticipantConfig.assignedCondition?.name || 'unknown',
            display_format: ParticipantConfig.assignedCondition?.displayFormat || 'unknown',
            trials_completed: ExperimentConfig.structure.trialsPerCondition,
            patterns_experienced: 15,
            unique_pattern_types: 15
        },
        on_finish: function() {
            // Trigger data download
            jsPsych.data.get().localSave('csv', `experiment_data_${ParticipantConfig.id}.csv`);
        }
    });
}


// Save data function
function saveData(data) {
    // In production, send to server
    if (!ExperimentConfig.debug.enabled && ExperimentConfig.dataCollection.saveToServer) {
        fetch(ExperimentConfig.dataCollection.serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                participant_id: ParticipantConfig.id,
                data: data.values(),
                metadata: ParticipantConfig
            })
        }).then(response => {
            console.log('Data saved to server');
        }).catch(error => {
            console.error('Error saving data:', error);
            // Fallback to local storage
            localStorage.setItem(`experiment_data_${ParticipantConfig.id}`, JSON.stringify(data.values()));
        });
    } else {
        // Save to local storage in debug mode
        localStorage.setItem(`experiment_data_${ParticipantConfig.id}`, JSON.stringify(data.values()));
        console.log('Data saved to localStorage');
    }
}

// Initialize stimuli patterns when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Ensure stimuli patterns are available
    if (typeof AlienPlantData !== 'undefined' && AlienPlantData.patterns) {
        console.log('Loaded 15 sophisticated stimuli patterns:', Object.keys(AlienPlantData.patterns));
        initializeExperiment();
    } else {
        console.error('AlienPlantData not found! Make sure plantGrowthData.js is loaded.');
        // Fallback initialization
        setTimeout(initializeExperiment, 1000);
    }
});