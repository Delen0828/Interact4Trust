# Prediction Trust Experiment

A jsPsych-based experiment studying how different prediction visualization formats (single aggregated vs. multiple alternatives) affect user trust and decision-making in a simulated "alien stock market" environment.

## Overview

This experiment implements a 2x2 factorial design:
- **Model Quality**: Good (±5% noise) vs Bad (±20% noise)  
- **Display Format**: Aggregation (single line) vs Alternative (multiple lines with opacity)

Participants trade stocks across 4 conditions (10 rounds each), making buy/sell decisions and rating their trust in the prediction model after each trade.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the experiment:
```bash
npm start
```
Or:
```bash
npm run serve
```

3. Open browser and navigate to:
```
http://localhost:8000
```

## Project Structure

```
├── index.html              # Main HTML file
├── src/
│   ├── experiment.js       # Main experiment logic
│   ├── config.js          # Configuration settings
│   ├── plugins/
│   │   ├── jspsych-stock-trading.js  # Custom trading interface
│   │   └── jspsych-trust-survey.js   # Trust assessment plugin
│   ├── utils/
│   │   ├── dataFetcher.js           # API integration
│   │   ├── predictionGenerator.js    # Prediction synthesis
│   │   └── portfolioManager.js       # Portfolio calculations
│   ├── stimuli/
│   │   └── stockData.js             # Mock stock data
│   └── styles/
│       └── experiment.css           # Styling
```

## Features

- **Custom jsPsych Plugins**: Stock trading interface and trust survey
- **D3.js Visualizations**: Interactive line charts with predictions
- **Portfolio Management**: Track profits/losses across rounds
- **Trust Assessment**: 5-dimension Likert scale ratings
- **Data Export**: Automatic CSV export of all trial data

## Configuration

Edit `src/config.js` to modify:
- Initial portfolio value (default: $10,000)
- Number of rounds per condition (default: 10)
- Model noise levels
- Trust questions
- Debug settings

## Data Output

The experiment collects:
- Trading decisions (buy/sell, quantity)
- Trust ratings (5 dimensions, 1-7 scale)
- Portfolio performance
- Response times
- Condition order

Data is automatically saved as CSV at the end of the experiment.

## Debug Mode

Set `debug.enabled = true` in config.js to:
- Show condition information
- Use mock data instead of API calls
- Enable console logging

## Alpha Vantage API

To use real stock data:
1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Set the API key in the environment or dataFetcher.js
3. Set `debug.useMockData = false` in config.js

Note: The experiment works perfectly with mock data for testing.

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

For research purposes only.