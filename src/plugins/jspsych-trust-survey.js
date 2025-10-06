var jsPsychTrustSurvey = (function (jsPsych) {
    "use strict";


    const info = {
        name: "trust-survey",
        parameters: {
            questions: {
                type: "complex",
                array: true,
                default: undefined,
                description: "Array of question objects with prompt, name, and labels"
            },
            previous_ratings: {
                type: "object",
                default: null,
                description: "Previous trust ratings to use as defaults"
            },
            scale_points: {
                type: "int",
                default: 7,
                description: "Number of points on the Likert scale"
            },
            round: {
                type: "int",
                default: 1,
                description: "Current round number"
            },
            condition: {
                type: "string",
                default: "",
                description: "Current experimental condition"
            },
            greenhouse_change: {
                type: "float",
                default: 0,
                description: "Change in greenhouse resources from last round"
            }
        }
    };

    class TrustSurveyPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            const start_time = performance.now();
            const responses = {};
            const changes = {};

            // Initialize responses with previous ratings or middle value
            trial.questions.forEach(q => {
                if (trial.previous_ratings && trial.previous_ratings[q.name]) {
                    responses[q.name] = trial.previous_ratings[q.name];
                    changes[q.name] = 0;
                } else {
                    responses[q.name] = Math.ceil(trial.scale_points / 2);
                    changes[q.name] = 0;
                }
            });

            // Create HTML
            let html = `
                <div class="trust-survey-container">
                    <div class="survey-header">
                        <h2>Trust Assessment - Round ${trial.round}</h2>
                        ${trial.greenhouse_change !== 0 ? `
                            <div class="greenhouse-change ${trial.greenhouse_change > 0 ? 'positive' : 'negative'}">
                                Last action: ${trial.greenhouse_change > 0 ? '+' : ''}${trial.greenhouse_change.toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="survey-instructions">
                        <p>Please rate your trust in the prediction model based on your recent experience.</p>
                        ${trial.previous_ratings ? '<p class="highlight">Your previous ratings are shown. Adjust them based on this round.</p>' : ''}
                    </div>
                    
                    <div class="questions-container">
            `;

            // Add each question
            trial.questions.forEach((question, qIndex) => {
                const prevRating = trial.previous_ratings ? trial.previous_ratings[question.name] : null;
                
                html += `
                    <div class="question-block" data-question="${question.name}">
                        <div class="question-prompt">${question.prompt}</div>
                        <div class="scale-container">
                            <div class="scale-labels">
                                <span class="scale-label-left">${question.labels[0]}</span>
                                <span class="scale-label-right">${question.labels[1]}</span>
                            </div>
                            <div class="scale-points">
                `;

                // Create scale points
                for (let i = 1; i <= trial.scale_points; i++) {
                    const isSelected = responses[question.name] === i;
                    const wasPrevious = prevRating === i;
                    
                    html += `
                        <div class="scale-point-container">
                            <button class="scale-point ${isSelected ? 'selected' : ''} ${wasPrevious ? 'was-previous' : ''}"
                                    data-question="${question.name}"
                                    data-value="${i}">
                                <span class="point-value">${i}</span>
                                ${wasPrevious ? '<span class="previous-marker">▼</span>' : ''}
                            </button>
                        </div>
                    `;
                }

                html += `
                            </div>
                            ${prevRating ? `
                                <div class="change-indicator" id="change-${question.name}">
                                    <span class="change-value">No change</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                    
                    <div class="survey-footer">
                        <button id="submit-ratings" class="submit-btn">Continue to Next Round</button>
                    </div>
                </div>
            `;

            display_element.innerHTML = html;

            // Add event handlers for scale points
            const scalePoints = display_element.querySelectorAll('.scale-point');
            scalePoints.forEach(point => {
                point.addEventListener('click', (e) => {
                    const questionName = e.currentTarget.dataset.question;
                    const value = parseInt(e.currentTarget.dataset.value);
                    const prevValue = responses[questionName];
                    
                    // Update selection
                    responses[questionName] = value;
                    
                    // Update visual state
                    const questionBlock = display_element.querySelector(`.question-block[data-question="${questionName}"]`);
                    questionBlock.querySelectorAll('.scale-point').forEach(p => {
                        p.classList.remove('selected');
                        if (parseInt(p.dataset.value) === value) {
                            p.classList.add('selected');
                        }
                    });
                    
                    // Update change indicator if there was a previous rating
                    if (trial.previous_ratings && trial.previous_ratings[questionName]) {
                        const change = value - trial.previous_ratings[questionName];
                        changes[questionName] = change;
                        
                        const changeIndicator = display_element.querySelector(`#change-${questionName}`);
                        if (changeIndicator) {
                            const changeValue = changeIndicator.querySelector('.change-value');
                            if (change > 0) {
                                changeValue.textContent = `+${change} from last round`;
                                changeValue.className = 'change-value increase';
                            } else if (change < 0) {
                                changeValue.textContent = `${change} from last round`;
                                changeValue.className = 'change-value decrease';
                            } else {
                                changeValue.textContent = 'No change';
                                changeValue.className = 'change-value';
                            }
                        }
                    }
                    
                    // Animate the selection
                    point.classList.add('pulse');
                    setTimeout(() => point.classList.remove('pulse'), 300);
                });
            });

            // Submit button handler
            const submitBtn = display_element.querySelector('#submit-ratings');
            submitBtn.addEventListener('click', () => {
                // Validate that all questions are answered
                let allAnswered = true;
                trial.questions.forEach(q => {
                    if (!responses[q.name]) {
                        allAnswered = false;
                    }
                });

                if (!allAnswered) {
                    alert('Please answer all questions before continuing.');
                    return;
                }

                // Calculate response time
                const end_time = performance.now();
                const rt = Math.round(end_time - start_time);

                // End trial
                this.endTrial(display_element, responses, changes, rt, trial);
            });

            // Add keyboard support for scale selection
            document.addEventListener('keydown', (e) => {
                if (e.key >= '1' && e.key <= String(trial.scale_points)) {
                    const value = parseInt(e.key);
                    // Find the currently focused question (simplified - would need proper focus management)
                    const focusedQuestion = trial.questions[0].name; // Default to first question
                    const point = display_element.querySelector(`.scale-point[data-question="${focusedQuestion}"][data-value="${value}"]`);
                    if (point) {
                        point.click();
                    }
                }
            });
        }

        endTrial(display_element, responses, changes, rt, trial) {
            // Clear display
            display_element.innerHTML = '';

            // Prepare trial data
            const trial_data = {
                trust_ratings: responses,
                rating_changes: changes,
                rt: rt,
                round: trial.round || 0,
                condition: trial.condition || 'UNKNOWN',
                greenhouse_change: trial.greenhouse_change || 0
            };

            // Add individual question responses for easier analysis
            Object.keys(responses).forEach(key => {
                trial_data[`trust_${key}`] = responses[key];
                if (changes[key] !== undefined) {
                    trial_data[`change_${key}`] = changes[key];
                }
            });

            // End trial
            this.jsPsych.finishTrial(trial_data);
        }
    }

    TrustSurveyPlugin.info = info;

    return TrustSurveyPlugin;
})(typeof jsPsych !== 'undefined' ? jsPsych : {});