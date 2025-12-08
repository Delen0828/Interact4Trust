/**
 * jsPsych Visualization Literacy Test Plugin
 * 
 * Tests participant understanding of common visualization concepts
 * Used in the Air Quality Prediction Visualization Trust Study
 */

var jsPsychVisLiteracy = (function (jspsych) {
	'use strict';

	// Use the global jsPsychModule if available, otherwise fall back to jspsych parameter
	jspsych = jspsych || (typeof jsPsychModule !== 'undefined' ? jsPsychModule : null);

	if (!jspsych) {
		console.error('jsPsych not available for vis-literacy plugin');
		return null;
	}

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
			// Define 12 Mini-VLAT questions (authentic questions from Washington University research)
			const questions = [
				{
					id: 'minivlat_1',
					type: 'treemap',
					question: 'eBay is nested in the Software category.',
					image: 'src/stimuli/minivlat-images/TreeMap.png',
					options: ['True', 'False', "I don't know"],
					correct: 1  // False
				},
				{
					id: 'minivlat_2',
					type: 'stacked_100_bar',
					question: 'Which country has the lowest proportion of Gold medals?',
					image: 'src/stimuli/minivlat-images/Stacked100.png',
					options: ['USA', 'Great Britain', 'Japan', 'Australia', "I don't know"],
					correct: 1  // Great Britain
				},
				{
					id: 'minivlat_3',
					type: 'histogram',
					question: 'What distance have customers traveled the most?',
					image: 'src/stimuli/minivlat-images/Histogram.png',
					options: ['60–70 km', '30–40 km', '20–30 km', '50–60 km', "I don't know"],
					correct: 1  // 30–40 km
				},
				{
					id: 'minivlat_4',
					type: 'choropleth',
					question: 'In 2020, the unemployment rate for Washington (WA) was higher than that of Wisconsin (WI).',
					image: 'src/stimuli/minivlat-images/Choropleth.png',
					options: ['True', 'False', "I don't know"],
					correct: 0  // True
				},
				{
					id: 'minivlat_5',
					type: 'pie_chart',
					question: 'What is the approximate global smartphone market share of Samsung?',
					image: 'src/stimuli/minivlat-images/PieChart.png',
					options: ['17.6%', '25.3%', '10.9%', '35.2%', "I don't know"],
					correct: 0  // 17.6%
				},
				{
					id: 'minivlat_6',
					type: 'bubble_chart',
					question: 'Which has the largest number of metro stations?',
					image: 'src/stimuli/minivlat-images/BubbleChart.png',
					options: ['Beijing', 'Shanghai', 'London', 'Seoul', "I don't know"],
					correct: 1  // Shanghai
				},
				{
					id: 'minivlat_7',
					type: 'stacked_bar',
					question: 'What is the cost of peanuts in Seoul?',
					image: 'src/stimuli/minivlat-images/StackedBar.png',
					options: ['$5.2', '$6.1', '$7.5', '$4.5', "I don't know"],
					correct: 1  // $6.1
				},
				{
					id: 'minivlat_8',
					type: 'line_chart',
					question: 'What was the price of a barrel of oil in February 2020?',
					image: 'src/stimuli/minivlat-images/LineChart.png',
					options: ['$50.54', '$47.02', '$42.34', '$43.48', "I don't know"],
					correct: 0  // $50.54
				},
				{
					id: 'minivlat_9',
					type: 'bar_chart',
					question: 'What is the average internet speed in Japan?',
					image: 'src/stimuli/minivlat-images/BarChart.png',
					options: ['42.30 Mbps', '40.51 Mbps', '35.25 Mbps', '16.16 Mbps', "I don't know"],
					correct: 1  // 40.51 Mbps
				},
				{
					id: 'minivlat_10',
					type: 'area_chart',
					question: 'What was the average price of a pound of coffee in October 2019?',
					image: 'src/stimuli/minivlat-images/AreaChart.png',
					options: ['$0.71', '$0.90', '$0.80', '$0.63', "I don't know"],
					correct: 0  // $0.71
				},
				{
					id: 'minivlat_11',
					type: 'stacked_area',
					question: 'What was the ratio of girls named "Isla" to girls named "Amelia" in 2012 in the UK?',
					image: 'src/stimuli/minivlat-images/StackedArea.png',
					options: ['1 to 1', '1 to 2', '1 to 3', '1 to 4', "I don't know"],
					correct: 1  // 1 to 2
				},
				{
					id: 'minivlat_12',
					type: 'scatter_plot',
					question: 'There is a negative relationship between the height and weight of the 85 males.',
					image: 'src/stimuli/minivlat-images/Scatterplot.png',
					options: ['True', 'False', "I don't know"],
					correct: 1  // False
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
          
          <div class="minivlat-layout">
            <div class="chart-container">
              ${question.image ? `<img src="${question.image}" alt="Visualization for question ${this.currentQuestion + 1}" class="minivlat-chart">` : ''}
            </div>
            
            <div class="question-panel">
              <div class="question-text">
                <h3>${question.question}</h3>
              </div>
              
              <div class="options-container">
                ${question.options.map((option, index) => `
                  <button type="button" class="option-button" data-value="${index}">
                    ${option}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div class="button-container">
            <button class="continue-btn minivlat-continue">
              ${this.currentQuestion < this.questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
            </button>
          </div>
        </div>
      `;

			const display_element = this.jsPsych.getDisplayElement();
			display_element.innerHTML = html;

			// Handle option button clicks
			const optionButtons = display_element.querySelectorAll('.option-button');
			const continueButton = display_element.querySelector('.continue-btn');
			let selectedValue = null;

			optionButtons.forEach(button => {
				button.addEventListener('click', () => {
					// Remove selected class from all buttons
					optionButtons.forEach(btn => btn.classList.remove('selected'));

					// Add selected class to clicked button
					button.classList.add('selected');

					// Store selected value
					selectedValue = parseInt(button.getAttribute('data-value'));

					// Enable continue button - remove disabled and add enabled class
					continueButton.disabled = false;
					continueButton.classList.add('enabled');
				});
			});

			// Add click handler for continue button
			continueButton.addEventListener('click', () => {
				if (selectedValue !== null) {
					this.selectedValue = selectedValue;
					this.nextQuestion();
				}
			});

			// Images are loaded directly via img tags, no additional rendering needed
		}

		nextQuestion() {
			if (this.selectedValue === null) return;

			const question = this.questions[this.currentQuestion];
			const response = this.selectedValue;
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
			this.selectedValue = null; // Reset for next question

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

			// Finish trial immediately without showing completion page
			this.jsPsych.finishTrial(trial_data);
		}

	}

	VisLiteracyPlugin.info = info;

	return VisLiteracyPlugin;
})(typeof jsPsychModule !== 'undefined' ? jsPsychModule : undefined);