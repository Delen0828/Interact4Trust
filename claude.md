# Claude Development Instructions

## Project: Air Quality Prediction Visualization Trust Study

### Overview
You are maintaining an interactive web experiment that studies how different uncertainty visualization formats affect user trust in decision-making. The experiment uses synthetic air quality prediction data comparing two cities (City A vs City B) to examine how visualization literacy, probability estimation, confidence, and trust are affected by different visualization approaches.

### Core Technologies
- **Frontend Framework**: jsPsych (JavaScript psychology experiment framework)
- **Visualization**: D3.js for interactive line charts with sophisticated hover effects and uncertainty representations
- **Styling**: Custom CSS with enhanced responsive design and condition-specific visual indicators
- **Data**: Synthetic air quality prediction data with multiple scenarios and aggregations
- **Architecture**: Vanilla JavaScript with modular plugin system

### Current Implementation Status

#### ✅ **Completed Core Features**

1. **8 Experimental Conditions** (Between-subjects design):
   - **Condition 1 (Baseline)**: Shows only aggregated prediction lines
   - **Condition 2 (PI Plot)**: Shows aggregated prediction with confidence bounds (shaded areas)
   - **Condition 3 (Ensemble Plot)**: Shows both aggregated and alternative prediction lines
   - **Condition 4 (Ensemble + Hover)**: Aggregated by default, hover reveals alternative predictions
   - **Condition 5 (PI Plot + Hover)**: PI plot with hover to reveal individual predictions
   - **Condition 6 (PI → Ensemble)**: PI plot that transforms to ensemble plot on hover
   - **Condition 7 (Buggy Control)**: Broken interactions (hover in wrong place, misaligned predictions, draggable lines)
   - **Condition 8 (Bad Control)**: Poor interactions (forced clicks, timed animations, disappearing pop-ups)

2. **Two-Phase Study Design**:
   - **Phase 1**: Participants make predictions without any visualization
   - **Phase 2**: Participants make predictions with assigned visualization condition
   - **Measurements**: Probability estimates, confidence ratings, trust assessments at each phase

3. **Experiment Structure**:
   - **Visualization Literacy Test** (pre-experiment assessment)
   - **Air Quality Prediction Tasks** comparing City A vs City B
   - **Trust and Confidence Measurements** using validated scales
   - **Between-subjects assignment** to one of 8 visualization conditions

### Key Implementation Details

#### 1. Experimental Design
```javascript
// Eight experimental conditions (between-subjects)
conditions: [
    { 
        id: 'condition_1_baseline', 
        name: 'Baseline',
        displayFormat: 'aggregation_only',
        description: 'Shows only aggregated prediction lines'
    },
    { 
        id: 'condition_2_pi_plot', 
        name: 'PI Plot',
        displayFormat: 'confidence_bounds',
        description: 'Shows aggregated prediction with confidence bounds'
    },
    { 
        id: 'condition_3_ensemble', 
        name: 'Ensemble Plot',
        displayFormat: 'alternative_lines',
        description: 'Shows both aggregated and alternative predictions'
    },
    { 
        id: 'condition_4_ensemble_hover', 
        name: 'Ensemble + Hover',
        displayFormat: 'hover_alternatives',
        description: 'Aggregated by default, hover to reveal alternatives'
    },
    { 
        id: 'condition_5_pi_hover', 
        name: 'PI Plot + Hover',
        displayFormat: 'hover_bounds',
        description: 'PI plot with hover to reveal individual predictions'
    },
    { 
        id: 'condition_6_pi_to_ensemble', 
        name: 'PI → Ensemble',
        displayFormat: 'transform_hover',
        description: 'PI plot transforms to ensemble plot on hover'
    },
    { 
        id: 'condition_7_buggy', 
        name: 'Buggy Control',
        displayFormat: 'broken_interactions',
        description: 'Broken interactions (misaligned, draggable, wrong hover zones)'
    },
    { 
        id: 'condition_8_bad', 
        name: 'Bad Control',
        displayFormat: 'poor_interactions',
        description: 'Poor interactions (forced clicks, timed pop-ups, disappearing elements)'
    }
]
```

#### 2. Data Structure System
```javascript
// Synthetic air quality data follows synthetic_city_data.json format
// Each scenario is a separate JSON file (planning to scale to 10 scenarios)
dataFormat: {
    "data": [
        {
            "date": "2025-01-01",
            "city": "A",                    // City A or B
            "price": 103,                   // Air quality index value
            "series": "historical",         // "historical" or "prediction"
            "scenario": null                // null for historical, 1-10 for predictions
        },
        {
            "date": "2025-06-01",
            "city": "A", 
            "price": 105.2,
            "series": "prediction",
            "scenario": 1                   // Scenario identifier for predictions
        }
        // ... more data points
    ]
}

// For jsPsych: Data is processed per trial, no global data structure needed
// For D3 visualization: Data filtered and aggregated at render time
// - Historical data: series === "historical"
// - Prediction scenarios: series === "prediction", scenario === 1-10
// - Aggregated prediction: mean of sampled scenarios (typically 5 out of 10)
// - Confidence bounds: min/max of sampled scenarios
```

