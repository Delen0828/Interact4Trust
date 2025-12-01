/**
 * Condition 3: Ensemble Plot
 * Shows both aggregated and alternative prediction lines
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition3 {
    constructor(svgId, processedData, config) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.chartRenderer = new ChartRenderer(svgId, config);
        this.interactionManager = new InteractionManager(svgId);
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

        // Render alternative prediction lines first
        this.renderAlternativeLines(predictionGroup);

        // Render aggregated prediction lines on top
        this.renderAggregatedLines(predictionGroup);

        console.log('Condition 3 (Ensemble Plot) rendered');
    }

    renderAlternativeLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();
        
        // Create separate groups for each stock's alternatives
        const alternativesGroupA = predictionGroup.append("g")
            .attr("class", "alternatives-group-a")
            .style("opacity", 1);
            
        const alternativesGroupB = predictionGroup.append("g")
            .attr("class", "alternatives-group-b")
            .style("opacity", 1);

        ['A', 'B'].forEach((stock, i) => {
            const color = i === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            const currentAlternativesGroup = stock === 'A' ? alternativesGroupA : alternativesGroupB;
            
            // Group alternatives by scenario
            const scenarios = {};
            this.data.stockData[stock].alternatives.forEach(alt => {
                if (!scenarios[alt.scenario]) {
                    scenarios[alt.scenario] = [];
                }
                scenarios[alt.scenario].push(alt);
            });
            
            console.log(`Stock ${stock} alternative scenarios:`, Object.keys(scenarios));
            
            // Create a line for each scenario
            Object.entries(scenarios).forEach(([scenarioName, scenarioData], scenarioIndex) => {
                if (scenarioData.length > 0) {
                    const fullScenarioData = [lastHistorical, ...scenarioData];
                    
                    currentAlternativesGroup.append("path")
                        .datum(fullScenarioData)
                        .attr("class", `prediction-line alternative-line scenario-${scenarioIndex} stock-${stock.toLowerCase()}-line`)
                        .attr("fill", "none")
                        .attr("stroke", color)
                        .attr("stroke-width", 1.5)
                        .attr("opacity", 0.2)  // Use default alternative opacity
                        .attr("d", line);
                        
                    console.log(`Rendered alternative scenario ${scenarioName} for stock ${stock} with ${scenarioData.length} points`);
                }
            });
        });
    }

    renderAggregatedLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();

        ['A', 'B'].forEach((stock, i) => {
            const color = i === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            
            if (this.data.realTimeAggregated[stock] && this.data.realTimeAggregated[stock].length > 0) {
                // Create continuous path through all real-time aggregated data points
                const fullAggregatedData = [lastHistorical, ...this.data.realTimeAggregated[stock]];
                
                predictionGroup.append("path")
                    .datum(fullAggregatedData)
                    .attr("class", `aggregated-line real-time-aggregated stock-${stock.toLowerCase()}-line`)
                    .attr("stroke", color)
                    .attr("fill", "none")
                    .attr("stroke-width", 2)
                    .attr("d", line);
                    
                console.log(`Rendered aggregated line for stock ${stock} with ${this.data.realTimeAggregated[stock].length} points`);
            }
        });
    }

    setupInteractions() {
        // No interactions for static ensemble plot
        console.log('No interactions for Condition 3 (Ensemble Plot)');
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}