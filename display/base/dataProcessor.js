/**
 * Shared data processing functions
 * Handles data filtering, aggregation, and calculations
 */
export class DataProcessor {
    constructor() {
        this.sampledScenarios = [];
        this.originalData = {};
    }

    /**
     * Get fixed scenarios for consistent experiment conditions
     * Uses scenarios [1, 2, 3, 5, 8] as specified for the study
     */
    static getFixedScenarios() {
        return ['scenario_1', 'scenario_2', 'scenario_3', 'scenario_5', 'scenario_8'];
    }

    /**
     * Process raw data into filtered datasets for each stock
     */
    processData(rawData, currentStartDate = '05/01') {
        // Validate input data
        if (!rawData) {
            throw new Error('DataProcessor: rawData is null or undefined');
        }
        
        if (!Array.isArray(rawData)) {
            // Handle case where data might be wrapped in an object
            if (typeof rawData === 'object' && rawData.data && Array.isArray(rawData.data)) {
                console.warn('DataProcessor: Found wrapped data format, unwrapping...');
                rawData = rawData.data;
            } else {
                throw new Error(`DataProcessor: Expected rawData to be an array, got ${typeof rawData}. If data is wrapped, ensure it has a 'data' property with an array.`);
            }
        }
        
        if (rawData.length === 0) {
            throw new Error('DataProcessor: rawData array is empty');
        }
        
        // Validate data structure 
        const firstItem = rawData[0];

        // Store original data
        const stockA = rawData.filter(d => d.stock === 'A');
        const stockB = rawData.filter(d => d.stock === 'B');
        this.originalData.A = stockA;
        this.originalData.B = stockB;

        // Get all available scenarios from prediction data (only once)
        if (this.sampledScenarios.length === 0) {
            const allScenarios = [...new Set(rawData
                .filter(d => d.series === 'prediction' && d.scenario)
                .map(d => d.scenario)
            )];
            
            // Use fixed scenarios for consistency: [1, 2, 3, 5, 8]
            const fixedScenarios = DataProcessor.getFixedScenarios();
            
            // Only include scenarios that exist in the data
            this.sampledScenarios = fixedScenarios.filter(scenario => allScenarios.includes(scenario));
            
        }

        // Process each stock with current date filter
        const stockData = {
            A: this.processStockData(stockA, currentStartDate),
            B: this.processStockData(stockB, currentStartDate)
        };
        
        // Calculate real-time aggregated data from sampled scenarios
        const realTimeAggregated = this.calculateRealTimeAggregation(rawData);
        
        // Calculate confidence bounds from sampled scenarios
        const confidenceBounds = this.calculateConfidenceBounds(rawData);

        // Calculate global Y scale
        const globalYScale = this.calculateGlobalYScale(stockData, realTimeAggregated);

        return {
            stockData,
            realTimeAggregated,
            confidenceBounds,
            globalYScale,
            sampledScenarios: this.sampledScenarios
        };
    }

    /**
     * Process individual stock data with date filtering
     */
    processStockData(stockData, currentStartDate) {
        // Filter historical data based on start date
        const startYear = 2025;
        const [startMonth, startDay] = currentStartDate.split('/').map(Number);
        const filterDate = new Date(startYear, startMonth - 1, startDay);
        
        const historical = stockData
            .filter(d => d.series === 'historical')
            .map(d => ({ date: new Date(d.date), price: d.price }))
            .filter(d => d.date >= filterDate)
            .sort((a, b) => a.date - b.date);

        // Filter alternatives to only include sampled scenarios
        const alternatives = stockData
            .filter(d => d.series === 'prediction' && 
                       d.scenario && 
                       this.sampledScenarios.includes(d.scenario))
            .map(d => ({ scenario: d.scenario, date: new Date(d.date), price: d.price }))
            .sort((a, b) => a.date - b.date);

        return {
            historical,
            alternatives
        };
    }

    /**
     * Calculate real-time aggregation from sampled scenarios
     */
    calculateRealTimeAggregation(data) {
        const realTimeAggregated = {};
        
        ['A', 'B'].forEach(stock => {
            // Filter prediction data for this stock and sampled scenarios
            const predictionData = data.filter(d => 
                d.stock === stock && 
                d.series === 'prediction' && 
                this.sampledScenarios.includes(d.scenario)
            );
            
            // Group by date
            const groupedByDate = {};
            predictionData.forEach(item => {
                if (!groupedByDate[item.date]) {
                    groupedByDate[item.date] = [];
                }
                groupedByDate[item.date].push(item.price);
            });
            
            // Calculate mean for each date
            const aggregatedData = [];
            Object.keys(groupedByDate).sort().forEach(date => {
                const prices = groupedByDate[date];
                const meanPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                aggregatedData.push({
                    date: new Date(date),
                    price: meanPrice
                });
            });
            
            realTimeAggregated[stock] = aggregatedData;
        });

        return realTimeAggregated;
    }

    /**
     * Calculate confidence bounds from sampled scenarios
     */
    calculateConfidenceBounds(data) {
        const confidenceBounds = {};
        
        ['A', 'B'].forEach(stock => {
            // Filter prediction data for this stock and sampled scenarios
            const predictionData = data.filter(d => 
                d.stock === stock && 
                d.series === 'prediction' && 
                this.sampledScenarios.includes(d.scenario)
            );
            
            // Group by date
            const groupedByDate = {};
            predictionData.forEach(item => {
                if (!groupedByDate[item.date]) {
                    groupedByDate[item.date] = [];
                }
                groupedByDate[item.date].push(item.price);
            });
            
            // Calculate min/max bounds for each date
            const boundsData = [];
            Object.keys(groupedByDate).sort().forEach(date => {
                const prices = groupedByDate[date];
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const meanPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                
                boundsData.push({
                    date: new Date(date),
                    min: minPrice,
                    max: maxPrice,
                    mean: meanPrice
                });
            });
            
            confidenceBounds[stock] = boundsData;
        });
        
        return confidenceBounds;
    }

    /**
     * Calculate global Y scale domain
     */
    calculateGlobalYScale(stockData, realTimeAggregated) {
        // Fixed y-axis range for consistent visualization across all phases
        return [0, 150]; // Air Quality Index range from 0 to 200
    }

    /**
     * Get sampled scenarios
     */
    getSampledScenarios() {
        return this.sampledScenarios;
    }

    /**
     * Get original data
     */
    getOriginalData() {
        return this.originalData;
    }

    /**
     * Reprocess data with new start date
     */
    reprocessWithNewDate(currentStartDate) {
        if (!this.originalData.A || !this.originalData.B) {
            throw new Error('Original data not available for reprocessing');
        }

        // Reprocess the data with the new date
        const stockData = {
            A: this.processStockData(this.originalData.A, currentStartDate),
            B: this.processStockData(this.originalData.B, currentStartDate)
        };

        // Recalculate aggregation and bounds with original data
        const fullData = [...this.originalData.A, ...this.originalData.B];
        const realTimeAggregated = this.calculateRealTimeAggregation(fullData);
        const confidenceBounds = this.calculateConfidenceBounds(fullData);
        const globalYScale = this.calculateGlobalYScale(stockData, realTimeAggregated);

        return {
            stockData,
            realTimeAggregated,
            confidenceBounds,
            globalYScale,
            sampledScenarios: this.sampledScenarios
        };
    }
}