/**
 * jsPsych Interaction Feedback Plugin
 *
 * Single-page feedback survey with required Yes/No questions
 * and optional follow-up text boxes.
 */

var jsPsychInteractionFeedback = (function (jspsych) {
  jspsych = jspsych || (typeof jsPsychModule !== 'undefined' ? jsPsychModule : null);
  if (!jspsych) {
    console.error('jsPsych module not available');
    return null;
  }
  'use strict';

  const info = {
    name: 'interaction-feedback',
    description: 'Interaction feedback survey with required Yes/No and optional text input',
    parameters: {
      preamble: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: 'Preamble',
        description: 'HTML content to display before the questions',
        default: ''
      }
    }
  };

  class InteractionFeedbackPlugin {
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
          .interaction-feedback-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .interaction-feedback-preamble {
            margin-bottom: 30px;
            text-align: center;
          }
          .interaction-feedback-preamble h3 {
            color: #374151;
            margin-bottom: 10px;
          }
          .interaction-feedback-question {
            margin-bottom: 28px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 22px;
          }
          .interaction-feedback-question:last-of-type {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
          }
          .question-prompt {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 12px;
            color: #333;
            text-align: left;
            line-height: 1.4;
          }
          .yes-no-row {
            display: flex;
            gap: 12px;
            align-items: center;
          }
          .yes-no-option {
            position: relative;
            cursor: pointer;
            min-width: 110px;
          }
          .yes-no-option input[type="radio"] {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0;
            cursor: pointer;
          }
          .yes-no-button {
            display: block;
            text-align: center;
            padding: 10px 14px;
            background: white;
            color: #333;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid #d1d5db;
            font-weight: 600;
          }
          .yes-no-option:hover .yes-no-button {
            border-color: #374151;
            background: #f9fafb;
          }
          .yes-no-option input:checked + .yes-no-button {
            background: #374151;
            color: white;
            border-color: #374151;
          }
          .feedback-textarea {
            width: 100%;
            box-sizing: border-box;
            min-height: 110px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 14px;
            line-height: 1.5;
            resize: vertical;
          }
          .feedback-textarea:focus {
            outline: none;
            border-color: #374151;
            box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.15);
          }
          .validation-message {
            color: #dc2626;
            font-size: 14px;
            margin-top: 16px;
            text-align: center;
            display: none;
          }
          .submit-btn {
            background: #374151;
            border-color: #374151;
            color: white;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            margin-top: 28px;
            width: 220px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .submit-btn:hover:not(:disabled) {
            background: #111827;
            border-color: #111827;
          }
          .submit-btn:disabled {
            background: #6b7280;
            border-color: #6b7280;
            cursor: not-allowed;
            opacity: 0.75;
          }
        </style>
        <div class="interaction-feedback-container">
          ${this.trial.preamble || ''}
          <form id="interaction-feedback-form">
            <div class="interaction-feedback-question">
              <div class="question-prompt">1. Do you think you encounter any bug in the interaction?</div>
              <div class="yes-no-row">
                <label class="yes-no-option">
                  <input type="radio" name="encounter_bug" value="Yes" required>
                  <span class="yes-no-button">Yes</span>
                </label>
                <label class="yes-no-option">
                  <input type="radio" name="encounter_bug" value="No" required>
                  <span class="yes-no-button">No</span>
                </label>
              </div>
            </div>

            <div class="interaction-feedback-question">
              <div class="question-prompt">2. If Yes, elaborate in the text box below.</div>
              <textarea
                class="feedback-textarea"
                id="bug_elaboration"
                name="bug_elaboration"
                placeholder="Optional details..."
              ></textarea>
            </div>

            <div class="interaction-feedback-question">
              <div class="question-prompt">3. Do you think you encounter any annoying interaction design?</div>
              <div class="yes-no-row">
                <label class="yes-no-option">
                  <input type="radio" name="annoying_design" value="Yes" required>
                  <span class="yes-no-button">Yes</span>
                </label>
                <label class="yes-no-option">
                  <input type="radio" name="annoying_design" value="No" required>
                  <span class="yes-no-button">No</span>
                </label>
              </div>
            </div>

            <div class="interaction-feedback-question">
              <div class="question-prompt">4. If Yes, elaborate in the text box below.</div>
              <textarea
                class="feedback-textarea"
                id="annoying_elaboration"
                name="annoying_elaboration"
                placeholder="Optional details..."
              ></textarea>
            </div>

            <div id="validation-message" class="validation-message">
              Please answer Questions 1 and 3 before continuing.
            </div>

            <button type="submit" id="interaction-feedback-submit" class="submit-btn" disabled>
              Continue
            </button>
          </form>
        </div>
      `;

      this.display_element.innerHTML = html;
    }

    setupEventListeners() {
      const form = document.getElementById('interaction-feedback-form');
      const radios = document.querySelectorAll('input[type="radio"]');

      radios.forEach((radio) => {
        radio.addEventListener('change', () => {
          this.checkFormValidity();
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validateForm()) {
          this.finishTrial();
        } else {
          const validationMessage = document.getElementById('validation-message');
          validationMessage.style.display = 'block';
        }
      });
    }

    checkFormValidity() {
      const submitButton = document.getElementById('interaction-feedback-submit');
      const validationMessage = document.getElementById('validation-message');
      const isValid = this.validateForm();

      submitButton.disabled = !isValid;
      if (isValid) {
        validationMessage.style.display = 'none';
      }
    }

    validateForm() {
      const hasBugAnswer = !!document.querySelector('input[name="encounter_bug"]:checked');
      const hasAnnoyingAnswer = !!document.querySelector('input[name="annoying_design"]:checked');
      return hasBugAnswer && hasAnnoyingAnswer;
    }

    finishTrial() {
      const endTime = performance.now();
      const rt = endTime - this.startTime;

      const bugAnswer = document.querySelector('input[name="encounter_bug"]:checked');
      const annoyingAnswer = document.querySelector('input[name="annoying_design"]:checked');
      const bugElaboration = document.getElementById('bug_elaboration').value.trim();
      const annoyingElaboration = document.getElementById('annoying_elaboration').value.trim();

      const trial_data = {
        response: {
          encounter_bug: bugAnswer ? bugAnswer.value : null,
          bug_elaboration: bugElaboration,
          annoying_design: annoyingAnswer ? annoyingAnswer.value : null,
          annoying_elaboration: annoyingElaboration
        },
        rt: rt,
        question_order: [
          'encounter_bug',
          'bug_elaboration',
          'annoying_design',
          'annoying_elaboration'
        ]
      };

      this.jsPsych.finishTrial(trial_data);
    }
  }

  InteractionFeedbackPlugin.info = info;

  return InteractionFeedbackPlugin;
})(jsPsychModule);

if (typeof window !== 'undefined') {
  window.jsPsychInteractionFeedback = jsPsychInteractionFeedback;
}

export default jsPsychInteractionFeedback;
