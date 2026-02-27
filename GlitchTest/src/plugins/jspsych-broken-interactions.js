/**
 * jsPsych Broken Interactions Plugin (Placeholder)
 * 
 * Control conditions with deliberately poor interaction design
 * Conditions 7 & 8: Buggy Control and Bad Control
 */

var jsPsychBrokenInteractions = (function (jspsych) {
  'use strict';
  
  // Use the global jsPsychModule if available, otherwise fall back to jspsych parameter
  jspsych = jspsych || (typeof jsPsychModule !== 'undefined' ? jsPsychModule : null);
  
  if (!jspsych) {
    console.error('jsPsych not available for broken-interactions plugin');
    return null;
  }

  const info = {
    name: 'broken-interactions',
    description: 'Control conditions with deliberately broken or poor interaction design',
    parameters: {
      condition_type: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Condition Type',
        description: 'Type of broken interaction (buggy or bad)',
        default: 'buggy'
      }
    }
  };

  class BrokenInteractionsPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      // This is a placeholder implementation
      // Detailed implementations will be added later based on user requirements

      if (trial.condition_type === 'buggy') {
        this.renderBuggyCondition(display_element, trial);
      } else if (trial.condition_type === 'bad') {
        this.renderBadCondition(display_element, trial);
      } else {
        this.renderPlaceholder(display_element, trial);
      }
    }

    renderBuggyCondition(display_element, trial) {
      // TODO: Implement Condition 7 - Buggy Control
      // Features to implement:
      // - Wrong hover zones (offset by 50px from actual elements)
      // - Misaligned predictions (random offset in position)
      // - Unintended draggable elements
      // - Hover effects that appear in wrong locations
      // - Data points that don't align with axis values

      let html = `
        <div class="broken-interactions-container">
          <div class="condition-header">
            <h2>Humidity Prediction Visualization</h2>
            <p>Explore the chart to make your prediction.</p>
          </div>
          
          <div class="placeholder-content">
            <div class="implementation-notice">
              <h3>🚧 Condition 7: Buggy Control (Placeholder)</h3>
              <p><strong>TO IMPLEMENT:</strong></p>
              <ul>
                <li>✓ Hover zones offset by 50px from actual chart elements</li>
                <li>✓ Prediction lines with random position offsets (5-15px)</li>
                <li>✓ Unintended draggable chart elements</li>
                <li>✓ Tooltips that appear in wrong locations</li>
                <li>✓ Misaligned axis labels and data points</li>
                <li>✓ Inconsistent interaction behavior across elements</li>
              </ul>
              <p><em>Current implementation: Functional placeholder</em></p>
            </div>
            
            <!-- Placeholder visualization -->
            <div class="chart-placeholder">
              <svg width="600" height="400" style="border: 1px solid #ccc; background: #f9f9f9;">
                <!-- TODO: Replace with broken D3.js visualization -->
                <text x="300" y="200" text-anchor="middle" font-size="16" fill="#666">
                  Buggy Visualization Placeholder
                </text>
                <text x="300" y="220" text-anchor="middle" font-size="12" fill="#999">
                  (Interactions will be deliberately broken when implemented)
                </text>
                
                <!-- Sample broken elements preview -->
                <line x1="100" y1="300" x2="500" y2="150" stroke="#0891B2" stroke-width="2" opacity="0.3"/>
                <line x1="105" y1="305" x2="505" y2="155" stroke="#0891B2" stroke-width="2"/>
                <text x="110" y="320" font-size="10" fill="red">Offset line (broken)</text>
                
                <line x1="100" y1="320" x2="500" y2="200" stroke="#7C3AED" stroke-width="2"/>
                <circle cx="300" cy="260" r="20" fill="none" stroke="red" stroke-dasharray="2,2"/>
                <text x="330" y="265" font-size="10" fill="red">Wrong hover zone</text>
              </svg>
            </div>
          </div>
          
          <button class="continue-btn" onclick="this.finishPlaceholder('buggy')">
            Continue (Placeholder Mode)
          </button>
        </div>
      `;
      
      display_element.innerHTML = html;
    }

    renderBadCondition(display_element, trial) {
      // TODO: Implement Condition 8 - Bad Control
      // Features to implement:
      // - Forced clicks instead of hover (hover disabled)
      // - Timed pop-ups that disappear after 2 seconds
      // - Unstable UI elements that randomly reposition
      // - Modal dialogs that interrupt interaction
      // - Delays and laggy responses to interactions

      let html = `
        <div class="broken-interactions-container">
          <div class="condition-header">
            <h2>Humidity Prediction Visualization</h2>
            <p>Click on chart elements to view details.</p>
          </div>
          
          <div class="placeholder-content">
            <div class="implementation-notice">
              <h3>🚧 Condition 8: Bad Control (Placeholder)</h3>
              <p><strong>TO IMPLEMENT:</strong></p>
              <ul>
                <li>✓ Force clicks instead of hover for all interactions</li>
                <li>✓ Timed pop-ups that disappear after 2 seconds automatically</li>
                <li>✓ UI elements that randomly reposition every 10 seconds</li>
                <li>✓ Modal dialogs that interrupt workflow</li>
                <li>✓ Artificial delays (500-1000ms) on all interactions</li>
                <li>✓ Information that requires multiple clicks to reveal</li>
                <li>✓ Unstable tooltip behavior</li>
              </ul>
              <p><em>Current implementation: Functional placeholder</em></p>
            </div>
            
            <!-- Placeholder visualization -->
            <div class="chart-placeholder">
              <svg width="600" height="400" style="border: 1px solid #ccc; background: #f9f9f9;">
                <!-- TODO: Replace with poor UX D3.js visualization -->
                <text x="300" y="200" text-anchor="middle" font-size="16" fill="#666">
                  Poor UX Visualization Placeholder
                </text>
                <text x="300" y="220" text-anchor="middle" font-size="12" fill="#999">
                  (Interactions will be deliberately poor when implemented)
                </text>
                
                <!-- Sample poor UX elements preview -->
                <line x1="100" y1="300" x2="500" y2="150" stroke="#0891B2" stroke-width="2"/>
                <line x1="100" y1="320" x2="500" y2="200" stroke="#7C3AED" stroke-width="2"/>
                
                <rect x="200" y="100" width="200" height="60" fill="white" stroke="#ccc" stroke-dasharray="2,2"/>
                <text x="300" y="120" text-anchor="middle" font-size="10" fill="red">Forced click popup</text>
                <text x="300" y="135" text-anchor="middle" font-size="10" fill="red">(disappears in 2s)</text>
                <text x="300" y="150" text-anchor="middle" font-size="10" fill="red">Click required for data</text>
              </svg>
            </div>
          </div>
          
          <button class="continue-btn" onclick="this.finishPlaceholder('bad')">
            Continue (Placeholder Mode)
          </button>
        </div>
      `;
      
      display_element.innerHTML = html;
    }

    renderPlaceholder(display_element, trial) {
      display_element.innerHTML = `
        <div class="broken-interactions-container">
          <h2>Broken Interactions Plugin</h2>
          <p>This plugin is in placeholder mode. Condition type: ${trial.condition_type}</p>
          <button onclick="this.finishPlaceholder('unknown')">Continue</button>
        </div>
      `;
    }

    finishPlaceholder(conditionType) {
      const trial_data = {
        condition_type: conditionType,
        implementation_status: 'placeholder',
        note: 'This is a placeholder implementation for broken interaction conditions'
      };
      
      this.jsPsych.finishTrial(trial_data);
    }
  }

  BrokenInteractionsPlugin.info = info;

  return BrokenInteractionsPlugin;
})(typeof jsPsychModule !== 'undefined' ? jsPsychModule : undefined);