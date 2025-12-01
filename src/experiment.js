// Air Quality Prediction Visualization Trust Study
// Two-Phase Study Design: No Visualization → With Visualization

let jsPsych;
let timeline = [];

// Initialize experiment
function initializeExperiment() {
    // Initialize jsPsych
    jsPsych = initJsPsych({
        display_element: 'jspsych-target',
        show_progress_bar: true,
        auto_update_progress_bar: false,
        message_progress_bar: 'Study Progress',
        on_finish: function() {
            const data = jsPsych.data.get();
            saveData(data);
        }
    });

    // Initialize participant configuration
    initializeParticipant();

    // Build timeline
    buildTimeline();

    // Start experiment
    jsPsych.run(timeline);
}

// Build experiment timeline
function buildTimeline() {
    // // Welcome screen
    // timeline.push({
    //     type: jsPsychHtmlButtonResponse,
    //     stimulus: `
    //         <div class="welcome-screen">
    //             <h1>Air Quality Prediction Study</h1>
    //             <p>Welcome! You are about to participate in a research study about how people make decisions using air quality predictions.</p>
    //             <p>This study examines how different ways of presenting prediction information affect trust and decision-making.</p>
    //             <p>The study will take approximately 20-25 minutes.</p>
    //             <div class="study-info">
    //                 <h3>What you'll do:</h3>
    //                 <ul>
    //                     <li>Complete a brief assessment of visualization understanding</li>
    //                     <li>Make predictions about air quality in two cities</li>
    //                     <li>Answer questions about your confidence and trust</li>
    //                 </ul>
    //             </div>
    //         </div>
    //     `,
    //     choices: ['Begin Study'],
    //     data: { trial_type: 'welcome' }
    // });

    // // Consent form
    // timeline.push({
    //     type: jsPsychHtmlButtonResponse,
    //     stimulus: `
    //         <div class="consent-form">
    //             <h2>Informed Consent</h2>
    //             <p>This research studies how visualization design affects decision-making and trust.</p>
    //             <div class="consent-details">
    //                 <h3>Study Details:</h3>
    //                 <ul>
    //                     <li><strong>Purpose:</strong> Understand how different visualization formats affect trust in prediction systems</li>
    //                     <li><strong>Time:</strong> Approximately 20-25 minutes</li>
    //                     <li><strong>Procedures:</strong> Answer questions, view charts, make predictions</li>
    //                     <li><strong>Risks:</strong> No foreseeable risks beyond normal computer use</li>
    //                 </ul>
                    
    //                 <h3>Your Rights:</h3>
    //                 <ul>
    //                     <li>Participation is completely voluntary</li>
    //                     <li>You may withdraw at any time without penalty</li>
    //                     <li>Your data will be anonymized and kept confidential</li>
    //                     <li>No personally identifying information will be collected</li>
    //                 </ul>
                    
    //                 <p><strong>Data Use:</strong> Anonymized data may be used for research publications and presentations.</p>
    //             </div>
    //             <p>By clicking "I Consent," you indicate that you understand this information and agree to participate.</p>
    //         </div>
    //     `,
    //     choices: ['I Consent', 'I Do Not Consent'],
    //     data: { trial_type: 'consent' },
    //     on_finish: function(data) {
    //         if (data.response === 1) {
    //             jsPsych.endExperiment('<p>Thank you for your interest. The experiment has ended.</p>');
    //         }
    //     }
    // });

    // // Instructions
    // timeline.push({
    //     type: jsPsychInstructions,
    //     pages: [
    //         `<div class="instructions">
    //             <h2>Study Overview</h2>
    //             <p>This study consists of two main parts:</p>
    //             <ol>
    //                 <li><strong>Visualization Assessment:</strong> Answer questions about charts and graphs</li>
    //                 <li><strong>Air Quality Predictions:</strong> Make predictions about air quality in two cities</li>
    //             </ol>
    //             <p>For the air quality predictions, you will:</p>
    //             <ul>
    //                 <li>First make predictions based on text descriptions</li>
    //                 <li>Then make predictions using visualizations</li>
    //                 <li>Answer questions about your confidence and trust</li>
    //             </ul>
    //         </div>`,
    //         `<div class="instructions">
    //             <h2>Air Quality Context</h2>
    //             <p>You will be making predictions about air quality in two hypothetical cities: <strong>City A</strong> and <strong>City B</strong>.</p>
    //             <p>Air quality is measured on a scale where:</p>
    //             <ul>
    //                 <li><strong>Higher values</strong> = Better air quality (cleaner air)</li>
    //                 <li><strong>Lower values</strong> = Worse air quality (more pollution)</li>
    //             </ul>
    //             <p>Your task will be to predict which city is likely to have better air quality in the future.</p>
    //         </div>`
    //     ],
    //     show_clickable_nav: true,
    //     data: { trial_type: 'instructions' }
    // });

    // // Visualization Literacy Test
    // timeline.push({
    //     type: jsPsychVisLiteracy,
    //     questions: ExperimentConfig.visualizationLiteracy.questions,
    //     data: { 
    //         trial_type: 'visualization_literacy',
    //         condition_id: ParticipantConfig.assignedCondition.id,
    //         condition_name: ParticipantConfig.assignedCondition.name
    //     },
    //     on_finish: function(data) {
    //         ParticipantConfig.visualizationLiteracyScore = data.total_score;
    //         console.log('Visualization literacy score:', data.total_score);
    //     }
    // });

    // // Study Introduction
    // timeline.push({
    //     type: jsPsychHtmlButtonResponse,
    //     stimulus: `
    //         <div class="phase-intro">
    //             <h2>Study Structure</h2>
    //             <p>This study consists of <strong>10 rounds</strong> of air quality predictions.</p>
    //             <p>Each round has two phases:</p>
    //             <ul>
    //                 <li><strong>Phase 1:</strong> View historical air quality data only</li>
    //                 <li><strong>Phase 2:</strong> View historical data + prediction forecasts</li>
    //             </ul>
    //             <p>You will make predictions and rate your confidence in both phases of each round.</p>
    //         </div>
    //     `,
    //     choices: ['Begin 10 Rounds'],
    //     data: { trial_type: 'study_intro' }
    // });

    // Generate 10 rounds of Phase 1 + Phase 2
    for (let round = 1; round <= 10; round++) {
        // // Round Introduction
        // timeline.push({
        //     type: jsPsychHtmlButtonResponse,
        //     stimulus: `
        //         <div class="round-intro">
        //             <h2>Round ${round} of 10</h2>
        //             <p>You will now see air quality data for a new city comparison.</p>
        //             <p>First you'll see historical data, then air quality forecasts.</p>
        //         </div>
        //     `,
        //     choices: ['Continue'],
        //     data: { 
        //         trial_type: 'round_intro',
        //         round: round
        //     }
        // });

        // Phase 1: Historical Visualization Only
        timeline.push({
            type: jsPsychPredictionTask,
            phase: 1,
            round: round,
            show_visualization: true,
            show_predictions: true,
            visualization_condition: function() { 
                return ExperimentConfig.conditions[0]; // Use baseline condition
            },
            air_quality_data: function() {
                return getAirQualityData(round);
            },
            question: ExperimentConfig.predictionTask.question,
            confidence_scale: ExperimentConfig.predictionTask.confidenceScale,
            travel_question: ExperimentConfig.predictionTask.travelQuestion,
            travel_choices: ExperimentConfig.predictionTask.travelChoices,
            data: { 
                trial_type: 'phase1_prediction',
                phase: 1,
                round: round,
                visualization_shown: true,
                predictions_shown: false,
                condition_id: ParticipantConfig.assignedCondition.id,
                condition_name: ParticipantConfig.assignedCondition.name
            },
            on_finish: function(data) {
                console.log(`Round ${round} Phase 1 complete. Probability estimate:`, data.probability_estimate);
            }
        });

        // // Trust Survey after Historical Data
        // timeline.push({
        //     type: jsPsychSurveyLikert,
        //     questions: ExperimentConfig.trustQuestions.map(q => ({
        //         prompt: q.prompt.replace('visualization', 'historical air quality data visualization'),
        //         name: q.type,
        //         labels: q.labels,
        //         required: true
        //     })),
        //     preamble: `
        //         <div class="trust-survey-preamble">
        //             <h3>Trust Assessment - Historical Data</h3>
        //             <p>Please rate your agreement with the following statements based on your experience with the historical air quality data visualization.</p>
        //         </div>
        //     `,
        //     data: { 
        //         trial_type: 'trust_survey_historical',
        //         phase: 1,
        //         round: round,
        //         condition_id: ParticipantConfig.assignedCondition.id,
        //         condition_name: ParticipantConfig.assignedCondition.name,
        //         display_format: 'historical_only'
        //     },
        //     on_finish: function(data) {
        //         // Convert 0-based to 1-based indexing and rename response fields for consistency with original plugin
        //         data.interface_trust = data.response.interface_trust !== null ? data.response.interface_trust + 1 : null;
        //         data.data_trust = data.response.data_trust !== null ? data.response.data_trust + 1 : null;
        //         data.misleading_rating = data.response.misleading_rating !== null ? data.response.misleading_rating + 1 : null;
                
        //         // Calculate composite metrics
        //         data.trust_composite = data.interface_trust && data.data_trust ? 
        //             Math.round((data.interface_trust + data.data_trust) / 2) : null;
        //         data.trust_adjusted = data.interface_trust && data.misleading_rating ? 
        //             Math.round(data.interface_trust - (data.misleading_rating - 4)) : null;
        //     }
        // });

        // Phase 2: Historical + Prediction Visualization  
        timeline.push({
            type: jsPsychPredictionTask,
            phase: 2,
            round: round,
            show_visualization: true,
            show_predictions: true,
            visualization_condition: function() { 
                return ParticipantConfig.assignedCondition; 
            },
            air_quality_data: function() {
                return getAirQualityData(round);
            },
            question: ExperimentConfig.predictionTask.question,
            confidence_scale: ExperimentConfig.predictionTask.confidenceScale,
            travel_question: ExperimentConfig.predictionTask.travelQuestion,
            travel_choices: ExperimentConfig.predictionTask.travelChoices,
            data: { 
                trial_type: 'phase2_prediction',
                phase: 2,
                round: round,
                visualization_shown: true,
                predictions_shown: true,
                condition_id: ParticipantConfig.assignedCondition.id,
                condition_name: ParticipantConfig.assignedCondition.name,
                display_format: ParticipantConfig.assignedCondition.displayFormat
            },
            on_finish: function(data) {
                console.log(`Round ${round} Phase 2 complete. Probability estimate:`, data.probability_estimate);
                if (round === 10) {
                    ParticipantConfig.allRoundsComplete = true;
                }
            }
        });

        // Trust Survey after Prediction Visualization
        timeline.push({
            type: jsPsychSurveyLikert,
            questions: ExperimentConfig.trustQuestions.map(q => ({
                prompt: q.prompt,
                name: q.type,
                labels: q.labels,
                required: true
            })),
            preamble: `
                <div class="trust-survey-preamble">
                    <h3>Trust Assessment - Air Quality Forecasts</h3>
                    <p>Please rate your agreement with the following statements based on your experience with the air quality forecast visualization.</p>
                </div>
            `,
            data: { 
                trial_type: 'trust_survey_prediction',
                phase: 2,
                round: round,
                condition_id: ParticipantConfig.assignedCondition.id,
                condition_name: ParticipantConfig.assignedCondition.name,
                display_format: ParticipantConfig.assignedCondition.displayFormat
            },
            on_finish: function(data) {
                // Convert 0-based to 1-based indexing and rename response fields for consistency with original plugin
                data.interface_trust = data.response.interface_trust !== null ? data.response.interface_trust + 1 : null;
                data.data_trust = data.response.data_trust !== null ? data.response.data_trust + 1 : null;
                data.misleading_rating = data.response.misleading_rating !== null ? data.response.misleading_rating + 1 : null;
                
                // Calculate composite metrics
                data.trust_composite = data.interface_trust && data.data_trust ? 
                    Math.round((data.interface_trust + data.data_trust) / 2) : null;
                data.trust_adjusted = data.interface_trust && data.misleading_rating ? 
                    Math.round(data.interface_trust - (data.misleading_rating - 4)) : null;
            }
        });
    }

    // Final Demographics Survey
    timeline.push({
        type: jsPsychSurveyText,
        questions: [
            {
                prompt: "What is your age?", 
                name: 'age',
                required: false,
                columns: 3
            },
            {
                prompt: "What is your field of study or profession?", 
                name: 'profession',
                required: false,
                columns: 40
            },
            {
                prompt: "How often do you work with data visualizations or charts?",
                name: 'viz_experience', 
                required: false,
                columns: 40
            }
        ],
        data: { 
            trial_type: 'demographics',
            condition_id: ParticipantConfig.assignedCondition.id,
            condition_name: ParticipantConfig.assignedCondition.name
        }
    });

    // Debrief
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class="debrief">
                <h2>Thank You!</h2>
                <p>This study investigated how different ways of presenting uncertainty in predictions affect trust and decision-making.</p>
                
                <h3>Study Background:</h3>
                <p>You were randomly assigned to one of eight different visualization conditions. The goal is to understand which formats help people make better decisions and maintain appropriate trust in prediction systems.</p>
                
                <p>The air quality data you saw was synthetic (computer-generated) for research purposes.</p>
                
                <h3>Questions?</h3>
                <p>If you have questions about this research, please contact the research team.</p>
                
                <p>Your participation contributes to understanding how to design better prediction visualizations for real-world applications like weather forecasting, financial predictions, and public health data.</p>
            </div>
        `,
        choices: ['Close Study'],
        data: { trial_type: 'debrief' }
    });
}

// Helper Functions

// Generate historical visualization for Phase 1 (no predictions)
function generateHistoricalVisualization(roundNumber) {
    console.log(`Generating historical visualization for round ${roundNumber}`);
    
    // Get historical data for this round
    const data = getAirQualityData(roundNumber);
    
    // Create embedded D3.js chart HTML
    const chartHtml = createEmbeddedHistoricalChart(data, roundNumber);
    
    return `
        <div class="historical-visualization">
            <h3>Historical Air Quality Data - Round ${roundNumber}</h3>
            <p>Below shows the air quality trends over the past 4 months for City A and City B.</p>
            <div class="chart-instructions">
                <p><strong>How to read this chart:</strong></p>
                <ul>
                    <li>Higher values = Better air quality (cleaner air)</li>
                    <li>Lower values = Worse air quality (more pollution)</li>
                    <li>Blue line = City A, Orange line = City B</li>
                </ul>
            </div>
            ${chartHtml}
            <p class="phase-note"><em>Historical data only - no prediction forecasts shown</em></p>
        </div>
    `;
}

// Get air quality data for specific round
function getAirQualityData(roundNumber = 1) {
    console.log(`Loading air quality data for round ${roundNumber}`);
    
    // Ensure we have the DataUtils available
    if (typeof DataUtils === 'undefined') {
        console.error('DataUtils not available');
        return getPlaceholderData(roundNumber);
    }
    
    try {
        // Get different data subsets for each round
        const allHistorical = DataUtils.getHistoricalData();
        const allPredictions = DataUtils.getVisualizationData().predictions;
        
        // Create round-specific data by taking different time periods
        const daysPerRound = Math.floor(allHistorical.length / 20); // Divide historical data
        const startIdx = (roundNumber - 1) * daysPerRound;
        const endIdx = startIdx + daysPerRound * 4; // Show 4 months of history per round
        
        // Filter historical data for this round's time period
        const roundHistorical = allHistorical.slice(startIdx, Math.min(endIdx, allHistorical.length));
        
        // Use same prediction scenarios but sample differently per round
        const scenariosToUse = ((roundNumber - 1) % 2) === 0 ? 
            [1, 3, 5, 7, 9] : [2, 4, 6, 8, 10]; // Alternate scenario sets
        
        const filteredScenarios = allPredictions.scenarios.filter((scenario, idx) => 
            scenariosToUse.includes(idx + 1)
        );
        
        return {
            round: roundNumber,
            historical: roundHistorical,
            predictions: {
                scenarios: filteredScenarios,
                aggregated: allPredictions.aggregated,
                bounds: allPredictions.bounds
            }
        };
        
    } catch (error) {
        console.error('Error loading air quality data:', error);
        return getPlaceholderData(roundNumber);
    }
}

// Fallback placeholder data for rounds
function getPlaceholderData(roundNumber) {
    const baseValue = 100 + (roundNumber % 3); // Slight variation per round
    
    // Generate simple placeholder historical data
    const historical = [];
    for (let i = 0; i < 30; i++) { // 30 days of history
        const date = new Date();
        date.setDate(date.getDate() - 30 + i);
        
        historical.push({
            date: date.toISOString().split('T')[0],
            city: 'A',
            aqi: baseValue + Math.sin(i/5) * 2 + (Math.random() - 0.5),
            series: 'historical',
            scenario: null
        });
        
        historical.push({
            date: date.toISOString().split('T')[0],
            city: 'B', 
            aqi: baseValue - 1 + Math.cos(i/4) * 1.5 + (Math.random() - 0.5),
            series: 'historical',
            scenario: null
        });
    }
    
    return {
        round: roundNumber,
        historical: historical,
        predictions: {
            scenarios: [],
            aggregated: [],
            bounds: []
        }
    };
}

// Create embedded D3.js chart for historical data only
function createEmbeddedHistoricalChart(data, roundNumber) {
    const chartId = `historical-chart-${roundNumber}`;
    
    // Create SVG chart HTML with inline JavaScript
    return `
        <div class="embedded-chart-container">
            <div id="${chartId}" class="chart-area"></div>
            <script>
                (function() {
                    // Chart dimensions
                    const margin = {top: 20, right: 60, bottom: 40, left: 60};
                    const width = 600 - margin.left - margin.right;
                    const height = 300 - margin.top - margin.bottom;
                    
                    // Clear any existing chart
                    d3.select('#${chartId}').selectAll('*').remove();
                    
                    // Create SVG
                    const svg = d3.select('#${chartId}')
                        .append('svg')
                        .attr('width', width + margin.left + margin.right)
                        .attr('height', height + margin.top + margin.bottom);
                        
                    const g = svg.append('g')
                        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
                    
                    // Process historical data
                    const historicalData = ${JSON.stringify(data.historical)};
                    
                    if (historicalData && historicalData.length > 0) {
                        // Parse dates and group by city
                        historicalData.forEach(d => {
                            d.date = new Date(d.date);
                            d.aqi = +d.aqi;
                        });
                        
                        const cityAData = historicalData.filter(d => d.city === 'A');
                        const cityBData = historicalData.filter(d => d.city === 'B');
                        
                        // Create scales
                        const xScale = d3.scaleTime()
                            .domain(d3.extent(historicalData, d => d.date))
                            .range([0, width]);
                            
                        const yScale = d3.scaleLinear()
                            .domain(d3.extent(historicalData, d => d.aqi))
                            .nice()
                            .range([height, 0]);
                        
                        // Create line generator
                        const line = d3.line()
                            .x(d => xScale(d.date))
                            .y(d => yScale(d.aqi))
                            .curve(d3.curveMonotoneX);
                        
                        // Add axes
                        g.append('g')
                            .attr('transform', 'translate(0,' + height + ')')
                            .call(d3.axisBottom(xScale)
                                .tickFormat(d3.timeFormat('%b %d')))
                            .selectAll('text')
                            .style('font-size', '12px');
                        
                        g.append('g')
                            .call(d3.axisLeft(yScale))
                            .selectAll('text')
                            .style('font-size', '12px');
                        
                        // Add axis labels
                        g.append('text')
                            .attr('transform', 'rotate(-90)')
                            .attr('y', 0 - margin.left)
                            .attr('x', 0 - (height / 2))
                            .attr('dy', '1em')
                            .style('text-anchor', 'middle')
                            .style('font-size', '14px')
                            .text('Air Quality Index');
                        
                        g.append('text')
                            .attr('transform', 'translate(' + (width/2) + ' ,' + (height + margin.bottom) + ')')
                            .style('text-anchor', 'middle')
                            .style('font-size', '14px')
                            .text('Date');
                        
                        // Add grid lines
                        g.append('g')
                            .attr('class', 'grid')
                            .attr('transform', 'translate(0,' + height + ')')
                            .call(d3.axisBottom(xScale)
                                .tickSize(-height)
                                .tickFormat(''))
                            .style('opacity', 0.1);
                        
                        g.append('g')
                            .attr('class', 'grid')
                            .call(d3.axisLeft(yScale)
                                .tickSize(-width)
                                .tickFormat(''))
                            .style('opacity', 0.1);
                        
                        // Add City A line
                        if (cityAData.length > 0) {
                            g.append('path')
                                .datum(cityAData)
                                .attr('class', 'city-a-line')
                                .attr('fill', 'none')
                                .attr('stroke', '#007bff')
                                .attr('stroke-width', 3)
                                .attr('d', line);
                            
                            // Add City A dots
                            g.selectAll('.city-a-dot')
                                .data(cityAData)
                                .enter().append('circle')
                                .attr('class', 'city-a-dot')
                                .attr('cx', d => xScale(d.date))
                                .attr('cy', d => yScale(d.aqi))
                                .attr('r', 4)
                                .attr('fill', '#007bff');
                        }
                        
                        // Add City B line
                        if (cityBData.length > 0) {
                            g.append('path')
                                .datum(cityBData)
                                .attr('class', 'city-b-line')
                                .attr('fill', 'none')
                                .attr('stroke', '#fd7e14')
                                .attr('stroke-width', 3)
                                .attr('d', line);
                            
                            // Add City B dots
                            g.selectAll('.city-b-dot')
                                .data(cityBData)
                                .enter().append('circle')
                                .attr('class', 'city-b-dot')
                                .attr('cx', d => xScale(d.date))
                                .attr('cy', d => yScale(d.aqi))
                                .attr('r', 4)
                                .attr('fill', '#fd7e14');
                        }
                        
                        // Add legend
                        const legend = g.append('g')
                            .attr('class', 'legend')
                            .attr('transform', 'translate(' + (width - 100) + ', 20)');
                        
                        legend.append('line')
                            .attr('x1', 0)
                            .attr('x2', 20)
                            .attr('y1', 0)
                            .attr('y2', 0)
                            .attr('stroke', '#007bff')
                            .attr('stroke-width', 3);
                        
                        legend.append('text')
                            .attr('x', 25)
                            .attr('y', 0)
                            .attr('dy', '0.35em')
                            .style('font-size', '12px')
                            .text('City A');
                        
                        legend.append('line')
                            .attr('x1', 0)
                            .attr('x2', 20)
                            .attr('y1', 15)
                            .attr('y2', 15)
                            .attr('stroke', '#fd7e14')
                            .attr('stroke-width', 3);
                        
                        legend.append('text')
                            .attr('x', 25)
                            .attr('y', 15)
                            .attr('dy', '0.35em')
                            .style('font-size', '12px')
                            .text('City B');
                    } else {
                        // Show placeholder if no data
                        g.append('text')
                            .attr('x', width/2)
                            .attr('y', height/2)
                            .attr('text-anchor', 'middle')
                            .style('font-size', '16px')
                            .style('fill', '#666')
                            .text('No historical data available for round ${roundNumber}');
                    }
                })();
            </script>
        </div>
    `;
}

// Save data function
function saveData(data) {
    const allData = data.values();
    
    // Add participant summary
    const summary = {
        participant_id: ParticipantConfig.id,
        condition: ParticipantConfig.assignedCondition,
        start_time: ParticipantConfig.startTime,
        end_time: new Date().toISOString(),
        visualization_literacy_score: ParticipantConfig.visualizationLiteracyScore,
        phase1_complete: ParticipantConfig.phase1Complete,
        phase2_complete: ParticipantConfig.phase2Complete
    };
    
    if (ExperimentConfig.dataCollection.saveToServer) {
        // Send to server
        fetch(ExperimentConfig.dataCollection.serverEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: allData, summary })
        }).then(response => {
            console.log('Data saved to server', response.status);
        }).catch(error => {
            console.error('Error saving data:', error);
            // Fallback to local storage
            localStorage.setItem(`air_quality_study_${ParticipantConfig.id}`, JSON.stringify({data: allData, summary}));
        });
    } else {
        // Save to local storage
        localStorage.setItem(`air_quality_study_${ParticipantConfig.id}`, JSON.stringify({data: allData, summary}));
        console.log('Data saved to localStorage');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting Air Quality Prediction Visualization Trust Study');
    initializeExperiment();
});