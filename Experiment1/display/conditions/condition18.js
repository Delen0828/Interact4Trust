/**
 * Condition 18: Glitch Hover
 * Aggregated by default, hover reveals alternatives with a millisecond-based glitch.
 * On hover, take the 2-digit millisecond value (0-99). If it is in the hidden list,
 * the alternatives are invisible; otherwise visible.
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

const HIDDEN_MILLISECOND_BUCKETS = new Set([
    4, 8, 10, 15, 18, 20, 21, 25, 32, 37,
    39, 43, 46, 52, 65, 72, 73, 77, 78, 79,
    80, 83, 84, 85, 87, 88, 89, 90, 94, 95
]);

export default class Condition18 {
    constructor(svgId, processedData, config, phase = null) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
        this.alternativesGroupA = null;
        this.alternativesGroupB = null;
        this.glitchIntervals = new Map();
        this.glitchVisibleState = new Map();
    }

    render() {
        const container = this.chartRenderer.setupBasicChart(
            {
                A: this.data.stockData.A,
                B: this.data.stockData.B,
                realTimeAggregated: this.data.realTimeAggregated
            },
            this.data.globalYScale
        );

        const predictionGroup = container.append("g").attr("class", "predictions");

        this.renderAlternativeLines(predictionGroup);
        this.renderAggregatedLines(predictionGroup);
    }

    renderAlternativeLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();

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

            const scenarios = {};
            this.data.stockData[stock].alternatives.forEach(alt => {
                if (!scenarios[alt.scenario]) {
                    scenarios[alt.scenario] = [];
                }
                scenarios[alt.scenario].push(alt);
            });

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

    renderAggregatedLines(predictionGroup) {
        this.chartRenderer.renderAggregatedLines(
            predictionGroup,
            {
                A: this.data.stockData.A,
                B: this.data.stockData.B
            },
            this.config.colors,
            this.data.realTimeAggregated
        );

        const line = this.chartRenderer.createLineGenerator();
        ['A', 'B'].forEach((stock) => {
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];

            if (this.data.realTimeAggregated[stock] && this.data.realTimeAggregated[stock].length > 0) {
                const fullAggregatedData = [lastHistorical, ...this.data.realTimeAggregated[stock]];

                this.interactionManager.createHoverZone(
                    predictionGroup,
                    fullAggregatedData,
                    `hover-zone-${stock.toLowerCase()}`,
                    line
                );
            }
        });
    }

    applyGlitchVisibility(targetGroup, key) {
        const { alternativeOpacity } = this.interactionManager.getOpacityValues();
        const now = new Date();
        const millisecondBucket = Math.floor(now.getMilliseconds() / 10); // 0-99
        const isVisible = !HIDDEN_MILLISECOND_BUCKETS.has(millisecondBucket);

        if (this.glitchVisibleState.get(key) === isVisible) {
            return;
        }

        this.glitchVisibleState.set(key, isVisible);
        targetGroup.interrupt().style("opacity", isVisible ? alternativeOpacity : 0);
    }

    startGlitch(key, targetGroup) {
        this.stopGlitch(key);
        this.glitchVisibleState.delete(key);
        this.applyGlitchVisibility(targetGroup, key);

        const intervalId = setInterval(() => {
            this.applyGlitchVisibility(targetGroup, key);
        }, 10);

        this.glitchIntervals.set(key, intervalId);
    }

    stopGlitch(key) {
        if (this.glitchIntervals.has(key)) {
            clearInterval(this.glitchIntervals.get(key));
            this.glitchIntervals.delete(key);
        }
        this.glitchVisibleState.delete(key);
    }

    addGlitchHoverInteraction(hoverZone, targetGroup, key) {
        hoverZone
            .on("mouseenter", () => {
                this.startGlitch(key, targetGroup);
            })
            .on("mouseleave", () => {
                this.stopGlitch(key);
                targetGroup.interrupt().style("opacity", 0);
            });
    }

    setupInteractions() {
        const hoverZoneA = this.interactionManager.select('hover-zone-a');
        const hoverZoneB = this.interactionManager.select('hover-zone-b');

        this.addGlitchHoverInteraction(hoverZoneA, this.alternativesGroupA, 'A');
        this.addGlitchHoverInteraction(hoverZoneB, this.alternativesGroupB, 'B');
    }

    cleanup() {
        this.stopGlitch('A');
        this.stopGlitch('B');
        this.interactionManager.cleanup();
    }
}
