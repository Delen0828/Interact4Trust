/**
 * Visualization Renderer
 * 
 * D3.js-based rendering for all 8 visualization conditions
 * Handles air quality data visualization with different uncertainty representations
 */

class VisualizationRenderer {
  constructor(containerId) {
    this.containerId = containerId;
    this.width = ExperimentConfig.visualization.width || 600;
    this.height = ExperimentConfig.visualization.height || 400;
    this.margin = ExperimentConfig.visualization.margin || { top: 20, right: 20, bottom: 40, left: 50 };
    this.colors = ExperimentConfig.visualization.colors || {
      cityA: '#007bff',
      cityB: '#fd7e14',
      historical: '#6c757d'
    };
  }

  // Condition 1: Baseline - Aggregated prediction lines only
  renderCondition1(data) {
    console.log('Rendering Condition 1: Baseline');
    this.clearContainer();
    
    const svg = this.createBaseSvg();
    const { xScale, yScale } = this.createScales(data);
    
    this.drawAxes(svg, xScale, yScale);
    this.drawHistoricalData(svg, data.historical, xScale, yScale);
    this.drawAggregatedPredictions(svg, data.predictions.aggregated, xScale, yScale);
  }

  // Condition 2: PI Plot - Confidence bounds with shaded areas
  renderCondition2(data) {
    console.log('Rendering Condition 2: PI Plot');
    this.clearContainer();
    
    const svg = this.createBaseSvg();
    const { xScale, yScale } = this.createScales(data);
    
    this.drawAxes(svg, xScale, yScale);
    this.drawHistoricalData(svg, data.historical, xScale, yScale);
    this.drawConfidenceBounds(svg, data.predictions.bounds, xScale, yScale);
    this.drawAggregatedPredictions(svg, data.predictions.aggregated, xScale, yScale);
  }

  // Condition 3: Ensemble Plot - Multiple prediction lines
  renderCondition3(data) {
    console.log('Rendering Condition 3: Ensemble Plot');
    this.clearContainer();
    
    const svg = this.createBaseSvg();
    const { xScale, yScale } = this.createScales(data);
    
    this.drawAxes(svg, xScale, yScale);
    this.drawHistoricalData(svg, data.historical, xScale, yScale);
    this.drawScenarioLines(svg, data.predictions.scenarios, xScale, yScale);
    this.drawAggregatedPredictions(svg, data.predictions.aggregated, xScale, yScale);
  }

  // Condition 4: Ensemble + Hover - Aggregated with hover to reveal alternatives
  renderCondition4(data) {
    console.log('Rendering Condition 4: Ensemble + Hover');
    this.clearContainer();
    
    const svg = this.createBaseSvg();
    const { xScale, yScale } = this.createScales(data);
    
    this.drawAxes(svg, xScale, yScale);
    this.drawHistoricalData(svg, data.historical, xScale, yScale);
    
    // Draw scenario lines (initially hidden)
    const scenarioGroup = this.drawScenarioLines(svg, data.predictions.scenarios, xScale, yScale, true);
    const aggregatedGroup = this.drawAggregatedPredictions(svg, data.predictions.aggregated, xScale, yScale);
    
    this.addHoverInteraction(svg, scenarioGroup, aggregatedGroup);
  }

  // Condition 5: PI Plot + Hover
  renderCondition5(data) {
    console.log('Rendering Condition 5: PI Plot + Hover');
    this.clearContainer();
    
    const svg = this.createBaseSvg();
    const { xScale, yScale } = this.createScales(data);
    
    this.drawAxes(svg, xScale, yScale);
    this.drawHistoricalData(svg, data.historical, xScale, yScale);
    
    // Draw confidence bounds
    const boundsGroup = this.drawConfidenceBounds(svg, data.predictions.bounds, xScale, yScale);
    const aggregatedGroup = this.drawAggregatedPredictions(svg, data.predictions.aggregated, xScale, yScale);
    
    // Draw scenario lines (initially hidden)
    const scenarioGroup = this.drawScenarioLines(svg, data.predictions.scenarios, xScale, yScale, true);
    
    this.addPIHoverInteraction(svg, scenarioGroup, boundsGroup, aggregatedGroup);
  }

