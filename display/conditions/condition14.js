/**
 * Condition 14: Escaping Aggregation Bug
 * Based on Condition 4: Ensemble + Hover, but with escaping aggregation bug
 * BUG: Aggregation line "escapes" by hiding when you hover, replaced by random alternative
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition14 {
    constructor(svgId, processedData, config, phase = null) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
        this.alternativesGroupA = null;
        this.alternativesGroupB = null;
        this.aggregatedGroupA = null;
        this.aggregatedGroupB = null;
        this.escapeReplacementA = null;
        this.escapeReplacementB = null;
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

        // Render aggregated prediction lines with custom handling for escaping bug
        this.renderAggregatedLinesWithEscape(predictionGroup);
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
                }
            });
        });
    }

    renderAggregatedLinesWithEscape(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();
        
        // Create groups for aggregated lines (so we can hide them)
        this.aggregatedGroupA = predictionGroup.append("g").attr("class", "aggregated-group-a");
        this.aggregatedGroupB = predictionGroup.append("g").attr("class", "aggregated-group-b");
        
        // Create groups for escape replacement lines (hidden initially)
        this.escapeReplacementA = predictionGroup.append("g")
            .attr("class", "escape-replacement-a")
            .style("opacity", 0);
        this.escapeReplacementB = predictionGroup.append("g")
            .attr("class", "escape-replacement-b")
            .style("opacity", 0);

        ['A', 'B'].forEach((stock, i) => {
            const color = i === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const currentAggregatedGroup = stock === 'A' ? this.aggregatedGroupA : this.aggregatedGroupB;
            const currentEscapeGroup = stock === 'A' ? this.escapeReplacementA : this.escapeReplacementB;
            
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            
            // Render normal aggregated line
            if (this.data.realTimeAggregated[stock] && this.data.realTimeAggregated[stock].length > 0) {
                const fullAggregatedData = [lastHistorical, ...this.data.realTimeAggregated[stock]];
                
                currentAggregatedGroup.append("path")
                    .datum(fullAggregatedData)
                    .attr("class", `aggregated-line stock-${stock.toLowerCase()}-line`)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "5,5")
                    .attr("d", line);
                
                // BUG: Create escape replacement line (random alternative scenario)
                const scenarios = {};
                this.data.stockData[stock].alternatives.forEach(alt => {
                    if (!scenarios[alt.scenario]) {
                        scenarios[alt.scenario] = [];
                    }
                    scenarios[alt.scenario].push(alt);
                });
                
                const scenarioKeys = Object.keys(scenarios);
                if (scenarioKeys.length > 0) {
                    // Pick a random scenario for escape replacement
                    const randomScenario = scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)];
                    const escapeData = [lastHistorical, ...scenarios[randomScenario]];
                    
                    currentEscapeGroup.append("path")
                        .datum(escapeData)
                        .attr("class", `escape-line stock-${stock.toLowerCase()}-line`)
                        .attr("fill", "none")
                        .attr("stroke", color)
                        .attr("stroke-width", 2)
                        .attr("stroke-dasharray", "5,5")
                        .attr("d", line);
                }
                
                // Create hover zone for this aggregated line
                this.interactionManager.createHoverZone(
                    predictionGroup,
                    fullAggregatedData,
                    `hover-zone-${stock.toLowerCase()}`,
                    line
                );
            }
        });
    }


    setupInteractions() {
        // BUG: Instead of showing alternatives, hide aggregation and show escape replacement
        
        // Stock A hover zone interactions
        const hoverZoneA = this.interactionManager.select('hover-zone-a');
        if (hoverZoneA) {
            hoverZoneA.on('mouseenter', () => {
                // BUG: Hide aggregation line and show escape replacement instead of alternatives
                this.aggregatedGroupA.transition().duration(200).style('opacity', 0);
                this.escapeReplacementA.transition().duration(200).style('opacity', 1);
            });
            
            hoverZoneA.on('mouseleave', () => {
                // Restore aggregation line and hide escape replacement
                this.aggregatedGroupA.transition().duration(200).style('opacity', 1);
                this.escapeReplacementA.transition().duration(200).style('opacity', 0);
            });
        }

        // Stock B hover zone interactions
        const hoverZoneB = this.interactionManager.select('hover-zone-b');
        if (hoverZoneB) {
            hoverZoneB.on('mouseenter', () => {
                // BUG: Hide aggregation line and show escape replacement instead of alternatives
                this.aggregatedGroupB.transition().duration(200).style('opacity', 0);
                this.escapeReplacementB.transition().duration(200).style('opacity', 1);
            });
            
            hoverZoneB.on('mouseleave', () => {
                // Restore aggregation line and hide escape replacement
                this.aggregatedGroupB.transition().duration(200).style('opacity', 1);
                this.escapeReplacementB.transition().duration(200).style('opacity', 0);
            });
        }
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}