/**
 * Condition 0: Historical Only
 * Shows only historical data, no predictions after 6/1
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition0 {
    constructor(svgId, processedData, config) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.chartRenderer = new ChartRenderer(svgId, config);
        this.interactionManager = new InteractionManager(svgId);
    }

    render() {
        // Setup chart structure without historical lines (we'll render them ourselves)
        this.chartRenderer.clearAndSetup();
        this.chartRenderer.createScales(
            {
                A: this.data.stockData.A,
                B: this.data.stockData.B,
                realTimeAggregated: {} // No aggregated data for historical only
            },
            this.data.globalYScale
        );
        this.chartRenderer.addGrid();
        this.chartRenderer.addAxes();
        this.chartRenderer.addReferenceLine();

        const container = this.chartRenderer.getContainer();

        // Create historical data group
        const historicalGroup = container.append("g").attr("class", "historical-data");

        // Render only historical lines (no predictions)
        this.renderHistoricalLinesOnly(historicalGroup);

    }

    renderHistoricalLinesOnly(historicalGroup) {
        const line = this.chartRenderer.createLineGenerator();

        ['A', 'B'].forEach((stock, i) => {
            const color = i === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const historicalData = this.data.stockData[stock].historical;
            
            if (historicalData && historicalData.length > 0) {
                historicalGroup.append("path")
                    .datum(historicalData)
                    .attr("class", `historical-line stock-${stock.toLowerCase()}-line`)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 2)
                    .attr("d", line);
                    
            }
        });
    }

    setupInteractions() {
        // No interactions for historical-only condition
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}