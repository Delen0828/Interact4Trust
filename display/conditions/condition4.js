/**
 * Condition 4: Ensemble + Hover
 * Aggregated by default, hover to reveal alternatives
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition4 {
    constructor(svgId, processedData, config) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.chartRenderer = new ChartRenderer(svgId, config);
        this.interactionManager = new InteractionManager(svgId);
        this.alternativesGroupA = null;
        this.alternativesGroupB = null;
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

        // Render alternative prediction lines (hidden initially)
        this.renderAlternativeLines(predictionGroup);

        // Render aggregated prediction lines with hover zones
        this.renderAggregatedLines(predictionGroup);

        console.log('Condition 4 (Ensemble + Hover) rendered');
    }

    renderAlternativeLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();
        
        // Create separate groups for each stock's alternatives (hidden initially)
        this.alternativesGroupA = predictionGroup.append("g")
            .attr("class", "alternatives-group-a")
            .style("opacity", 0);
            
        this.alternativesGroupB = predictionGroup.append("g")
            .attr("class", "alternatives-group-b")
            .style("opacity", 0);

        ['A', 'B'].forEach((stock, i) => {
            const color = i === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            const currentAlternativesGroup = stock === 'A' ? this.alternativesGroupA : this.alternativesGroupB;
            
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
                    
                // Create hover zone for this aggregated line
                this.interactionManager.createHoverZone(
                    predictionGroup,
                    fullAggregatedData,
                    `hover-zone-${stock.toLowerCase()}`,
                    line
                );
                    
                console.log(`Rendered aggregated line for stock ${stock} with ${this.data.realTimeAggregated[stock].length} points`);
            }
        });
    }

    setupInteractions() {
        // Stock A hover zone interactions
        const hoverZoneA = this.interactionManager.select('hover-zone-a');
        this.interactionManager.addHoverInteraction(
            hoverZoneA, 
            this.alternativesGroupA,
            { showDuration: 200, hideDuration: 200, useAlternativeOpacity: true }
        );

        // Stock B hover zone interactions
        const hoverZoneB = this.interactionManager.select('hover-zone-b');
        this.interactionManager.addHoverInteraction(
            hoverZoneB, 
            this.alternativesGroupB,
            { showDuration: 200, hideDuration: 200, useAlternativeOpacity: true }
        );

        console.log('Hover interactions setup for Condition 4 (Ensemble + Hover)');
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}