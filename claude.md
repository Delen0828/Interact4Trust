# Claude Development Instructions

## Project: Alien Plant Growth Prediction Trust Study

### Overview
You are maintaining an interactive web experiment that studies how different prediction visualization formats affect user trust in decision-making. The experiment uses sophisticated synthetic data presented as "alien plant growth" predictions in a cultivation simulation context.

### Core Technologies
- **Frontend Framework**: jsPsych (JavaScript psychology experiment framework)
- **Visualization**: D3.js for interactive line charts with sophisticated hover effects
- **Styling**: Custom CSS with enhanced responsive design and pattern-specific visual indicators
- **Data**: Sophisticated synthetic prediction patterns (15 unique stimuli)
- **Architecture**: Vanilla JavaScript with modular plugin system

### Current Implementation Status

#### ✅ **Completed Core Features**

1. **15 Sophisticated Stimuli Patterns** - Each combining pattern type with trend direction:
   - **Pattern Types**: Agreement, Polarization, Risk of Loss, Chance of Gain, Ambiguous Spread
   - **Trend Directions**: Increase, Decrease, Stable
   - **Total Combinations**: 5 patterns × 3 trends = 15 unique stimuli

2. **Two Named Experimental Conditions** (Between-subjects design):
   - **"Aggregation"**: Shows single aggregated prediction line only
   - **"Hover-to-Reveal"**: Shows aggregated prediction by default, hover reveals alternatives

3. **Experiment Structure**:
   - **15 trials per participant** (each participant assigned to ONE condition)
   - **All 15 stimuli patterns** experienced by each participant
   - **Plant species rotation** across trials (LUXF, CRYS, NEBF, VOID)
   - **Randomized pattern order** for each participant

### Key Implementation Details

#### 1. Experimental Design
```javascript
// Two named conditions (between-subjects)
conditions: [
    { 
        id: 'aggregation', 
        name: 'Aggregation',
        displayFormat: 'aggregation',
        description: 'Single aggregated prediction line only'
    },
    { 
        id: 'hover_to_reveal', 
        name: 'Hover-to-Reveal',
        displayFormat: 'alternative',
        description: 'Aggregated prediction with hover to reveal alternatives'
    }
]
```

#### 2. Stimuli Pattern System
```javascript
// 15 sophisticated patterns with real synthetic data
stimuliPatterns: {
    "increase_agreement": {
        trend: "increase",
        pattern: "agreement", 
        aggregation: 107.5,
        alternatives: [107.68, 107.57, 107.07, 107.67, 107.52]
    },
    // ... 14 more patterns
}
```

#### 3. Plant Cultivation Interface
- **Greenhouse Resource Management**: Start with 10,000 units, track cultivation costs
- **Cultivation Actions**: Cultivate (expect growth) or Prune (expect decline)
- **Resource Investment**: Variable resource amounts with plant count calculation
- **Outcome Feedback**: Show actual growth with profit/loss calculation

#### 4. Trust Rating System
- **5 Trust Questions** with 7-point Likert scales
- **Previous Rating Display**: Shows participant's rating from previous trial
- **Change Indicators**: Highlights changes from previous responses
- **Context Awareness**: Includes greenhouse performance changes

#### 5. Sophisticated Visualizations
- **Interactive D3.js Charts** with smooth animations and transitions
- **Pattern-Specific Styling**: Visual indicators for different pattern types
- **Hover Interactions**: Smooth reveal of alternative predictions (in Hover-to-Reveal condition)
- **Responsive Design**: Works on desktop and mobile devices

### File Structure
```
src/
├── experiment.js              # Main experiment timeline and flow
├── config.js                  # Experiment configuration and conditions
├── plugins/
│   ├── jspsych-plant-cultivation.js  # Plant cultivation trial plugin
│   └── jspsych-trust-survey.js       # Trust rating plugin
├── stimuli/
│   └── plantGrowthData.js     # 15 sophisticated prediction patterns
├── utils/
│   ├── greenhouseManager.js   # Resource and cultivation management
│   ├── predictionGenerator.js # Pattern-based prediction system
│   └── dataFetcher.js        # Data handling utilities
└── styles/
    └── experiment.css         # Enhanced styling with pattern indicators
```

