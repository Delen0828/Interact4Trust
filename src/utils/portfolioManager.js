class PortfolioManager {
    constructor(initialCash = 10000) {
        this.initialCash = initialCash;
        this.reset();
    }

    /**
     * Reset portfolio to initial state
     */
    reset() {
        this.portfolio = {
            cash: this.initialCash,
            shares: 0,
            totalValue: this.initialCash,
            transactions: [],
            performanceHistory: [{
                round: 0,
                value: this.initialCash,
                timestamp: new Date().toISOString()
            }]
        };
    }

    /**
     * Execute a buy transaction
     * @param {number} shares - Number of shares to buy
     * @param {number} pricePerShare - Current price per share
     * @returns {object} Transaction result
     */
    buy(shares, pricePerShare) {
        const totalCost = shares * pricePerShare;
        const commission = totalCost * ExperimentConfig.portfolio.commissionRate;
        const totalWithCommission = totalCost + commission;

        if (totalWithCommission > this.portfolio.cash) {
            return {
                success: false,
                error: 'Insufficient funds',
                maxAffordableShares: Math.floor(this.portfolio.cash / (pricePerShare * (1 + ExperimentConfig.portfolio.commissionRate)))
            };
        }

        // Execute transaction
        this.portfolio.cash -= totalWithCommission;
        this.portfolio.shares += shares;

        const transaction = {
            type: 'buy',
            shares: shares,
            pricePerShare: pricePerShare,
            totalCost: totalCost,
            commission: commission,
            timestamp: new Date().toISOString(),
            cashAfter: this.portfolio.cash,
            sharesAfter: this.portfolio.shares
        };

        this.portfolio.transactions.push(transaction);

        return {
            success: true,
            transaction: transaction
        };
    }

    /**
     * Execute a sell transaction
     * @param {number} shares - Number of shares to sell
     * @param {number} pricePerShare - Current price per share
     * @returns {object} Transaction result
     */
    sell(shares, pricePerShare) {
        if (shares > this.portfolio.shares) {
            return {
                success: false,
                error: 'Insufficient shares',
                availableShares: this.portfolio.shares
            };
        }

        const totalRevenue = shares * pricePerShare;
        const commission = totalRevenue * ExperimentConfig.portfolio.commissionRate;
        const totalAfterCommission = totalRevenue - commission;

        // Execute transaction
        this.portfolio.cash += totalAfterCommission;
        this.portfolio.shares -= shares;

        const transaction = {
            type: 'sell',
            shares: shares,
            pricePerShare: pricePerShare,
            totalRevenue: totalRevenue,
            commission: commission,
            timestamp: new Date().toISOString(),
            cashAfter: this.portfolio.cash,
            sharesAfter: this.portfolio.shares
        };

        this.portfolio.transactions.push(transaction);

        return {
            success: true,
            transaction: transaction
        };
    }

    /**
     * Update portfolio value based on current market price
     * @param {number} currentPrice - Current price per share
     * @param {number} round - Current round number
     * @returns {object} Updated portfolio state
     */
    updateValue(currentPrice, round = null) {
        const sharesValue = this.portfolio.shares * currentPrice;
        this.portfolio.totalValue = this.portfolio.cash + sharesValue;

        if (round !== null) {
            this.portfolio.performanceHistory.push({
                round: round,
                value: this.portfolio.totalValue,
                cash: this.portfolio.cash,
                shares: this.portfolio.shares,
                sharePrice: currentPrice,
                timestamp: new Date().toISOString()
            });
        }

        return {
            cash: this.portfolio.cash,
            shares: this.portfolio.shares,
            sharesValue: sharesValue,
            totalValue: this.portfolio.totalValue,
            profitLoss: this.portfolio.totalValue - this.initialCash,
            profitLossPercentage: ((this.portfolio.totalValue - this.initialCash) / this.initialCash) * 100
        };
    }

    /**
     * Get current portfolio state
     * @returns {object} Current portfolio state
     */
    getState() {
        return {
            ...this.portfolio,
            profitLoss: this.portfolio.totalValue - this.initialCash,
            profitLossPercentage: ((this.portfolio.totalValue - this.initialCash) / this.initialCash) * 100
        };
    }

    /**
     * Get portfolio statistics
     * @returns {object} Portfolio performance statistics
     */
    getStatistics() {
        const values = this.portfolio.performanceHistory.map(h => h.value);
        const returns = [];
        
        for (let i = 1; i < values.length; i++) {
            returns.push((values[i] - values[i-1]) / values[i-1]);
        }

        const totalReturn = (this.portfolio.totalValue - this.initialCash) / this.initialCash;
        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const volatility = this.calculateVolatility(returns);
        const sharpeRatio = avgReturn / volatility;
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const maxDrawdown = this.calculateMaxDrawdown(values);

        const buyTrades = this.portfolio.transactions.filter(t => t.type === 'buy');
        const sellTrades = this.portfolio.transactions.filter(t => t.type === 'sell');
        const totalCommission = this.portfolio.transactions.reduce((sum, t) => sum + t.commission, 0);

        return {
            totalReturn: totalReturn * 100,
            averageReturn: avgReturn * 100,
            volatility: volatility * 100,
            sharpeRatio: sharpeRatio,
            maxValue: maxValue,
            minValue: minValue,
            maxDrawdown: maxDrawdown * 100,
            totalTrades: this.portfolio.transactions.length,
            buyTrades: buyTrades.length,
            sellTrades: sellTrades.length,
            totalCommission: totalCommission,
            finalValue: this.portfolio.totalValue,
            profitLoss: this.portfolio.totalValue - this.initialCash
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
     * Export transaction history as CSV
     */
    exportTransactions() {
        const headers = ['Timestamp', 'Type', 'Shares', 'Price', 'Total', 'Commission', 'Cash After', 'Shares After'];
        const rows = this.portfolio.transactions.map(t => [
            t.timestamp,
            t.type,
            t.shares,
            t.pricePerShare,
            t.type === 'buy' ? t.totalCost : t.totalRevenue,
            t.commission,
            t.cashAfter,
            t.sharesAfter
        ]);

        return [headers, ...rows];
    }

    /**
     * Validate a potential trade
     * @param {string} type - 'buy' or 'sell'
     * @param {number} shares - Number of shares
     * @param {number} price - Price per share
     * @returns {object} Validation result
     */
    validateTrade(type, shares, price) {
        if (shares <= 0) {
            return { valid: false, reason: 'Shares must be positive' };
        }

        if (shares > ExperimentConfig.portfolio.maxSharesPerTrade) {
            return { valid: false, reason: `Maximum ${ExperimentConfig.portfolio.maxSharesPerTrade} shares per trade` };
        }

        if (type === 'buy') {
            const totalCost = shares * price * (1 + ExperimentConfig.portfolio.commissionRate);
            if (totalCost > this.portfolio.cash) {
                return { 
                    valid: false, 
                    reason: 'Insufficient funds',
                    maxAffordable: Math.floor(this.portfolio.cash / (price * (1 + ExperimentConfig.portfolio.commissionRate)))
                };
            }
        } else if (type === 'sell') {
            if (shares > this.portfolio.shares) {
                return { 
                    valid: false, 
                    reason: 'Insufficient shares',
                    availableShares: this.portfolio.shares
                };
            }
        }

        return { valid: true };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioManager;
}