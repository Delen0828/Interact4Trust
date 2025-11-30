/**
 * jsPsych Visualization Literacy Test Plugin
 * 
 * Tests participant understanding of common visualization concepts
 * Used in the Air Quality Prediction Visualization Trust Study
 */

var jsPsychVisLiteracy = (function (jspsych) {
  'use strict';

  const info = {
    name: 'vis-literacy',
    description: 'Visualization literacy assessment with 12 questions',
    parameters: {
      questions: {
        type: jspsych.ParameterType.OBJECT,
        pretty_name: 'Questions',
        description: 'Array of visualization literacy questions',
        default: []
      },
      randomize_order: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: 'Randomize Order',
        description: 'Whether to randomize question order',
        default: false
      }
    }
  };

  class VisLiteracyPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      // Define 12 visualization literacy questions
      const questions = [
        {
          id: 'vl_1',
          type: 'line_chart_basic',
          question: 'Looking at this line chart, in which month did City A have the highest air quality value?',
          chart_data: this.generateBasicLineChart(),
          options: ['January', 'March', 'May', 'June'],
          correct: 2 // May (index 2)
        },
        {
          id: 'vl_2',
          type: 'trend_identification',
          question: 'What trend does City A show from January to June?',
          chart_data: this.generateTrendChart(),
          options: ['Increasing', 'Decreasing', 'Stable', 'No clear trend'],
          correct: 0 // Increasing
        },
        {
          id: 'vl_3',
          type: 'uncertainty_bounds',
          question: 'In this chart, what do the shaded areas around the line represent?',
          chart_data: this.generateUncertaintyChart(),
          options: ['Data errors', 'Uncertainty/confidence ranges', 'Different time periods', 'Missing data'],
          correct: 1 // Uncertainty ranges
        },
        {
          id: 'vl_4',
          type: 'comparison',
          question: 'According to this chart, which city generally has better air quality?',
          chart_data: this.generateComparisonChart(),
          options: ['City A', 'City B', 'They are about the same', 'Cannot determine'],
          correct: 0 // City A
        },
        {
          id: 'vl_5',
          type: 'prediction_lines',
          question: 'The dotted lines in this chart represent:',
          chart_data: this.generatePredictionChart(),
          options: ['Past data', 'Future predictions', 'Data gaps', 'Average values'],
          correct: 1 // Future predictions
        },
        {
          id: 'vl_6',
          type: 'scale_reading',
          question: 'What is the approximate air quality value for City B in April?',
          chart_data: this.generateScaleChart(),
          options: ['98', '101', '104', '107'],
          correct: 1 // 101
        },
        {
          id: 'vl_7',
          type: 'multiple_lines',
          question: 'This chart shows multiple prediction scenarios. How many different scenarios are displayed?',
          chart_data: this.generateMultipleLinesChart(),
          options: ['3', '5', '7', '9'],
          correct: 1 // 5
        },
        {
          id: 'vl_8',
          type: 'confidence_interpretation',
          question: 'When prediction lines are closer together, this usually indicates:',
          chart_data: null, // Text-only question
          options: ['Higher uncertainty', 'Lower uncertainty', 'No relationship to uncertainty', 'Data errors'],
          correct: 1 // Lower uncertainty
        },
        {
          id: 'vl_9',
          type: 'axis_interpretation',
          question: 'On the Y-axis of this air quality chart, higher values represent:',
          chart_data: this.generateAxisChart(),
          options: ['Worse air quality', 'Better air quality', 'More data points', 'Longer time periods'],
          correct: 1 // Better air quality
        },
        {
          id: 'vl_10',
          type: 'intersection_reading',
          question: 'At approximately what month do the two city trends intersect (cross over)?',
          chart_data: this.generateIntersectionChart(),
          options: ['February', 'March', 'April', 'May'],
          correct: 2 // April
        },
        {
          id: 'vl_11',
          type: 'variability',
          question: 'Which city shows more variability (fluctuation) in its air quality?',
          chart_data: this.generateVariabilityChart(),
          options: ['City A', 'City B', 'Both show equal variability', 'Cannot determine'],
          correct: 1 // City B
        },
        {
          id: 'vl_12',
          type: 'aggregation',
          question: 'The thick line among multiple thin lines typically represents:',
          chart_data: this.generateAggregationChart(),
          options: ['The most recent data', 'The average/mean', 'The most accurate prediction', 'Random selection'],
          correct: 1 // Average/mean
        }
      ];

      this.questions = trial.randomize_order ? 
        this.jsPsych.randomization.shuffle(questions) : questions;
      
      this.currentQuestion = 0;
      this.responses = [];
      this.startTime = performance.now();

      this.showQuestion();
    }

    showQuestion() {
      const question = this.questions[this.currentQuestion];
      
      let html = `
        <div class="vis-literacy-container">
          <div class="progress-info">
            <h2>Visualization Assessment</h2>
            <p>Question ${this.currentQuestion + 1} of ${this.questions.length}</p>
          </div>
          
          <div class="question-container">
            ${question.chart_data ? `<div class="chart-container" id="vis-chart">${question.chart_data}</div>` : ''}
            
            <div class="question-text">
              <h3>${question.question}</h3>
            </div>
            
            <div class="options-container">
              ${question.options.map((option, index) => `
                <label class="option-label">
                  <input type="radio" name="vis_literacy_response" value="${index}">
                  <span class="option-text">${option}</span>
                </label>
              `).join('')}
            </div>
            
            <div class="button-container">
              <button class="continue-btn" disabled onclick="this.nextQuestion()">
                ${this.currentQuestion < this.questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
              </button>
            </div>
          </div>
        </div>
      `;

      const display_element = this.jsPsych.getDisplayElement();
      display_element.innerHTML = html;

      // Enable button when option selected
      const radioButtons = display_element.querySelectorAll('input[name="vis_literacy_response"]');
      const continueButton = display_element.querySelector('.continue-btn');
      
      radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
          continueButton.disabled = false;
        });
      });

      // Add click handler for continue button
      continueButton.addEventListener('click', () => {
        this.nextQuestion();
      });

      // Render chart if needed
      if (question.chart_data && question.type !== 'text_only') {
        this.renderChart(question);
      }
    }

    nextQuestion() {
      const display_element = this.jsPsych.getDisplayElement();
      const selectedOption = display_element.querySelector('input[name="vis_literacy_response"]:checked');
      
      if (!selectedOption) return;

      const question = this.questions[this.currentQuestion];
      const response = parseInt(selectedOption.value);
      const isCorrect = response === question.correct;

      this.responses.push({
        question_id: question.id,
        question_type: question.type,
        question_text: question.question,
        response: response,
        correct_answer: question.correct,
        is_correct: isCorrect,
        rt: performance.now() - this.startTime
      });

      this.currentQuestion++;

      if (this.currentQuestion < this.questions.length) {
        this.startTime = performance.now(); // Reset timer for next question
        this.showQuestion();
      } else {
        this.finishTrial();
      }
    }

    finishTrial() {
      const totalScore = this.responses.filter(r => r.is_correct).length;
      const totalQuestions = this.responses.length;
      const percentScore = Math.round((totalScore / totalQuestions) * 100);

      const trial_data = {
        responses: this.responses,
        total_score: totalScore,
        total_questions: totalQuestions,
        percent_score: percentScore,
        rt_total: this.responses.reduce((sum, r) => sum + r.rt, 0)
      };

      // Show completion message
      const display_element = this.jsPsych.getDisplayElement();
      display_element.innerHTML = `
        <div class="vis-literacy-complete">
          <h2>Assessment Complete</h2>
          <p>You answered ${totalScore} out of ${totalQuestions} questions correctly.</p>
          <p>Score: ${percentScore}%</p>
          <button onclick="this.jsPsych.finishTrial(${JSON.stringify(trial_data).replace(/"/g, '&quot;')})">
            Continue to Study
          </button>
        </div>
      `;

      // Auto-continue after 2 seconds
      setTimeout(() => {
        this.jsPsych.finishTrial(trial_data);
      }, 2000);
    }

    renderChart(question) {
      // Simple SVG chart rendering based on question type
      // This is a placeholder - full implementation would use D3.js
      const chartContainer = document.getElementById('vis-chart');
      if (chartContainer) {
        chartContainer.innerHTML = question.chart_data;
      }
    }

    // Chart generation methods (simplified SVG)
    generateBasicLineChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="150" x2="350" y2="50" stroke="#007bff" stroke-width="2"/>
          <text x="50" y="170" font-size="12">Jan</text>
          <text x="150" y="170" font-size="12">Mar</text>
          <text x="250" y="170" font-size="12">May</text>
          <text x="350" y="170" font-size="12">Jun</text>
          <text x="20" y="160" font-size="10">95</text>
          <text x="20" y="60" font-size="10">105</text>
          <text x="180" y="20" font-size="14">City A Air Quality</text>
        </svg>
      `;
    }

    generateTrendChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <polyline points="50,150 100,140 150,120 200,110 250,90 300,70 350,50" 
                    fill="none" stroke="#007bff" stroke-width="2"/>
          <text x="180" y="20" font-size="14">City A Trend</text>
        </svg>
      `;
    }

    generateUncertaintyChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <path d="M50,130 Q200,80 350,60 L350,80 Q200,120 50,150 Z" 
                fill="#007bff" fill-opacity="0.3"/>
          <line x1="50" y1="140" x2="350" y2="70" stroke="#007bff" stroke-width="2"/>
          <text x="150" y="20" font-size="14">Prediction with Uncertainty</text>
        </svg>
      `;
    }

    generateComparisonChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="120" x2="350" y2="80" stroke="#007bff" stroke-width="2"/>
          <line x1="50" y1="140" x2="350" y2="120" stroke="#fd7e14" stroke-width="2"/>
          <text x="360" y="85" font-size="12" fill="#007bff">City A</text>
          <text x="360" y="125" font-size="12" fill="#fd7e14">City B</text>
        </svg>
      `;
    }

    generatePredictionChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="120" x2="200" y2="100" stroke="#007bff" stroke-width="2"/>
          <line x1="200" y1="100" x2="350" y2="80" stroke="#007bff" stroke-width="2" stroke-dasharray="5,5"/>
          <line x1="200" y1="0" x2="200" y2="200" stroke="#ccc" stroke-width="1"/>
          <text x="100" y="190" font-size="12">Historical</text>
          <text x="250" y="190" font-size="12">Future</text>
        </svg>
      `;
    }

    generateScaleChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="120" x2="350" y2="100" stroke="#fd7e14" stroke-width="2"/>
          <circle cx="150" cy="110" r="3" fill="#fd7e14"/>
          <text x="20" y="60" font-size="10">105</text>
          <text x="20" y="100" font-size="10">101</text>
          <text x="20" y="140" font-size="10">97</text>
          <text x="140" y="190" font-size="12">Apr</text>
        </svg>
      `;
    }

    generateMultipleLinesChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="120" x2="350" y2="80" stroke="#007bff" stroke-width="1" opacity="0.6"/>
          <line x1="50" y1="130" x2="350" y2="90" stroke="#007bff" stroke-width="1" opacity="0.6"/>
          <line x1="50" y1="110" x2="350" y2="70" stroke="#007bff" stroke-width="1" opacity="0.6"/>
          <line x1="50" y1="140" x2="350" y2="100" stroke="#007bff" stroke-width="1" opacity="0.6"/>
          <line x1="50" y1="125" x2="350" y2="85" stroke="#007bff" stroke-width="1" opacity="0.6"/>
          <line x1="50" y1="125" x2="350" y2="85" stroke="#007bff" stroke-width="3"/>
          <text x="150" y="20" font-size="14">Multiple Scenarios</text>
        </svg>
      `;
    }

    generateAxisChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="150" x2="350" y2="70" stroke="#007bff" stroke-width="2"/>
          <text x="15" y="160" font-size="12">Poor</text>
          <text x="15" y="80" font-size="12">Good</text>
          <text x="10" y="30" font-size="12">Air Quality</text>
        </svg>
      `;
    }

    generateIntersectionChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="80" x2="350" y2="140" stroke="#007bff" stroke-width="2"/>
          <line x1="50" y1="140" x2="350" y2="80" stroke="#fd7e14" stroke-width="2"/>
          <circle cx="200" cy="110" r="4" fill="red"/>
          <text x="50" y="190" font-size="12">Feb</text>
          <text x="125" y="190" font-size="12">Mar</text>
          <text x="200" y="190" font-size="12">Apr</text>
          <text x="275" y="190" font-size="12">May</text>
        </svg>
      `;
    }

    generateVariabilityChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <polyline points="50,120 100,115 150,125 200,120 250,125 300,120 350,125" 
                    fill="none" stroke="#007bff" stroke-width="2"/>
          <polyline points="50,140 100,130 150,150 200,125 250,155 300,135 350,160" 
                    fill="none" stroke="#fd7e14" stroke-width="2"/>
          <text x="360" y="125" font-size="12" fill="#007bff">City A</text>
          <text x="360" y="165" font-size="12" fill="#fd7e14">City B</text>
        </svg>
      `;
    }

    generateAggregationChart() {
      return `
        <svg width="400" height="200" style="border: 1px solid #ccc;">
          <line x1="50" y1="110" x2="350" y2="90" stroke="#007bff" stroke-width="1" opacity="0.4"/>
          <line x1="50" y1="120" x2="350" y2="100" stroke="#007bff" stroke-width="1" opacity="0.4"/>
          <line x1="50" y1="130" x2="350" y2="110" stroke="#007bff" stroke-width="1" opacity="0.4"/>
          <line x1="50" y1="125" x2="350" y2="105" stroke="#007bff" stroke-width="1" opacity="0.4"/>
          <line x1="50" y1="119" x2="350" y2="99" stroke="#007bff" stroke-width="3"/>
          <text x="150" y="20" font-size="14">Thick vs Thin Lines</text>
        </svg>
      `;
    }
  }

  VisLiteracyPlugin.info = info;

  return VisLiteracyPlugin;
})(jsPsychModule);