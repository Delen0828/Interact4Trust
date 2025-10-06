var jsPsychPlantCultivation = (function (jsPsych) {
    "use strict";

    const info = {
        name: "plant-cultivation",
        parameters: {
            growth_data: {
                type: "object",
                default: undefined,
                description: "Historical plant growth data to display"
            },
            predictions: {
                type: "object",
                default: undefined,
                description: "Prediction data based on condition"
            },
            condition: {
                type: "object",
                default: undefined,
                description: "Current experimental condition"
            },
            greenhouse: {
                type: "object",
                default: undefined,
                description: "Current greenhouse state"
            },
            round: {
                type: "int",
                default: 1,
                description: "Current round number"
            },
            show_feedback: {
                type: "bool",
                default: true,
                description: "Whether to show feedback after decision"
            },
            feedback_duration: {
                type: "int",
                default: 3000,
                description: "How long to show feedback"
            }
        }
    };

    class PlantCultivationPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            // Initialize trial data
            const start_time = performance.now();
            let response = {
                action: null,
                plants: 0,
                greenhouse_before: {...trial.greenhouse},
                greenhouse_after: null,
                yield_result: 0
            };

            // Create main container with debug info
            const debugInfo = ExperimentConfig.debug.showStimuliInfo && trial.predictions?.metadata ? 
                `<div class="debug-info">
                    <strong>Stimuli ${trial.predictions.metadata.stimuliIndex || 0}/15:</strong> 
                    ${trial.predictions.pattern || 'unknown'} - ${trial.predictions.trend || 'unknown'}
                    <br><small>${trial.predictions.description || 'No description'}</small>
                </div>` : '';

            let html = `
                <div class="plant-cultivation-container">
                    <div class="cultivation-header">
                        <h2>Alien Plant Growth Lab - ${trial.growth_data.plantName || `Plant #${trial.growth_data.plantIndex || trial.trial}`}</h2>
                        <div class="greenhouse-status">
                            <span>Resources: ${trial.greenhouse.resources.toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}</span>
                            <span>Round: ${trial.round}/10</span>
                        </div>
                        ${debugInfo}
                    </div>
                    
                    <div class="chart-container" id="growth-chart"></div>
                    
                    <div class="cultivation-controls">
                        <div class="action-input-container">
                            <div class="input-row">
                                <label for="action-type">Action:</label>
                                <select id="action-type" class="action-select">
                                    <option value="">Select Action</option>
                                    <option value="cultivate">CULTIVATE (Expect Growth)</option>
                                    <option value="prune">PRUNE (Expect Decline)</option>
                                </select>
                            </div>
                            
                            <div class="input-row">
                                <label for="resource-amount">Resource Amount:</label>
                                <input type="number" id="resource-amount" min="0" step="1" value="0" placeholder="Enter resource units">
                                <span id="plant-count"></span>
                            </div>
                            
                        </div>
                        
                        <button id="confirm-action" class="confirm-btn" disabled>Confirm Action</button>
                    </div>
                    
                    <div id="feedback-overlay" class="feedback-overlay hidden"></div>
                </div>
            `;

            display_element.innerHTML = html;

            // Draw the chart
            this.drawChart(trial.growth_data, trial.predictions, trial.condition);

            // Setup event handlers
            const actionType = display_element.querySelector('#action-type');
            const resourceInput = display_element.querySelector('#resource-amount');
            const plantCount = display_element.querySelector('#plant-count');
            const actionContainer = display_element.querySelector('.action-input-container');
            const confirmBtn = display_element.querySelector('#confirm-action');

            // Update action display and validation
            const updateAction = () => {
                const action = actionType.value;
                const resourceAmount = parseFloat(resourceInput.value) || 0;
                const currentHeight = trial.growth_data.heights[trial.growth_data.heights.length - 1];
                const maxResources = trial.greenhouse.resources;
                
                // Calculate plants from resource amount
                const plants = resourceAmount > 0 ? Math.floor(resourceAmount / 100) : 0;
                plantCount.textContent = plants > 0 ? `(${plants} plants)` : '';
                
                // Validate resource amount against available resources - create/remove error message dynamically
                let existingError = actionContainer.querySelector('.error-message');
                
                if (resourceAmount > 0 && resourceAmount > maxResources) {
                    // Create error message if it doesn't exist
                    if (!existingError) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.textContent = `Maximum available: ${maxResources.toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}`;
                        actionContainer.appendChild(errorDiv);
                    } else {
                        // Update existing error message
                        existingError.textContent = `Maximum available: ${maxResources.toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}`;
                    }
                } else {
                    // Remove error message if it exists
                    if (existingError) {
                        existingError.remove();
                    }
                }
                
                // Enable confirm button if action is selected and resource amount is valid
                const hasValidAction = action && resourceAmount > 0 && resourceAmount <= maxResources;
                confirmBtn.disabled = !hasValidAction;
            };

            // Get current action details
            const getCurrentAction = () => {
                const action = actionType.value;
                const resourceAmount = parseFloat(resourceInput.value) || 0;
                const plants = resourceAmount > 0 ? Math.floor(resourceAmount / 100) : 0;
                
                return {
                    action: action || null,
                    resourceAmount: resourceAmount,
                    plants: plants
                };
            };

            // Event handlers
            actionType.addEventListener('change', updateAction);
            resourceInput.addEventListener('input', updateAction);

            // Confirm action handler
            confirmBtn.addEventListener('click', () => {
                const end_time = performance.now();
                const rt = Math.round(end_time - start_time);
                
                const currentAction = getCurrentAction();
                response.action = currentAction.action;
                response.resource_amount = currentAction.resourceAmount;
                response.plants = currentAction.plants;
                response.rt = rt;

                // Calculate action outcome
                const currentHeight = trial.growth_data.heights[trial.growth_data.heights.length - 1];
                const groundTruth = trial.predictions.groundTruth;
                const cultivationCost = currentAction.resourceAmount * ExperimentConfig.greenhouse.cultivationCostRate;

                if (response.action === 'cultivate') {
                    // Cultivate: gain when height increases
                    const growthChange = groundTruth - currentHeight;
                    response.yield_result = (currentAction.plants * growthChange * 10) - cultivationCost;
                    response.greenhouse_after = {
                        resources: trial.greenhouse.resources + response.yield_result,
                        totalValue: trial.greenhouse.resources + response.yield_result
                    };
                } else if (response.action === 'prune') {
                    // Prune: gain when height decreases
                    const growthChange = currentHeight - groundTruth;
                    response.yield_result = (currentAction.plants * growthChange * 10) - cultivationCost;
                    response.greenhouse_after = {
                        resources: trial.greenhouse.resources + response.yield_result,
                        totalValue: trial.greenhouse.resources + response.yield_result
                    };
                }

                // Show feedback if enabled
                if (trial.show_feedback) {
                    this.showFeedback(response, groundTruth, () => {
                        this.endTrial(display_element, response, trial);
                    });
                } else {
                    this.endTrial(display_element, response, trial);
                }
            });

            // Initialize confirm button state
            confirmBtn.disabled = true;
            
            // Initialize action display
            updateAction();
        }

        drawChart(growthData, predictions, condition) {
            const container = document.querySelector('#growth-chart');
            const config = ExperimentConfig.chart;
            
            const width = config.width;
            const height = config.height;
            const margin = config.margins;
            
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;

            const g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Prepare data - handle both array and single value predictions
            const allHeights = [...growthData.heights];
            const dates = growthData.dates.map(d => new Date(d));
            
            // Handle predictions.values which might be array or single value
            const predictionValues = Array.isArray(predictions.values) ? predictions.values : [predictions.values];
            const flatPredictionValues = predictionValues.flat();

            // Scales
            const xScale = d3.scaleTime()
                .domain(d3.extent(dates))
                .range([0, chartWidth]);

            // Fixed y-scale from 0 to 200
            const yScale = d3.scaleLinear()
                .domain([0, 200])
                .range([chartHeight, 0]);

            // Grid lines
            g.append('g')
                .attr('class', 'grid')
                .attr('transform', `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale)
                    .tickSize(-chartHeight)
                    .tickFormat(''))
                .style('stroke-dasharray', '3,3')
                .style('opacity', 0.3);

            g.append('g')
                .attr('class', 'grid')
                .call(d3.axisLeft(yScale)
                    .tickSize(-chartWidth)
                    .tickFormat(''))
                .style('stroke-dasharray', '3,3')
                .style('opacity', 0.3);

            // Draw historical data with lines and dots
            const historicalHeights = allHeights.slice(0, -1);
            const historicalDates = dates.slice(0, -1);
            
            // Add current height to historical for complete line
            const currentHeight = allHeights[allHeights.length - 1];
            const currentDate = dates[dates.length - 1];
            
            // Draw lines connecting historical dots (including current)
            g.append('path')
                .datum(allHeights)
                .attr('class', 'historical-line')
                .attr('fill', 'none')
                .attr('stroke', config.colors.historical)
                .attr('stroke-width', 2)
                .attr('d', d3.line()
                    .x((d, i) => xScale(dates[i]))
                    .y(d => yScale(d))
                );
            
            // Add dots for historical data points
            g.selectAll('.historical-dot')
                .data(historicalHeights)
                .enter().append('circle')
                .attr('class', 'historical-dot')
                .attr('cx', (d, i) => xScale(historicalDates[i]))
                .attr('cy', d => yScale(d))
                .attr('r', 4)
                .attr('fill', config.colors.historical);
            
            // Add current height dot (the last height that connects to predictions)
            g.append('circle')
                .attr('class', 'current-dot')
                .attr('cx', xScale(currentDate))
                .attr('cy', yScale(currentHeight))
                .attr('r', 5)
                .attr('fill', config.colors.historical)
                .attr('stroke', 'white')
                .attr('stroke-width', 1);

            // Store chart context for later use (e.g., ground truth rendering)
            this.chartContext = {
                currentHeight: currentHeight,
                currentDate: currentDate,
                dates: dates,
                allHeights: allHeights,
                xScale: xScale,
                yScale: yScale,
                chartWidth: chartWidth,
                chartHeight: chartHeight
            };
            
            // Draw predictions with lines and dots based on condition
            const predictionDate = new Date(currentDate);
            predictionDate.setDate(predictionDate.getDate() + 1);
            
            if (condition.displayFormat === 'aggregation') {
                // Single prediction line and dot
                const firstPrediction = Array.isArray(predictions.values) ? predictions.values[0] : predictions.values;
                const predictionData = [currentHeight, firstPrediction];
                const predictionDates = [currentDate, predictionDate];
                
                // LOG AGGREGATION DATA
                console.log('=== AGGREGATION CONDITION ===');
                console.log('Predictions object:', predictions);
                console.log('predictions.values:', predictions.values);
                console.log('Array.isArray(predictions.values):', Array.isArray(predictions.values));
                console.log('firstPrediction (used for line):', firstPrediction);
                console.log('predictionData (line points):', predictionData);
                console.log('currentHeight:', currentHeight);
                console.log('===============================');
                
                // Draw line from current to prediction
                g.append('path')
                    .datum(predictionData)
                    .attr('fill', 'none')
                    .attr('stroke', config.colors.prediction.aggregation)
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '5,5')
                    .attr('d', d3.line()
                        .x((d, i) => xScale(predictionDates[i]))
                        .y(d => yScale(d))
                    );
                
                // Add prediction dot
                g.append('circle')
                    .attr('class', 'prediction-dot')
                    .attr('cx', xScale(predictionDate))
                    .attr('cy', yScale(firstPrediction))
                    .attr('r', 5)
                    .attr('fill', config.colors.prediction.aggregation)
                    .attr('stroke', 'white')
                    .attr('stroke-width', 1);

            } else {
                // Alternative condition: Show aggregate by default, alternatives on hover
                // Handle sophisticated patterns from the 15 stimuli
                
                // Create container group for all predictions
                const predictionsGroup = g.append('g').attr('class', 'predictions-container');
                
                // Ensure we have array of predictions
                const predictionArray = Array.isArray(predictions.values) ? predictions.values : [predictions.values];
                
                // Use groundTruth for aggregate line (the actual aggregation value), not first alternative
                const aggregateValue = predictions.groundTruth;
                
                // LOG ALTERNATIVE CONDITION - AGGREGATE LINE
                console.log('=== ALTERNATIVE CONDITION - AGGREGATE LINE ===');
                console.log('Predictions object:', predictions);
                console.log('predictions.values:', predictions.values);
                console.log('predictions.groundTruth (correct aggregate):', predictions.groundTruth);
                console.log('Array.isArray(predictions.values):', Array.isArray(predictions.values));
                console.log('predictionArray:', predictionArray);
                console.log('aggregateValue (used for aggregate line):', aggregateValue);
                console.log('currentHeight:', currentHeight);
                console.log('============================================');
                
                // Draw aggregate prediction (initially visible)
                const aggregateData = [currentHeight, aggregateValue];
                const aggregateDates = [currentDate, predictionDate];
                
                const aggregateGroup = predictionsGroup.append('g')
                    .attr('class', 'aggregate-prediction')
                    .style('opacity', 1);
                
                aggregateGroup.append('path')
                    .datum(aggregateData)
                    .attr('fill', 'none')
                    .attr('stroke', config.colors.prediction.aggregation)
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '5,5')
                    .attr('d', d3.line()
                        .x((d, i) => xScale(aggregateDates[i]))
                        .y(d => yScale(d))
                    );
                
                aggregateGroup.append('circle')
                    .attr('class', 'prediction-dot')
                    .attr('cx', xScale(predictionDate))
                    .attr('cy', yScale(aggregateValue))
                    .attr('r', 5)
                    .attr('fill', config.colors.prediction.aggregation)
                    .attr('stroke', 'white')
                    .attr('stroke-width', 1);
                
                // Draw alternative predictions (initially hidden) only if we have multiple predictions
                if (predictionArray.length > 1) {
                    console.log('=== ALTERNATIVE CONDITION - ALL ALTERNATIVES ===');
                    console.log('predictionArray.length:', predictionArray.length);
                    console.log('All predictions in array:', predictionArray);
                    console.log('===============================================');
                    
                    const alternativeGroup = predictionsGroup.append('g')
                        .attr('class', 'alternative-predictions')
                        .style('opacity', 0);
                    
                    predictionArray.forEach((pred, i) => {
                        const predictionData = [currentHeight, pred];
                        const predictionDates = [currentDate, predictionDate];
                        
                        console.log(`Alternative ${i}: pred=${pred}, predictionData=[${predictionData.join(', ')}]`);
                        
                        // Use fixed opacity for all alternative lines
                        const opacity = 0.5;
                        
                        const colorIndex = Math.min(i, config.colors.prediction.alternative.length - 1);
                        
                        // Draw line from current to each prediction
                        alternativeGroup.append('path')
                            .datum(predictionData)
                            .attr('fill', 'none')
                            .attr('stroke', config.colors.prediction.alternative[colorIndex])
                            .attr('stroke-width', Math.max(1, 2.5 - i * 0.3))
                            .attr('stroke-dasharray', '3,2')
                            .attr('opacity', opacity)
                            .attr('d', d3.line()
                                .x((d, j) => xScale(predictionDates[j]))
                                .y(d => yScale(d))
                            );
                        
                        // Add prediction dot
                        alternativeGroup.append('circle')
                            .attr('class', `prediction-dot prediction-dot-${i}`)
                            .attr('cx', xScale(predictionDate))
                            .attr('cy', yScale(pred))
                            .attr('r', Math.max(2, 5 - i * 0.4))  // Graduated sizes for confidence
                            .attr('fill', config.colors.prediction.alternative[colorIndex])
                            .attr('opacity', opacity)
                            .attr('stroke', 'white')
                            .attr('stroke-width', 0.5);
                    });
                
                    // Add invisible hover area over the chart for interaction (only if we have alternatives)
                    const hoverArea = svg.append('rect')
                        .attr('class', 'hover-area')
                        .attr('x', margin.left)
                        .attr('y', margin.top)
                        .attr('width', chartWidth)
                        .attr('height', chartHeight)
                        .attr('fill', 'transparent')
                        .attr('pointer-events', 'all');
                    
                    // Add hover event handlers for sophisticated pattern interaction
                    hoverArea
                        .on('mouseenter', function() {
                            // Hide aggregate, show alternatives with smooth transition
                            aggregateGroup.transition()
                                .duration(300)
                                .style('opacity', 0);
                            alternativeGroup.transition()
                                .duration(300)
                                .style('opacity', 1);
                        })
                        .on('mouseleave', function() {
                            // Show aggregate, hide alternatives with smooth transition
                            alternativeGroup.transition()
                                .duration(300)
                                .style('opacity', 0);
                            aggregateGroup.transition()
                                .duration(300)
                                .style('opacity', 1);
                        });
                } else {
                    // No alternatives available, just show the single prediction
                    console.log('Single prediction in alternative mode:', aggregateValue);
                }
            }

            // Axes
            g.append('g')
                .attr('transform', `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

            g.append('g')
                .call(d3.axisLeft(yScale).tickFormat(d => `${d.toFixed(0)} mm`));

            // Labels
            svg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', margin.left / 2)
                .attr('x', -(height / 2))
                .attr('text-anchor', 'middle')
                .text('Plant Height (mm)');

            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height - margin.bottom / 2)
                .attr('text-anchor', 'middle')
                .text('Date');

            // Enhanced legend with pattern information
            const legend = svg.append('g')
                .attr('transform', `translate(${width - margin.right - 140}, ${margin.top})`);

            // Historical line and dot
            legend.append('line')
                .attr('x1', 0).attr('x2', 20)
                .attr('y1', 0).attr('y2', 0)
                .attr('stroke', config.colors.historical)
                .attr('stroke-width', 2);
            legend.append('circle')
                .attr('cx', 10)
                .attr('cy', 0)
                .attr('r', 4)
                .attr('fill', config.colors.historical);
            legend.append('text')
                .attr('x', 25).attr('y', 5)
                .text('Historical Growth');

            // Prediction line and dot
            legend.append('line')
                .attr('x1', 0).attr('x2', 20)
                .attr('y1', 20).attr('y2', 20)
                .attr('stroke', config.colors.prediction.aggregation)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5');
            legend.append('circle')
                .attr('cx', 10)
                .attr('cy', 20)
                .attr('r', 4)
                .attr('fill', config.colors.prediction.aggregation);
            
            // Show prediction type based on condition
            const predictionText = condition.displayFormat === 'alternative' ? 
                'Predictions (hover to see all)' : 'Prediction';
            legend.append('text')
                .attr('x', 25).attr('y', 25)
                .text(predictionText);
            
            // Add pattern information if available and debug is enabled
            if (ExperimentConfig.debug.showStimuliInfo && predictions.pattern) {
                legend.append('text')
                    .attr('x', 0).attr('y', 45)
                    .style('font-size', '11px')
                    .style('fill', '#666')
                    .text(`Pattern: ${predictions.pattern}`);
                
                legend.append('text')
                    .attr('x', 0).attr('y', 60)
                    .style('font-size', '11px')
                    .style('fill', '#666')
                    .text(`Trend: ${predictions.trend}`);
            }
        }

        showFeedback(response, groundTruth, callback) {
            const overlay = document.querySelector('#feedback-overlay');
            const yieldClass = response.yield_result >= 0 ? 'profit' : 'loss';
            const yieldText = response.yield_result >= 0 ? 'Resource Gain' : 'Resource Loss';
            
            const actionDescription = response.action === 'cultivate' ? 
                `You cultivated ${response.plants} plants with ${response.resource_amount.toFixed(0)} resources` :
                `You pruned ${response.plants} plants with ${response.resource_amount.toFixed(0)} resources`;
            
            // Add pattern information to feedback if available and debug is enabled
            const patternInfo = ExperimentConfig.debug.showStimuliInfo && response.predictions ? 
                `<p class="pattern-info"><strong>Pattern:</strong> ${response.predictions.pattern || 'unknown'} - ${response.predictions.trend || 'unknown'}</p>` : '';
            
            overlay.innerHTML = `
                <div class="feedback-content">
                    <h3>Growth Outcome</h3>
                    <p><strong>Actual Growth Height:</strong> ${groundTruth.toFixed(1)} mm</p>
                    ${patternInfo}
                    <p>${actionDescription}</p>
                    <p class="${yieldClass}"><strong>${yieldText}:</strong> ${Math.abs(response.yield_result).toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}</p>
                    <p><strong>New Resources:</strong> ${response.greenhouse_after.resources.toFixed(0)} ${ExperimentConfig.greenhouse.resourceUnit}</p>
                </div>
            `;
            
            overlay.classList.remove('hidden');

            // Update chart to show ground truth
            this.addGroundTruthToChart(groundTruth);

            setTimeout(() => {
                callback();
            }, ExperimentConfig.timing.feedbackDuration);
        }

        addGroundTruthToChart(groundTruth) {
            const svg = d3.select('#growth-chart svg');
            const g = svg.select('g');
            const config = ExperimentConfig.chart;
            
            // Use stored context from chart creation
            const currentHeight = this.chartContext.currentHeight;
            const currentDate = this.chartContext.currentDate;
            const xScale = this.chartContext.xScale;
            const yScale = this.chartContext.yScale;
            
            if (!currentHeight || !currentDate || !xScale || !yScale) {
                console.error('Chart context not available for ground truth');
                return;
            }
            
            const predictionDate = new Date(currentDate);
            predictionDate.setDate(predictionDate.getDate() + 1);
            
            // Draw ground truth line and dot with same color as historical data
            const groundTruthData = [currentHeight, groundTruth];
            const groundTruthDates = [currentDate, predictionDate];
            
            // Add ground truth line
            g.append('path')
                .datum(groundTruthData)
                .attr('class', 'ground-truth-line')
                .attr('fill', 'none')
                .attr('stroke', config.colors.historical)  // Same color as historical
                .attr('stroke-width', 3)
                .attr('d', d3.line()
                    .x((d, i) => xScale(groundTruthDates[i]))
                    .y(d => yScale(d))
                );
            
            // Add ground truth dot
            g.append('circle')
                .attr('class', 'ground-truth-dot')
                .attr('cx', xScale(predictionDate))
                .attr('cy', yScale(groundTruth))
                .attr('r', 6)
                .attr('fill', config.colors.historical)  // Same color as historical data
                .attr('stroke', 'white')
                .attr('stroke-width', 2);
        }

        endTrial(display_element, response, trial) {
            // Clear display
            display_element.innerHTML = '';

            // Save comprehensive trial data including stimuli information
            const trial_data = {
                ...response,
                plant_index: trial.growth_data?.plantIndex || trial.trial,
                condition: trial.condition?.id || 'UNKNOWN',
                round: trial.round || 0,
                growth_data: trial.growth_data || null,
                predictions: trial.predictions || null,
                // Enhanced data logging for stimuli patterns
                stimuli_pattern: trial.predictions?.pattern || 'unknown',
                stimuli_trend: trial.predictions?.trend || 'unknown', 
                stimuli_index: trial.predictions?.metadata?.stimuliIndex || 0,
                stimuli_description: trial.predictions?.description || 'no description',
                pattern_id: trial.predictions?.patternId || 'unknown',
                display_format: trial.condition?.displayFormat || 'unknown'
            };

            // End trial
            this.jsPsych.finishTrial(trial_data);
        }
    }

    PlantCultivationPlugin.info = info;

    return PlantCultivationPlugin;
})(typeof jsPsych !== 'undefined' ? jsPsych : {});