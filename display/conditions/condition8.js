/**
 * Condition 8: Bad Control
 * Poor interaction: click to reveal one alternative line at a time
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition8 {
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

        // Render aggregated prediction lines with click zones (with dashed style)
        this.renderAggregatedLines(predictionGroup);

        console.log('Condition 8 (Bad Control) rendered');
    }

    renderAlternativeLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();
        
        // Create separate groups for each stock's alternatives (group visible, but individual lines hidden)
        this.alternativesGroupA = predictionGroup.append("g")
            .attr("class", "alternatives-group-a");
            
        this.alternativesGroupB = predictionGroup.append("g")
            .attr("class", "alternatives-group-b");

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
                        .attr("opacity", 0)  // Start invisible for bad UX hunting
                        .attr("d", line);
                        
                    console.log(`Rendered alternative scenario ${scenarioName} for stock ${stock} with ${scenarioData.length} points`);
                }
            });
        });
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
        
        // Add click zones for interaction (wider for easier clicking)
        const line = this.chartRenderer.createLineGenerator();
        ['A', 'B'].forEach((stock, i) => {
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            
            if (this.data.realTimeAggregated[stock] && this.data.realTimeAggregated[stock].length > 0) {
                const fullAggregatedData = [lastHistorical, ...this.data.realTimeAggregated[stock]];
                
                // Create click zone for this aggregated line (wider for easier clicking)
                this.interactionManager.createHoverZone(
                    predictionGroup,
                    fullAggregatedData,
                    `click-zone-${stock.toLowerCase()}`,
                    line,
                    20  // Wider stroke for easier clicking
                );
            }
        });
    }

    setupInteractions() {
        // Bad Control - hover on invisible alternative lines to reveal them individually
        // Users have to hunt for the invisible lines by moving mouse around!
        
        // Stock A bad hover reveal
        this.interactionManager.addBadHoverReveal(this.alternativesGroupA);
        
        // Stock B bad hover reveal  
        this.interactionManager.addBadHoverReveal(this.alternativesGroupB);

        console.log('Bad hover-to-reveal interactions setup for Condition 8 (Bad Control)');
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}