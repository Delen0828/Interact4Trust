var jsPsychStockTrading = (function (jsPsych) {
    "use strict";

    const info = {
        name: "stock-trading",
        parameters: {
            stock_data: {
                type: "object",
                default: undefined,
                description: "Historical stock data to display"
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
            portfolio: {
                type: "object",
                default: undefined,
                description: "Current portfolio state"
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

    class StockTradingPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {
            // Initialize trial data
            const start_time = performance.now();
            let response = {
                decision: null,
                shares: 0,
                portfolio_before: {...trial.portfolio},
                portfolio_after: null,
                profit_loss: 0
            };

            // Create main container
            let html = `
                <div class="stock-trading-container">
                    <div class="trading-header">
                        <h2>Alien Stock Market - ${trial.stock_data.symbol}</h2>
                        <div class="portfolio-status">
                            <span>Cash: ${ExperimentConfig.portfolio.currency}${trial.portfolio.cash.toFixed(2)}</span>
                            <span>Round: ${trial.round}/10</span>
                        </div>
                    </div>
                    
                    <div class="chart-container" id="stock-chart"></div>
                    
                    <div class="trading-controls">
                        <div class="position-input-container">
                            <div class="input-row">
                                <label for="position-direction">Direction:</label>
                                <select id="position-direction" class="direction-select">
                                    <option value="">Select Direction</option>
                                    <option value="long">LONG</option>
                                    <option value="short">SHORT</option>
                                </select>
                            </div>
                            
                            <div class="input-row">
                                <label for="position-value">Position Value:</label>
                                <input type="number" id="position-value" min="0" step="0.01" value="0" placeholder="Enter dollar amount">
                                <span id="position-shares"></span>
                            </div>
                            
                        </div>
                        
                        <button id="confirm-trade" class="confirm-btn" disabled>Confirm Trade</button>
                    </div>
                    
                    <div id="feedback-overlay" class="feedback-overlay hidden"></div>
                </div>
            `;

            display_element.innerHTML = html;

            // Draw the chart
            this.drawChart(trial.stock_data, trial.predictions, trial.condition);

            // Setup event handlers
            const positionDirection = display_element.querySelector('#position-direction');
            const positionValueInput = display_element.querySelector('#position-value');
            const positionShares = display_element.querySelector('#position-shares');
            const positionContainer = display_element.querySelector('.position-input-container');
            const confirmBtn = display_element.querySelector('#confirm-trade');

            // Update position display and validation
            const updatePosition = () => {
                const direction = positionDirection.value;
                const positionValue = parseFloat(positionValueInput.value) || 0;
                const currentPrice = trial.stock_data.prices[trial.stock_data.prices.length - 1];
                const maxCash = trial.portfolio.cash;
                
                // Calculate shares from position value
                const shares = positionValue > 0 ? positionValue / currentPrice : 0;
                positionShares.textContent = shares > 0 ? `(${shares.toFixed(4)} shares)` : '';
                
                // Validate position value against available cash - create/remove error message dynamically
                let existingError = positionContainer.querySelector('.error-message');
                
                if (positionValue > 0 && positionValue > maxCash) {
                    // Create error message if it doesn't exist
                    if (!existingError) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.textContent = `Maximum available: ${ExperimentConfig.portfolio.currency}${maxCash.toFixed(2)}`;
                        positionContainer.appendChild(errorDiv);
                    } else {
                        // Update existing error message
                        existingError.textContent = `Maximum available: ${ExperimentConfig.portfolio.currency}${maxCash.toFixed(2)}`;
                    }
                } else {
                    // Remove error message if it exists
                    if (existingError) {
                        existingError.remove();
                    }
                }
                
                // Enable confirm button if direction is selected and position value is valid
                const hasValidTrade = direction && positionValue > 0 && positionValue <= maxCash;
                confirmBtn.disabled = !hasValidTrade;
            };

            // Get current trade details
            const getCurrentTrade = () => {
                const direction = positionDirection.value;
                const positionValue = parseFloat(positionValueInput.value) || 0;
                const currentPrice = trial.stock_data.prices[trial.stock_data.prices.length - 1];
                const shares = positionValue > 0 ? positionValue / currentPrice : 0;
                
                return {
                    decision: direction || null,
                    positionValue: positionValue,
                    shares: shares
                };
            };

            // Event handlers
            positionDirection.addEventListener('change', updatePosition);
            positionValueInput.addEventListener('input', updatePosition);

            // Confirm trade handler
            confirmBtn.addEventListener('click', () => {
                const end_time = performance.now();
                const rt = Math.round(end_time - start_time);
                
                const trade = getCurrentTrade();
                response.decision = trade.decision;
                response.position_value = trade.positionValue;
                response.shares = trade.shares;
                response.rt = rt;

                // Calculate trade outcome
                const currentPrice = trial.stock_data.prices[trial.stock_data.prices.length - 1];
                const groundTruth = trial.predictions.groundTruth;
                const commission = trade.positionValue * ExperimentConfig.portfolio.commissionRate;

                if (response.decision === 'long') {
                    // Long position: profit when price goes up
                    const priceChange = groundTruth - currentPrice;
                    response.profit_loss = (trade.shares * priceChange) - commission;
                    response.portfolio_after = {
                        cash: trial.portfolio.cash + response.profit_loss,
                        totalValue: trial.portfolio.cash + response.profit_loss
                    };
                } else if (response.decision === 'short') {
                    // Short position: profit when price goes down
                    const priceChange = currentPrice - groundTruth;
                    response.profit_loss = (trade.shares * priceChange) - commission;
                    response.portfolio_after = {
                        cash: trial.portfolio.cash + response.profit_loss,
                        totalValue: trial.portfolio.cash + response.profit_loss
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
            
            // Initialize position display
            updatePosition();
        }

        drawChart(stockData, predictions, condition) {
            const container = document.querySelector('#stock-chart');
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

            // Prepare data
            const allPrices = [...stockData.prices];
            const dates = stockData.dates.map(d => new Date(d));

            // Scales
            const xScale = d3.scaleTime()
                .domain(d3.extent(dates))
                .range([0, chartWidth]);

            const yExtent = d3.extent([...allPrices, ...predictions.values.flat()]);
            const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
            
            const yScale = d3.scaleLinear()
                .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
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
            const historicalPrices = allPrices.slice(0, -1);
            const historicalDates = dates.slice(0, -1);
            
            // Add current price to historical for complete line
            const currentPrice = allPrices[allPrices.length - 1];
            const currentDate = dates[dates.length - 1];
            
            // Draw lines connecting historical dots (including current)
            g.append('path')
                .datum(allPrices)
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
                .data(historicalPrices)
                .enter().append('circle')
                .attr('class', 'historical-dot')
                .attr('cx', (d, i) => xScale(historicalDates[i]))
                .attr('cy', d => yScale(d))
                .attr('r', 4)
                .attr('fill', config.colors.historical);
            
            // Add current price dot (the last price that connects to predictions)
            g.append('circle')
                .attr('class', 'current-dot')
                .attr('cx', xScale(currentDate))
                .attr('cy', yScale(currentPrice))
                .attr('r', 5)
                .attr('fill', config.colors.historical)
                .attr('stroke', 'white')
                .attr('stroke-width', 1);

            // Store chart context for later use (e.g., ground truth rendering)
            this.chartContext = {
                currentPrice: currentPrice,
                currentDate: currentDate,
                dates: dates,
                allPrices: allPrices,
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
                const predictionData = [currentPrice, predictions.values[0]];
                const predictionDates = [currentDate, predictionDate];
                
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
                    .attr('cy', yScale(predictions.values[0]))
                    .attr('r', 5)
                    .attr('fill', config.colors.prediction.aggregation)
                    .attr('stroke', 'white')
                    .attr('stroke-width', 1);

            } else {
                // Multiple prediction lines and dots with varying opacity
                predictions.values.forEach((pred, i) => {
                    const predictionData = [currentPrice, pred];
                    const predictionDates = [currentDate, predictionDate];
                    
                    // Draw line from current to each prediction
                    g.append('path')
                        .datum(predictionData)
                        .attr('fill', 'none')
                        .attr('stroke', config.colors.prediction.alternative[i])
                        .attr('stroke-width', 2 - i * 0.2)
                        .attr('stroke-dasharray', '5,5')
                        .attr('opacity', ExperimentConfig.displayParams.alternative.opacityLevels[i])
                        .attr('d', d3.line()
                            .x((d, j) => xScale(predictionDates[j]))
                            .y(d => yScale(d))
                        );
                    
                    // Add prediction dot
                    g.append('circle')
                        .attr('class', `prediction-dot prediction-dot-${i}`)
                        .attr('cx', xScale(predictionDate))
                        .attr('cy', yScale(pred))
                        .attr('r', 5 - i * 0.5)  // Slightly smaller for lower confidence
                        .attr('fill', config.colors.prediction.alternative[i])
                        .attr('opacity', ExperimentConfig.displayParams.alternative.opacityLevels[i])
                        .attr('stroke', 'white')
                        .attr('stroke-width', 0.5);
                });
            }

            // Axes
            g.append('g')
                .attr('transform', `translate(0,${chartHeight})`)
                .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

            g.append('g')
                .call(d3.axisLeft(yScale).tickFormat(d => `${ExperimentConfig.portfolio.currency}${d.toFixed(0)}`));

            // Labels
            svg.append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', margin.left / 2)
                .attr('x', -(height / 2))
                .attr('text-anchor', 'middle')
                .text('Stock Price');

            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height - margin.bottom / 2)
                .attr('text-anchor', 'middle')
                .text('Date');

            // Legend with lines and dots
            const legend = svg.append('g')
                .attr('transform', `translate(${width - margin.right - 120}, ${margin.top})`);

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
                .text('Historical');

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
            legend.append('text')
                .attr('x', 25).attr('y', 25)
                .text('Prediction');
        }

        showFeedback(response, groundTruth, callback) {
            const overlay = document.querySelector('#feedback-overlay');
            const profitLossClass = response.profit_loss >= 0 ? 'profit' : 'loss';
            const profitLossText = response.profit_loss >= 0 ? 'Profit' : 'Loss';
            
            const tradeDescription = `You went ${response.decision.toUpperCase()} with ${ExperimentConfig.portfolio.currency}${response.position_value.toFixed(2)} (${response.shares.toFixed(4)} shares)`;
            
            overlay.innerHTML = `
                <div class="feedback-content">
                    <h3>Trade Result</h3>
                    <p>Ground Truth Price: ${ExperimentConfig.portfolio.currency}${groundTruth.toFixed(2)}</p>
                    <p>${tradeDescription}</p>
                    <p class="${profitLossClass}">${profitLossText}: ${ExperimentConfig.portfolio.currency}${Math.abs(response.profit_loss).toFixed(2)}</p>
                    <p>New Cash: ${ExperimentConfig.portfolio.currency}${response.portfolio_after.cash.toFixed(2)}</p>
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
            const svg = d3.select('#stock-chart svg');
            const g = svg.select('g');
            const config = ExperimentConfig.chart;
            
            // Use stored context from chart creation
            const currentPrice = this.chartContext.currentPrice;
            const currentDate = this.chartContext.currentDate;
            const xScale = this.chartContext.xScale;
            const yScale = this.chartContext.yScale;
            
            if (!currentPrice || !currentDate || !xScale || !yScale) {
                console.error('Chart context not available for ground truth');
                return;
            }
            
            const predictionDate = new Date(currentDate);
            predictionDate.setDate(predictionDate.getDate() + 1);
            
            // Draw ground truth line and dot with same color as historical data
            const groundTruthData = [currentPrice, groundTruth];
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

            // Save data
            const trial_data = {
                ...response,
                stock_symbol: trial.stock_data?.symbol || 'UNKNOWN',
                condition: trial.condition?.id || 'UNKNOWN',
                round: trial.round || 0,
                stock_data: trial.stock_data || null,
                predictions: trial.predictions || null
            };

            // End trial
            this.jsPsych.finishTrial(trial_data);
        }
    }

    StockTradingPlugin.info = info;

    return StockTradingPlugin;
})(typeof jsPsych !== 'undefined' ? jsPsych : {});