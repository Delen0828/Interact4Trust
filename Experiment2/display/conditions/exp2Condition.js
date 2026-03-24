/**
 * Experiment 2: Unified Parameterized Condition
 *
 * Renders per-city display independently based on condition configuration:
 * - type "region": shaded 95% CI band around the mean + aggregated dashed line
 * - type "line" + lineCount=1: aggregated prediction line only
 * - type "line" + lineCount>1: sampled scenario lines + aggregated line
 *
 * Interaction mode options:
 * - hover_show_one: hover each city's dashed line to reveal only that city's details
 * - click_show_one: use two city checkboxes to toggle each city's details
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
            cityBLineCount: 1,
            interactionMode: 'hover_show_one'
        };

        this.isStaticBaseline = this.isStaticBaselineCondition();
        this.interactionMode = this.resolveInteractionMode();

        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
        this.cityInteractionState = {
            A: this.createCityInteractionState(),
            B: this.createCityInteractionState()
        };

        this.controlContainer = null;
        this.cityCheckboxes = { A: null, B: null };
    }

    resolveInteractionMode() {
        const candidate = String(
            this.conditionConfig?.interactionMode || this.conditionConfig?.displayFormat || 'hover_show_one'
        ).toLowerCase();
        if (candidate === 'click_show_one') return 'click_show_one';
        return 'hover_show_one';
    }

    isStaticBaselineCondition() {
        const cityAType = this.conditionConfig?.cityAType || 'line';
        const cityBType = this.conditionConfig?.cityBType || 'line';
        const cityALineCount = Number(this.conditionConfig?.cityALineCount || 1);
        const cityBLineCount = Number(this.conditionConfig?.cityBLineCount || 1);
        const conditionId = String(this.conditionConfig?.id || '').toLowerCase();

        const looksLikeBaselineById = conditionId.includes('baseline');
        const looksLikeStaticByStructure = cityAType === 'line'
            && cityBType === 'line'
            && cityALineCount <= 1
            && cityBLineCount <= 1;

        return looksLikeBaselineById || looksLikeStaticByStructure;
    }

    createCityInteractionState() {
        return {
            hoverZone: null,
            aggregatedLine: null,
            confidenceBounds: null,
            ensembleGroup: null
        };
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
        const predictionGroup = container.append('g').attr('class', 'predictions');

        // Render each city's predictions independently
        this.renderCityPrediction(predictionGroup, 'A', this.conditionConfig.cityAType, this.conditionConfig.cityALineCount);
        this.renderCityPrediction(predictionGroup, 'B', this.conditionConfig.cityBType, this.conditionConfig.cityBLineCount);

        if (!this.isStaticBaseline && this.interactionMode === 'click_show_one') {
            this.renderClickControls();
        }
    }

    renderCityPrediction(predictionGroup, city, type, lineCount) {
        if (type === 'region') {
            // Render confidence bounds hidden initially; reveal on interaction.
            this.cityInteractionState[city].confidenceBounds = this.renderConfidenceBounds(predictionGroup, city);
            // Then aggregated line on top
            this.renderAggregatedLine(predictionGroup, city);
        } else {
            // type === 'line'
            if (lineCount > 1) {
                // Render ensemble lines hidden initially; reveal on interaction.
                this.cityInteractionState[city].ensembleGroup = this.renderEnsembleLines(predictionGroup, city, lineCount);
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

            predictionGroup.append('path')
                .datum(areaData)
                .attr('class', `confidence-bounds confidence-bounds-${city.toLowerCase()}`)
                .attr('fill', color)
                .attr('opacity', 0)
                .attr('d', area);

            return predictionGroup.select(`.confidence-bounds-${city.toLowerCase()}`);
        }

        return null;
    }

    renderAggregatedLine(predictionGroup, city) {
        const line = this.chartRenderer.createLineGenerator();
        const color = city === 'A' ? this.config.colors.stockA : this.config.colors.stockB;
        const lastHistorical = this.data.stockData[city].historical[
            this.data.stockData[city].historical.length - 1
        ];

        if (this.data.realTimeAggregated[city] && this.data.realTimeAggregated[city].length > 0) {
            const fullAggregatedData = [lastHistorical, ...this.data.realTimeAggregated[city]];

            predictionGroup.append('path')
                .datum(fullAggregatedData)
                .attr('class', `aggregated-line real-time-aggregated aggregated-stock-${city.toLowerCase()}-line stock-${city.toLowerCase()}-line`)
                .attr('stroke', color)
                .attr('fill', 'none')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5')
                .attr('d', line);

            this.cityInteractionState[city].aggregatedLine = predictionGroup.select(`.aggregated-stock-${city.toLowerCase()}-line`);

            if (!this.isStaticBaseline) {
                const hoverZone = this.interactionManager.createHoverZone(
                    predictionGroup,
                    fullAggregatedData,
                    `hover-zone exp2-hover-zone-${city.toLowerCase()}`,
                    line,
                    20
                );
                this.cityInteractionState[city].hoverZone = hoverZone;
            }
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
        this.data.stockData[city].alternatives.forEach((alt) => {
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
        const ensembleGroup = predictionGroup.append('g')
            .attr('class', `alternatives-group-${city.toLowerCase()}`)
            .style('opacity', 0);

        // Draw each scenario line
        rankedScenarioIds.forEach((scenarioId, index) => {
            const scenarioData = scenarios[scenarioId];
            if (scenariosToShowSet.has(scenarioId) && scenarioData && scenarioData.length > 0) {
                const fullScenarioData = [lastHistorical, ...scenarioData];

                ensembleGroup.append('path')
                    .datum(fullScenarioData)
                    .attr('class', `prediction-line alternative-line scenario-${index} stock-${city.toLowerCase()}-line`)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', 1.5)
                    .attr('opacity', this.interactionManager.getOpacityValues().alternativeOpacity)
                    .attr('d', line);
            }
        });

        return ensembleGroup;
    }

    setCityDetailVisibility(city, isVisible, duration = 180) {
        const state = this.cityInteractionState[city];
        if (!state) return;

        const { alternativeOpacity, shadeOpacity } = this.interactionManager.getOpacityValues();

        if (state.confidenceBounds) {
            state.confidenceBounds.transition()
                .duration(duration)
                .attr('opacity', isVisible ? shadeOpacity : 0);
        }
        if (state.ensembleGroup) {
            state.ensembleGroup.transition()
                .duration(duration)
                .style('opacity', isVisible ? alternativeOpacity : 0);
        }
    }

    renderClickControls() {
        const controls = this.createControlContainer();
        if (!controls) return;

        const cityALabel = this.config?.labels?.stockA || 'City A';
        const cityBLabel = this.config?.labels?.stockB || 'City B';
        const colorA = this.config?.colors?.stockA || '#0891B2';
        const colorB = this.config?.colors?.stockB || '#7C3AED';

        const controlA = this.createCheckboxControl(
            `exp3-city-a-${this.svgId}`,
            cityALabel,
            colorA,
            (checked) => this.setCityDetailVisibility('A', checked)
        );
        controlA.checkbox.setAttribute('data-stock', 'A');
        controlA.checkbox.setAttribute('data-interaction', 'checkbox-city');
        controls.appendChild(controlA.wrapper);
        this.cityCheckboxes.A = controlA.checkbox;

        const controlB = this.createCheckboxControl(
            `exp3-city-b-${this.svgId}`,
            cityBLabel,
            colorB,
            (checked) => this.setCityDetailVisibility('B', checked)
        );
        controlB.checkbox.setAttribute('data-stock', 'B');
        controlB.checkbox.setAttribute('data-interaction', 'checkbox-city');
        controls.appendChild(controlB.wrapper);
        this.cityCheckboxes.B = controlB.checkbox;
    }

    createControlContainer() {
        const chartContainer = document.querySelector(`#${this.svgId}`)?.parentElement;
        if (!chartContainer) return null;

        const controls = document.createElement('div');
        controls.className = 'exp3-detail-controls';
        controls.setAttribute('data-interaction', 'checkbox-controls');
        controls.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            margin: 12px auto 0;
            padding: 8px 10px;
            background: #f8f9fa;
            border-top: 1px solid #e5e7eb;
            border-radius: 6px;
            box-sizing: border-box;
            flex-wrap: wrap;
        `;

        chartContainer.appendChild(controls);
        this.controlContainer = controls;
        return controls;
    }

    createCheckboxControl(id, label, color, onChange) {
        const wrapper = document.createElement('label');
        wrapper.className = 'exp3-checkbox-wrapper';
        wrapper.setAttribute('data-interaction', 'checkbox-wrapper');
        wrapper.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-size: 12px;
            color: #374151;
            padding: 4px 8px;
            border: 1px solid #d1d5db;
            border-radius: 16px;
            background: #ffffff;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.className = 'exp3-detail-checkbox';
        checkbox.setAttribute('data-interaction', 'checkbox-input');
        checkbox.style.cssText = `
            margin: 0;
            width: 14px;
            height: 14px;
            cursor: pointer;
        `;

        const swatch = document.createElement('span');
        swatch.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            background: ${color};
        `;

        const labelText = document.createElement('span');
        labelText.textContent = label;

        checkbox.addEventListener('change', () => {
            onChange(Boolean(checkbox.checked));
        });

        wrapper.appendChild(checkbox);
        wrapper.appendChild(swatch);
        wrapper.appendChild(labelText);

        return { wrapper, checkbox };
    }

    setupInteractions() {
        if (this.isStaticBaseline) return;

        if (this.interactionMode === 'click_show_one') {
            // Checkbox interaction handlers are attached during control creation.
            return;
        }

        ['A', 'B'].forEach((city) => {
            const state = this.cityInteractionState[city];
            if (!state || !state.hoverZone) return;

            state.hoverZone
                .on('mouseenter', () => {
                    this.setCityDetailVisibility(city, true, 180);
                })
                .on('mouseleave', () => {
                    this.setCityDetailVisibility(city, false, 180);
                });
        });
    }

    cleanup() {
        this.interactionManager.cleanup();
        if (this.controlContainer && this.controlContainer.parentElement) {
            this.controlContainer.parentElement.removeChild(this.controlContainer);
        }
    }
}