  // Condition 6: PI → Ensemble (Transform on hover)
  renderCondition6(data) {
    console.log('Rendering Condition 6: PI → Ensemble');
    this.clearContainer();
    
    const svg = this.createBaseSvg();
    const { xScale, yScale } = this.createScales(data);
    
    this.drawAxes(svg, xScale, yScale);
    this.drawHistoricalData(svg, data.historical, xScale, yScale);
    
    // Start with PI plot
    const boundsGroup = this.drawConfidenceBounds(svg, data.predictions.bounds, xScale, yScale);
    const aggregatedGroup = this.drawAggregatedPredictions(svg, data.predictions.aggregated, xScale, yScale);
    
    // Prepare ensemble elements (hidden initially)
    const scenarioGroup = this.drawScenarioLines(svg, data.predictions.scenarios, xScale, yScale, true);
    
    this.addTransformInteraction(svg, boundsGroup, scenarioGroup, aggregatedGroup);
  }

  // Placeholder for Condition 7: Broken interactions
  renderBrokenInteractions(data) {
    console.log('Rendering Condition 7: Broken Interactions (Placeholder)');
    this.clearContainer();
    
    const container = d3.select(`#${this.containerId}`);
    container.append('div')
      .attr('class', 'broken-placeholder')
      .html(`
        <h3>🚧 Condition 7: Broken Interactions</h3>
        <p>TODO: Implement broken interaction patterns</p>
        <ul>
          <li>Offset hover zones</li>
          <li>Misaligned elements</li>
          <li>Unintended draggable components</li>
        </ul>
      `);
  }

  // Placeholder for Condition 8: Poor interactions
  renderPoorInteractions(data) {
    console.log('Rendering Condition 8: Poor Interactions (Placeholder)');
    this.clearContainer();
    
    const container = d3.select(`#${this.containerId}`);
    container.append('div')
      .attr('class', 'poor-placeholder')
      .html(`
        <h3>🚧 Condition 8: Poor Interactions</h3>
        <p>TODO: Implement poor UX patterns</p>
        <ul>
          <li>Forced clicks instead of hover</li>
          <li>Timed disappearing elements</li>
          <li>Unstable UI positioning</li>
        </ul>
      `);
  }

  // Helper methods for D3.js rendering
  clearContainer() {
    d3.select(`#${this.containerId}`).selectAll('*').remove();
  }

  createBaseSvg() {
    return d3.select(`#${this.containerId}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
  }

  createScales(data) {
    // Placeholder scale creation
    const chartWidth = this.width - this.margin.left - this.margin.right;
    const chartHeight = this.height - this.margin.top - this.margin.bottom;
    
    const xScale = d3.scaleTime()
      .domain([new Date('2025-01-01'), new Date('2025-06-30')])
      .range([0, chartWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([95, 110])
      .range([chartHeight, 0]);
    
    return { xScale, yScale };
  }

  drawAxes(svg, xScale, yScale) {
    const chartHeight = this.height - this.margin.top - this.margin.bottom;
    
    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b')));
    
    // Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale));
      
    // Axis labels
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left)
      .attr('x', 0 - (chartHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Air Quality Index');
  }

  drawHistoricalData(svg, historicalData, xScale, yScale) {
    // Placeholder historical data rendering
    if (!historicalData) return;
    
    const line = d3.line()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // This would be implemented with real data processing
    console.log('Drawing historical data (placeholder)');
  }

  drawAggregatedPredictions(svg, aggregatedData, xScale, yScale) {
    // Placeholder aggregated prediction rendering
    console.log('Drawing aggregated predictions (placeholder)');
    return svg.append('g').attr('class', 'aggregated-predictions');
  }

  drawConfidenceBounds(svg, boundsData, xScale, yScale) {
    // Placeholder confidence bounds rendering
    console.log('Drawing confidence bounds (placeholder)');
    return svg.append('g').attr('class', 'confidence-bounds');
  }

  drawScenarioLines(svg, scenariosData, xScale, yScale, hidden = false) {
    // Placeholder scenario lines rendering
    console.log('Drawing scenario lines (placeholder)');
    const group = svg.append('g').attr('class', 'scenario-lines');
    if (hidden) {
      group.style('opacity', 0);
    }
    return group;
  }

  addHoverInteraction(svg, scenarioGroup, aggregatedGroup) {
    // Placeholder hover interaction
    console.log('Adding hover interaction (placeholder)');
  }

  addPIHoverInteraction(svg, scenarioGroup, boundsGroup, aggregatedGroup) {
    // Placeholder PI hover interaction
    console.log('Adding PI hover interaction (placeholder)');
  }

  addTransformInteraction(svg, boundsGroup, scenarioGroup, aggregatedGroup) {
    // Placeholder transform interaction
    console.log('Adding transform interaction (placeholder)');
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.VisualizationRenderer = VisualizationRenderer;
}