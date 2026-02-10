/**
 * Condition 15: Inconsistent Shape Bug
 * Based on Condition 4: Ensemble + Hover, but with inconsistent shape bug
 * BUG: Every hover shows different random subset of alternative lines (3 out of 5 randomly sampled)
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition15 {
    constructor(svgId, processedData, config, phase = null) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
        this.alternativesGroupA = null;
        this.alternativesGroupB = null;
        this.allAlternativeLinesA = [];
        this.allAlternativeLinesB = [];
        this.hoverCounter = 0; // Track hover events for different randomization
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

        // Render alternative prediction lines (all hidden initially)
        this.renderAlternativeLines(predictionGroup);

        // Render aggregated prediction lines with hover zones (with dashed style)
        this.renderAggregatedLines(predictionGroup);
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
            const currentAlternativeLines = stock === 'A' ? this.allAlternativeLinesA : this.allAlternativeLinesB;
            
            // Group alternatives by scenario
            const scenarios = {};
            this.data.stockData[stock].alternatives.forEach(alt => {
                if (!scenarios[alt.scenario]) {
                    scenarios[alt.scenario] = [];
                }
                scenarios[alt.scenario].push(alt);
            });
            
            // Create a line for each scenario and store references
            Object.entries(scenarios).forEach(([scenarioName, scenarioData], scenarioIndex) => {
                if (scenarioData.length > 0) {
                    const fullScenarioData = [lastHistorical, ...scenarioData];
                    
                    const alternativeLine = currentAlternativesGroup.append("path")
                        .datum(fullScenarioData)
                        .attr("class", `prediction-line alternative-line scenario-${scenarioIndex} stock-${stock.toLowerCase()}-line`)
                        .attr("fill", "none")
                        .attr("stroke", color)
                        .attr("stroke-width", 1.5)
                        .attr("d", line)
                        .style("display", "none"); // All hidden initially
                    
                    // Store reference for random sampling
                    currentAlternativeLines.push({
                        line: alternativeLine,
                        scenario: scenarioName,
                        index: scenarioIndex
                    });
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
        
        // Add hover zones for interaction
        const line = this.chartRenderer.createLineGenerator();
        ['A', 'B'].forEach((stock, i) => {
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            
            if (this.data.realTimeAggregated[stock] && this.data.realTimeAggregated[stock].length > 0) {
                const fullAggregatedData = [lastHistorical, ...this.data.realTimeAggregated[stock]];
                
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


    // BUG: Randomly sample 3 out of available alternative lines each time
    getRandomSample(alternatives, sampleSize = 3) {
        this.hoverCounter++;
        
        // Ensure alternatives array is valid and has elements
        if (!alternatives || !Array.isArray(alternatives) || alternatives.length === 0) {
            return [];
        }
        
        // Use hover counter as seed for different randomization each time
        const shuffled = alternatives.slice();
        
        // Fisher-Yates shuffle with counter-based seed
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor((Math.sin(this.hoverCounter * (i + 1)) * 10000) % 1 * (i + 1));
            // Ensure we don't access undefined indices
            if (shuffled[i] && shuffled[j]) {
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        }
        
        return shuffled.slice(0, Math.min(sampleSize, shuffled.length)).filter(item => item && item.line);
    }

    setupInteractions() {
        // Stock A hover zone interactions with BUG
        const hoverZoneA = this.interactionManager.select('hover-zone-a');
        if (hoverZoneA) {
            hoverZoneA.on('mouseenter', () => {
                // BUG: Hide all lines first
                this.allAlternativeLinesA.forEach(item => {
                    if (item && item.line) {
                        item.line.style('display', 'none');
                    }
                });
                
                // BUG: Show random sample of 3 lines
                const randomSample = this.getRandomSample(this.allAlternativeLinesA, 3);
                randomSample.forEach(item => {
                    if (item && item.line) {
                        item.line.style('display', 'block');
                    }
                });
                
                // Show the group
                this.alternativesGroupA.transition().duration(200)
                    .style('opacity', 0.6);
            });
            
            hoverZoneA.on('mouseleave', () => {
                this.alternativesGroupA.transition().duration(200)
                    .style('opacity', 0);
            });
        }

        // Stock B hover zone interactions with BUG
        const hoverZoneB = this.interactionManager.select('hover-zone-b');
        if (hoverZoneB) {
            hoverZoneB.on('mouseenter', () => {
                // BUG: Hide all lines first
                this.allAlternativeLinesB.forEach(item => {
                    if (item && item.line) {
                        item.line.style('display', 'none');
                    }
                });
                
                // BUG: Show random sample of 3 lines
                const randomSample = this.getRandomSample(this.allAlternativeLinesB, 3);
                randomSample.forEach(item => {
                    if (item && item.line) {
                        item.line.style('display', 'block');
                    }
                });
                
                // Show the group
                this.alternativesGroupB.transition().duration(200)
                    .style('opacity', 0.6);
            });
            
            hoverZoneB.on('mouseleave', () => {
                this.alternativesGroupB.transition().duration(200)
                    .style('opacity', 0);
            });
        }
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}