/**
 * Condition 11: Checkbox Selection (Bad Design)
 * Shows list of checkboxes for each prediction scenario
 * All boxes start empty (unchecked)
 * User must tick each box individually to reveal corresponding line
 * Bad UX due to multiple selections required
 */
import { ChartRenderer } from '../base/chartRenderer.js';
import { InteractionManager } from '../base/interactionManager.js';

export default class Condition11 {
    constructor(svgId, processedData, config, phase = null) {
        this.svgId = svgId;
        this.data = processedData;
        this.config = config;
        this.phase = phase;
        this.chartRenderer = new ChartRenderer(svgId, config, phase);
        this.interactionManager = new InteractionManager(svgId);
        
        // State management for checkboxes and lines (individual city/scenario combinations)
        this.checkboxContainer = null;
        this.alternativeLines = {}; // Store by cityScenario key (e.g., "A_1", "B_2")
        this.cityScenarioCheckboxes = {};
        this.selectAllCheckbox = null;
        this.isBulkUpdating = false;
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

        // Render aggregated prediction lines (always visible)
        this.renderAggregatedLines(predictionGroup);

        // Render alternative prediction lines (hidden initially)
        this.renderAlternativeLines(predictionGroup);

        // Add checkbox controls
        this.addCheckboxControls();
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
    }

    renderAlternativeLines(predictionGroup) {
        const line = this.chartRenderer.createLineGenerator();
        
        // Create individual alternative lines for each city and scenario combination
        ['A', 'B'].forEach((stock, stockIndex) => {
            const color = stockIndex === 0 ? this.config.colors.stockA : this.config.colors.stockB;
            const lastHistorical = this.data.stockData[stock].historical[
                this.data.stockData[stock].historical.length - 1
            ];
            
            // Group alternatives by scenario
            const scenarios = {};
            this.data.stockData[stock].alternatives.forEach(alt => {
                if (!scenarios[alt.scenario]) {
                    scenarios[alt.scenario] = [];
                }
                scenarios[alt.scenario].push(alt);
            });
            
            // Create individual lines for each scenario of this city
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
                        .style("display", "none"); // Hidden initially
                    
                    // Store reference by cityScenario key
                    const cityScenarioKey = `${stock}_${scenarioName}`;
                    this.alternativeLines[cityScenarioKey] = alternativeLine;
                }
            });
        });
    }

    addCheckboxControls() {
        // Append controls inside chart container to keep them below chart (not side-by-side)
        const chartContainer = document.querySelector(`#${this.svgId}`).parentElement;
        
        // Create checkbox container beneath the chart
        this.checkboxContainer = document.createElement('div');
        this.checkboxContainer.style.cssText = `
            display: block;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin: 12px auto 0;
            padding: 6px 8px;
            background: #f8f9fa;
            border-radius: 6px;
            border-top: 1px solid #e9ecef;
            clear: both;
            text-align: center;
        `;
        
        // Create checkbox grid (separate for each city/scenario combination)
        const checkboxGrid = document.createElement('div');
        checkboxGrid.style.cssText = `
            display: flex;
            flex-wrap: nowrap;
            justify-content: center;
            align-items: center;
            gap: 2px;
            overflow-x: auto;
            overflow-y: hidden;
            padding-bottom: 1px;
        `;

        // Add checkboxes for each city/scenario combination
        const scenarioIndexByCity = { A: 0, B: 0 };
        Object.keys(this.alternativeLines).sort().forEach((cityScenarioKey) => {
            const [city] = cityScenarioKey.split('_');
            scenarioIndexByCity[city] = (scenarioIndexByCity[city] || 0) + 1;
            const scenarioIndex = scenarioIndexByCity[city];
            const color = city === 'A' ? this.config.colors.stockA : this.config.colors.stockB;
            
            const checkboxWrapper = document.createElement('label');
            checkboxWrapper.style.cssText = `
                display: flex;
                align-items: center;
                font-size: 9px;
                color: #6c757d;
                cursor: pointer;
                padding: 1px 3px;
                border-radius: 2px;
                transition: background-color 0.2s;
                border: 1px solid #e9ecef;
                margin: 0;
                min-height: 18px;
                white-space: nowrap;
            `;
            
            // Add hover effect
            checkboxWrapper.addEventListener('mouseenter', () => {
                checkboxWrapper.style.backgroundColor = '#f8f9fa';
            });
            checkboxWrapper.addEventListener('mouseleave', () => {
                checkboxWrapper.style.backgroundColor = 'transparent';
            });
            
            // Create checkbox input
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `checkbox-${cityScenarioKey}-${this.svgId}`;
            checkbox.style.cssText = `
                margin-right: 2px;
                transform: scale(0.72);
            `;

            const colorDot = document.createElement('div');
            colorDot.style.cssText = `
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: ${color};
                margin-right: 2px;
                flex: 0 0 auto;
            `;
            
            // Create label text
            const labelText = document.createElement('span');
            labelText.textContent = `${city}[${scenarioIndex}]`;
            labelText.style.fontSize = '8px';
            
            // Add event listener
            checkbox.addEventListener('change', () => {
                this.toggleCityScenario(cityScenarioKey, checkbox.checked);
                this.updateSelectAllState();
            });
            this.cityScenarioCheckboxes[cityScenarioKey] = checkbox;
            
            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(colorDot);
            checkboxWrapper.appendChild(labelText);
            checkboxGrid.appendChild(checkboxWrapper);
        });

        // Add "Select All" option at the end
        const selectAllWrapper = document.createElement('label');
        selectAllWrapper.style.cssText = `
            display: flex;
            align-items: center;
            font-size: 9px;
            color: #495057;
            cursor: pointer;
            padding: 1px 3px;
            border-radius: 2px;
            border: 1px dashed #adb5bd;
            margin: 0;
            min-height: 18px;
            font-weight: 600;
            white-space: nowrap;
        `;

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = `checkbox-select-all-${this.svgId}`;
        selectAllCheckbox.style.cssText = `
            margin-right: 2px;
            transform: scale(0.72);
        `;
        this.selectAllCheckbox = selectAllCheckbox;

        const selectAllText = document.createElement('span');
        selectAllText.textContent = 'All';
        selectAllText.style.fontSize = '8px';

        selectAllCheckbox.addEventListener('change', () => {
            this.setAllScenariosVisible(selectAllCheckbox.checked);
        });

        selectAllWrapper.appendChild(selectAllCheckbox);
        selectAllWrapper.appendChild(selectAllText);
        checkboxGrid.appendChild(selectAllWrapper);
        
        this.checkboxContainer.appendChild(checkboxGrid);
        
        chartContainer.appendChild(this.checkboxContainer);
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
        // No additional interactions needed for this condition
        // The checkbox interactions are handled in addCheckboxControls()
    }

    cleanup() {
        this.interactionManager.cleanup();
        
        // Remove checkbox container if it exists
        if (this.checkboxContainer && this.checkboxContainer.parentElement) {
            this.checkboxContainer.parentElement.removeChild(this.checkboxContainer);
        }
    }
}
