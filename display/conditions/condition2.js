/**
 * Condition 2: PI Plot
 * Shows aggregated prediction with confidence bounds
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition2 {
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

        // Render confidence bounds first (underneath other elements)
        this.renderConfidenceBounds(predictionGroup);

        // Render aggregated prediction lines
        this.renderAggregatedLines(predictionGroup);

        console.log('Condition 2 (PI Plot) rendered');
    }

    renderConfidenceBounds(predictionGroup) {
        const area = this.chartRenderer.createAreaGenerator();

        ['A', 'B'].forEach((stock, i) => {
            const color = i === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            
            if (this.data.confidenceBounds[stock] && this.data.confidenceBounds[stock].length > 0) {
                // Create area data including connection from last historical point
                const areaData = [
                    { date: lastHistorical.date, min: lastHistorical.price, max: lastHistorical.price },
                    ...this.data.confidenceBounds[stock]
                ];
                
                // Draw confidence bounds area
                predictionGroup.append("path")
                    .datum(areaData)
                    .attr("class", `confidence-bounds confidence-bounds-${stock.toLowerCase()}`)
                    .attr("fill", color)
                    .attr("opacity", 0.2)
                    .attr("d", area);
                    
                console.log(`Rendered confidence bounds for stock ${stock} with ${this.data.confidenceBounds[stock].length} points`);
            }
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
        // No interactions for static PI plot
        console.log('No interactions for Condition 2 (PI Plot)');
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}