#!/usr/bin/env python3
"""
Python script to generate prediction data for all cases
Run with: python generate_data.py
"""

import json
import random
from typing import List, Dict, Any, Tuple


def generate_historical_data(trend: str = 'stable') -> List[Dict[str, Any]]:
    """Generate historical data with trend"""
    values = []
    num_points = 10
    
    # Define trend parameters
    if trend == 'increase':
        start_value = 50  # 60-70 range
        end_value = 100    # 95-105 range
    elif trend == 'decrease':
        start_value = 150  # 130-140 range
        end_value = 100     # 95-105 range
    elif trend == 'stable':
        center_value = 100
        start_value = center_value
        end_value = center_value
    else:
        raise ValueError(f"Unknown trend: {trend}")
    
    # Generate values with trend
    for i in range(num_points):
        if trend == 'stable':
            # Stable trend: fluctuate around center with controlled variance
            variance = 10  # ±5 from center
            base_value = center_value + (random.random() - 0.5) * 2 * variance
        else:
            # Linear interpolation between start and end values
            variance = 10
            progress = i / (num_points - 1)
            base_value = start_value + (end_value - start_value) * progress
            
            # Add realistic noise (smaller variance for trending data)
            noise = (random.random() - 0.5) * 2 * variance  # ±3 noise
            base_value += noise
        
        values.append(round(base_value, 2))
    
    # Convert to data format
    data = [{"time": index, "value": value} for index, value in enumerate(values)]
    
    return data


def generate_predictions(current_price: float, trend: str, pattern: str) -> Dict[str, Any]:
    """Generate prediction data for a specific trend and pattern"""
    trend_strength = 20
    aggregation_value = current_price
    
    # Calculate aggregation based on trend
    if trend == 'increase':
        aggregation_value = current_price + trend_strength
    elif trend == 'decrease':
        aggregation_value = current_price - trend_strength
    elif trend == 'stable':
        aggregation_value = current_price
    
    # Generate alternatives based on pattern
    alternatives = []
    noise_level = 20
    
    if pattern == 'agreement':
        # All predictions cluster tightly around aggregation
        for i in range(5):
            deviation = (random.random() - 0.5) * 2 * noise_level  # Small deviation
            alternatives.append(aggregation_value + deviation)
    
    elif pattern == 'polarization':
        # EXTREME split - very dramatic polarization
        alternatives = [
            aggregation_value + 40,   # Very high prediction
            aggregation_value + 30,   # High prediction
            aggregation_value,        # At aggregation
            aggregation_value - 30,   # Low prediction
            aggregation_value - 40    # Very low prediction
        ]
    
    elif pattern == 'risk_of_loss':
        # Most predictions cluster ABOVE aggregation, with 1 extreme outlier showing risk
        alternatives = [
            aggregation_value + 25.3,  # High prediction
            aggregation_value + 24.3,  # High prediction
            aggregation_value + 23.8,  # High prediction
            aggregation_value + 15.3,  # Moderate prediction
            aggregation_value - 88.7   # EXTREME OUTLIER: Risk of severe loss
        ]
    
    elif pattern == 'chance_of_gain':
        # Most predictions cluster BELOW/AT aggregation, with 1 extreme outlier showing chance of gain
        alternatives = [
            aggregation_value + 45,     # EXTREME OUTLIER: Chance of major gain (contrarian)
            aggregation_value - 21.5,  # Following downward trend
            aggregation_value - 22,    # Following downward trend
            aggregation_value - 22.5,  # Following downward trend
            aggregation_value - 23     # Following downward trend
        ]
    
    elif pattern == 'ambiguous_spread':
        # Wide scatter around aggregation
        spread = 80
        alternatives = [
            aggregation_value + spread * 0.8,
            aggregation_value + spread * 0.1,
            aggregation_value - spread * 0.25,
            aggregation_value - spread * 0.45,
            aggregation_value + spread * 0.2
        ]
    
    else:
        raise ValueError(f"Unknown pattern: {pattern}")
    
    # Ensure mean of alternatives equals aggregation
    current_mean = sum(alternatives) / len(alternatives)
    adjustment = aggregation_value - current_mean
    alternatives = [round(v + adjustment, 2) for v in alternatives]
    
    return {
        "aggregation": round(aggregation_value, 2),
        "alternatives": alternatives
    }


def generate_simple_format() -> Dict[str, Any]:
    """Generate data in the format expected by the visualization"""
    trends = ['increase', 'decrease', 'stable']
    patterns = ['agreement', 'polarization', 'risk_of_loss', 'chance_of_gain', 'ambiguous_spread']
    
    data = {
        "historical": {},
        "cases": {}
    }
    
    for trend in trends:
        for pattern in patterns:
            case_id = f"{trend}_{pattern}"
            historical_data = generate_historical_data(trend)
            current_price = historical_data[-1]["value"]
            predictions = generate_predictions(current_price, trend, pattern)
            
            # Store historical data for each trend
            if trend not in data["historical"]:
                data["historical"][trend] = historical_data
            
            data["cases"][case_id] = {
                "trend": trend,
                "pattern": pattern,
                "aggregation": predictions["aggregation"],
                "alternatives": predictions["alternatives"]
            }
    
    return data


def main():
    """Main function to generate and save data"""
    # Generate data
    data = generate_simple_format()
    
    # Save to JSON file
    with open('predictions-data.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print('Generated predictions-data.json successfully!')
    
    # Print some statistics for verification
    print(f"Generated {len(data['cases'])} cases across {len(data['historical'])} trends")
    print(f"Trends: {list(data['historical'].keys())}")
    print(f"Sample case keys: {list(data['cases'].keys())[:3]}...")


if __name__ == "__main__":
    main()