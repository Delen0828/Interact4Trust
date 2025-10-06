class GreenhouseManager {
    constructor(initialResources = 10000) {
        this.initialResources = initialResources;
        this.reset();
    }

    /**
     * Reset greenhouse to initial state
     */
    reset() {
        this.greenhouse = {
            resources: this.initialResources,
            plants: 0,
            totalValue: this.initialResources,
            actions: [],
            growthHistory: [{
                round: 0,
                value: this.initialResources,
                timestamp: new Date().toISOString()
            }]
        };
    }

    /**
     * Execute a cultivation action
     * @param {number} plants - Number of plants to cultivate
     * @param {number} resourcesPerPlant - Resources needed per plant
     * @returns {object} Action result
     */
    cultivate(plants, resourcesPerPlant) {
        const totalCost = plants * resourcesPerPlant;
        const cultivationCost = totalCost * ExperimentConfig.greenhouse.cultivationCostRate;
        const totalWithCost = totalCost + cultivationCost;

        if (totalWithCost > this.greenhouse.resources) {
            return {
                success: false,
                error: 'Insufficient resources',
                maxAffordablePlants: Math.floor(this.greenhouse.resources / (resourcesPerPlant * (1 + ExperimentConfig.greenhouse.cultivationCostRate)))
            };
        }

        // Execute action
        this.greenhouse.resources -= totalWithCost;
        this.greenhouse.plants += plants;

        const action = {
            type: 'cultivate',
            plants: plants,
            resourcesPerPlant: resourcesPerPlant,
            totalCost: totalCost,
            cultivationCost: cultivationCost,
            timestamp: new Date().toISOString(),
            resourcesAfter: this.greenhouse.resources,
            plantsAfter: this.greenhouse.plants
        };

        this.greenhouse.actions.push(action);

        return {
            success: true,
            action: action
        };
    }

    /**
     * Execute a pruning action
     * @param {number} plants - Number of plants to prune
     * @param {number} resourcesPerPlant - Resources gained per plant
     * @returns {object} Action result
     */
    prune(plants, resourcesPerPlant) {
        if (plants > this.greenhouse.plants) {
            return {
                success: false,
                error: 'Insufficient plants',
                availablePlants: this.greenhouse.plants
            };
        }

        const totalYield = plants * resourcesPerPlant;
        const cultivationCost = totalYield * ExperimentConfig.greenhouse.cultivationCostRate;
        const totalAfterCost = totalYield - cultivationCost;

        // Execute action
        this.greenhouse.resources += totalAfterCost;
        this.greenhouse.plants -= plants;

        const action = {
            type: 'prune',
            plants: plants,
            resourcesPerPlant: resourcesPerPlant,
            totalYield: totalYield,
            cultivationCost: cultivationCost,
            timestamp: new Date().toISOString(),
            resourcesAfter: this.greenhouse.resources,
            plantsAfter: this.greenhouse.plants
        };

        this.greenhouse.actions.push(action);

        return {
            success: true,
            action: action
        };
    }

    /**
     * Update greenhouse value based on current growth height
     * @param {number} currentHeight - Current plant height
     * @param {number} round - Current round number
     * @returns {object} Updated greenhouse state
     */
    updateValue(currentHeight, round = null) {
        const plantsValue = this.greenhouse.plants * currentHeight * 10;
        this.greenhouse.totalValue = this.greenhouse.resources + plantsValue;

        if (round !== null) {
            this.greenhouse.growthHistory.push({
                round: round,
                value: this.greenhouse.totalValue,
                resources: this.greenhouse.resources,
                plants: this.greenhouse.plants,
                plantHeight: currentHeight,
                timestamp: new Date().toISOString()
            });
        }

        return {
            resources: this.greenhouse.resources,
            plants: this.greenhouse.plants,
            plantsValue: plantsValue,
            totalValue: this.greenhouse.totalValue,
            yieldGain: this.greenhouse.totalValue - this.initialResources,
            yieldGainPercentage: ((this.greenhouse.totalValue - this.initialResources) / this.initialResources) * 100
        };
    }

    /**
     * Get current greenhouse state
     * @returns {object} Current greenhouse state
     */
    getState() {
        return {
            ...this.greenhouse,
            yieldGain: this.greenhouse.totalValue - this.initialResources,
            yieldGainPercentage: ((this.greenhouse.totalValue - this.initialResources) / this.initialResources) * 100
        };
    }

    /**
     * Get greenhouse statistics
     * @returns {object} Greenhouse performance statistics
     */
    getStatistics() {
        const values = this.greenhouse.growthHistory.map(h => h.value);
        const returns = [];
        
        for (let i = 1; i < values.length; i++) {
            returns.push((values[i] - values[i-1]) / values[i-1]);
        }

        const totalGrowth = (this.greenhouse.totalValue - this.initialResources) / this.initialResources;
        const avgGrowth = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const growthVariability = this.calculateVolatility(returns);
        const efficiencyRatio = avgGrowth / growthVariability;
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const maxDecline = this.calculateMaxDrawdown(values);

        const cultivateActions = this.greenhouse.actions.filter(t => t.type === 'cultivate');
        const pruneActions = this.greenhouse.actions.filter(t => t.type === 'prune');
        const totalCultivationCost = this.greenhouse.actions.reduce((sum, t) => sum + t.cultivationCost, 0);

        return {
            totalGrowth: totalGrowth * 100,
            averageGrowth: avgGrowth * 100,
            growthVariability: growthVariability * 100,
            efficiencyRatio: efficiencyRatio,
            maxValue: maxValue,
            minValue: minValue,
            maxDecline: maxDecline * 100,
            totalActions: this.greenhouse.actions.length,
            cultivateActions: cultivateActions.length,
            pruneActions: pruneActions.length,
            totalCultivationCost: totalCultivationCost,
            finalValue: this.greenhouse.totalValue,
            yieldGain: this.greenhouse.totalValue - this.initialResources
        };
    }

    /**
     * Calculate volatility (standard deviation of returns)
     */
    calculateVolatility(returns) {
        if (returns.length === 0) return 0;
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    /**
     * Calculate maximum drawdown
     */
    calculateMaxDrawdown(values) {
        let maxDrawdown = 0;
        let peak = values[0];

        for (let value of values) {
            if (value > peak) {
                peak = value;
            }
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        return maxDrawdown;
    }

    /**
     * Export action history as CSV
     */
    exportActions() {
        const headers = ['Timestamp', 'Type', 'Plants', 'Resources/Plant', 'Total', 'Cultivation Cost', 'Resources After', 'Plants After'];
        const rows = this.greenhouse.actions.map(t => [
            t.timestamp,
            t.type,
            t.plants,
            t.resourcesPerPlant,
            t.type === 'cultivate' ? t.totalCost : t.totalYield,
            t.cultivationCost,
            t.resourcesAfter,
            t.plantsAfter
        ]);

        return [headers, ...rows];
    }

    /**
     * Validate a potential action
     * @param {string} type - 'cultivate' or 'prune'
     * @param {number} plants - Number of plants
     * @param {number} resourceCost - Resources per plant
     * @returns {object} Validation result
     */
    validateAction(type, plants, resourceCost) {
        if (plants <= 0) {
            return { valid: false, reason: 'Plants must be positive' };
        }

        if (plants > ExperimentConfig.greenhouse.maxPlantsPerAction) {
            return { valid: false, reason: `Maximum ${ExperimentConfig.greenhouse.maxPlantsPerAction} plants per action` };
        }

        if (type === 'cultivate') {
            const totalCost = plants * resourceCost * (1 + ExperimentConfig.greenhouse.cultivationCostRate);
            if (totalCost > this.greenhouse.resources) {
                return { 
                    valid: false, 
                    reason: 'Insufficient resources',
                    maxAffordable: Math.floor(this.greenhouse.resources / (resourceCost * (1 + ExperimentConfig.greenhouse.cultivationCostRate)))
                };
            }
        } else if (type === 'prune') {
            if (plants > this.greenhouse.plants) {
                return { 
                    valid: false, 
                    reason: 'Insufficient plants',
                    availablePlants: this.greenhouse.plants
                };
            }
        }

        return { valid: true };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GreenhouseManager;
}