### Data Logging Structure
```javascript
// Comprehensive trial data logging
{
    trial_type: 'plant_cultivation',
    condition_id: 'aggregation',
    condition_name: 'Aggregation', 
    trial: 1,                    // 1-15
    plant_species: 'LUXF',
    display_format: 'aggregation',
    stimuli_pattern: 'increase_agreement',
    stimuli_trend: 'increase',
    stimuli_index: 1,            // 1-15
    action: 'cultivate',
    resource_amount: 500,
    plants: 5,
    yield_result: 150,
    rt: 12500                    // Response time in ms
}
```

### Current Experiment Flow
```javascript
// Simplified single-condition flow
1. Welcome & Consent
2. General Instructions
3. Condition Assignment (random: Aggregation OR Hover-to-Reveal)
4. Condition-Specific Instructions
5. 15 Cultivation Trials:
   - Plant Cultivation Decision
   - Trust Rating Survey
6. Final Survey
7. Debrief & Data Download
```

### Debug Features
- **Stimuli Information Display**: Shows current pattern name, trend, and index
- **Pattern Descriptions**: Detailed explanations of each pattern type
- **Console Logging**: Tracks pattern assignment and participant responses
- **Toggle Controls**: Enable/disable debug info via configuration

### Visual Design Features
- **Alien Plant Theme**: Consistent plant cultivation terminology and visuals
- **Pattern-Specific Colors**: Visual indicators for different pattern types
- **Smooth Animations**: D3.js transitions for professional polish
- **Responsive Layout**: Mobile-friendly design with adaptive components
- **Accessibility**: Proper contrast ratios and readable fonts

### Testing Checklist
- [x] Two conditions work correctly (Aggregation vs Hover-to-Reveal)
- [x] All 15 stimuli patterns generate with correct characteristics
- [x] Plant cultivation calculations are accurate
- [x] Trust ratings persist correctly between trials
- [x] Data logs capture all required fields including pattern information
- [x] UI responsive on mobile and desktop
- [x] Debug information displays correctly
- [x] Hover interactions work smoothly in Hover-to-Reveal condition

### Production Deployment
- **Participant Assignment**: Automatic random assignment to conditions
- **Data Export**: CSV download with participant ID
- **Session Management**: Proper state handling throughout 15 trials
- **Error Handling**: Graceful fallbacks for missing data or patterns
- **Performance**: Optimized for smooth interactions and quick loading

### Research Validity Features
- **Between-Subjects Design**: Clean comparison between visualization approaches
- **Complete Pattern Coverage**: Every participant sees all 15 sophisticated patterns
- **Randomization**: Pattern order randomized per participant
- **Comprehensive Logging**: Detailed interaction and timing data
- **Validated Instruments**: Standard trust rating scales

### Maintenance Notes
- **No External APIs**: All data is synthetic and self-contained
- **Modular Architecture**: Easy to modify individual components
- **Comprehensive Documentation**: Code comments explain complex algorithms
- **Version Control**: Track changes to stimuli patterns and conditions
- **Research Ethics**: Informed consent and data anonymization built-in

### Key Differences from Original Plan
- **Technology**: jsPsych instead of React/TypeScript
- **Theme**: Alien plant cultivation instead of stock market
- **Design**: 2 conditions × 15 trials instead of 4 conditions × 10 rounds
- **Data**: Sophisticated synthetic patterns instead of Alpha Vantage API
- **Structure**: Between-subjects instead of within-subjects design
- **Focus**: Trust in prediction visualization formats in cultivation context

This implementation provides a robust, research-grade experiment for studying how different prediction visualization approaches affect user trust and decision-making in uncertain environments.