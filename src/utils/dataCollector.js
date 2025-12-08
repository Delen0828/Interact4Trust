/**
 * Data Collector
 * 
 * Comprehensive data logging utilities for the air quality prediction study
 * Tracks participant responses, interactions, and timing across all 8 conditions
 */

class DataCollector {
  constructor() {
    this.studyData = {
      participant_id: this.generateParticipantId(),
      start_time: performance.now(),
      assigned_condition: null,
      vis_literacy_score: null,
      phase_1_data: {},
      phase_2_data: {},
      demographics: {},
      interaction_log: [],
      session_metadata: {}
    };
  }

  generateParticipantId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4);
    return `P${timestamp}${random}`.toUpperCase();
  }

  setCondition(conditionId, conditionName, displayFormat) {
    this.studyData.assigned_condition = {
      id: conditionId,
      name: conditionName,
      display_format: displayFormat,
      assigned_time: performance.now() - this.studyData.start_time
    };
    
  }

  setVisualizationLiteracyScore(score, totalQuestions, responses) {
    this.studyData.vis_literacy_score = {
      score: score,
      total: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      responses: responses,
      completion_time: performance.now() - this.studyData.start_time
    };
    
  }

  setPhase1Data(data) {
    this.studyData.phase_1_data = {
      ...data,
      phase: 1,
      has_visualization: false,
      completion_time: performance.now() - this.studyData.start_time
    };
    
  }

  setPhase2Data(data) {
    this.studyData.phase_2_data = {
      ...data,
      phase: 2,
      has_visualization: true,
      completion_time: performance.now() - this.studyData.start_time
    };
    
  }

  logInteraction(interactionType, data = {}) {
    const interaction = {
      type: interactionType,
      data: data,
      timestamp: performance.now() - this.studyData.start_time,
      condition_id: this.studyData.assigned_condition?.id || 'unknown'
    };
    
    this.studyData.interaction_log.push(interaction);
    
    // Only log important interactions to avoid spam
    if (['hover_enter', 'hover_leave', 'click', 'broken_interaction'].includes(interactionType)) {
    }
  }

  setDemographics(demographics) {
    this.studyData.demographics = {
      ...demographics,
      completion_time: performance.now() - this.studyData.start_time
    };
    
  }

  addSessionMetadata(key, value) {
    this.studyData.session_metadata[key] = value;
  }

  // Calculate derived metrics
  getPhaseComparison() {
    if (!this.studyData.phase_1_data.probability_estimate || 
        !this.studyData.phase_2_data.probability_estimate) {
      return null;
    }

    const phase1 = this.studyData.phase_1_data;
    const phase2 = this.studyData.phase_2_data;

    return {
      probability_change: phase2.probability_estimate - phase1.probability_estimate,
      confidence_change: phase2.confidence_rating - phase1.confidence_rating,
      decision_consistent: phase1.travel_choice === phase2.travel_choice,
      response_time_difference: phase2.rt - phase1.rt
    };
  }

  getInteractionSummary() {
    const interactions = this.studyData.interaction_log;
    
    return {
      total_interactions: interactions.length,
      hover_events: interactions.filter(i => i.type === 'hover_enter').length,
      click_events: interactions.filter(i => i.type === 'click').length,
      broken_interactions: interactions.filter(i => i.type === 'broken_interaction').length,
      session_duration: interactions.length > 0 ? 
        Math.max(...interactions.map(i => i.timestamp)) : 0
    };
  }

  // Get complete study data for export
  getCompleteData() {
    const completionTime = performance.now() - this.studyData.start_time;
    
    return {
      ...this.studyData,
      study_completion_time: completionTime,
      study_completion_minutes: Math.round(completionTime / 60000 * 100) / 100,
      phase_comparison: this.getPhaseComparison(),
      interaction_summary: this.getInteractionSummary(),
      export_timestamp: new Date().toISOString()
    };
  }

  // Export data as CSV-ready format
  getCSVData() {
    const data = this.getCompleteData();
    const phaseComparison = data.phase_comparison || {};
    const interactionSummary = data.interaction_summary;
    const visLiteracy = data.vis_literacy_score || {};
    const phase1 = data.phase_1_data;
    const phase2 = data.phase_2_data;
    const condition = data.assigned_condition || {};

    return {
      // Participant info
      participant_id: data.participant_id,
      condition_id: condition.id,
      condition_name: condition.name,
      display_format: condition.display_format,
      
      // Visualization literacy
      vis_literacy_score: visLiteracy.score,
      vis_literacy_percentage: visLiteracy.percentage,
      
      // Phase 1 (no visualization)
      phase1_probability: phase1.probability_estimate,
      phase1_confidence: phase1.confidence_rating,
      phase1_travel_choice: phase1.travel_choice,
      phase1_rt: phase1.rt,
      
      // Phase 2 (with visualization)
      phase2_probability: phase2.probability_estimate,
      phase2_confidence: phase2.confidence_rating,
      phase2_travel_choice: phase2.travel_choice,
      phase2_rt: phase2.rt,
      
      // Trust measurements (Phase 2)
      interface_trust: phase2.interface_trust,
      data_trust: phase2.data_trust,
      misleading_rating: phase2.misleading_rating,
      
      // Derived metrics
      probability_change: phaseComparison.probability_change,
      confidence_change: phaseComparison.confidence_change,
      decision_consistent: phaseComparison.decision_consistent,
      rt_difference: phaseComparison.response_time_difference,
      
      // Interaction data
      total_interactions: interactionSummary.total_interactions,
      hover_events: interactionSummary.hover_events,
      click_events: interactionSummary.click_events,
      broken_interactions: interactionSummary.broken_interactions,
      
      // Study metadata
      study_duration_minutes: data.study_completion_minutes,
      export_timestamp: data.export_timestamp
    };
  }

  // Download data as CSV
  downloadCSV() {
    const csvData = this.getCSVData();
    const headers = Object.keys(csvData);
    const values = Object.values(csvData);
    
    const csvContent = [
      headers.join(','),
      values.map(v => typeof v === 'string' ? `"${v}"` : v).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air_quality_study_${csvData.participant_id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
  }

  // Download complete JSON data
  downloadJSON() {
    const data = this.getCompleteData();
    const jsonContent = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `air_quality_study_complete_${data.participant_id}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
  }

  // Reset data for new participant
  reset() {
    this.studyData = {
      participant_id: this.generateParticipantId(),
      start_time: performance.now(),
      assigned_condition: null,
      vis_literacy_score: null,
      phase_1_data: {},
      phase_2_data: {},
      demographics: {},
      interaction_log: [],
      session_metadata: {}
    };
    
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.DataCollector = DataCollector;
}

// For module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataCollector;
}