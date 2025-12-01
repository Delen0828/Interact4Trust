/**
 * Condition 1: Baseline
 * Shows only aggregated prediction lines
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition1 {
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
        const line = this.chartRenderer.createLineGenerator();

        // Render aggregated prediction lines only
        this.renderAggregatedLines(predictionGroup, line);

        console.log('Condition 1 (Baseline) rendered');
    }

    renderAggregatedLines(predictionGroup, line) {
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
        // No interactions for baseline condition
        console.log('No interactions for Condition 1 (Baseline)');
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}