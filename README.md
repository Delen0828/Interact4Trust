# Air Quality Prediction Visualization Trust Study

An interactive web experiment studying how different uncertainty visualization formats affect user trust in decision-making using air quality prediction data.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server with PHP data saving:**
   ```bash
   npm start
   # or
   ./start_server.sh
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8000` to run the experiment
   
   **Alternative Python server (no data saving):**
   ```bash
   npm run start-python  # Runs on localhost:8080
   ```

## Study Overview

- **8 experimental conditions** (between-subjects design)
- **Two-phase study**: Text-based prediction → Visualization-based prediction  
- **Measurements**: Visualization literacy, probability estimation, confidence, trust
- **Data**: Synthetic air quality predictions for City A vs City B

## Testing Different Conditions

To test different visualization conditions, edit `index.html` line 13:

```javascript
const ASSIGNED_CONDITION = 1;  // Change to 1-8 to test different conditions
```

### Available Conditions:
1. **Baseline** - Aggregated prediction lines only
2. **PI Plot** - Confidence bounds with shaded areas  
3. **Ensemble Plot** - Multiple prediction lines shown
4. **Ensemble + Hover** - Hover reveals alternative predictions
5. **PI Plot + Hover** - Hover reveals individual predictions
6. **PI → Ensemble** - Transform between representations on hover
7. **Buggy Control** - Broken interactions (placeholder)
8. **Bad Control** - Poor interactions (placeholder)

## File Structure

```
src/
├── experiment.js              # Main experiment timeline
├── config.js                  # 8-condition configuration  
├── plugins/                   # Custom jsPsych plugins
│   ├── jspsych-vis-literacy.js       # Visualization literacy test
│   ├── jspsych-prediction-task.js    # Air quality prediction task
│   ├── jspsych-trust-survey.js       # Trust measurement scales
│   └── jspsych-broken-interactions.js # Control conditions (placeholder)
├── utils/                     # Utility modules
│   ├── visualizationRenderer.js      # D3.js visualization management
│   ├── conditionManager.js           # Condition metadata handling
│   ├── interactionController.js      # Hover/click interaction logic  
│   └── dataCollector.js              # Comprehensive data logging
├── data/                      
│   └── airQualityData.js             # Synthetic air quality data
└── styles/                    
    ├── experiment.css                # Main styling
    └── air-quality-theme.css         # Condition-specific styling
```

## Technologies

- **jsPsych 7.3.4** - Psychology experiment framework
- **D3.js 7.9.0** - Interactive data visualizations
- **Vanilla JavaScript** - No build process required
- **CSS3** - Responsive design with condition-specific styling

## Data Export

### With PHP Server (Recommended)
- **Automatic CSV saving**: Data saved to `data/` folder as `user_[ID]_[timestamp].csv`
- **Server-side storage**: Participant data securely stored on server
- **Fallback mechanism**: Uses localStorage if server unavailable

### With Python Server (Development)
- **localStorage only**: Data saved in browser storage
- **Manual download**: Participants download their own data files
- **JSON format**: Complete interaction logs and metadata

## Development

- **No build process** required - edit files directly
- **Local server** via Python HTTP server
- **Debug mode** available via browser console
- **Condition testing** via assignment flag in index.html

## Production Deployment

For production use:
1. Set `ASSIGNED_CONDITION = null` in `index.html` for random assignment
2. Deploy static files to any web server
3. No server-side dependencies required

## Research Features

- **Between-subjects design** - Each participant sees one condition
- **Two-phase comparison** - Before/after visualization exposure
- **Comprehensive logging** - All interactions and timing data captured
- **Visualization literacy assessment** - Pre-experiment screening
- **Validated trust scales** - Standard psychological instruments

## Browser Compatibility

- Modern browsers with ES6+ support
- Responsive design for desktop and mobile
- Accessibility features included

---

For questions or issues, refer to the comprehensive documentation in `CLAUDE.md`.