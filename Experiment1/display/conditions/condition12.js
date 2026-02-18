/**
 * Condition 12: Legend Hover (Bad Design)
 * Shows legend with scenario labels
 * Must hover on each small legend item to show corresponding prediction line
 * Only shows one line at a time (no simultaneous view)
 * Bad UX due to precision required for hover targets + incomplete information
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition12 {
    constructor(svgId, processedData, config, phase = null) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
        
        // State management for legend and lines (individual city/scenario combinations)
        this.legendContainer = null;
        this.alternativeLines = {}; // Store by cityScenario key (e.g., "A_1", "B_2")
        this.currentVisibleCityScenario = null;
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

        // Add legend controls
        this.addLegendControls();
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
        
        // Create individual alternative lines for each city and scenario combination
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
            Object.entries(scenarios).forEach(([scenarioName, scenarioData]) => {
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
                    
                    // Store reference by cityScenario key
                    const cityScenarioKey = `${stock}_${scenarioName}`;
                    this.alternativeLines[cityScenarioKey] = alternativeLine;
                }
            });
        });
    }

    addLegendControls() {
        // Get the condition panel (parent of chart-container) to append controls below the chart
        const chartContainer = document.querySelector(`#${this.svgId}`).parentElement;
        const conditionPanel = chartContainer.parentElement;
        
        // Create legend container beneath the chart
        this.legendContainer = document.createElement('div');
        this.legendContainer.style.cssText = `
            display: block;
            width: 100%;
            margin-top: 12px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 4px;
            border-top: 1px solid #e9ecef;
            clear: both;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.textContent = 'Hover on city/scenarios to view individual predictions:';
        header.style.cssText = `
            font-size: 10px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #495057;
        `;
        this.legendContainer.appendChild(header);
        
        // Create legend items grid (intentionally small and cramped for bad UX)
        const legendGrid = document.createElement('div');
        legendGrid.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 1px;
            justify-content: space-between;
        `;
        
        // Add legend items for each city/scenario combination (very small hover targets)
        Object.keys(this.alternativeLines).sort().forEach((cityScenarioKey) => {
            const [city, scenarioName] = cityScenarioKey.split('_');
            const color = city === 'A' ? this.config.colors.stockA : this.config.colors.stockB;
            
            const legendItem = document.createElement('div');
            legendItem.style.cssText = `
                display: flex;
                align-items: center;
                font-size: 8px;
                color: #6c757d;
                cursor: pointer;
                padding: 1px 3px;
                border-radius: 1px;
                border: 1px solid #dee2e6;
                background: white;
                margin: 0.5px;
                min-width: 35px;
                transition: all 0.1s;
            `;
            
            // Create color indicator (very small)
            const colorIndicator = document.createElement('div');
            colorIndicator.style.cssText = `
                width: 5px;
                height: 5px;
                border-radius: 1px;
                margin-right: 2px;
                background: ${color};
            `;
            
            // Create label text (very abbreviated)
            const labelText = document.createElement('span');
            labelText.textContent = `${city}${scenarioName}`;
            labelText.style.cssText = `
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 7px;
            `;
            
            // Add hover events (requires precision)
            legendItem.addEventListener('mouseenter', () => {
                this.showCityScenario(cityScenarioKey);
                legendItem.style.backgroundColor = '#e3f2fd';
                legendItem.style.borderColor = '#2196f3';
                legendItem.style.transform = 'scale(1.1)';
            });
            
            legendItem.addEventListener('mouseleave', () => {
                this.hideCurrentCityScenario();
                legendItem.style.backgroundColor = 'white';
                legendItem.style.borderColor = '#dee2e6';
                legendItem.style.transform = 'scale(1)';
            });
            
            legendItem.appendChild(colorIndicator);
            legendItem.appendChild(labelText);
            legendGrid.appendChild(legendItem);
        });
        
        this.legendContainer.appendChild(legendGrid);
        
        // Add instruction text (emphasizing the bad UX)
        const instruction = document.createElement('div');
        instruction.textContent = '⚠️ Hover precisely on tiny legend items above (one line at a time, 10 total)';
        instruction.style.cssText = `
            font-size: 8px;
            color: #dc3545;
            text-align: center;
            margin-top: 4px;
            font-style: italic;
        `;
        this.legendContainer.appendChild(instruction);
        
        conditionPanel.appendChild(this.legendContainer);
    }

    showCityScenario(cityScenarioKey) {
        // Hide current scenario if any
        this.hideCurrentCityScenario();
        
        // Show the new city/scenario combination
        const line = this.alternativeLines[cityScenarioKey];
        if (line) {
            line.style('display', 'block');
            this.currentVisibleCityScenario = cityScenarioKey;
        }
    }

    hideCurrentCityScenario() {
        if (this.currentVisibleCityScenario) {
            const line = this.alternativeLines[this.currentVisibleCityScenario];
            if (line) {
                line.style('display', 'none');
            }
            this.currentVisibleCityScenario = null;
        }
    }

    setupInteractions() {
        // No additional interactions needed for this condition
        // The legend interactions are handled in addLegendControls()
    }

    cleanup() {
        this.interactionManager.cleanup();
        
        // Remove legend container if it exists
        if (this.legendContainer && this.legendContainer.parentElement) {
            this.legendContainer.parentElement.removeChild(this.legendContainer);
        }
    }
}