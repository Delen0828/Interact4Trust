/**
 * Core D3 chart rendering utilities
 * Shared functionality for all visualization conditions
 */
export class ChartRenderer {
    constructor(svgId, config) {
        this.svgId = svgId;
        this.config = config;
        this.svg = d3.select(`#${svgId}`);
        this.margin = config.margin;
        this.width = config.width - this.margin.left - this.margin.right;
        this.height = config.height - this.margin.top - this.margin.bottom;
        this.g = null;
        this.xScale = null;
        this.yScale = null;
    }

    /**
     * Clear existing content and setup SVG container
     */
    clearAndSetup() {
        this.svg.selectAll("*").remove();
        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
        return this.g;
    }

    /**
     * Create time and linear scales for the chart
     */
    createScales(data, globalYScale) {
        // Collect all dates from data
        const allDates = [
            ...data.A.historical.map(d => d.date),
            ...data.B.historical.map(d => d.date),
            ...(data.realTimeAggregated?.A ? data.realTimeAggregated.A.map(d => d.date) : []),
            ...(data.realTimeAggregated?.B ? data.realTimeAggregated.B.map(d => d.date) : [])
        ];

        this.xScale = d3.scaleTime()
            .domain([d3.min(allDates), new Date('2025-06-30')])
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .domain(globalYScale)
            .range([this.height, 0]);

        return { xScale: this.xScale, yScale: this.yScale };
    }

    /**
     * Add grid lines to the chart
     */
    addGrid() {
        // Horizontal grid lines
        this.g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale)
                .tickSize(-this.height)
                .tickFormat("")
            );

        // Vertical grid lines
        this.g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.width)
                .tickFormat("")
            );
    }

    /**
     * Add X and Y axes to the chart
     */
    addAxes() {
        // X-axis
        this.g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat("%m/%d")));

        // Y-axis
        this.g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(this.yScale));
    }

    /**
     * Add vertical reference line at prediction start (06/01)
     */
    addReferenceLine() {
        const verticalLineDate = new Date('2025-06-01');
        this.g.append("line")
            .attr("class", "vertical-reference-line")
            .attr("x1", this.xScale(verticalLineDate))
            .attr("x2", this.xScale(verticalLineDate))
            .attr("y1", 0)
            .attr("y2", this.height)
            .attr("stroke", "#999")
            .attr("stroke-width", 1)
            .attr("opacity", 0.8);
    }

    /**
     * Create D3 line generator
     */
    createLineGenerator() {
        return d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.price))
            .curve(d3.curveMonotoneX);
    }

    /**
     * Create D3 area generator for confidence bounds
     */
    createAreaGenerator() {
        return d3.area()
            .x(d => this.xScale(d.date))
            .y0(d => this.yScale(d.min))
            .y1(d => this.yScale(d.max))
            .curve(d3.curveMonotoneX);
    }

    /**
     * Render historical data lines for both stocks
     */
    renderHistoricalLines(data) {
        const line = this.createLineGenerator();

        // Stock A historical line
        this.g.append("path")
            .datum(data.A.historical)
            .attr("class", "historical-line")
            .attr("stroke", this.config.colors.stockA)
            .attr("d", line);

        // Stock B historical line
        this.g.append("path")
            .datum(data.B.historical)
            .attr("class", "historical-line")
            .attr("stroke", this.config.colors.stockB)
            .attr("d", line);
    }

    /**
     * Render aggregated prediction lines with dashed style after reference date
     */
    renderAggregatedLines(container, data, colors, realTimeAggregated) {
        const line = this.createLineGenerator();

        ['A', 'B'].forEach((stock, i) => {
            const color = i === 0 ? colors.stockA : colors.stockB;
            const lastHistorical = data[stock].historical[data[stock].historical.length - 1];
            
            if (realTimeAggregated[stock] && realTimeAggregated[stock].length > 0) {
                // Create continuous path through all real-time aggregated data points
                const fullAggregatedData = [lastHistorical, ...realTimeAggregated[stock]];
                
                container.append("path")
                    .datum(fullAggregatedData)
                    .attr("class", `aggregated-line real-time-aggregated stock-${stock.toLowerCase()}-line`)
                    .attr("stroke", color)
                    .attr("fill", "none")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "5,5") // Dashed line for predictions
                    .attr("d", line);
                    
                console.log(`Rendered dashed aggregated line for stock ${stock} with ${realTimeAggregated[stock].length} points`);
            }
        });
    }

    /**
     * Get SVG group container for adding elements
     */
    getContainer() {
        return this.g;
    }

    /**
     * Get scales for external use
     */
    getScales() {
        return {
            x: this.xScale,
            y: this.yScale
        };
    }

    /**
     * Setup basic chart structure (grid, axes, reference line, historical data)
     */
    setupBasicChart(data, globalYScale) {
        this.clearAndSetup();
        this.createScales(data, globalYScale);
        this.addGrid();
        this.addAxes();
        this.addReferenceLine();
        this.renderHistoricalLines(data);
        return this.g;
    }
}