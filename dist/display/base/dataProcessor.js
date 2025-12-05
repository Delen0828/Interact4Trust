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
     * Fisher-Yates shuffle for random sampling
     */
    static sampleScenarios(scenarios, sampleSize) {
        const scenariosCopy = [...scenarios];
        
        // Fisher-Yates shuffle
        for (let i = scenariosCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scenariosCopy[i], scenariosCopy[j]] = [scenariosCopy[j], scenariosCopy[i]];
        }
        
        return scenariosCopy.slice(0, sampleSize);
    }

    /**
     * Process raw data into filtered datasets for each stock
     */
    processData(rawData, currentStartDate = '05/01') {
        // Store original data
        const stockA = rawData.filter(d => d.stock === 'A');
        const stockB = rawData.filter(d => d.stock === 'B');
        this.originalData.A = stockA;
        this.originalData.B = stockB;

        // Get all available scenarios from prediction data (only once)
        if (this.sampledScenarios.length === 0) {
            const allScenarios = [...new Set(rawData
                .filter(d => d.series === 'prediction')
                .map(d => d.scenario)
            )];
            
            
            // Random sample 5 scenarios out of 10
            this.sampledScenarios = DataProcessor.sampleScenarios(allScenarios, 5);
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
        const allValues = [];
        
        // Include historical and alternative values
        Object.values(stockData).forEach(stock => {
            stock.historical.forEach(d => allValues.push(d.price));
            stock.alternatives.forEach(d => allValues.push(d.price));
        });
        
        // Include real-time aggregated values
        Object.values(realTimeAggregated).forEach(aggregatedData => {
            if (aggregatedData) {
                aggregatedData.forEach(d => allValues.push(d.price));
            }
        });

        // Fixed y-scale range from 90 to 110
        return [90, 110];
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