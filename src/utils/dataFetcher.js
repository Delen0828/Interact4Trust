class DataFetcher {
    constructor(apiKey = null) {
        // In browser environment, API key should be passed directly or set in config
        this.apiKey = apiKey || window.ALPHA_VANTAGE_API_KEY || null;
        this.useMockData = (typeof ExperimentConfig !== 'undefined') ? ExperimentConfig.debug.useMockData : true;
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.cache = new Map();
        this.cacheExpiry = 3600000; // 1 hour in milliseconds
    }

    /**
     * Fetch plant growth data from Alpha Vantage API (repurposed)
     * @param {string} species - Plant species identifier
     * @param {string} interval - Time interval (daily, weekly, monthly)
     * @returns {Promise<object>} Plant growth data
     */
    async fetchPlantData(species, interval = 'daily') {
        // Check cache first
        const cacheKey = `${symbol}_${interval}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        // If in debug mode or no API key, return mock data
        if (this.useMockData || !this.apiKey) {
            return this.getMockData(symbol);
        }

        try {
            const functionMap = {
                'daily': 'TIME_SERIES_DAILY',
                'weekly': 'TIME_SERIES_WEEKLY',
                'monthly': 'TIME_SERIES_MONTHLY'
            };

            const params = new URLSearchParams({
                function: functionMap[interval],
                symbol: symbol,
                apikey: this.apiKey,
                outputsize: 'compact'
            });

            const response = await fetch(`${this.baseUrl}?${params}`);
            const data = await response.json();

            if (data['Error Message']) {
                throw new Error(`API Error: ${data['Error Message']}`);
            }

            if (data['Note']) {
                console.warn('API call frequency limit reached, using mock data');
                return this.getMockData(symbol);
            }

            const processedData = this.processApiData(data, symbol, interval);
            this.saveToCache(cacheKey, processedData);
            
            return processedData;

        } catch (error) {
            console.error('Error fetching plant data:', error);
            return this.getMockData(symbol);
        }
    }

    /**
     * Process raw API data into usable format
     */
    processApiData(rawData, symbol, interval) {
        const timeSeriesKey = Object.keys(rawData).find(key => key.includes('Time Series'));
        const timeSeries = rawData[timeSeriesKey];

        if (!timeSeries) {
            throw new Error('Invalid data format from API');
        }

        const dates = [];
        const heights = [];
        const growth_rates = [];

        // Get last 60 data points
        const entries = Object.entries(timeSeries).slice(0, 60).reverse();

        entries.forEach(([date, values]) => {
            dates.push(date);
            heights.push(parseFloat(values['4. close']) / 3); // Convert to height-like values
            growth_rates.push(Math.abs((parseFloat(values['4. close']) - parseFloat(values['1. open'])) / parseFloat(values['1. open']) * 100));
        });

        return {
            symbol: symbol,
            dates: dates,
            heights: heights,
            growth_rates: growth_rates,
            metadata: {
                fetchedAt: new Date().toISOString(),
                interval: interval,
                dataPoints: dates.length
            }
        };
    }

    /**
     * Get mock data for development/testing
     */
    getMockData(symbol) {
        // Generate realistic-looking plant growth data
        const baseHeight = 30 + Math.random() * 70; // Random base height between 30-100 cm
        const volatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
        const trend = 0.001 * (Math.random() - 0.5); // Slight trend
        
        const dates = [];
        const heights = [];
        const growth_rates = [];
        
        const today = new Date();
        
        for (let i = 59; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
            
            // Generate height with random walk (plant growth pattern)
            const previousHeight = heights.length > 0 ? heights[heights.length - 1] : baseHeight;
            const change = (Math.random() - 0.5) * 2 * volatility + trend;
            const newHeight = previousHeight * (1 + change);
            heights.push(Math.max(newHeight, 10)); // Ensure height doesn't go below 10 cm
            
            // Generate growth rate
            const growthRate = Math.abs(change) * 100;
            growth_rates.push(Math.round(growthRate * 10) / 10);
        }

        return {
            symbol: symbol,
            dates: dates,
            heights: heights,
            growth_rates: growth_rates,
            metadata: {
                fetchedAt: new Date().toISOString(),
                interval: 'daily',
                dataPoints: dates.length,
                isMockData: true
            }
        };
    }

    /**
     * Transform growth data to "alien plant" format
     */
    transformToAlienPlant(growthData, plantInfo) {
        // Apply transformation to make it look like alien plant growth
        const scaleFactor = 0.8 + Math.random() * 0.4; // Random scale between 0.8-1.2
        const transformedHeights = growthData.heights.map(height => height * scaleFactor);
        
        return {
            ...growthData,
            plantIndex: plantInfo.plantIndex,
            plantName: plantInfo.plantName,
            heights: transformedHeights,
            originalSymbol: growthData.symbol,
            scaleFactor: scaleFactor
        };
    }

    /**
     * Fetch data for all experiment plants
     */
    async fetchAllPlants() {
        const dataSources = ['AAPL', 'GOOGL', 'MSFT', 'AMZN']; // Data sources (repurposed)
        const totalPlants = ExperimentConfig.totalPlants || 15;
        const allData = [];

        for (let i = 0; i < Math.min(dataSources.length, totalPlants); i++) {
            const data = await this.fetchPlantData(dataSources[i]);
            const alienData = this.transformToAlienPlant(data, { 
                plantIndex: i + 1, 
                plantName: `Plant #${i + 1}` 
            });
            allData.push(alienData);
            
            // Add delay to respect API rate limits
            if (!ExperimentConfig.debug.useMockData && i < dataSources.length - 1) {
                await this.delay(12000); // 12 seconds delay (5 calls per minute limit)
            }
        }

        return allData;
    }

    /**
     * Cache management
     */
    saveToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Save data to localStorage for offline use
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`plant_data_${key}`, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(`plant_data_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFetcher;
}