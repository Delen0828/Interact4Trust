// Air Quality Prediction Visualization Trust Study
// Two-Phase Study Design: No Visualization → With Visualization

let jsPsych;
let timeline = [];

// Initialize experiment
function initializeExperiment() {
    // Initialize jsPsych
    jsPsych = initJsPsych({
        display_element: 'jspsych-target',
        show_progress_bar: true,
        auto_update_progress_bar: false,
        message_progress_bar: 'Study Progress',
        on_finish: function() {
            const data = jsPsych.data.get();
            saveData(data);
        }
    });

    // Initialize participant configuration
    initializeParticipant();

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
                <h1>Air Quality Prediction Study</h1>
                <p>Welcome! You are about to participate in a research study about how people make decisions using air quality predictions.</p>
                <p>This study examines how different ways of presenting prediction information affect trust and decision-making.</p>
                <p>The study will take approximately 20-25 minutes.</p>
                <div class="study-info">
                    <h3>What you'll do:</h3>
                    <ul>
                        <li>Complete a brief assessment of visualization understanding</li>
                        <li>Make predictions about air quality in two cities</li>
                        <li>Answer questions about your confidence and trust</li>
                    </ul>
                </div>
            </div>
        `,
        choices: ['Begin Study'],
        data: { trial_type: 'welcome' }
    });

    // Consent form
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="consent-form">
                <h2>Informed Consent</h2>
                <p>This research studies how visualization design affects decision-making and trust.</p>
                <div class="consent-details">
                    <h3>Study Details:</h3>
                    <ul>
                        <li><strong>Purpose:</strong> Understand how different visualization formats affect trust in prediction systems</li>
                        <li><strong>Time:</strong> Approximately 20-25 minutes</li>
                        <li><strong>Procedures:</strong> Answer questions, view charts, make predictions</li>
                        <li><strong>Risks:</strong> No foreseeable risks beyond normal computer use</li>
                    </ul>
                    
                    <h3>Your Rights:</h3>
                    <ul>
                        <li>Participation is completely voluntary</li>
                        <li>You may withdraw at any time without penalty</li>
                        <li>Your data will be anonymized and kept confidential</li>
                        <li>No personally identifying information will be collected</li>
                    </ul>
                    
                    <p><strong>Data Use:</strong> Anonymized data may be used for research publications and presentations.</p>
                </div>
                <p>By clicking "I Consent," you indicate that you understand this information and agree to participate.</p>
            </div>
        `,
        choices: ['I Consent', 'I Do Not Consent'],
        data: { trial_type: 'consent' },
        on_finish: function(data) {
            if (data.response === 1) {
                jsPsych.endExperiment('<p>Thank you for your interest. The experiment has ended.</p>');
            }
        }
    });

    // Instructions
    timeline.push({
        type: jsPsychInstructions,
        pages: [
            `<div class="instructions">
                <h2>Study Overview</h2>
                <p>This study consists of two main parts:</p>
                <ol>
                    <li><strong>Visualization Assessment:</strong> Answer questions about charts and graphs</li>
                    <li><strong>Air Quality Predictions:</strong> Make predictions about air quality in two cities</li>
                </ol>
                <p>For the air quality predictions, you will:</p>
                <ul>
                    <li>First make predictions based on text descriptions</li>
                    <li>Then make predictions using visualizations</li>
                    <li>Answer questions about your confidence and trust</li>
                </ul>
            </div>`,
            `<div class="instructions">
                <h2>Air Quality Context</h2>
                <p>You will be making predictions about air quality in two hypothetical cities: <strong>City A</strong> and <strong>City B</strong>.</p>
                <p>Air quality is measured on a scale where:</p>
                <ul>
                    <li><strong>Higher values</strong> = Better air quality (cleaner air)</li>
                    <li><strong>Lower values</strong> = Worse air quality (more pollution)</li>
                </ul>
                <p>Your task will be to predict which city is likely to have better air quality in the future.</p>
            </div>`
        ],
        show_clickable_nav: true,
        data: { trial_type: 'instructions' }
    });

    // // Visualization Literacy Test
    // timeline.push({
    //     type: jsPsychVisLiteracy,
    //     questions: ExperimentConfig.visualizationLiteracy.questions,
    //     data: { 
    //         trial_type: 'visualization_literacy',
    //         condition_id: ParticipantConfig.assignedCondition.id,
    //         condition_name: ParticipantConfig.assignedCondition.name
    //     },
    //     on_finish: function(data) {
    //         ParticipantConfig.visualizationLiteracyScore = data.total_score;
    //         console.log('Visualization literacy score:', data.total_score);
    //     }
    // });

    // Phase 1 Introduction
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="phase-intro">
                <h2>Phase 1: Prediction Without Visualization</h2>
                <p>In this first phase, you will make predictions about air quality based on text descriptions only.</p>
                <p>You will read a brief description of air quality trends and then make your prediction.</p>
                <p>This helps us understand your baseline prediction ability before seeing any charts or graphs.</p>
            </div>
        `,
        choices: ['Continue'],
        data: { trial_type: 'phase1_intro' }
    });

    // Phase 1: Prediction Without Visualization
    timeline.push({
        type: jsPsychPredictionTask,
        phase: 1,
        show_visualization: false,
        description: function() {
            return generateTextDescription();
        },
        question: ExperimentConfig.predictionTask.question,
        confidence_scale: ExperimentConfig.predictionTask.confidenceScale,
        travel_question: ExperimentConfig.predictionTask.travelQuestion,
        travel_choices: ExperimentConfig.predictionTask.travelChoices,
        data: { 
            trial_type: 'phase1_prediction',
            phase: 1,
            visualization_shown: false,
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name
        },
        on_finish: function(data) {
            ParticipantConfig.phase1Complete = true;
            console.log('Phase 1 complete. Probability estimate:', data.probability_estimate);
        }
    });

    // Condition Assignment and Introduction
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const condition = ParticipantConfig.assignedCondition;
            return `
                <div class="phase-intro">
                    <h2>Phase 2: Prediction With Visualization</h2>
                    <p>Now you will make the same type of prediction, but this time you will have access to visualizations showing air quality data and predictions.</p>
                    
                    <div class="condition-info">
                        <h3>Your Visualization Format: ${condition.name}</h3>
                        <p>${condition.instructions}</p>
                        ${ExperimentConfig.debug.showConditionInfo ? 
                            `<p class="debug-info"><em>Debug: ${condition.description} (${condition.displayFormat})</em></p>` : ''}
                    </div>
                    
                    <p>Take your time to explore the visualization and make your best prediction.</p>
                </div>
            `;
        },
        choices: ['Continue to Visualization'],
        data: { 
            trial_type: 'phase2_intro',
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name
        }
    });

    // Phase 2: Prediction With Visualization
    timeline.push({
        type: jsPsychPredictionTask,
        phase: 2,
        show_visualization: true,
        visualization_condition: function() { 
            return ParticipantConfig.assignedCondition; 
        },
        air_quality_data: function() {
            return getAirQualityData();
        },
        question: ExperimentConfig.predictionTask.question,
        confidence_scale: ExperimentConfig.predictionTask.confidenceScale,
        travel_question: ExperimentConfig.predictionTask.travelQuestion,
        travel_choices: ExperimentConfig.predictionTask.travelChoices,
        data: { 
            trial_type: 'phase2_prediction',
            phase: 2,
            visualization_shown: true,
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name,
            display_format: ParticipantConfig.assignedCondition.displayFormat
        },
        on_finish: function(data) {
            ParticipantConfig.phase2Complete = true;
            console.log('Phase 2 complete. Probability estimate:', data.probability_estimate);
        }
    });

    // Trust Survey
    timeline.push({
        type: jsPsychTrustSurvey,
        questions: ExperimentConfig.trustQuestions,
        condition: function() { 
            return ParticipantConfig.assignedCondition; 
        },
        data: { 
            trial_type: 'trust_survey',
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name,
            display_format: ParticipantConfig.assignedCondition.displayFormat
        }
    });

    // Interpretation Questions
    timeline.push({
        type: jsPsychSurveyMultiChoice,
        questions: [
            {
                prompt: "How would you describe the visualization you just used?",
                options: [
                    "Very easy to understand",
                    "Somewhat easy to understand", 
                    "Neither easy nor difficult",
                    "Somewhat difficult to understand",
                    "Very difficult to understand"
                ],
                required: true,
                name: 'visualization_difficulty'
            },
            {
                prompt: "Did the visualization change your prediction compared to the text-only version?",
                options: [
                    "Yes, significantly",
                    "Yes, somewhat",
                    "No, stayed about the same",
                    "I'm not sure"
                ],
                required: true,
                name: 'prediction_change'
            },
            {
                prompt: "Which format helped you make a more confident decision?",
                options: [
                    "Text description only",
                    "Visualization only",
                    "Both were equally helpful",
                    "Neither was particularly helpful"
                ],
                required: true,
                name: 'preferred_format'
            }
        ],
        data: { 
            trial_type: 'interpretation_questions',
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name
        }
    });

    // Final Demographics Survey
    timeline.push({
        type: jsPsychSurveyText,
        questions: [
            {
                prompt: "What is your age?", 
                name: 'age',
                required: false,
                columns: 3
            },
            {
                prompt: "What is your field of study or profession?", 
                name: 'profession',
                required: false,
                columns: 40
            },
            {
                prompt: "How often do you work with data visualizations or charts?",
                name: 'viz_experience', 
                required: false,
                columns: 40
            }
        ],
        data: { 
            trial_type: 'demographics',
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name
        }
    });

    // Study Complete
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            const condition = ParticipantConfig.assignedCondition;
            return `
                <div class="study-complete">
                    <h2>Study Complete!</h2>
                    <p>Thank you for participating in this research study.</p>
                    
                    <div class="study-summary">
                        <h3>What you completed:</h3>
                        <ul>
                            <li>✓ Visualization literacy assessment</li>
                            <li>✓ Phase 1: Text-based predictions</li>
                            <li>✓ Phase 2: Visualization-based predictions (${condition.name})</li>
                            <li>✓ Trust and confidence measurements</li>
                        </ul>
                    </div>
                    
                    <p>Your data helps researchers understand how different visualization designs affect decision-making and trust in prediction systems.</p>
                    
                    <p><strong>Data Download:</strong> Click below to download your anonymized data.</p>
                </div>
            `;
        },
        choices: ['Download Data & Complete Study'],
        data: { 
            trial_type: 'study_complete',
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name,
            phase1_complete: ParticipantConfig.phase1Complete,
            phase2_complete: ParticipantConfig.phase2Complete
        },
        on_finish: function() {
            // Trigger data download
            jsPsych.data.get().localSave('csv', `air_quality_study_${ParticipantConfig.id}.csv`);
        }
    });

    // Debrief
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="debrief">
                <h2>Thank You!</h2>
                <p>This study investigated how different ways of presenting uncertainty in predictions affect trust and decision-making.</p>
                
                <h3>Study Background:</h3>
                <p>You were randomly assigned to one of eight different visualization conditions. The goal is to understand which formats help people make better decisions and maintain appropriate trust in prediction systems.</p>
                
                <p>The air quality data you saw was synthetic (computer-generated) for research purposes.</p>
                
                <h3>Questions?</h3>
                <p>If you have questions about this research, please contact the research team.</p>
                
                <p>Your participation contributes to understanding how to design better prediction visualizations for real-world applications like weather forecasting, financial predictions, and public health data.</p>
            </div>
        `,
        choices: ['Close Study'],
        data: { trial_type: 'debrief' }
    });
}

