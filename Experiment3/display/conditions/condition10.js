/**
 * Condition 10: Button Next Line (Bad Design)
 * Shows aggregated prediction initially
 * Click "Next Line" button to reveal alternative prediction lines one by one
 * Bad UX due to excessive clicking required
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition10 {
    constructor(svgId, processedData, config, phase = null) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
        
        // State management for alternative lines (individual lines, not pairs)
        this.currentLineIndex = 0;
        this.allAlternativeLines = []; // Store all individual lines from both cities
        this.nextButton = null;
    }

    render() {
        // Setup basic chart structure
        const container = this.chartRenderer.setupBasicChart(
            {
                A: this.data.stockData.A,
                B: this.data.stockData.B,
                realTimeAggregated: this.data.realTimeAggregated
            },
            this.data.globalYScale
        );

        // Create prediction group
        const predictionGroup = container.append("g").attr("class", "predictions");

        // Render aggregated prediction lines (always visible)
        this.renderAggregatedLines(predictionGroup);

        // Render alternative prediction lines (hidden initially)
        this.renderAlternativeLines(predictionGroup);

        // Add control button
        this.addNextButton();
    }

    renderAggregatedLines(predictionGroup) {
        // Use the base renderer for dashed aggregated lines
        this.chartRenderer.renderAggregatedLines(
            predictionGroup, 
            {
                A: this.data.stockData.A,
                B: this.data.stockData.B
            },
            this.config.colors,
            this.data.realTimeAggregated
        );
    }

    renderAlternativeLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();
        
        // Create individual alternative lines for each city and scenario
        ['A', 'B'].forEach((stock, stockIndex) => {
            const color = stockIndex === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            
            // Group alternatives by scenario
            const scenarios = {};
            this.data.stockData[stock].alternatives.forEach(alt => {
                if (!scenarios[alt.scenario]) {
                    scenarios[alt.scenario] = [];
                }
                scenarios[alt.scenario].push(alt);
            });
            
            // Create individual lines for each scenario of this city
            Object.entries(scenarios).forEach(([scenarioName, scenarioData], scenarioIndex) => {
                if (scenarioData.length > 0) {
                    const fullScenarioData = [lastHistorical, ...scenarioData];
                    
                    const alternativeLine = predictionGroup.append("path")
                        .datum(fullScenarioData)
                        .attr("class", `alternative-line scenario-${scenarioName} stock-${stock.toLowerCase()}-line`)
                        .attr("fill", "none")
                        .attr("stroke", color)
                        .attr("stroke-width", 1.5)
                        .attr("opacity", 0.6)
                        .attr("d", line)
                        .style("display", "none"); // Hidden initially
                    
                    // Store all lines individually
                    this.allAlternativeLines.push({
                        line: alternativeLine,
                        city: stock,
                        scenario: scenarioName,
                        label: `City ${stock} - Scenario ${scenarioName}`
                    });
                }
            });
        });
    }

    addNextButton() {
        // Get the condition panel (parent of chart-container) to append controls below the chart
        const chartContainer = document.querySelector(`#${this.svgId}`).parentElement;
        const conditionPanel = chartContainer.parentElement;
        
        // Create button container beneath the chart
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: block;
            width: 100%;
            margin-top: 12px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            clear: both;
        `;
        
        // Create "Next Line" button (smaller)
        this.nextButton = document.createElement('button');
        this.nextButton.textContent = 'Next Line';
        this.nextButton.style.cssText = `
            padding: 4px 8px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
        `;
        
        // Create status text
        const statusText = document.createElement('span');
        statusText.id = `status-${this.svgId}`;
        statusText.style.cssText = `
            font-size: 10px;
            color: #666;
            margin-left: 8px;
            display: inline-block;
        `;
        this.updateStatusText(statusText);
        
        buttonContainer.appendChild(this.nextButton);
        buttonContainer.appendChild(statusText);
        conditionPanel.appendChild(buttonContainer);
        
        // Add click event listener
        this.nextButton.addEventListener('click', () => {
            this.showNextLine(statusText);
        });
    }

    showNextLine(statusText) {
        if (this.currentLineIndex < this.allAlternativeLines.length) {
            // Show the current individual line
            const currentLineData = this.allAlternativeLines[this.currentLineIndex];
            currentLineData.line.style('display', 'block');
            
            this.currentLineIndex++;
            this.updateStatusText(statusText);
            
            // Disable button if all lines are shown
            if (this.currentLineIndex >= this.allAlternativeLines.length) {
                this.nextButton.disabled = true;
                this.nextButton.textContent = 'All Lines Shown';
                this.nextButton.style.background = '#95a5a6';
                this.nextButton.style.cursor = 'not-allowed';
            }
        }
    }

    updateStatusText(statusText) {
        const totalLines = this.allAlternativeLines.length;
        let currentLineInfo = '';
        if (this.currentLineIndex > 0 && this.currentLineIndex <= totalLines) {
            const lastShownLine = this.allAlternativeLines[this.currentLineIndex - 1];
            currentLineInfo = ` (Last: ${lastShownLine.label})`;
        }
        statusText.textContent = `Lines shown: ${this.currentLineIndex}/${totalLines}${currentLineInfo}`;
    }

    setupInteractions() {
        // No additional interactions needed for this condition
        // The button interaction is handled in addNextButton()
    }

    cleanup() {
        this.interactionManager.cleanup();
        
        // Remove button container if it exists
        const chartContainer = document.querySelector(`#${this.svgId}`).parentElement;
        const conditionPanel = chartContainer.parentElement;
        const buttonContainer = conditionPanel.querySelector('div[style*="background: #f8f9fa"]');
        if (buttonContainer) {
            buttonContainer.remove();
        }
    }
}