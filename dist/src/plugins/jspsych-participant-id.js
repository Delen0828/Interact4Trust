/**
 * jsPsych plugin for collecting participant ID
 * Displays a form where participants enter their unique ID
 * Validates input and stores it for use throughout the experiment
 */

var jsPsychParticipantId = (function (jspsych) {
    "use strict";

    const info = {
        name: 'participant-id',
        parameters: {
            prompt: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Prompt',
                default: 'Please enter your participant ID:',
                description: 'The prompt text displayed above the input field.'
            },
            placeholder: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Placeholder',
                default: 'Enter your ID here',
                description: 'Placeholder text for the input field.'
            },
            required: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: 'Required',
                default: true,
                description: 'Whether the input is required.'
            },
            button_label: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Button label',
                default: 'Continue',
                description: 'Label for the continue button.'
            },
            validation_message: {
                type: jspsych.ParameterType.STRING,
                pretty_name: 'Validation message',
                default: 'Please enter your participant ID.',
                description: 'Message shown when validation fails.'
            }
        }
    };

    class ParticipantIdPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            // Create HTML for participant ID input
            var html = `
                <div class="participant-id-container">
                    <div class="participant-id-content">
                        <h2>Participant Information</h2>
                        <p class="participant-id-prompt">${trial.prompt}</p>
                        
                        <form id="participant-id-form">
                            <div class="input-group">
                                <input type="text" 
                                       id="participant-id-input" 
                                       name="participant_id" 
                                       placeholder="${trial.placeholder}"
                                       ${trial.required ? 'required' : ''}>
                            </div>
                            
                            <div class="error-message" id="error-message" style="display: none;">
                                ${trial.validation_message}
                            </div>
                            
                            <button type="submit" class="jspsych-btn jspsych-btn-primary">
                                ${trial.button_label}
                            </button>
                        </form>
                    </div>
                </div>
            `;

            // Add CSS styles
            html += `
                <style>
                    .participant-id-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 60vh;
                        padding: 20px;
                    }
                    
                    .participant-id-content {
                        background: white;
                        border-radius: 8px;
                        padding: 40px;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        border: 1px solid #ddd;
                        max-width: 500px;
                        width: 100%;
                        text-align: center;
                    }
                    
                    .participant-id-content h2 {
                        color: #333;
                        margin-bottom: 20px;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    
                    .participant-id-prompt {
                        color: #555;
                        font-size: 18px;
                        margin-bottom: 30px;
                        line-height: 1.5;
                    }
                    
                    .input-group {
                        margin-bottom: 20px;
                    }
                    
                    #participant-id-input {
                        width: 100%;
                        padding: 15px;
                        font-size: 16px;
                        border: 2px solid #ddd;
                        border-radius: 6px;
                        box-sizing: border-box;
                        transition: border-color 0.3s ease;
                    }
                    
                    #participant-id-input:focus {
                        outline: none;
                        border-color: #007bff;
                        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
                    }
                    
                    .error-message {
                        color: #dc3545;
                        font-size: 14px;
                        margin-bottom: 15px;
                        background: #f8d7da;
                        padding: 10px;
                        border-radius: 4px;
                        border: 1px solid #f5c6cb;
                    }
                    
                    .jspsych-btn-primary {
                        background-color: #007bff;
                        border-color: #007bff;
                        color: white;
                        font-size: 16px;
                        padding: 12px 30px;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    
                    .jspsych-btn-primary:hover {
                        background-color: #0056b3;
                        border-color: #0056b3;
                    }
                    
                    .jspsych-btn-primary:disabled {
                        background-color: #6c757d;
                        border-color: #6c757d;
                        cursor: not-allowed;
                    }
                    
                    @media (max-width: 600px) {
                        .participant-id-content {
                            padding: 30px 20px;
                            margin: 10px;
                        }
                        
                        .participant-id-content h2 {
                            font-size: 24px;
                        }
                        
                        .participant-id-prompt {
                            font-size: 16px;
                        }
                    }
                </style>
            `;

            display_element.innerHTML = html;

            // Handle form submission
            var form = display_element.querySelector('#participant-id-form');
            var input = display_element.querySelector('#participant-id-input');
            var errorMessage = display_element.querySelector('#error-message');

            // Focus on input field
            input.focus();

            // Show error message
            const showError = () => {
                errorMessage.style.display = 'block';
                input.style.borderColor = '#dc3545';
                input.focus();
            };

            // Hide error message
            const hideError = () => {
                errorMessage.style.display = 'none';
                input.style.borderColor = '#ddd';
            };

            // Handle form submission
            const handleSubmit = (e) => {
                e.preventDefault();
                
                var participant_id = input.value.trim();
                
                // Validate input
                if (trial.required && participant_id === '') {
                    showError();
                    return;
                }
                
                // Hide error message if previously shown
                hideError();
                
                // Store participant ID in jsPsych data
                this.jsPsych.data.addProperties({
                    participant_id: participant_id
                });

                // Update ParticipantConfig if available
                if (typeof ParticipantConfig !== 'undefined') {
                    ParticipantConfig.id = participant_id;
                }

                // End trial
                var trial_data = {
                    participant_id: participant_id,
                    rt: performance.now() - start_time
                };

                display_element.innerHTML = '';
                this.jsPsych.finishTrial(trial_data);
            };

            form.addEventListener('submit', handleSubmit);

            // Allow Enter key to submit
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSubmit(e);
                }
            });

            // Record start time
            var start_time = performance.now();
        }
    }
    ParticipantIdPlugin.info = info;

    return ParticipantIdPlugin;

})(jsPsychModule);

// ES6 module export for dynamic import
if (typeof window !== 'undefined') {
    window.jsPsychParticipantId = jsPsychParticipantId;
}

// Export for ES6 modules
export default jsPsychParticipantId;