#### 3. Two-Phase Study Interface
- **Phase 1 (No Visualization)**: Text-based air quality descriptions, probability estimation task
- **Phase 2 (With Visualization)**: Interactive D3.js charts showing air quality predictions
- **Prediction Task**: "The probability that air quality in City A > City B is ____%"
- **Confidence Assessment**: 7-point scale from "Very uncertain" to "Very certain"
- **Travel Decision**: Choice between cities for travel planning

#### 4. Trust and Confidence Measurement
- **Interface Trust**: "How much do you trust the fidelity of this visualization tool?"
- **Data Trust**: "How much do you trust the underlying air quality data?"
- **Misleading Assessment**: "How much do you think this visualization is misleading?"
- **Confidence Tracking**: Before/after visualization exposure comparison
- **Interpretation Questions**: Multiple choice comprehension assessment

#### 5. Sophisticated Visualizations
- **Interactive D3.js Charts** with smooth animations and uncertainty representations
- **Condition-Specific Interactions**: Hover effects, confidence bounds, ensemble displays
- **Broken Interaction Controls**: Deliberately poor UX for control conditions
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility Features**: Screen reader support and keyboard navigation

### File Structure
```
src/
├── experiment.js              # Main experiment timeline and flow
├── config.js                  # Experiment configuration and 8 conditions
├── plugins/
│   ├── jspsych-vis-literacy.js      # Visualization literacy test plugin
│   ├── jspsych-prediction-task.js   # Air quality prediction task plugin
│   ├── jspsych-trust-survey.js      # Trust and confidence rating plugin
│   └── jspsych-broken-interactions.js # Control condition plugins (buggy/bad UX)
├── stimuli/
│   └── airQualityData.js      # Synthetic air quality prediction data
├── utils/
│   ├── visualizationRenderer.js # D3.js visualization management
│   ├── conditionManager.js      # Handle 8 different visualization conditions
│   ├── interactionController.js # Hover, click, and broken interaction logic
│   └── dataCollector.js        # Comprehensive data logging utilities
└── styles/
    └── experiment.css         # Enhanced styling with condition-specific indicators
```

### Data Logging Structure
```javascript
// Comprehensive study data logging
{
    // Phase 1 (No Visualization)
    phase_1_data: {
        probability_estimate: 65,     // Percentage estimate
        confidence_rating: 4,         // 1-7 scale
        travel_choice: 'city_a',
        rt_phase1: 8500              // Response time in ms
    },
    
    // Phase 2 (With Visualization) 
    phase_2_data: {
        condition_id: 'condition_3_ensemble',
        condition_name: 'Ensemble Plot',
        display_format: 'alternative_lines',
        probability_estimate: 72,     // After seeing visualization
        confidence_rating: 6,         // After seeing visualization
        travel_choice: 'city_a',
        rt_phase2: 12300,            // Response time in ms
        
        // Trust measurements
        interface_trust: 5,           // 1-7 scale
        data_trust: 4,               // 1-7 scale  
        misleading_rating: 2,        // 1-7 scale (reverse coded)
        
        // Interaction tracking
        hover_events: 3,             // Number of hovers (if applicable)
        click_events: 1,             // Number of clicks
        time_on_viz: 45000          // Time spent viewing visualization
    },
    
    // Pre-study assessment
    vis_literacy_score: 8,           // Out of 12 possible
    participant_id: 'P001',
    timestamp: '2025-01-15T10:30:00Z'
}
```

### Current Experiment Flow
```javascript
// Two-phase study design
1. Welcome & Consent
2. Visualization Literacy Test (12 questions)
3. General Instructions
4. Phase 1: Prediction Without Visualization
   - Text description of air quality trends
   - Probability estimation task
   - Confidence and travel decision
5. Condition Assignment (random: 1 of 8 conditions)
6. Condition-Specific Instructions  
7. Phase 2: Prediction With Visualization
   - Interactive D3.js chart (condition-dependent)
   - Updated probability estimation
   - Updated confidence and travel decision
   - Trust and interpretation questions
8. Final Demographics Survey
9. Debrief & Data Download
```

### Condition Assignment System
```javascript
// Manual condition assignment flag for testing (index.html)
const ASSIGNED_CONDITION = 1;  // Change to 1-8 to test different conditions

// Condition assignment logic (experiment.js)
const assignedCondition = ASSIGNED_CONDITION || Math.floor(Math.random() * 8) + 1;
const conditionConfig = ExperimentConfig.getConditionById(`condition_${assignedCondition}_${conditionNames[assignedCondition-1]}`);

// Each participant experiences only ONE condition throughout the study
// For production: Set ASSIGNED_CONDITION = null to enable random assignment
// For testing: Set ASSIGNED_CONDITION = 1-8 to test specific conditions
```

### Detailed Condition Specifications

