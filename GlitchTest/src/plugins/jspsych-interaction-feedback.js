/**
 * jsPsych Interaction Feedback Plugin
 *
 * Single-page user experience survey with required rating questions
 * and optional follow-up comments.
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
    description: 'User experience survey with required responses and optional text input',
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
          .option-row {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
          }
          .option-card {
            position: relative;
            cursor: pointer;
            min-width: 110px;
          }
          .option-card input[type="radio"] {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0;
            cursor: pointer;
          }
          .option-button {
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
          .option-card:hover .option-button {
            border-color: #374151;
            background: #f9fafb;
          }
          .option-card input:checked + .option-button {
            background: #374151;
            color: white;
            border-color: #374151;
          }
          .option-card input:disabled + .option-button {
            background: #f3f4f6;
            border-color: #e5e7eb;
            color: #9ca3af;
            cursor: not-allowed;
          }
          .follow-up-note {
            margin-top: 10px;
            font-size: 14px;
            color: #6b7280;
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
              <div class="question-prompt">1. How do you like the system?</div>
              <div class="option-row">
                <label class="option-card">
                  <input type="radio" name="system_rating" value="Dislike a lot" required>
                  <span class="option-button">Dislike a lot</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="system_rating" value="Dislike" required>
                  <span class="option-button">Dislike</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="system_rating" value="Neutral" required>
                  <span class="option-button">Neutral</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="system_rating" value="Like" required>
                  <span class="option-button">Like</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="system_rating" value="Like a lot" required>
                  <span class="option-button">Like a lot</span>
                </label>
              </div>
            </div>

            <div class="interaction-feedback-question">
              <div class="question-prompt">2. Do you think there is any bug in the system?</div>
              <div class="option-row">
                <label class="option-card">
                  <input type="radio" name="encounter_bug" value="Yes" required>
                  <span class="option-button">Yes</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="encounter_bug" value="No" required>
                  <span class="option-button">No</span>
                </label>
              </div>
            </div>

            <div class="interaction-feedback-question">
              <div class="question-prompt">3. If yes in Question 2, what do you think the bug is?</div>
              <div class="option-row">
                <label class="option-card">
                  <input type="radio" name="bug_type" value="Glitch" disabled>
                  <span class="option-button">Glitch</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="bug_type" value="Inconsistency" disabled>
                  <span class="option-button">Inconsistency</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="bug_type" value="Hard interaction" disabled>
                  <span class="option-button">Hard interaction</span>
                </label>
                <label class="option-card">
                  <input type="radio" name="bug_type" value="N/A" checked>
                  <span class="option-button">N/A</span>
                </label>
              </div>
              <div id="bug-type-note" class="follow-up-note">Select Question 2 first.</div>
            </div>

            <div class="interaction-feedback-question">
              <div class="question-prompt">Additional comments</div>
              <textarea
                class="feedback-textarea"
                id="free_response"
                name="free_response"
                placeholder="Optional comments..."
              ></textarea>
            </div>

            <div id="validation-message" class="validation-message">
              Please answer the required questions before continuing.
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
          this.updateBugTypeState();
          this.checkFormValidity();
        });
      });

      this.updateBugTypeState();
      this.checkFormValidity();

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

    updateBugTypeState() {
      const bugAnswer = document.querySelector('input[name="encounter_bug"]:checked');
      const bugTypeOptions = document.querySelectorAll('input[name="bug_type"]');
      const bugTypeNote = document.getElementById('bug-type-note');
      const naOption = document.querySelector('input[name="bug_type"][value="N/A"]');

      if (!bugAnswer) {
        bugTypeOptions.forEach((option) => {
          option.disabled = option.value !== 'N/A';
        });
        if (naOption) {
          naOption.checked = true;
        }
        if (bugTypeNote) {
          bugTypeNote.textContent = 'Select Question 2 first.';
        }
        return;
      }

      if (bugAnswer.value === 'Yes') {
        bugTypeOptions.forEach((option) => {
          option.disabled = option.value === 'N/A';
        });
        if (naOption && naOption.checked) {
          naOption.checked = false;
        }
        if (bugTypeNote) {
          bugTypeNote.textContent = 'Please select the issue type that fits best.';
        }
      } else {
        bugTypeOptions.forEach((option) => {
          option.disabled = option.value !== 'N/A';
        });
        if (naOption) {
          naOption.checked = true;
        }
        if (bugTypeNote) {
          bugTypeNote.textContent = 'Question 3 is marked as N/A because you selected No in Question 2.';
        }
      }
    }

    validateForm() {
      const hasSystemRating = !!document.querySelector('input[name="system_rating"]:checked');
      const hasBugAnswer = !!document.querySelector('input[name="encounter_bug"]:checked');
      const bugAnswer = document.querySelector('input[name="encounter_bug"]:checked');
      const bugType = document.querySelector('input[name="bug_type"]:checked');
      const hasRequiredBugType = bugAnswer && bugAnswer.value === 'Yes' ? !!bugType && bugType.value !== 'N/A' : true;

      return hasSystemRating && hasBugAnswer && hasRequiredBugType;
    }

    finishTrial() {
      const endTime = performance.now();
      const rt = endTime - this.startTime;

      const systemRating = document.querySelector('input[name="system_rating"]:checked');
      const bugAnswer = document.querySelector('input[name="encounter_bug"]:checked');
      const bugType = document.querySelector('input[name="bug_type"]:checked');
      const freeResponse = document.getElementById('free_response').value.trim();

      const trial_data = {
        response: {
          system_rating: systemRating ? systemRating.value : null,
          encounter_bug: bugAnswer ? bugAnswer.value : null,
          bug_type: bugType ? bugType.value : null,
          free_response: freeResponse
        },
        rt: rt,
        question_order: [
          'system_rating',
          'encounter_bug',
          'bug_type',
          'free_response'
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
