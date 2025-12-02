/**
 * jsPsych Prediction Task Plugin
 * 
 * Two-phase air quality prediction task with optional visualization
 * Phase 1: Text-based prediction
 * Phase 2: Visualization-based prediction (8 conditions)
 */

var jsPsychPredictionTask = (function (jspsych) {
  'use strict';

  const info = {
    name: 'prediction-task',
    description: 'Air quality prediction task with optional visualization',
    parameters: {
      phase: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Phase',
        description: 'Study phase (1 = historical only, 2 = historical + predictions)',
        default: 1
      },
      round: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Round',
        description: 'Round number (1-10)',
        default: 1
      },
      show_visualization: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Show Visualization',
        description: 'Whether to show visualization',
        default: true
      },
      show_predictions: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Show Predictions',
        description: 'Whether to show prediction data (Phase 2)',
        default: false
      },
      visualization_condition: {
        type: jspsych.ParameterType.OBJECT,
        pretty_name: 'Visualization Condition',
        description: 'Condition object for visualization rendering',
        default: null
      },
      description: {
        type: jspsych.ParameterType.FUNCTION,
        pretty_name: 'Description',
        description: 'Text description for Phase 1',
        default: null
      },
      air_quality_data: {
        type: jspsych.ParameterType.FUNCTION,
        pretty_name: 'Air Quality Data',
        description: 'Air quality data for visualization',
        default: null
      },
      question: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Question',
        description: 'Main prediction question',
        default: 'The probability that air quality in City A will be better than City B is ____%'
      },
      confidence_scale: {
        type: jspsych.ParameterType.OBJECT,
        pretty_name: 'Confidence Scale',
        description: 'Confidence rating scale configuration',
        default: {
          min: 1,
          max: 7,
          labels: ['Very Uncertain', 'Uncertain', 'Somewhat Uncertain', 'Neutral', 'Somewhat Certain', 'Certain', 'Very Certain']
        }
      },
      travel_question: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Travel Question',
        description: 'Travel decision question',
        default: 'If you were planning to visit one of these cities, which would you choose?'
      },
      travel_choices: {
        type: jspsych.ParameterType.ARRAY,
        pretty_name: 'Travel Choices',
        description: 'Travel choice options',
        default: ['City A', 'City B', 'No Preference']
      }
    }
  };

  class PredictionTaskPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
      this.startTime = null;
      this.interactionLog = [];
    }

    trial(display_element, trial) {
      this.startTime = performance.now();
      this.display_element = display_element;
      this.trial = trial;

      // Log condition information
      if (trial.visualization_condition && typeof trial.visualization_condition === 'function') {
        this.condition = trial.visualization_condition();
        console.log('Prediction task - Condition:', this.condition?.name);
      }

      this.renderTask();
    }

    renderTask() {
      const roundText = this.trial.round ? ` - Round ${this.trial.round}` : '';
      const phaseDescription = this.trial.show_predictions ? 
        'historical data and prediction forecasts' : 'historical data only';
      
      let html = `
        <style>
          .question-title {
            font-size: 1.1em;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
          }
          .probability-input-inline {
            display: inline;
            width: 100px;
            padding: 6px 10px;
            margin: 0 5px;
            border: 2px solid #ddd;
            border-radius: 4px;
            font-size: 1.1em;
            text-align: center;
            background-color: #f8f9fa;
          }
          .probability-input-inline:focus {
            border-color: #007bff;
            outline: none;
            background-color: white;
          }
        </style>
        <div class="prediction-task-container">
          <div class="task-header">
            <h2>Air Quality Prediction</h2>
            ${this.trial.show_predictions && this.condition ? 
              `<p class="condition-note"><em>Visualization: ${this.condition.name}</em></p>` : ''}
          </div>

          <div class="content-area">
            ${this.trial.show_predictions ? this.renderVisualization() : this.renderDescription()}
          </div>

          <div class="prediction-form">
            <div class="question-section">
              <h3 class="question-title">Q1. ${this.trial.question.replace(' ____%', '')} 
                <input type="number" id="probability-estimate" min="0" max="100" 
                       placeholder="0-100" class="probability-input-inline">%
              </h3>
            </div>

            <div class="confidence-section">
              <h3 class="question-title">Q2. How confident are you in this prediction?</h3>
              <div class="confidence-scale">
                ${this.trial.confidence_scale.labels.map((label, index) => `
                  <label class="confidence-option">
                    <input type="radio" name="confidence" value="${index + 1}">
                    <span class="confidence-number">${index + 1}</span>
                    <span class="confidence-label">${label}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="travel-section">
              <h3 class="question-title">Q3. ${this.trial.travel_question}</h3>
              <div class="travel-choices">
                ${this.trial.travel_choices.map((choice, index) => `
                  <label class="travel-option">
                    <input type="radio" name="travel-choice" value="${choice}">
                    <span class="travel-text">${choice}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="submit-section">
              <button id="submit-prediction" class="submit-btn" disabled>
                ${this.trial.phase === 1 ? 'Continue to Forecast' : 'Continue to Trust Survey'}
              </button>
            </div>
          </div>
        </div>
      `;

      this.display_element.innerHTML = html;
      this.setupEventListeners();

      // Render visualization if needed
      if (this.trial.show_visualization && this.condition) {
        this.renderVisualizationContent();
      }
    }

    renderDescription() {
      if (this.trial.description && typeof this.trial.description === 'function') {
        return `<div class="description-content">${this.trial.description()}</div>`;
      }
      return '<div class="description-content"><p>Description not available.</p></div>';
    }

    renderVisualization() {
      return `
        <div class="visualization-content">
          <div class="viz-header">
            ${this.condition ? `<p class="condition-info">${this.condition.instructions}</p>` : ''}
          </div>
          <div id="air-quality-chart" class="chart-container">
            <div class="chart-placeholder">Loading visualization...</div>
          </div>
        </div>
      `;
    }

    renderVisualizationContent() {
      if (!window.VisualizationRenderer) {
        console.error('VisualizationRenderer not found');
        return;
      }

      try {
        // Get air quality data
        const data = this.trial.air_quality_data ? this.trial.air_quality_data() : null;
        if (!data) {
          console.error('No air quality data provided');
          return;
        }

        // Initialize visualization renderer
        const renderer = new VisualizationRenderer('air-quality-chart');
        
        // Set up interaction logging
        this.setupVisualizationInteractionLogging(renderer);

        // Render based on condition
        switch (this.condition.displayFormat) {
          case 'aggregation_only':
            renderer.renderCondition1(data);
            break;
          case 'confidence_bounds':
            renderer.renderCondition2(data);
            break;
          case 'alternative_lines':
            renderer.renderCondition3(data);
            break;
          case 'hover_alternatives':
            renderer.renderCondition4(data);
            break;
          case 'hover_bounds':
            renderer.renderCondition5(data);
            break;
          case 'transform_hover':
            renderer.renderCondition6(data);
            break;
          case 'broken_interactions':
            // Placeholder for broken interactions (Condition 7)
            renderer.renderBrokenInteractions(data);
            break;
          case 'poor_interactions':
            // Placeholder for poor interactions (Condition 8)
            renderer.renderPoorInteractions(data);
            break;
          default:
            console.error('Unknown display format:', this.condition.displayFormat);
            renderer.renderCondition1(data); // Fallback
        }

      } catch (error) {
        console.error('Error rendering visualization:', error);
        document.getElementById('air-quality-chart').innerHTML = 
          '<p class="error-message">Error loading visualization. Please continue with your best estimate.</p>';
      }
    }

    setupVisualizationInteractionLogging(renderer) {
      // Log mouse interactions for analysis
      const chartContainer = document.getElementById('air-quality-chart');
      if (chartContainer) {
        chartContainer.addEventListener('mouseenter', (e) => {
          this.logInteraction('chart_enter', { timestamp: performance.now() - this.startTime });
        });

        chartContainer.addEventListener('mouseleave', (e) => {
          this.logInteraction('chart_leave', { timestamp: performance.now() - this.startTime });
        });

        chartContainer.addEventListener('mousemove', (e) => {
          this.logInteraction('chart_hover', { 
            x: e.clientX, 
            y: e.clientY,
            timestamp: performance.now() - this.startTime 
          });
        });

        chartContainer.addEventListener('click', (e) => {
          this.logInteraction('chart_click', { 
            x: e.clientX, 
            y: e.clientY,
            timestamp: performance.now() - this.startTime 
          });
        });
      }
    }

    logInteraction(type, data) {
      this.interactionLog.push({
        type: type,
        data: data,
        timestamp: performance.now() - this.startTime
      });
    }

    setupEventListeners() {
      const probabilityInput = document.getElementById('probability-estimate');
      const submitButton = document.getElementById('submit-prediction');
      
      // Enable submit button when all required fields are filled
      const checkFormValidity = () => {
        const probability = probabilityInput.value;
        const confidence = document.querySelector('input[name="confidence"]:checked');
        const travelChoice = document.querySelector('input[name="travel-choice"]:checked');
        
        const isValid = probability !== '' && 
                       parseFloat(probability) >= 0 && 
                       parseFloat(probability) <= 100 && 
                       confidence && 
                       travelChoice;
        
        submitButton.disabled = !isValid;
      };

      // Add event listeners
      probabilityInput.addEventListener('input', checkFormValidity);
      
      const radioInputs = document.querySelectorAll('input[type="radio"]');
      radioInputs.forEach(radio => {
        radio.addEventListener('change', checkFormValidity);
      });

      // Submit button click
      submitButton.addEventListener('click', () => {
        this.finishTrial();
      });

      // Enter key support for probability input
      probabilityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !submitButton.disabled) {
          this.finishTrial();
        }
      });
    }

    finishTrial() {
      const endTime = performance.now();
      const rt = endTime - this.startTime;

      // Collect responses
      const probabilityInput = document.getElementById('probability-estimate');
      const confidence = document.querySelector('input[name="confidence"]:checked');
      const travelChoice = document.querySelector('input[name="travel-choice"]:checked');

      const trial_data = {
        phase: this.trial.phase,
        round: this.trial.round || null,
        visualization_shown: this.trial.show_visualization,
        predictions_shown: this.trial.show_predictions || false,
        condition_id: this.condition?.id || null,
        condition_name: this.condition?.name || null,
        display_format: this.condition?.displayFormat || null,
        
        // Responses
        probability_estimate: parseFloat(probabilityInput.value),
        confidence_rating: confidence ? parseInt(confidence.value) : null,
        confidence_label: confidence ? this.trial.confidence_scale.labels[parseInt(confidence.value) - 1] : null,
        travel_choice: travelChoice ? travelChoice.value : null,
        
        // Timing and interactions
        rt: rt,
        interaction_log: this.interactionLog,
        total_interactions: this.interactionLog.length,
        
        // Additional data for Phase 2
        ...(this.trial.phase === 2 && {
          hover_events: this.interactionLog.filter(i => i.type === 'chart_hover').length,
          click_events: this.interactionLog.filter(i => i.type === 'chart_click').length,
          time_on_viz: this.interactionLog.length > 0 ? 
            Math.max(...this.interactionLog.map(i => i.timestamp)) - 
            Math.min(...this.interactionLog.map(i => i.timestamp)) : 0
        })
      };

      this.jsPsych.finishTrial(trial_data);
    }
  }

  PredictionTaskPlugin.info = info;

  return PredictionTaskPlugin;
})(jsPsychModule);