#### **Condition 1: Baseline**
- **Implementation**: Single aggregated prediction line for each city
- **Interaction**: No hover effects, static display
- **Technical**: Use mean of 5 randomly sampled scenarios from synthetic data
- **Purpose**: Control condition to establish baseline trust and accuracy

#### **Condition 2: PI Plot** 
- **Implementation**: Aggregated prediction with shaded confidence bounds
- **Interaction**: Static shaded areas showing min/max of sampled scenarios
- **Technical**: D3.js area charts with opacity-controlled fill
- **Purpose**: Test impact of uncertainty bounds on trust

#### **Condition 3: Ensemble Plot**
- **Implementation**: Show all alternative prediction lines simultaneously  
- **Interaction**: Static display of 5 sampled scenario lines + aggregated line
- **Technical**: Multiple path elements with controlled opacity
- **Purpose**: Test impact of showing prediction variability

#### **Condition 4: Ensemble + Hover**
- **Implementation**: Aggregated line by default, hover reveals alternatives
- **Interaction**: Smooth transitions on mouse hover over prediction lines
- **Technical**: CSS/D3 transitions with opacity changes on hover events
- **Purpose**: Test progressive disclosure approach

#### **Condition 5: PI Plot + Hover**  
- **Implementation**: PI plot baseline, hover reveals individual scenario lines
- **Interaction**: Confidence bounds visible, hover shows constituent scenarios
- **Technical**: Layered SVG elements with hover event listeners
- **Purpose**: Combine uncertainty bounds with detailed exploration

#### **Condition 6: PI → Ensemble**
- **Implementation**: PI plot transforms to ensemble plot on hover
- **Interaction**: Morphing animation from bounds to individual lines
- **Technical**: Coordinated D3 transitions and path interpolation
- **Purpose**: Test dynamic transformation between uncertainty representations

#### **Condition 7: Buggy Control**
- **Implementation**: Deliberately broken interactions
- **Interaction**: Wrong hover zones, misaligned predictions, draggable elements
- **Technical**: Offset event listeners, incorrect data binding, unwanted interactions
- **Purpose**: Control for poor interface quality effects

#### **Condition 8: Bad Control** 
- **Implementation**: Poor UX patterns
- **Interaction**: Forced clicks, timed pop-ups, disappearing elements
- **Technical**: setTimeout functions, modal dialogs, unstable UI elements  
- **Purpose**: Control for poor interaction design effects

### Debug Features
- **Condition Information Display**: Shows current condition name and ID
- **Interaction Logging**: Tracks all hover, click, and timing events
- **Console Logging**: Monitors data processing and visualization rendering
- **Toggle Controls**: Enable/disable debug info and timing displays

### Visual Design Features
- **Air Quality Theme**: Consistent terminology around city air quality comparison
- **Condition-Specific Styling**: Visual indicators differentiate each condition
- **Smooth Animations**: D3.js transitions for professional polish (except controls)
- **Responsive Layout**: Mobile-friendly design with adaptive components
- **Accessibility**: Screen reader support, keyboard navigation, high contrast

### Testing Checklist
- [ ] All 8 conditions render correctly with distinct behaviors
- [ ] Air quality data loads and processes properly
- [ ] Two-phase study flow works seamlessly
- [ ] Visualization literacy test scores correctly
- [ ] Trust and confidence measurements capture data properly
- [ ] Broken control conditions exhibit intended poor UX
- [ ] Data logging captures all required metrics
- [ ] UI responsive on mobile and desktop
- [ ] Debug information displays correctly

### Production Deployment
- **Participant Assignment**: Automatic random assignment to 1 of 8 conditions
- **Data Export**: Comprehensive CSV download with participant ID
- **Session Management**: Proper state handling across two-phase design
- **Error Handling**: Graceful fallbacks for missing data or broken interactions
- **Performance**: Optimized for smooth interactions and quick loading

### Research Validity Features
- **Between-Subjects Design**: Clean comparison across 8 visualization conditions
- **Two-Phase Comparison**: Before/after visualization exposure measurement
- **Comprehensive Assessment**: Visualization literacy, trust, confidence, accuracy
- **Randomization**: Condition assignment randomized per participant
- **Validated Instruments**: Standard trust and confidence rating scales

### Maintenance Notes
- **No External APIs**: All data is synthetic and self-contained
- **Modular Architecture**: Easy to modify individual visualization conditions
- **Comprehensive Documentation**: Code comments explain condition implementations
- **Version Control**: Track changes to conditions and interaction patterns
- **Research Ethics**: Informed consent and data anonymization built-in

### Key Differences from Original Plant Study
- **Domain**: Air quality prediction instead of alien plant cultivation
- **Study Design**: 8 conditions instead of 2, two-phase instead of 15 trials
- **Measurements**: Visualization literacy, probability estimation, trust scales
- **Data**: Air quality time series instead of plant growth patterns
- **Interactions**: Sophisticated hover/animation effects plus broken control conditions
- **Focus**: Uncertainty visualization impact on trust and decision-making

This implementation provides a comprehensive research platform for studying how different uncertainty visualization approaches affect user trust, confidence, and decision-making accuracy in predictive contexts.