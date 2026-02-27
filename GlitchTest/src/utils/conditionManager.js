/**
 * Condition Manager
 * 
 * Manages 8 different visualization conditions and their specific behaviors
 */

class ConditionManager {
  constructor() {
    this.conditions = ExperimentConfig.conditions;
  }

  getConditionById(id) {
    return this.conditions.find(c => c.id === id);
  }

  getConditionByIndex(index) {
    return this.conditions[index] || null;
  }

  isValidCondition(conditionId) {
    return this.conditions.some(c => c.id === conditionId);
  }

  getConditionInstructions(conditionId) {
    const condition = this.getConditionById(conditionId);
    return condition ? condition.instructions : 'No instructions available.';
  }

  getDisplayFormat(conditionId) {
    const condition = this.getConditionById(conditionId);
    return condition ? condition.displayFormat : 'unknown';
  }

  isInteractiveCondition(conditionId) {
    const condition = this.getConditionById(conditionId);
    if (!condition) return false;
    
    return condition.displayFormat.includes('hover') || 
           condition.displayFormat.includes('transform');
  }

  isBrokenCondition(conditionId) {
    const condition = this.getConditionById(conditionId);
    return condition && (condition.displayFormat === 'broken_interactions' || 
                        condition.displayFormat === 'poor_interactions');
  }

  getConditionMetadata(conditionId) {
    const condition = this.getConditionById(conditionId);
    if (!condition) return null;
    
    return {
      id: condition.id,
      name: condition.name,
      displayFormat: condition.displayFormat,
      description: condition.description,
      instructions: condition.instructions,
      isInteractive: this.isInteractiveCondition(conditionId),
      isBroken: this.isBrokenCondition(conditionId)
    };
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.ConditionManager = ConditionManager;
}