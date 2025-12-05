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
          type: 'line_chart',
          question: 'What was the price range of a barrel of oil in 2020?',
          image: 'src/stimuli/minivlat-images/LineChart.png',
          options: ['$16.55 - $57.52', '$19.52 - $59.00', '$23.43 - $60.72', '$21.82 - $87.52'],
          correct: 0 // $16.55 - $57.52
        },
        {
          id: 'minivlat_2',
          type: 'bar_chart',
          question: 'What is the range of the average internet speed in Asia?',
          image: 'src/stimuli/minivlat-images/BarChart.png',
          options: ['5.50Mbps - 30.60Mbps', '7.00Mbps - 29.40Mbps', '6.40Mbps - 27.38Mbps', '5.50Mbps - 28.60Mbps'],
          correct: 3 // 5.50Mbps - 28.60Mbps
        },
        {
          id: 'minivlat_3',
          type: 'stacked_bar',
          question: 'What is the cost of peanuts in Las Vegas?',
          image: 'src/stimuli/minivlat-images/StackedBar.png',
          options: ['$9.0', '$6.1', '$10.3', '$4.3'],
          correct: 1 // $6.1
        },
        {
          id: 'minivlat_4',
          type: 'stacked_100_bar',
          question: 'What is the approval rating of Republicans among postgraduate-educated people?',
          image: 'src/stimuli/minivlat-images/Stacked100.png',
          options: ['35%', '27%', '23%', '20%'],
          correct: 1 // 27%
        },
        {
          id: 'minivlat_5',
          type: 'pie_chart',
          question: 'About what is the global smartphone market share of Samsung?',
          image: 'src/stimuli/minivlat-images/PieChart.png',
          options: ['20%', '25%', '30%', '15%'],
          correct: 1 // 25%
        },
        {
          id: 'minivlat_6',
          type: 'histogram',
          question: 'How many people have rated the taxi between 4.2 and 4.4?',
          image: 'src/stimuli/minivlat-images/Histogram.png',
          options: ['270', '190', '300', '290'],
          correct: 1 // 190
        },
        {
          id: 'minivlat_7',
          type: 'scatter_plot',
          question: 'There is a negative linear relationship between the height and the weight of the 85 males.',
          image: 'src/stimuli/minivlat-images/Scatterplot.png',
          options: ['True', 'False'],
          correct: 1 // False
        },
        {
          id: 'minivlat_8',
          type: 'area_chart',
          question: 'What was the average price of a pound of coffee beans in September 2013?',
          image: 'src/stimuli/minivlat-images/AreaChart.png',
          options: ['$5.15', '$6.2', '$4.8', '$4.3'],
          correct: 0 // $5.15
        },
        {
          id: 'minivlat_9',
          type: 'stacked_area',
          question: 'What was the number of girls named \'Olivia\' in 2010 in the UK?',
          image: 'src/stimuli/minivlat-images/StackedArea.png',
          options: ['2000', '2500', '1700', '2400'],
          correct: 2 // 1700
        },
        {
          id: 'minivlat_10',
          type: 'bubble_chart',
          question: 'What is the total length of the metro system in Beijing?',
          image: 'src/stimuli/minivlat-images/BubbleChart.png',
          options: ['525 km', '495 km', '305 km', '475 km'],
          correct: 0 // 525 km
        },
        {
          id: 'minivlat_11',
          type: 'choropleth',
          question: 'In 2015, the unemployment rate for Washington (WA) was higher than that of Wisconsin (WI).',
          image: 'src/stimuli/minivlat-images/Choropleth.png',
          options: ['True', 'False'],
          correct: 0 // True
        },
        {
          id: 'minivlat_12',
          type: 'bubble_chart_multi',
          question: 'For which website was the number of unique visitors the largest in 2010?',
          image: 'src/stimuli/minivlat-images/TreeMap.png',
          options: ['Amazon', 'Chase', 'PayPal', 'Citibank'],
          correct: 3 // Citibank
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