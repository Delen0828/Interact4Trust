/**
 * jsPsych Personality Survey Plugin
 * 
 * Custom plugin for personality assessment questions using button-style interface
 * Matches the visual style of confidence ratings in prediction tasks
 */

var jsPsychPersonalitySurvey = (function (jspsych) {
  // Ensure jspsych is available, fallback to global jsPsychModule
  jspsych = jspsych || (typeof jsPsychModule !== 'undefined' ? jsPsychModule : null);
  if (!jspsych) {
    console.error('jsPsych module not available');
    return null;
  }
  'use strict';

  const info = {
    name: 'personality-survey',
    description: 'Personality assessment survey with custom button styling',
    parameters: {
      questions: {
        type: jspsych.ParameterType.OBJECT,
        pretty_name: 'Questions',
        description: 'Array of personality survey questions',
        default: []
      },
      preamble: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Preamble',
        description: 'HTML content to display before the questions',
        default: ''
      },
      scale_width: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Scale Width',
        description: 'Width of the scale in pixels',
        default: 700
      }
    }
  };

  class PersonalitySurveyPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
      this.startTime = null;
    }

    trial(display_element, trial) {
      this.startTime = performance.now();
      this.display_element = display_element;
      this.trial = trial;

      this.renderSurvey();
      this.setupEventListeners();
    }

    renderSurvey() {
      const html = `
        <style>
          .personality-survey-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .personality-survey-preamble {
            margin-bottom: 30px;
            text-align: center;
          }
          .personality-survey-preamble h3 {
            color: #374151;
            margin-bottom: 15px;
          }
          .personality-question {
            margin-bottom: 40px;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 30px;
          }
          .personality-question:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .question-prompt {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 20px;
            color: #333;
            text-align: left;
            line-height: 1.4;
          }
          .personality-scale {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: flex-start;
            margin-top: 10px;
            justify-content: flex-start;
          }
          .personality-option {
            position: relative;
            cursor: pointer;
            flex: 1;
            min-width: 160px;
          }
          .personality-option input[type="radio"] {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0;
            cursor: pointer;
          }
          .personality-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0;
            background: white;
            color: #333;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid #ddd;
            height: 80px;
            box-sizing: border-box;
            position: relative;
          }
          .personality-option:hover .personality-button {
            border-color: #374151;
            background: #f9fafb;
          }
          .personality-option input:checked + .personality-button {
            background: #374151;
            color: white;
            border-color: #374151;
          }
          .personality-number {
            font-weight: 600;
            font-size: 18px;
            text-align: center;
            line-height: 1;
            margin-top: 15px;
            margin-bottom: 0;
          }
          .personality-label {
            font-size: 10px;
            font-weight: 500;
            line-height: 1.1;
            text-align: center;
            word-wrap: break-word;
            hyphens: auto;
            margin-top: 8px;
            padding: 0 4px;
          }
          .submit-btn {
            background: #374151 !important;
            border-color: #374151 !important;
            color: white;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            margin-top: 30px;
            width: 200px;
            display: block;
            margin: 30px auto 0;
          }
          .submit-btn:hover:not(:disabled) {
            background: #111827 !important;
            border-color: #111827 !important;
          }
          .submit-btn:disabled {
            background: #6c757d !important;
            border-color: #6c757d !important;
            cursor: not-allowed;
            opacity: 0.7;
          }
          .validation-message {
            color: #dc3545;
            font-size: 14px;
            margin-top: 15px;
            text-align: center;
            display: none;
          }
        </style>
        <div class="personality-survey-container">
          ${this.trial.preamble || ''}
          
          <form id="personality-survey-form">
            ${this.trial.questions.map((question, qIndex) => `
              <div class="personality-question">
                <div class="question-prompt">${question.prompt}</div>
                <div class="personality-scale">
                  ${question.labels.map((label, index) => `
                    <label class="personality-option">
                      <input type="radio" name="question_${qIndex}" value="${index}">
                      <span class="personality-button">
                        <span class="personality-number">${index + 1}</span>
                        <span class="personality-label">${label}</span>
                      </span>
                    </label>
                  `).join('')}
                </div>
              </div>
            `).join('')}
            
            <div class="validation-message" id="validation-message">
              Please answer all questions before continuing.
            </div>
            
            <button type="submit" id="submit-btn" class="submit-btn" disabled>
              Continue
            </button>
          </form>
        </div>
      `;

      this.display_element.innerHTML = html;
    }

    setupEventListeners() {
      const form = document.getElementById('personality-survey-form');
      const submitButton = document.getElementById('submit-btn');
      const validationMessage = document.getElementById('validation-message');
      
      // Check form validity when any radio button changes
      const radioInputs = document.querySelectorAll('input[type="radio"]');
      radioInputs.forEach(radio => {
        radio.addEventListener('change', () => {
          this.checkFormValidity();
        });
      });

      // Handle form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validateForm()) {
          this.finishTrial();
        }
      });
    }

    checkFormValidity() {
      const submitButton = document.getElementById('submit-btn');
      const validationMessage = document.getElementById('validation-message');
      
      const isValid = this.validateForm();
      submitButton.disabled = !isValid;
      
      if (isValid) {
        validationMessage.style.display = 'none';
      }
    }

    validateForm() {
      // Check that all questions have been answered
      const questionCount = this.trial.questions.length;
      for (let i = 0; i < questionCount; i++) {
        const answered = document.querySelector(`input[name="question_${i}"]:checked`);
        if (!answered) {
          return false;
        }
      }
      return true;
    }

    finishTrial() {
      const endTime = performance.now();
      const rt = endTime - this.startTime;

      // Collect responses
      const responses = {};
      this.trial.questions.forEach((question, index) => {
        const selectedOption = document.querySelector(`input[name="question_${index}"]:checked`);
        const responseValue = selectedOption ? parseInt(selectedOption.value) : null;
        responses[question.type] = responseValue;
      });

      const trial_data = {
        response: responses,
        rt: rt,
        question_order: this.trial.questions.map(q => q.type)
      };

      this.jsPsych.finishTrial(trial_data);
    }
  }

  PersonalitySurveyPlugin.info = info;

  return PersonalitySurveyPlugin;
})(jsPsychModule);

// ES6 module export for dynamic import
if (typeof window !== 'undefined') {
  window.jsPsychPersonalitySurvey = jsPsychPersonalitySurvey;
}

// Export for ES6 modules
export default jsPsychPersonalitySurvey;