// Helper Functions

// Generate text description for Phase 1
function generateTextDescription() {
    return `
        <div class="text-description">
            <h3>Air Quality Information</h3>
            <p><strong>City A:</strong> Historical air quality has been gradually improving over the past 5 months, with values ranging from 100-103. Recent trends suggest continued improvement.</p>
            <p><strong>City B:</strong> Air quality has been more variable, fluctuating between 100-102. The trend over the past 5 months shows slight improvement but with more uncertainty.</p>
            <p><strong>Forecasts:</strong> Multiple prediction models suggest City A is more likely to maintain its improving trend, while City B's future air quality remains more uncertain.</p>
        </div>
    `;
}

// Get air quality data (placeholder - will load from synthetic_city_data.json)
function getAirQualityData() {
    // This will be implemented to load data from AirQualityData
    // For now, return placeholder structure
    return {
        historical: {
            cityA: [],
            cityB: []
        },
        predictions: {
            scenarios: [],
            aggregated: {
                cityA: [],
                cityB: []
            },
            bounds: {
                cityA: { min: [], max: [] },
                cityB: { min: [], max: [] }
            }
        }
    };
}

// Save data function
function saveData(data) {
    const allData = data.values();
    
    // Add participant summary
    const summary = {
        participant_id: ParticipantConfig.id,
        condition: ParticipantConfig.assignedCondition,
        start_time: ParticipantConfig.startTime,
        end_time: new Date().toISOString(),
        visualization_literacy_score: ParticipantConfig.visualizationLiteracyScore,
        phase1_complete: ParticipantConfig.phase1Complete,
        phase2_complete: ParticipantConfig.phase2Complete
    };
    
    if (ExperimentConfig.dataCollection.saveToServer) {
        // Send to server
        fetch(ExperimentConfig.dataCollection.serverEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: allData, summary })
        }).then(response => {
            console.log('Data saved to server');
        }).catch(error => {
            console.error('Error saving data:', error);
            // Fallback to local storage
            localStorage.setItem(`air_quality_study_${ParticipantConfig.id}`, JSON.stringify({data: allData, summary}));
        });
    } else {
        // Save to local storage
        localStorage.setItem(`air_quality_study_${ParticipantConfig.id}`, JSON.stringify({data: allData, summary}));
        console.log('Data saved to localStorage');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting Air Quality Prediction Visualization Trust Study');
    initializeExperiment();
});