/**
 * Experiment 2: Unified Parameterized Condition
 *
 * Renders per-city display independently based on condition configuration:
 * - type "region": shaded 95% CI band around the mean + aggregated dashed line
 * - type "line" + lineCount=1: aggregated prediction line only
 * - type "line" + lineCount>1: sampled scenario lines + aggregated line
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { DataProcessor } from '../base/dataProcessor.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Exp2Condition {
    constructor(svgId, processedData, config, phase, conditionConfig) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.conditionConfig = conditionConfig || {
            cityAType: 'line',
            cityBType: 'line',
            cityALineCount: 1,
            cityBLineCount: 1
        };
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
    }

    render() {
        // Setup basic chart structure (axes, grid, reference line, historical lines)
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

        // Render each city's predictions independently
        this.renderCityPrediction(predictionGroup, 'A', this.conditionConfig.cityAType, this.conditionConfig.cityALineCount);
        this.renderCityPrediction(predictionGroup, 'B', this.conditionConfig.cityBType, this.conditionConfig.cityBLineCount);
    }

    renderCityPrediction(predictionGroup, city, type, lineCount) {
        if (type === 'region') {
            // Render confidence bounds (PI band) first (underneath)
            this.renderConfidenceBounds(predictionGroup, city);
            // Then aggregated line on top
            this.renderAggregatedLine(predictionGroup, city);
        } else {
            // type === 'line'
            if (lineCount > 1) {
                // Render ensemble lines underneath
                this.renderEnsembleLines(predictionGroup, city, lineCount);
            }
            // Aggregated line on top
            this.renderAggregatedLine(predictionGroup, city);
        }
    }

    renderConfidenceBounds(predictionGroup, city) {
        const area = this.chartRenderer.createAreaGenerator();
        const color = city === 'A' ? this.config.colors.stockA : this.config.colors.stockB;
        const lastHistorical = this.data.stockData[city].historical[
            this.data.stockData[city].historical.length - 1
        ];

        if (this.data.confidenceBounds[city] && this.data.confidenceBounds[city].length > 0) {
            // Connect from last historical point
            const areaData = [
                { date: lastHistorical.date, lower: lastHistorical.price, upper: lastHistorical.price },
                ...this.data.confidenceBounds[city]
            ];

            predictionGroup.append("path")
                .datum(areaData)
                .attr("class", `confidence-bounds confidence-bounds-${city.toLowerCase()}`)
                .attr("fill", color)
                .attr("opacity", this.interactionManager.getOpacityValues().shadeOpacity)
                .attr("d", area);
        }
    }

    renderAggregatedLine(predictionGroup, city) {
        const line = this.chartRenderer.createLineGenerator();
        const color = city === 'A' ? this.config.colors.stockA : this.config.colors.stockB;
        const lastHistorical = this.data.stockData[city].historical[
            this.data.stockData[city].historical.length - 1
        ];

        if (this.data.realTimeAggregated[city] && this.data.realTimeAggregated[city].length > 0) {
            const fullAggregatedData = [lastHistorical, ...this.data.realTimeAggregated[city]];

            predictionGroup.append("path")
                .datum(fullAggregatedData)
                .attr("class", `aggregated-line real-time-aggregated stock-${city.toLowerCase()}-line`)
                .attr("stroke", color)
                .attr("fill", "none")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .attr("d", line);
        }
    }

    renderEnsembleLines(predictionGroup, city, lineCount) {
        const line = this.chartRenderer.createLineGenerator();
        const color = city === 'A' ? this.config.colors.stockA : this.config.colors.stockB;
        const lastHistorical = this.data.stockData[city].historical[
            this.data.stockData[city].historical.length - 1
        ];

        // Group alternatives by scenario
        const scenarios = {};
        this.data.stockData[city].alternatives.forEach(alt => {
            if (!scenarios[alt.scenario]) {
                scenarios[alt.scenario] = [];
            }
            scenarios[alt.scenario].push(alt);
        });

        const rankedScenarioIds = Object.entries(scenarios)
            .map(([scenarioId, scenarioRows]) => {
                const sortedRows = scenarioRows.slice().sort((a, b) => a.date - b.date);
                const finalRow = sortedRows[sortedRows.length - 1];
                return {
                    scenarioId,
                    finalPrice: finalRow ? finalRow.price : Number.NEGATIVE_INFINITY
                };
            })
            .sort((a, b) => {
                if (b.finalPrice !== a.finalPrice) {
                    return b.finalPrice - a.finalPrice;
                }
                return a.scenarioId.localeCompare(b.scenarioId);
            })
            .map((entry) => entry.scenarioId);

        const seedBase = this.conditionConfig?.samplingSeed || `${this.conditionConfig?.id || 'exp2'}|${city}`;
        const scenariosToShow = DataProcessor.sampleRankedScenariosEvenly(
            rankedScenarioIds,
            lineCount,
            `${seedBase}|${city}|${lineCount}`
        );
        const scenariosToShowSet = new Set(scenariosToShow);

        // Create ensemble lines group
        const ensembleGroup = predictionGroup.append("g")
            .attr("class", `alternatives-group-${city.toLowerCase()}`)
            .style("opacity", 1);

        // Draw each scenario line
        rankedScenarioIds.forEach((scenarioId, index) => {
            const scenarioData = scenarios[scenarioId];
            if (scenariosToShowSet.has(scenarioId) && scenarioData && scenarioData.length > 0) {
                const fullScenarioData = [lastHistorical, ...scenarioData];

                ensembleGroup.append("path")
                    .datum(fullScenarioData)
                    .attr("class", `prediction-line alternative-line scenario-${index} stock-${city.toLowerCase()}-line`)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 1.5)
                    .attr("opacity", this.interactionManager.getOpacityValues().alternativeOpacity)
                    .attr("d", line);
            }
        });
    }

    setupInteractions() {
        // No interactions for Experiment 2 - all static
    }

    cleanup() {
        this.interactionManager.cleanup();
    }
}
