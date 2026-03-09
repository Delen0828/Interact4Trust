/**
 * jsPsych Trust Survey Plugin
 * 
 * Custom plugin for trust assessment questions using button-style interface
 * Matches the visual style of confidence ratings in prediction tasks
 */

var jsPsychTrustSurvey = (function (jspsych) {
  // Ensure jspsych is available, fallback to global jsPsychModule
  jspsych = jspsych || (typeof jsPsychModule !== 'undefined' ? jsPsychModule : null);
  if (!jspsych) {
    console.error('jsPsych module not available');
    return null;
  }
  'use strict';

  const info = {
    name: 'trust-survey',
    description: 'Trust assessment survey with custom button styling',
    parameters: {
      questions: {
        type: jspsych.ParameterType.OBJECT,
        pretty_name: 'Questions',
        description: 'Array of trust survey questions',
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
        default: 600
      }
    }
  };

  class TrustSurveyPlugin {
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
          .trust-survey-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .trust-survey-preamble {
            margin-bottom: 30px;
            text-align: center;
            color: #374151;
          }
          .trust-survey-preamble h3 {
            color: #374151;
            margin-bottom: 15px;
            font-size: 30px;
          }
          .trust-survey-preamble p {
            font-size: 18px;
            line-height: 1.6;
          }
          .trust-question {
            margin-bottom: 40px;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 30px;
          }
          .trust-question:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .trust-question-prompt {
            font-size: 22px;
            font-weight: 500;
            margin-bottom: 20px;
            color: #374151;
            text-align: left;
            line-height: 1.4;
          }
          .trust-scale {
            display: grid;
            grid-template-columns: repeat(var(--scale-count), minmax(0, 1fr));
            gap: 8px;
            align-items: flex-start;
            margin-top: 10px;
            justify-content: stretch;
          }
          .trust-option {
            position: relative;
            cursor: pointer;
            min-width: 0;
          }
          .trust-option input[type="radio"] {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0;
            cursor: pointer;
          }
          .trust-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            background: white;
            color: #374151;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid #ddd;
            min-height: 54px;
            box-sizing: border-box;
            position: relative;
          }
          .trust-option:hover .trust-button {
            border-color: #374151;
            background: #f9fafb;
          }
          .trust-option input:checked + .trust-button {
            background: #374151;
            color: white;
            border-color: #374151;
          }
          .trust-number {
            font-weight: 600;
            font-size: 20px;
            text-align: center;
            line-height: 1;
            margin: 0;
          }
          .trust-scale-labels {
            display: grid;
            grid-template-columns: repeat(var(--scale-count), minmax(0, 1fr));
            gap: 8px;
            margin-top: 8px;
            align-items: start;
          }
          .trust-scale-label {
            color: #6b7280;
            font-size: 13px;
            font-weight: 500;
            line-height: 1.2;
            max-width: 120px;
          }
          .trust-scale-label-left {
            justify-self: start;
            text-align: left;
          }
          .trust-scale-label-center {
            justify-self: center;
            text-align: center;
          }
          .trust-scale-label-right {
            justify-self: end;
            text-align: right;
          }
          .submit-btn {
            background: #374151 !important;
            border-color: #374151 !important;
            color: white;
            padding: 12px 24px;
            font-size: 18px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            margin-top: 30px;
            width: 220px;
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
            font-size: 16px;
            margin-top: 15px;
            text-align: center;
            display: none;
          }
        </style>
        <div class="trust-survey-container">
          ${this.trial.preamble || ''}
          
          <form id="trust-survey-form">
            ${this.trial.questions.map((question, qIndex) => `
              <div class="trust-question">
                <div class="trust-question-prompt">${question.prompt}</div>
                <div class="trust-scale" style="--scale-count: ${question.labels.length};">
                  ${question.labels.map((label, index) => `
                    <label class="trust-option">
                      <input type="radio" name="question_${qIndex}" value="${index}">
                      <span class="trust-button" title="${label}">
                        <span class="trust-number">${index + 1}</span>
                      </span>
                    </label>
                  `).join('')}
                </div>
                <div class="trust-scale-labels" style="--scale-count: ${question.labels.length};">
                  <span class="trust-scale-label trust-scale-label-left" style="grid-column: 1;">${question.labels[0] || ''}</span>
                  <span class="trust-scale-label trust-scale-label-center" style="grid-column: ${Math.floor(question.labels.length / 2) + 1};">${question.labels[Math.floor(question.labels.length / 2)] || ''}</span>
                  <span class="trust-scale-label trust-scale-label-right" style="grid-column: ${question.labels.length};">${question.labels[question.labels.length - 1] || ''}</span>
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
      const form = document.getElementById('trust-survey-form');
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

  TrustSurveyPlugin.info = info;

  return TrustSurveyPlugin;
})(jsPsychModule);

// ES6 module export for dynamic import
if (typeof window !== 'undefined') {
  window.jsPsychTrustSurvey = jsPsychTrustSurvey;
}

// Export for ES6 modules
export default jsPsychTrustSurvey;
