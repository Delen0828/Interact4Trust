# Prediction Trust Experiment Plan

## Study Overview
**Research Question**: Does showing multiple prediction alternatives versus a single aggregated prediction affect user trust and understanding in model predictions?

**Context**: Users will interact with predictions from an "alien stock market" (disguised historical stock data) to evaluate trust in different prediction visualization formats.

## Experimental Design

### Independent Variables (2x2 Factorial Design)
1. **Model Quality**
   - Good Model: Predictions closer to ground truth
   - Bad Model: Predictions further from ground truth

2. **Display Format**
   - Aggregation: Single prediction line
   - Alternative: Multiple possible predictions with opacity encoding probability

### Dependent Variables
- User trust ratings (1-7 scale on 5 dimensions)
- Trading performance (profit/loss)
- Decision confidence (implicit through trading amounts)

## Data Source
- Historical stock data from Alpha Vantage API (https://www.alphavantage.co/)
- Presented as "alien stock market" data to participants
- Synthetic predictions generated based on ground truth with controlled variance

## Experimental Conditions
4 conditions total (2x2):
1. Good Model + Aggregation
2. Good Model + Alternative
3. Bad Model + Aggregation
4. Bad Model + Alternative

## Experiment Flow

### Setup
- Each participant starts with $10,000 virtual currency
- 4 different stocks (one per condition)
- 10 consecutive prediction points per stock

### Per Round (10 rounds per condition)
1. **Prediction Display**
   - Show line chart with historical data and prediction
   - Display current portfolio value
   
2. **Trading Decision**
   - User chooses: Buy or Sell
   - User inputs: Number of shares
   
3. **Outcome Reveal**
   - Display ground truth
   - Update portfolio value
   - Show profit/loss from trade
   
4. **Trust Assessment**
   - 5 trust questions (1-7 Likert scale)
   - Scale starts from previous response
   - User adjusts based on recent experience

### Trust Questions
1. How much do you trust the accuracy of this prediction model?
2. How confident are you in making decisions based on these predictions?
3. How well do you understand the model's prediction logic?
4. How reliable do you find the prediction visualizations?
5. How likely are you to use this model for future decisions?

## User Interface Layout

### Left Panel: Visualization
- Line chart showing:
  - Historical stock prices (solid line)
  - Predictions based on condition:
    - Aggregation: Single prediction line
    - Alternative: Multiple lines with varying opacity
- Trading controls (Buy/Sell buttons, quantity input)
- Portfolio status (current value, available cash)

### Right Panel: Trust Assessment
- 5 trust questions with 7-point scales
- Previous ratings shown as starting points
- Submit button to proceed to next round

## Data Collection

### Per Round
- Trading decision (buy/sell, quantity)
- Trust ratings (5 dimensions)
- Response time
- Portfolio performance

### Calculated Metrics
- Trust rating changes over time
- Correlation between performance and trust
- Decision patterns per condition
- Final portfolio value per condition

## Prediction Generation Algorithm

### Good Model
- Base prediction = ground_truth + small_noise
- Small noise: ±5% of ground truth value
- For alternatives: Generate 3-5 variations with different noise samples

### Bad Model
- Base prediction = ground_truth + large_noise
- Large noise: ±20% of ground truth value
- For alternatives: Generate 3-5 variations with wider variance

### Alternative Display
- Primary prediction: 100% opacity
- Secondary predictions: 60-80% opacity based on probability
- Probability distribution: Normal distribution around base prediction

## Expected Outcomes

### Hypotheses
1. Alternative displays will lead to higher trust when model performs poorly
2. Aggregated displays will lead to higher trust when model performs well
3. Trust ratings will correlate with trading performance
4. Understanding ratings will be higher for alternative displays

## Technical Requirements

### Frontend
- Interactive line chart visualization
- Real-time portfolio tracking
- Responsive trust rating interface
- Session state management

### Backend
- Alpha Vantage API integration
- Prediction generation engine
- Data logging system
- Session management

## Participant Instructions
"You are participating in an alien stock market trading simulation. You will see predictions for stock prices and make trading decisions. Your goal is to maximize your portfolio value while evaluating how much you trust the prediction system."

## Ethical Considerations
- Inform participants data is simulated
- No real money involved
- Data anonymization
- Option to withdraw at any time