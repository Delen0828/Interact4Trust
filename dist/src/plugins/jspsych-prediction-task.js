/**
 * jsPsych Prediction Task Plugin
 * 
 * Two-phase air quality prediction task with optional visualization
 * Phase 1: Text-based prediction
 * Phase 2: Visualization-based prediction (8 conditions)
 */

var jsPsychPredictionTask = (function (jspsych) {
  // Ensure jspsych is available, fallback to global jsPsychModule
  jspsych = jspsych || (typeof jsPsychModule !== 'undefined' ? jsPsychModule : null);
  if (!jspsych) {
    console.error('jsPsych module not available');
    return null;
  }
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
        default: 'The probability that the air quality index of City A will be better than City B on 06/30 is ____%'
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
      this.sliderMoved = false; // Track if slider has been moved
    }

    trial(display_element, trial) {
      this.startTime = performance.now();
      this.display_element = display_element;
      this.trial = trial;
      this.sliderMoved = false; // Reset slider tracking for new trial

      // Get condition information
      if (trial.visualization_condition) {
        if (typeof trial.visualization_condition === 'function') {
          this.condition = trial.visualization_condition();
        } else if (typeof trial.visualization_condition === 'object') {
          this.condition = trial.visualization_condition;
        }
      } else {
        this.condition = null;
      }

      // Render task synchronously first, then handle async visualization
      this.renderTask();
    }

    renderTask() {
      // Note: roundText and phaseDescription available for future use if needed
      
      let html = `
        <style>
          .question-title {
            font-size: 1.1em;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
            text-align: left;
          }
          .probability-slider-container {
            margin: 20px 0;
            position: relative;
            width: 100%;
          }
          .probability-slider {
            width: calc(100% - 24px);
            margin: 0 12px;
            height: 8px;
            border-radius: 4px;
            background: #ddd;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
            cursor: pointer;
          }
          .probability-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #0891B2;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(8, 145, 178, 0.3);
          }
          .probability-slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #0891B2;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
          }
          .slider-city-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 14px;
            font-weight: 500;
          }
          .city-b-label {
            color: #7C3AED;
          }
          .city-a-label {
            color: #0891B2;
          }
          .current-probability {
            text-align: center;
            margin-top: 15px;
            font-size: 16px;
            font-weight: 600;
            color: #0891B2;
            min-height: 20px;
          }
          .confidence-scale {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: flex-start;
            margin-top: 10px;
            justify-content: flex-start;
          }
          .confidence-option {
            position: relative;
            cursor: pointer;
            flex: 1;
            min-width: 80px;
          }
          .confidence-option input[type="radio"] {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0;
            cursor: pointer;
          }
          .confidence-button {
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
          .confidence-option:hover .confidence-button {
            border-color: #0891B2;
            background: #f0f7ff;
          }
          .confidence-option input:checked + .confidence-button {
            background: #0891B2;
            color: white;
            border-color: #0891B2;
          }
          .confidence-number {
            font-weight: 600;
            font-size: 18px;
            text-align: center;
            line-height: 1;
            margin-top: 15px;
            margin-bottom: 0;
          }
          .confidence-label {
            font-size: 12px;
            font-weight: 500;
            line-height: 1.1;
            text-align: center;
            word-wrap: break-word;
            hyphens: auto;
            margin-top: 8px;
            padding: 0 4px;
          }
          .travel-choices {
            display: flex;
            flex-direction: row;
            gap: 15px;
            align-items: flex-start;
            margin-top: 10px;
          }
          .travel-option {
            position: relative;
            cursor: pointer;
          }
          .travel-option input[type="radio"] {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0;
            cursor: pointer;
          }
          .travel-button {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            background: white;
            color: #333;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid #ddd;
            min-width: 120px;
            justify-content: center;
          }
          .travel-option:hover .travel-button {
            border-color: #0891B2;
            background: #f0f7ff;
          }
          .travel-option input:checked + .travel-button {
            background: #0891B2;
            color: white;
            border-color: #0891B2;
          }
          .travel-text {
            font-weight: 500;
          }
          .estimates-container {
            display: flex;
            gap: 30px;
            align-items: center;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          .estimate-input-group {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .estimate-label {
            font-weight: 600;
            font-size: 18px;
            color: #333;
            min-width: 70px;
          }
          .estimate-label.city-a {
            color: #0891B2;
          }
          .estimate-label.city-b {
            color: #7C3AED;
          }
          .estimate-input {
            width: 120px;
            padding: 8px 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
          }
          .estimate-input:focus {
            outline: none;
            border-color: #0891B2;
            background: #f0f7ff;
          }
          .estimate-input::placeholder {
            color: #999;
            font-size: 14px;
          }
          .scene-label {
            font-size: 16px;
            font-weight: 500;
            color: #28a745;
            background: rgba(40, 167, 69, 0.1);
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid rgba(40, 167, 69, 0.3);
          }
          .submit-btn {
            background: #28a745 !important;
            border-color: #28a745 !important;
          }
          .submit-btn:hover:not(:disabled) {
            background: #218838 !important;
            border-color: #1e7e34 !important;
          }
        </style>
        <div class="prediction-task-container">
          <div class="task-header">
            <h2 style="color: #28a745;">Air Quality Prediction</h2>
            <div class="scene-label">
              ${this.trial.phase === 1 ? 'Historical Data' : 'Forecast Data'}
            </div>
          </div>

          <div class="content-area">
            ${this.trial.show_visualization ? this.renderVisualization() : this.renderDescription()}
          </div>

          <div class="prediction-form">
            <div class="question-section">
              <h3 class="question-title">Q1. ${this.trial.question.replace(' ____%', '')}</h3>
              <div class="probability-slider-container">
                <input type="range" id="probability-estimate" class="probability-slider" 
                       min="0" max="100" step="1" value="">
                <div class="slider-city-labels">
                  <span class="city-b-label">City B will be better</span>
                  <span class="city-a-label">City A will be better</span>
                </div>
                <div class="current-probability" id="current-probability">Please move the slider to indicate your prediction</div>
                <div class="slider-requirement" id="slider-requirement" style="font-size: 12px; color: #e74c3c; margin-top: 5px; text-align: center; display: block;">
                  ⚠️ You must move the slider to continue
                </div>
              </div>
            </div>

            <div class="air-quality-estimates-section">
              <h3 class="question-title">Q2. What is the estimated air quality index of City A and City B on 06/30?</h3>
              <div class="estimates-container">
                <div class="estimate-input-group">
                  <label for="city-a-estimate" class="estimate-label city-a">City A:</label>
                  <input type="number" id="city-a-estimate" class="estimate-input" 
                         placeholder="Enter AQI" min="0" max="500" step="1">
                </div>
                <div class="estimate-input-group">
                  <label for="city-b-estimate" class="estimate-label city-b">City B:</label>
                  <input type="number" id="city-b-estimate" class="estimate-input" 
                         placeholder="Enter AQI" min="0" max="500" step="1">
                </div>
              </div>
            </div>

            <div class="confidence-section">
              <h3 class="question-title">Q3. How confident are you in this prediction?</h3>
              <div class="confidence-scale">
                ${this.trial.confidence_scale.labels.map((label, index) => `
                  <label class="confidence-option">
                    <input type="radio" name="confidence" value="${index + 1}">
                    <span class="confidence-button">
                      <span class="confidence-number">${index + 1}</span>
                      <span class="confidence-label">${label}</span>
                    </span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="travel-section">
              <h3 class="question-title">Q4. ${this.trial.travel_question}</h3>
              <div class="travel-choices">
                ${this.trial.travel_choices.map((choice) => `
                  <label class="travel-option">
                    <input type="radio" name="travel-choice" value="${choice}">
                    <span class="travel-button">
                      <span class="travel-text">${choice}</span>
                    </span>
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
      if (this.trial.show_visualization) {
        // Update condition display after DOM is ready
        setTimeout(() => {
          const conditionElement = document.getElementById('condition-display');
          if (conditionElement) {
            const conditionName = this.condition?.name || 'Loading...';
            conditionElement.textContent = `Condition: ${conditionName}`;
          }
        }, 0);
        
        // Set up timeout to catch stuck loading
        const loadingTimeout = setTimeout(() => {
          const chartElement = document.getElementById('air-quality-chart');
          if (chartElement && chartElement.innerHTML.includes('Loading visualization')) {
            chartElement.innerHTML = `
              <div class="error-message">
                <strong>Loading timeout</strong><br>
                Visualization is taking longer than expected to load.<br>
                Please continue with your best estimate or refresh the page.
              </div>`;
          }
        }, 10000); // 10 second timeout
        
        // Use setTimeout to ensure DOM is ready, then call async function
        setTimeout(() => {
          this.renderVisualizationContent()
            .then(() => {
              clearTimeout(loadingTimeout); // Clear timeout on success
            })
            .catch(error => {
              clearTimeout(loadingTimeout); // Clear timeout on error
              const chartElement = document.getElementById('air-quality-chart');
              if (chartElement) {
                chartElement.innerHTML = 
                  `<p class="error-message">Visualization failed to load: ${error.message}<br>Please continue with your best estimate.</p>`;
              }
            });
        }, 100);
      }
    }

    renderDescription() {
      if (this.trial.description && typeof this.trial.description === 'function') {
        return `<div class="description-content">${this.trial.description()}</div>`;
      }
      // Fallback message when no description is provided
      return `<div class="description-content">
        <p style="text-align: center; color: #666; font-style: italic;">
          Please review the information above and make your prediction below.
        </p>
      </div>`;
    }

    renderVisualization() {
      
      // Create initial template with placeholder that will be updated
      const initialTemplate = `
        <div class="visualization-content">
          <div id="air-quality-chart" class="chart-container">
            <div class="chart-placeholder" id="loading-placeholder">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 14px;">Loading visualization...</div>
                <div style="margin-top: 8px; font-size: 11px; color: #999;">
                  Phase ${this.trial.phase || 'Unknown'} • ${this.trial.show_predictions ? 'With Predictions' : 'Historical Only'}
                </div>
                <div style="margin-top: 15px; width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
                  <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #0891B2 25%, #ffffff 25%, #ffffff 50%, #0891B2 50%, #0891B2 75%, #ffffff 75%); background-size: 40px 100%; animation: loading-stripe 1s linear infinite;"></div>
                </div>
              </div>
            </div>
          </div>
          
          
          <style>
            @keyframes loading-stripe {
              0% { background-position: 0 0; }
              100% { background-position: 40px 0; }
            }
          </style>
        </div>
      `;
      
      return initialTemplate;
    }

    async renderVisualizationContent() {
      
      try {
        // Get air quality data - handle both sync and async data functions
        let data = null;
        if (this.trial.air_quality_data) {
          const dataResult = this.trial.air_quality_data();
          
          // Check if it's a Promise (async function)
          if (dataResult && typeof dataResult.then === 'function') {
            data = await dataResult;
          } else {
            data = dataResult;
          }
        }
        
        if (!data) {
          document.getElementById('air-quality-chart').innerHTML = 
            '<p class="error-message">No data available. Please continue with your best estimate.</p>';
          return;
        }
        
        // Import ConditionFactory dynamically
        const { ConditionFactory } = await import('../../display/conditionFactory.js');
        
        // Initialize condition factory
        const conditionFactory = new ConditionFactory();
        
        // Configure for jsPsych context
        const config = {
          width: 600,
          height: 400,
          margin: { top: 20, right: 20, bottom: 60, left: 70 },
          colors: {
            historical: '#6c757d',
            stockA: '#0891B2',
            stockB: '#7C3AED'
          },
          showAxisTitles: true,
          xAxisTitle: 'Date',
          yAxisTitle: 'Air Quality Index'
        };
        
        
        // Initialize with data (pass data array directly, not wrapped)
        await conditionFactory.initialize(config, data, '05/01', this.trial.phase);
        
        // Set up interaction logging before rendering
        this.setupVisualizationInteractionLogging();

        // Determine condition number from display format
        const conditionNumber = this.getConditionNumber();
        
        // Clear the container and create SVG element for the condition
        const chartContainer = document.getElementById('air-quality-chart');
        chartContainer.innerHTML = '';
        
        // Create SVG element with proper ID for the condition
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", "jspsych-chart-svg");
        svg.setAttribute("width", "600");
        svg.setAttribute("height", "400");
        svg.setAttribute("class", "chart-svg");
        chartContainer.appendChild(svg);

        // Render the condition
        const conditionInstance = await conditionFactory.renderCondition(conditionNumber, 'jspsych-chart-svg');
        
        // Store condition instance for cleanup
        this.conditionInstance = conditionInstance;

        // Add city labels to the start of the lines
        this.addCityLabels(svg, data);


      } catch (error) {
        console.error('Visualization loading error:', error);
        console.error('Error stack:', error.stack);
        
        // Safely check if data is defined before logging it
        try {
          console.error('Data passed to visualization:', typeof data !== 'undefined' ? data : 'undefined');
        } catch (e) {
          console.error('Could not log data (data not accessible)');
        }
        
        const dataInfo = (() => {
          try {
            if (typeof data === 'undefined') {
              return 'undefined';
            } else if (Array.isArray(data)) {
              return `Array (length: ${data.length})`;
            } else {
              return `${typeof data} ${typeof data === 'object' && data ? `(keys: ${Object.keys(data).join(', ')})` : ''}`;
            }
          } catch (e) {
            return 'not accessible';
          }
        })();
        
        const errorDetails = `
          <div class="error-details" style="text-align: left; margin-top: 10px; padding: 10px; background: #f8f8f8; border-radius: 4px; font-family: monospace; font-size: 12px;">
            <strong>Error Details:</strong><br>
            ${error.message}<br>
            <br>
            <strong>Data Info:</strong><br>
            ${dataInfo}<br>
            <br>
            <details>
              <summary>Technical Details</summary>
              <pre>${error.stack || 'No stack trace available'}</pre>
            </details>
          </div>
        `;
        
        document.getElementById('air-quality-chart').innerHTML = 
          `<p class="error-message">Error loading visualization: ${error.message}</p>
           <p>Please continue with your best estimate.</p>
           ${errorDetails}`;
      }
    }

    addCityLabels(svg, data) {
      try {
        // Get the chart group (where the actual chart is rendered)
        const chartGroup = d3.select(svg).select('g');
        if (chartGroup.empty()) {
          console.warn('Chart group not found, skipping city labels');
          return;
        }

        // Find line elements with more flexible selectors
        const stockALine = d3.select(svg).select('path.stock-a-line, path.line-a, path[stroke="#0891B2"], path[stroke="#0066cc"]');
        const stockBLine = d3.select(svg).select('path.stock-b-line, path.line-b, path[stroke="#7C3AED"], path[stroke="#ff6600"]');

        // Get chart dimensions and margins for better positioning
        const svgWidth = parseInt(svg.getAttribute('width')) || 600;
        const svgHeight = parseInt(svg.getAttribute('height')) || 400;
        
        // Approximate chart margins (should match the config)
        const margin = { top: 20, right: 20, bottom: 60, left: 70 };
        const chartWidth = svgWidth - margin.left - margin.right;
        const chartHeight = svgHeight - margin.top - margin.bottom;

        // Position labels more reliably at the end of the chart area
        const labelX = margin.left + chartWidth - 10; // 10px from right edge
        
        if (!stockALine.empty()) {
          const pathData = stockALine.attr('d');
          if (pathData) {
            // Extract the last point from the path for more accurate positioning
            const pathPoints = pathData.match(/[ML]\s*([+-]?[0-9]*\.?[0-9]+),([+-]?[0-9]*\.?[0-9]+)/g);
            if (pathPoints && pathPoints.length > 0) {
              // Get the last point in the path
              const lastPointStr = pathPoints[pathPoints.length - 1];
              const coords = lastPointStr.match(/[ML]\s*([+-]?[0-9]*\.?[0-9]+),([+-]?[0-9]*\.?[0-9]+)/);
              
              if (coords) {
                const y = parseFloat(coords[2]);
                
                chartGroup.append('text')
                  .attr('x', labelX)
                  .attr('y', y - 5) // Slightly above the line
                  .attr('text-anchor', 'end')
                  .attr('font-size', '11px')
                  .attr('font-weight', '600')
                  .attr('fill', '#0891B2')
                  .style('background', 'rgba(255,255,255,0.8)')
                  .text('City A');
              }
            }
          }
        }

        if (!stockBLine.empty()) {
          const pathData = stockBLine.attr('d');
          if (pathData) {
            // Extract the last point from the path for more accurate positioning
            const pathPoints = pathData.match(/[ML]\s*([+-]?[0-9]*\.?[0-9]+),([+-]?[0-9]*\.?[0-9]+)/g);
            if (pathPoints && pathPoints.length > 0) {
              // Get the last point in the path
              const lastPointStr = pathPoints[pathPoints.length - 1];
              const coords = lastPointStr.match(/[ML]\s*([+-]?[0-9]*\.?[0-9]+),([+-]?[0-9]*\.?[0-9]+)/);
              
              if (coords) {
                const y = parseFloat(coords[2]);
                
                chartGroup.append('text')
                  .attr('x', labelX)
                  .attr('y', y + 15) // Slightly below the line (opposite of City A)
                  .attr('text-anchor', 'end')
                  .attr('font-size', '11px')
                  .attr('font-weight', '600')
                  .attr('fill', '#7C3AED')
                  .style('background', 'rgba(255,255,255,0.8)')
                  .text('City B');
              }
            }
          }
        }

      } catch (error) {
        // Silently fail if labeling doesn't work
      }
    }

    
    getConditionNumber() {
      // Handle null condition
      if (!this.condition || !this.condition.displayFormat) {
        return 1; // Fallback to Baseline
      }
      
      // Map jsPsych condition display formats to display system condition numbers
      switch (this.condition.displayFormat) {
        case 'historical_only':
          return 0;  // Condition 0: Historical Only
        case 'aggregation_only':
          return 1;  // Condition 1: Baseline
        case 'confidence_bounds':
          return 2;  // Condition 2: PI Plot
        case 'alternative_lines':
          return 3;  // Condition 3: Ensemble Plot
        case 'hover_alternatives':
          return 4;  // Condition 4: Ensemble + Hover
        case 'hover_bounds':
          return 5;  // Condition 5: PI Plot + Hover
        case 'transform_hover':
          return 6;  // Condition 6: PI → Ensemble
        case 'broken_interactions':
          return 7;  // Condition 7: Buggy Control
        case 'poor_interactions':
          return 8;  // Condition 8: Bad Control
        case 'combined_pi_ensemble':
          return 9;  // Condition 9: Combined PI + Ensemble
        default:
          return 1;  // Fallback to Baseline
      }
    }

    setupVisualizationInteractionLogging() {
      // Log mouse interactions for analysis
      const chartContainer = document.getElementById('air-quality-chart');
      if (chartContainer) {
        chartContainer.addEventListener('mouseenter', () => {
          this.logInteraction('chart_enter', { timestamp: performance.now() - this.startTime });
        });

        chartContainer.addEventListener('mouseleave', () => {
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
      const currentProbabilityDisplay = document.getElementById('current-probability');
      const submitButton = document.getElementById('submit-prediction');
      
      // Update probability display when slider changes
      const updateProbabilityDisplay = () => {
        if (probabilityInput.value !== '') {
          const value = parseInt(probabilityInput.value);
          currentProbabilityDisplay.textContent = `${value}% that City A will be better than City B`;
        } else {
          currentProbabilityDisplay.textContent = '';
        }
      };

      // Enable submit button when all required fields are filled AND slider has been moved
      const checkFormValidity = () => {
        const probability = probabilityInput.value;
        const cityAEstimate = document.getElementById('city-a-estimate').value;
        const cityBEstimate = document.getElementById('city-b-estimate').value;
        const confidence = document.querySelector('input[name="confidence"]:checked');
        const travelChoice = document.querySelector('input[name="travel-choice"]:checked');
        
        const isValid = probability !== '' && 
                       cityAEstimate !== '' && 
                       cityBEstimate !== '' &&
                       confidence && 
                       travelChoice &&
                       this.sliderMoved; // Require that slider has been moved
        
        submitButton.disabled = !isValid;
        
        // Add/remove enabled class for styling
        if (isValid) {
          submitButton.classList.add('enabled');
        } else {
          submitButton.classList.remove('enabled');
        }
      };

      // Add event listeners
      probabilityInput.addEventListener('input', () => {
        this.sliderMoved = true; // Mark slider as moved when user interacts with it
        
        // Hide the requirement message once slider is moved
        const requirementMessage = document.getElementById('slider-requirement');
        if (requirementMessage) {
          requirementMessage.style.display = 'none';
        }
        
        updateProbabilityDisplay();
        checkFormValidity();
      });
      
      // Add event listeners for estimate inputs
      const cityAEstimate = document.getElementById('city-a-estimate');
      const cityBEstimate = document.getElementById('city-b-estimate');
      
      cityAEstimate.addEventListener('input', checkFormValidity);
      cityBEstimate.addEventListener('input', checkFormValidity);
      
      const radioInputs = document.querySelectorAll('input[type="radio"]');
      radioInputs.forEach(radio => {
        radio.addEventListener('change', checkFormValidity);
      });

      // Submit button click
      submitButton.addEventListener('click', () => {
        this.finishTrial();
      });
    }

    finishTrial() {
      const endTime = performance.now();
      const rt = endTime - this.startTime;

      // Cleanup condition instance if it exists
      if (this.conditionInstance) {
        try {
          this.conditionInstance.cleanup();
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      // Collect responses
      const probabilityInput = document.getElementById('probability-estimate');
      const cityAEstimate = document.getElementById('city-a-estimate');
      const cityBEstimate = document.getElementById('city-b-estimate');
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
        city_a_estimate: cityAEstimate.value ? parseFloat(cityAEstimate.value) : null,
        city_b_estimate: cityBEstimate.value ? parseFloat(cityBEstimate.value) : null,
        confidence_rating: confidence ? parseInt(confidence.value) : null,
        slider_moved: this.sliderMoved, // Track whether participant actively moved the slider
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

// ES6 module export for dynamic import
if (typeof window !== 'undefined') {
  window.jsPsychPredictionTask = jsPsychPredictionTask;
}

// Export for ES6 modules
export default jsPsychPredictionTask;