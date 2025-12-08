/**
 * Condition Factory
 * Dynamically loads and instantiates condition modules
 */
import { DataProcessor } from './base/dataProcessor.js';

export class ConditionFactory {
    constructor() {
        this.dataProcessor = new DataProcessor();
        this.processedData = null;
        this.config = null;
        this.conditionInstances = new Map();
    }

    /**
     * Initialize factory with configuration and data
     */
    async initialize(config, rawData, startDate = '05/01', phase = null) {
        this.config = config;
        this.phase = phase;
        
        
        // Process data through data processor
        this.processedData = this.dataProcessor.processData(rawData, startDate);
        
        return this;
    }

    /**
     * Create a specific condition instance
     */
    async createCondition(conditionNumber, svgId) {
        try {
            // Validate condition number
            if (conditionNumber < 0 || conditionNumber > 9) {
                throw new Error(`Invalid condition number: ${conditionNumber}. Must be between 0 and 9.`);
            }

            // Check if we have processed data
            if (!this.processedData) {
                throw new Error('Factory not initialized. Call initialize() first.');
            }

            
            // Dynamically import the condition module
            const module = await import(`./conditions/condition${conditionNumber}.js`);
            
            // Create condition instance with phase parameter
            const condition = new module.default(svgId, this.processedData, this.config, this.phase);
            
            // Store instance for cleanup later
            const key = `${svgId}-${conditionNumber}`;
            this.conditionInstances.set(key, condition);
            
            return condition;
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Render a specific condition
     */
    async renderCondition(conditionNumber, svgId) {
        try {
            const condition = await this.createCondition(conditionNumber, svgId);
            
            // Render the condition
            condition.render();
            
            // Setup interactions
            condition.setupInteractions();
            
            return condition;
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Render all 10 conditions
     */
    async renderAllConditions() {
        const conditionMappings = [
            { number: 0, svgId: 'chart-0' },
            { number: 1, svgId: 'chart-1' },
            { number: 2, svgId: 'chart-2' },
            { number: 3, svgId: 'chart-3' },
            { number: 4, svgId: 'chart-4' },
            { number: 5, svgId: 'chart-5' },
            { number: 6, svgId: 'chart-6' },
            { number: 7, svgId: 'chart-7' },
            { number: 8, svgId: 'chart-8' },
            { number: 9, svgId: 'chart-9' }
        ];


        // Render all conditions in parallel for better performance
        const renderPromises = conditionMappings.map(async ({ number, svgId }) => {
            try {
                return await this.renderCondition(number, svgId);
            } catch (error) {
                return null;
            }
        });

        const results = await Promise.allSettled(renderPromises);
        
        // Log results
        const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
        const failed = results.length - successful;
        
        
        return results;
    }

    /**
     * Update data with new start date and re-render all conditions
     */
    async updateWithNewDate(newStartDate) {
        try {
            
            // Reprocess data with new date
            this.processedData = this.dataProcessor.reprocessWithNewDate(newStartDate);
            
            // Re-render all conditions
            await this.renderAllConditions();
            
            
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get a specific condition instance
     */
    getCondition(conditionNumber, svgId) {
        const key = `${svgId}-${conditionNumber}`;
        return this.conditionInstances.get(key);
    }

    /**
     * Cleanup all condition instances
     */
    cleanup() {
        
        for (const [key, condition] of this.conditionInstances) {
            try {
                condition.cleanup();
            } catch (error) {
            }
        }
        
        this.conditionInstances.clear();
    }

    /**
     * Get current processed data
     */
    getProcessedData() {
        return this.processedData;
    }

    /**
     * Get data processor instance
     */
    getDataProcessor() {
        return this.dataProcessor;
    }

    /**
     * Check if factory is initialized
     */
    isInitialized() {
        return this.processedData !== null && this.config !== null;
    }

    /**
     * Get condition mapping information
     */
    static getConditionInfo() {
        return {
            0: { name: 'Historical Only', description: 'Shows only historical data, no predictions after 6/1' },
            1: { name: 'Baseline', description: 'Shows only aggregated prediction lines' },
            2: { name: 'PI Plot', description: 'Shows aggregated prediction with confidence bounds' },
            3: { name: 'Ensemble Plot', description: 'Shows both aggregated and alternative predictions' },
            4: { name: 'Ensemble + Hover', description: 'Aggregated by default, hover to reveal alternatives' },
            5: { name: 'PI Plot + Hover', description: 'PI plot with hover to reveal individual predictions' },
            6: { name: 'PI → Ensemble', description: 'PI plot transforms to ensemble plot on hover' },
            7: { name: 'Buggy Control', description: 'Broken interactions: hover zones show wrong city data' },
            8: { name: 'Bad Control', description: 'Poor interaction: click to reveal one alternative line at a time' },
            9: { name: 'Combined PI + Ensemble', description: 'Shows both confidence bounds and alternative prediction lines' }
        };
    }
}