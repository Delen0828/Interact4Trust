/**
 * Condition Factory - Experiment 2
 * Dynamically loads condition0 (Phase 1) or exp2Condition (Phase 2)
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

        // Process data through data processor (uses all 10 scenarios)
        this.processedData = this.dataProcessor.processData(rawData, startDate);

        return this;
    }

    /**
     * Create a condition instance
     * conditionNumber: 0 for Phase 1 (historical only), -1 for Exp2 parameterized
     * conditionConfig: per-city config for exp2Condition
     */
    async createCondition(conditionNumber, svgId, conditionConfig = null) {
        if (!this.processedData) {
            throw new Error('Factory not initialized. Call initialize() first.');
        }

        let condition;

        if (conditionNumber === 0) {
            // Phase 1: Historical only
            const module = await import('./conditions/condition0.js');
            condition = new module.default(svgId, this.processedData, this.config, this.phase);
        } else {
            // Phase 2: Exp2 parameterized condition
            const module = await import('./conditions/exp2Condition.js');
            condition = new module.default(svgId, this.processedData, this.config, this.phase, conditionConfig);
        }

        const key = `${svgId}-${conditionNumber}`;
        this.conditionInstances.set(key, condition);

        return condition;
    }

    /**
     * Render a condition
     */
    async renderCondition(conditionNumber, svgId, conditionConfig = null) {
        const condition = await this.createCondition(conditionNumber, svgId, conditionConfig);
        condition.render();
        condition.setupInteractions();
        return condition;
    }

    /**
     * Cleanup all condition instances
     */
    cleanup() {
        for (const [key, condition] of this.conditionInstances) {
            try {
                condition.cleanup();
            } catch (error) {
                // ignore
            }
        }
        this.conditionInstances.clear();
    }

    getProcessedData() {
        return this.processedData;
    }

    isInitialized() {
        return this.processedData !== null && this.config !== null;
    }
}
