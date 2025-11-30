/**
 * jsPsych Trust Survey Plugin
 * 
 * Trust and confidence measurement for Air Quality Prediction Visualization Study
 * Measures interface trust, data trust, and misleading assessment
 */

var jsPsychTrustSurvey = (function (jspsych) {
  "use strict";

  const info = {
    name: "trust-survey",
    description: "Trust and confidence assessment for air quality prediction visualization",
    parameters: {
      questions: {
        type: jspsych.ParameterType.OBJECT,
        array: true,
        pretty_name: "Questions",
        description: "Array of trust question objects",
        default: []
      },
      condition: {
        type: jspsych.ParameterType.FUNCTION,
        pretty_name: "Condition",
        description: "Function returning current experimental condition",
        default: null
      },
      scale_points: {
        type: jspsych.ParameterType.INT,
        pretty_name: "Scale Points", 
        description: "Number of points on the Likert scale",
        default: 7
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

      // Get current condition
      const condition = trial.condition && typeof trial.condition === 'function' ? 
        trial.condition() : { name: 'Unknown', displayFormat: 'unknown' };

      // Create HTML
      let html = `
        <div class="trust-survey-container">
          <div class="survey-header">
            <h2>Trust and Confidence Assessment</h2>
            <p class="condition-context">
              You just used the <strong>${condition.name}</strong> visualization format to make predictions about air quality.
            </p>
          </div>
          
          <div class="survey-instructions">
            <p>Please rate your agreement with the following statements based on your experience with the visualization.</p>
            <p class="scale-info">Use the 7-point scale where 1 = "Not at all" and 7 = "Completely".</p>
          </div>
          
          <div class="questions-container">
      `;

      // Add each question
      trial.questions.forEach((question, qIndex) => {
        html += `
          <div class="question-block" data-question="${question.type}">
            <div class="question-number">Question ${qIndex + 1}</div>
            <div class="question-prompt">${question.prompt}</div>
            
            <div class="scale-container">
              <div class="scale-labels">
                <span class="scale-label-left">${question.labels[0]}</span>
                <span class="scale-label-right">${question.labels[question.labels.length - 1]}</span>
              </div>
              
              <div class="scale-points">
        `;

        // Create scale points with all labels
        for (let i = 1; i <= trial.scale_points; i++) {
          const label = question.labels[i - 1] || '';
          html += `
            <div class="scale-point-container">
              <button class="scale-point" 
                      data-question="${question.type}" 
                      data-value="${i}"
                      title="${label}">
                <span class="point-value">${i}</span>
              </button>
              <div class="point-label">${label}</div>
            </div>
          `;
        }

        html += `
              </div>
            </div>
            
            <div class="question-explanation">
              ${this.getQuestionExplanation(question.type)}
            </div>
          </div>
        `;
      });

      html += `
          </div>
          
          <div class="survey-footer">
            <button id="submit-trust-ratings" class="submit-btn" disabled>
              Continue to Final Questions
            </button>
            <div class="completion-status">
              <span id="completion-count">0</span> of ${trial.questions.length} questions answered
            </div>
          </div>
        </div>
      `;

      display_element.innerHTML = html;
      this.setupEventListeners(display_element, trial, responses, start_time);
    }

    getQuestionExplanation(questionType) {
      const explanations = {
        'interface_trust': 'This question asks about your trust in the visualization tool itself - whether it worked as you expected and displayed information clearly.',
        'data_trust': 'This question asks about your trust in the underlying air quality data that was used to create the predictions.',
        'misleading_rating': 'This question asks whether you think the visualization might have led you to incorrect conclusions (higher ratings = more misleading).'
      };
      
      return explanations[questionType] || '';
    }

    setupEventListeners(display_element, trial, responses, start_time) {
      const scalePoints = display_element.querySelectorAll('.scale-point');
      const submitBtn = display_element.querySelector('#submit-trust-ratings');
      const completionCount = display_element.querySelector('#completion-count');

      // Update completion status
      const updateCompletionStatus = () => {
        const answeredCount = Object.keys(responses).length;
        completionCount.textContent = answeredCount;
        submitBtn.disabled = answeredCount < trial.questions.length;
      };

      // Scale point click handlers
      scalePoints.forEach(point => {
        point.addEventListener('click', (e) => {
          const questionType = e.currentTarget.dataset.question;
          const value = parseInt(e.currentTarget.dataset.value);
          
          // Update response
          responses[questionType] = value;
          
          // Update visual state
          const questionBlock = display_element.querySelector(`.question-block[data-question="${questionType}"]`);
          questionBlock.querySelectorAll('.scale-point').forEach(p => {
            p.classList.remove('selected');
            if (parseInt(p.dataset.value) === value) {
              p.classList.add('selected');
            }
          });
          
          // Animate selection
          point.classList.add('pulse');
          setTimeout(() => point.classList.remove('pulse'), 300);
          
          // Update completion status
          updateCompletionStatus();
        });

        // Hover effects
        point.addEventListener('mouseenter', (e) => {
          const questionType = e.currentTarget.dataset.question;
          const questionBlock = display_element.querySelector(`.question-block[data-question="${questionType}"]`);
          questionBlock.classList.add('question-highlighted');
        });

        point.addEventListener('mouseleave', (e) => {
          const questionType = e.currentTarget.dataset.question;
          const questionBlock = display_element.querySelector(`.question-block[data-question="${questionType}"]`);
          questionBlock.classList.remove('question-highlighted');
        });
      });

      // Submit button handler
      submitBtn.addEventListener('click', () => {
        this.finishTrial(display_element, trial, responses, start_time);
      });

      // Keyboard navigation support
      document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= String(trial.scale_points)) {
          const value = parseInt(e.key);
          // Apply to the first unanswered question or the most recently highlighted one
          const unansweredQuestion = trial.questions.find(q => !responses[q.type]);
          if (unansweredQuestion) {
            const point = display_element.querySelector(
              `.scale-point[data-question="${unansweredQuestion.type}"][data-value="${value}"]`
            );
            if (point) point.click();
          }
        }
      });
    }

    finishTrial(display_element, trial, responses, start_time) {
      const end_time = performance.now();
      const rt = Math.round(end_time - start_time);

      // Get condition information
      const condition = trial.condition && typeof trial.condition === 'function' ? 
        trial.condition() : { name: 'Unknown', displayFormat: 'unknown' };

      // Prepare trial data
      const trial_data = {
        // Trust responses
        interface_trust: responses.interface_trust || null,
        data_trust: responses.data_trust || null,
        misleading_rating: responses.misleading_rating || null,
        
        // Condition information
        condition_id: condition.id || 'unknown',
        condition_name: condition.name || 'unknown',
        display_format: condition.displayFormat || 'unknown',
        
        // Timing
        rt: rt,
        
        // Complete responses object
        trust_responses: responses,
        
        // Calculated metrics
        trust_composite: responses.interface_trust && responses.data_trust ? 
          Math.round((responses.interface_trust + responses.data_trust) / 2) : null,
        trust_adjusted: responses.interface_trust && responses.misleading_rating ? 
          Math.round(responses.interface_trust - (responses.misleading_rating - 4)) : null // Adjust for misleading
      };

      // Add individual responses for easier analysis
      Object.keys(responses).forEach(key => {
        trial_data[`trust_${key}`] = responses[key];
      });

      // Clear display
      display_element.innerHTML = '';

      // Finish trial
      this.jsPsych.finishTrial(trial_data);
    }
  }

  TrustSurveyPlugin.info = info;

  return TrustSurveyPlugin;
})(jsPsychModule);