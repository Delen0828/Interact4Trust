class PredictionGenerator {
    constructor() {
        this.seed = Date.now();
        // Import the sophisticated stimuli patterns
        this.stimuliPatterns = window.AlienPlantData?.patterns || {};
    }

    /**
     * Generate predictions using sophisticated stimuli patterns
     * @param {string} patternId - The stimuli pattern ID (e.g., 'increase_agreement')
     * @param {string} displayFormat - 'aggregation' or 'alternative'
     * @param {number} currentHeight - Current plant height
     * @returns {object} Prediction object with sophisticated pattern data
     */
    generatePatternBasedPredictions(patternId, displayFormat, currentHeight = 102.5) {
        // Get the pattern from the stimuli data
        const pattern = this.stimuliPatterns[patternId];
        if (!pattern) {
            console.error('Pattern not found:', patternId, 'Available patterns:', Object.keys(this.stimuliPatterns));
            return this.generateFallbackPredictions(currentHeight, displayFormat);
        }

        const predictions = {
            patternId: patternId,
            pattern: pattern.pattern,
            trend: pattern.trend,
            description: pattern.description,
            displayFormat: displayFormat,
            groundTruth: pattern.aggregation,
            values: displayFormat === 'aggregation' ? [pattern.aggregation] : pattern.alternatives,
            probabilities: displayFormat === 'aggregation' ? [1.0] : [1.0, 0.8, 0.6, 0.4, 0.2],
            currentHeight: currentHeight
        };

        // Add metadata
        predictions.metadata = {
            generatedAt: new Date().toISOString(),
            patternType: pattern.pattern,
            trendDirection: pattern.trend,
            stimuliIndex: Object.keys(this.stimuliPatterns).indexOf(patternId) + 1,
            totalStimuli: Object.keys(this.stimuliPatterns).length
        };

        return predictions;
    }

    /**
     * Generate fallback predictions if pattern is not found
     */
    generateFallbackPredictions(currentHeight, displayFormat) {
        const predictions = {
            patternId: 'fallback',
            pattern: 'unknown',
            trend: 'stable',
            description: 'Fallback prediction when pattern not found',
            displayFormat: displayFormat,
            groundTruth: currentHeight * 1.02,
            values: displayFormat === 'aggregation' ? [currentHeight * 1.02] : [
                currentHeight * 1.05,
                currentHeight * 1.03,
                currentHeight * 1.02,
                currentHeight * 1.01,
                currentHeight * 0.99
            ],
            probabilities: displayFormat === 'aggregation' ? [1.0] : [1.0, 0.8, 0.6, 0.4, 0.2],
            currentHeight: currentHeight
        };

        predictions.metadata = {
            generatedAt: new Date().toISOString(),
            patternType: 'fallback',
            trendDirection: 'stable',
            stimuliIndex: 0,
            totalStimuli: 15
        };

        return predictions;
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use generatePatternBasedPredictions instead
     */
    generatePredictions(groundTruth, modelQuality, displayFormat) {
        console.warn('generatePredictions is deprecated. Use generatePatternBasedPredictions instead.');
        
        // Convert to pattern-based approach
        const fallbackPattern = displayFormat === 'aggregation' ? 'stable_agreement' : 'stable_polarization';
        return this.generatePatternBasedPredictions(fallbackPattern, displayFormat, groundTruth);
    }

    /**
     * Get ground truth from pattern data
     * @param {string} patternId - The stimuli pattern ID
     * @returns {number} The ground truth height value from pattern
     */
    getGroundTruthFromPattern(patternId) {
        const pattern = this.stimuliPatterns[patternId];
        return pattern ? pattern.aggregation : 102.5;
    }

    /**
     * Generate synthetic ground truth based on historical growth data (legacy)
     * @param {number} lastHeight - The last known plant height
     * @param {number} volatility - Growth volatility factor (0.01 to 0.05)
     * @returns {number} The ground truth height value
     */
    generateGroundTruth(lastHeight, volatility = 0.02) {
        // Simulate realistic plant growth pattern
        const trend = this.random() > 0.6 ? 1 : -1; // 60% chance growth, 40% decline (pruning/disease)
        const magnitude = this.random() * volatility;
        const change = trend * magnitude;
        
        return lastHeight * (1 + change);
    }

    /**
     * Generate noise based on specified level (legacy method)
     * @param {number} noiseLevel - The noise level (0 to 1)
     * @returns {number} Noise value between -noiseLevel and +noiseLevel
     */
    generateNoise(noiseLevel) {
        // Use Box-Muller transform for normal distribution
        const u1 = this.random();
        const u2 = this.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        // Scale to desired noise level
        return z0 * noiseLevel * 0.5; // 0.5 to keep most values within range
    }

    /**
     * Update stimuli patterns (for dynamic loading)
     */
    updateStimuliPatterns(patterns) {
        this.stimuliPatterns = patterns;
    }

    /**
     * Generate pattern-based predictions for multiple rounds using stimuli
     * @param {Array} patternIds - Array of pattern IDs to use for each round
     * @param {string} displayFormat - Display format
     * @param {number} startingHeight - Starting plant height
     * @returns {Array} Array of pattern-based prediction objects
     */
    generatePatternBatchPredictions(patternIds, displayFormat, startingHeight = 102.5) {
        const predictions = [];
        let currentHeight = startingHeight;
        
        for (let i = 0; i < patternIds.length; i++) {
            const patternId = patternIds[i];
            const prediction = this.generatePatternBasedPredictions(patternId, displayFormat, currentHeight);
            
            predictions.push(prediction);
            // Update current height based on ground truth for next round
            currentHeight = prediction.groundTruth;
        }
        
        return predictions;
    }

    /**
     * Generate a batch of predictions for multiple rounds (legacy)
     * @param {Array} historicalHeights - Array of historical plant heights
     * @param {number} numRounds - Number of rounds to generate
     * @param {string} modelQuality - Model quality
     * @param {string} displayFormat - Display format
     * @returns {Array} Array of prediction objects
     */
    generateBatchPredictions(historicalHeights, numRounds, modelQuality, displayFormat) {
        console.warn('generateBatchPredictions is deprecated. Use generatePatternBatchPredictions instead.');
        
        const predictions = [];
        let currentHeights = [...historicalHeights];
        
        for (let i = 0; i < numRounds; i++) {
            const lastHeight = currentHeights[currentHeights.length - 1];
            const groundTruth = this.generateGroundTruth(lastHeight);
            const prediction = this.generatePredictions(groundTruth, modelQuality, displayFormat);
            
            predictions.push(prediction);
            currentHeights.push(groundTruth);
        }
        
        return predictions;
    }

    /**
     * Seeded random number generator for reproducibility
     */
    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Reset seed for reproducibility
     */
    resetSeed(seed = Date.now()) {
        this.seed = seed;
    }

    /**
     * Get all available pattern IDs
     */
    getAllPatternIds() {
        return Object.keys(this.stimuliPatterns);
    }

    /**
     * Get pattern information for debugging
     */
    getPatternInfo(patternId) {
        const pattern = this.stimuliPatterns[patternId];
        if (!pattern) return null;
        
        return {
            id: patternId,
            pattern: pattern.pattern,
            trend: pattern.trend,
            description: pattern.description,
            index: Object.keys(this.stimuliPatterns).indexOf(patternId) + 1,
            totalPatterns: Object.keys(this.stimuliPatterns).length
        };
    }

    /**
     * Validate prediction quality for pattern-based predictions
     * Calculate how well the pattern represents the expected behavior
     */
    validatePredictionQuality(predictions) {
        if (!predictions.values || predictions.values.length === 0) {
            return { valid: false, reason: 'No prediction values found' };
        }

        const groundTruth = predictions.groundTruth;
        const errors = predictions.values.map(pred => Math.abs(pred - groundTruth));
        const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
        const errorPercentage = (meanError / groundTruth) * 100;
        
        return {
            valid: true,
            meanAbsoluteError: meanError,
            errorPercentage: errorPercentage,
            patternType: predictions.pattern,
            trendDirection: predictions.trend,
            stimuliIndex: predictions.metadata?.stimuliIndex || 0
        };
    }

    /**
     * Check if pattern matches expected characteristics
     */
    validatePatternCharacteristics(patternId) {
        const pattern = this.stimuliPatterns[patternId];
        if (!pattern) return { valid: false, reason: 'Pattern not found' };
        
        const characteristics = {
            hasAggregation: typeof pattern.aggregation === 'number',
            hasAlternatives: Array.isArray(pattern.alternatives) && pattern.alternatives.length === 5,
            hasDescription: typeof pattern.description === 'string',
            hasPattern: typeof pattern.pattern === 'string',
            hasTrend: typeof pattern.trend === 'string'
        };
        
        const valid = Object.values(characteristics).every(Boolean);
        
        return {
            valid,
            characteristics,
            patternId,
            reason: valid ? 'Pattern is valid' : 'Pattern missing required properties'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictionGenerator;
}