/**
 * Air Quality Data
 * 
 * Synthetic air quality index (AQI) data for two cities with historical and prediction data
 * Following the format structure from synthetic_city_data.json
 * 
 * Data Structure:
 * - Historical data: 4 months (Jan-Apr 2025) for cities A and B
 * - Prediction data: 2 months (May-Jun 2025) with 10 scenarios each
 * - AQI values range from 95-110 (moderate to unhealthy for sensitive groups)
 * - Cities A and B have different baseline patterns
 */

// Generate dates for a given range
function generateDates(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Generate historical data with realistic AQI patterns
function generateHistoricalData() {
  const historicalDates = generateDates('2025-01-01', '2025-04-30');
  const data = [];
  
  // City A: Generally higher AQI, more variable (industrial city)
  let cityAValue = 103;
  // City B: Generally lower AQI, more stable (coastal city)
  let cityBValue = 100;
  
  historicalDates.forEach(date => {
    // City A: More volatile, trending slightly upward
    cityAValue += (Math.random() - 0.45) * 0.8;
    cityAValue = Math.max(95, Math.min(110, cityAValue));
    
    // City B: More stable, slight seasonal variation
    cityBValue += (Math.random() - 0.5) * 0.4;
    cityBValue = Math.max(95, Math.min(110, cityBValue));
    
    data.push({
      date: date,
      city: "A",
      aqi: Math.round(cityAValue * 100) / 100,
      series: "historical",
      scenario: null
    });
    
    data.push({
      date: date,
      city: "B", 
      aqi: Math.round(cityBValue * 100) / 100,
      series: "historical",
      scenario: null
    });
  });
  
  return data;
}

// Generate prediction scenarios with different uncertainty patterns
function generatePredictionData() {
  const predictionDates = generateDates('2025-05-01', '2025-06-30');
  const data = [];
  
  // Base prediction values (what aggregated line will show)
  const baseCityA = 105;
  const baseCityB = 101;
  
  // Generate 10 different scenarios for each city
  for (let scenario = 1; scenario <= 10; scenario++) {
    let cityAValue = baseCityA + (Math.random() - 0.5) * 2; // Start with some variation
    let cityBValue = baseCityB + (Math.random() - 0.5) * 2;
    
    predictionDates.forEach(date => {
      // Different scenario patterns
      let aVariation = 0;
      let bVariation = 0;
      
      switch(scenario) {
        case 1:
        case 2:
        case 3:
          // Agreement scenarios - low variation
          aVariation = (Math.random() - 0.5) * 0.5;
          bVariation = (Math.random() - 0.5) * 0.5;
          break;
        case 4:
        case 5:
          // Moderate disagreement
          aVariation = (Math.random() - 0.5) * 1.5;
          bVariation = (Math.random() - 0.5) * 1.5;
          break;
        case 6:
        case 7:
          // High disagreement
          aVariation = (Math.random() - 0.5) * 3;
          bVariation = (Math.random() - 0.5) * 3;
          break;
        case 8:
        case 9:
          // Polarized scenarios
          aVariation = scenario === 8 ? 2 : -2;
          bVariation = scenario === 8 ? -1.5 : 1.5;
          break;
        case 10:
          // Wild card scenario
          aVariation = (Math.random() - 0.5) * 4;
          bVariation = (Math.random() - 0.5) * 4;
          break;
      }
      
      cityAValue += aVariation * 0.1;
      cityBValue += bVariation * 0.1;
      
      // Keep within reasonable bounds
      cityAValue = Math.max(95, Math.min(110, cityAValue));
      cityBValue = Math.max(95, Math.min(110, cityBValue));
      
      data.push({
        date: date,
        city: "A",
        aqi: Math.round(cityAValue * 100) / 100,
        series: "prediction",
        scenario: `scenario_${scenario}`
      });
      
      data.push({
        date: date,
        city: "B",
        aqi: Math.round(cityBValue * 100) / 100,
        series: "prediction", 
        scenario: `scenario_${scenario}`
      });
    });
  }
  
  return data;
}

// Complete synthetic air quality dataset
const airQualityData = {
  data: [
    ...generateHistoricalData(),
    ...generatePredictionData()
  ]
};

// Utility functions for data processing
const DataUtils = {
  
  // Get historical data only
  getHistoricalData() {
    return airQualityData.data.filter(d => d.series === 'historical');
  },
  
  // Get prediction data for specific scenario
  getPredictionData(scenario = null) {
    const predictions = airQualityData.data.filter(d => d.series === 'prediction');
    
    if (scenario) {
      return predictions.filter(d => d.scenario === scenario);
    }
    
    return predictions;
  },
  
  // Get aggregated predictions (average across all scenarios)
  getAggregatedPredictions() {
    const predictions = this.getPredictionData();
    const aggregated = [];
    
    // Group by date and city, then average
    const grouped = predictions.reduce((acc, curr) => {
      const key = `${curr.date}_${curr.city}`;
      if (!acc[key]) {
        acc[key] = {
          date: curr.date,
          city: curr.city,
          values: [],
          series: 'aggregated'
        };
      }
      acc[key].values.push(curr.aqi);
      return acc;
    }, {});
    
    // Calculate averages
    Object.values(grouped).forEach(group => {
      const avgAqi = group.values.reduce((sum, val) => sum + val, 0) / group.values.length;
      aggregated.push({
        date: group.date,
        city: group.city,
        aqi: Math.round(avgAqi * 100) / 100,
        series: 'aggregated',
        scenario: null
      });
    });
    
    return aggregated;
  },
  
  // Get confidence bounds (min/max across scenarios)
  getConfidenceBounds() {
    const predictions = this.getPredictionData();
    const bounds = [];
    
    // Group by date and city
    const grouped = predictions.reduce((acc, curr) => {
      const key = `${curr.date}_${curr.city}`;
      if (!acc[key]) {
        acc[key] = {
          date: curr.date,
          city: curr.city,
          values: []
        };
      }
      acc[key].values.push(curr.aqi);
      return acc;
    }, {});
    
    // Calculate bounds
    Object.values(grouped).forEach(group => {
      const values = group.values;
      bounds.push({
        date: group.date,
        city: group.city,
        min: Math.min(...values),
        max: Math.max(...values),
        series: 'bounds'
      });
    });
    
    return bounds;
  },
  
  // Get all scenarios as separate series
  getAllScenarios() {
    const scenarios = [];
    
    for (let i = 1; i <= 10; i++) {
      const scenarioData = this.getPredictionData(`scenario_${i}`);
      scenarios.push({
        id: `scenario_${i}`,
        name: `Scenario ${i}`,
        data: scenarioData
      });
    }
    
    return scenarios;
  },
  
  // Get data formatted for D3.js visualization
  getVisualizationData() {
    return {
      historical: this.getHistoricalData(),
      predictions: {
        aggregated: this.getAggregatedPredictions(),
        scenarios: this.getAllScenarios(),
        bounds: this.getConfidenceBounds()
      }
    };
  }
};

// Export for use in experiment
if (typeof window !== 'undefined') {
  window.airQualityData = airQualityData;
  window.DataUtils = DataUtils;
}

// For module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { airQualityData, DataUtils };
}