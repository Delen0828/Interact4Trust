/**
 * Condition 16: Tiny Slider Checkbox Selection (Worse Design)
 * Worse version of Condition 11 with a tiny vertical-space horizontal slider.
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition16 {
    constructor(svgId, processedData, config, phase = null) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);

        this.sliderContainer = null;
        this.alternativeLines = {};
        this.cityScenarioCheckboxes = {};
        this.selectAllCheckbox = null;
        this.isBulkUpdating = false;
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

        this.renderAggregatedLines(predictionGroup);
        this.renderAlternativeLines(predictionGroup);
        this.addTinySliderControls();
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
    }

    renderAlternativeLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();

        ['A', 'B'].forEach((stock, stockIndex) => {
            const color = stockIndex === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];

            const scenarios = {};
            this.data.stockData[stock].alternatives.forEach(alt => {
                if (!scenarios[alt.scenario]) {
                    scenarios[alt.scenario] = [];
                }
                scenarios[alt.scenario].push(alt);
            });

            Object.entries(scenarios).forEach(([scenarioName, scenarioData]) => {
                if (scenarioData.length > 0) {
                    const fullScenarioData = [lastHistorical, ...scenarioData];
                    const alternativeLine = predictionGroup.append("path")
                        .datum(fullScenarioData)
                        .attr("class", `alternative-line scenario-${scenarioName} stock-${stock.toLowerCase()}-line`)
                        .attr("fill", "none")
                        .attr("stroke", color)
                        .attr("stroke-width", 1.5)
                        .attr("opacity", 0.6)
                        .attr("d", line)
                        .style("display", "none");

                    const cityScenarioKey = `${stock}_${scenarioName}`;
                    this.alternativeLines[cityScenarioKey] = alternativeLine;
                }
            });
        });
    }

    addTinySliderControls() {
        const chartContainer = document.querySelector(`#${this.svgId}`).parentElement;

        this.sliderContainer = document.createElement('div');
        this.sliderContainer.style.cssText = `
            width: min(100%, 680px);
            margin: 10px auto 0;
            padding: 6px 8px;
            background: #f3f4f6;
            border-radius: 6px;
            border-top: 1px solid #d1d5db;
            text-align: center;
        `;

        const header = document.createElement('div');
        header.textContent = 'Select scenarios to display:';
        header.style.cssText = `
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #4b5563;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        this.sliderContainer.appendChild(header);

        const sliderViewport = document.createElement('div');
        sliderViewport.style.cssText = `
            overflow: visible;
            width: 100%;
            margin: 0 auto;
            padding: 0;
            border: none;
            border-radius: 0;
            background: transparent;
        `;

        const sliderTrack = document.createElement('div');
        sliderTrack.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 4px;
            width: 100%;
        `;

        Object.keys(this.alternativeLines).sort().forEach((cityScenarioKey) => {
            const [city, scenarioName] = cityScenarioKey.split('_');
            const color = city === 'A' ? this.config.colors.stockA : this.config.colors.stockB;

            const checkboxWrapper = document.createElement('label');
            checkboxWrapper.style.cssText = `
                display: flex;
                align-items: center;
                min-height: 24px;
                font-size: 10px;
                color: #6b7280;
                cursor: pointer;
                padding: 2px 6px;
                border: 1px solid #e5e7eb;
                border-radius: 3px;
                white-space: nowrap;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `tiny-checkbox-${cityScenarioKey}-${this.svgId}`;
            checkbox.style.cssText = `
                margin-right: 4px;
                transform: scale(0.8);
            `;

            const colorDot = document.createElement('div');
            colorDot.style.cssText = `
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: ${color};
                margin-right: 3px;
                flex: 0 0 auto;
            `;

            const labelText = document.createElement('span');
            labelText.textContent = `${city}S${scenarioName}`;
            labelText.style.fontSize = '9px';

            checkbox.addEventListener('change', () => {
                this.toggleCityScenario(cityScenarioKey, checkbox.checked);
                this.updateSelectAllState();
            });
            this.cityScenarioCheckboxes[cityScenarioKey] = checkbox;

            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(colorDot);
            checkboxWrapper.appendChild(labelText);
            sliderTrack.appendChild(checkboxWrapper);
        });

        const selectAllWrapper = document.createElement('label');
        selectAllWrapper.style.cssText = `
            display: flex;
            align-items: center;
            min-height: 24px;
            font-size: 10px;
            color: #111827;
            cursor: pointer;
            padding: 2px 6px;
            border: 1px dashed #9ca3af;
            border-radius: 3px;
            font-weight: 600;
            white-space: nowrap;
        `;

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = `tiny-checkbox-select-all-${this.svgId}`;
        selectAllCheckbox.style.cssText = `
            margin-right: 4px;
            transform: scale(0.8);
        `;
        this.selectAllCheckbox = selectAllCheckbox;

        const selectAllText = document.createElement('span');
        selectAllText.textContent = 'All';

        selectAllCheckbox.addEventListener('change', () => {
            this.setAllScenariosVisible(selectAllCheckbox.checked);
        });

        selectAllWrapper.appendChild(selectAllCheckbox);
        selectAllWrapper.appendChild(selectAllText);
        sliderTrack.appendChild(selectAllWrapper);

        sliderViewport.appendChild(sliderTrack);
        this.sliderContainer.appendChild(sliderViewport);

        const instruction = document.createElement('div');
        instruction.textContent = 'Compact selection controls below chart.';
        instruction.style.cssText = `
            font-size: 9px;
            color: #6b7280;
            text-align: center;
            margin-top: 6px;
            font-style: italic;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        this.sliderContainer.appendChild(instruction);

        chartContainer.appendChild(this.sliderContainer);
    }

    toggleCityScenario(cityScenarioKey, isVisible) {
        const line = this.alternativeLines[cityScenarioKey];
        if (line) {
            line.style('display', isVisible ? 'block' : 'none');
        }
    }

    setAllScenariosVisible(isVisible) {
        this.isBulkUpdating = true;
        Object.entries(this.cityScenarioCheckboxes).forEach(([cityScenarioKey, checkbox]) => {
            checkbox.checked = isVisible;
            this.toggleCityScenario(cityScenarioKey, isVisible);
        });
        this.isBulkUpdating = false;
    }

    updateSelectAllState() {
        if (!this.selectAllCheckbox || this.isBulkUpdating) {
            return;
        }

        const checkboxes = Object.values(this.cityScenarioCheckboxes);
        const allChecked = checkboxes.length > 0 && checkboxes.every(checkbox => checkbox.checked);
        this.selectAllCheckbox.checked = allChecked;
    }

    setupInteractions() {
        // No extra interactions beyond checkbox controls.
    }

    cleanup() {
        this.interactionManager.cleanup();
        if (this.sliderContainer && this.sliderContainer.parentElement) {
            this.sliderContainer.parentElement.removeChild(this.sliderContainer);
        }
    }
}
