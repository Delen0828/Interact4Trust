/**
 * Interaction Controller
 * 
 * Handles hover, click, and broken interaction patterns for different conditions
 */

class InteractionController {
  constructor() {
    this.loggedInteractions = [];
    this.startTime = performance.now();
  }

  logInteraction(type, data = {}) {
    this.loggedInteractions.push({
      type: type,
      data: data,
      timestamp: performance.now() - this.startTime
    });
  }

  getInteractionLog() {
    return this.loggedInteractions;
  }

  resetLog() {
    this.loggedInteractions = [];
    this.startTime = performance.now();
  }

  // Set up standard hover interactions for conditions 4, 5, 6
  setupHoverInteractions(container, targetElements, revealElements, options = {}) {
    const { fadeInDuration = 200, fadeOutDuration = 200, trigger = 'mouseenter' } = options;
    
    targetElements.forEach((target, index) => {
      target.addEventListener('mouseenter', (e) => {
        this.logInteraction('hover_enter', { element: index, x: e.clientX, y: e.clientY });
        
        if (revealElements[index]) {
          d3.select(revealElements[index])
            .transition()
            .duration(fadeInDuration)
            .style('opacity', 1);
        }
      });
      
      target.addEventListener('mouseleave', (e) => {
        this.logInteraction('hover_leave', { element: index });
        
        if (revealElements[index]) {
          d3.select(revealElements[index])
            .transition()
            .duration(fadeOutDuration)
            .style('opacity', 0);
        }
      });
    });
  }

  // Set up broken interactions for condition 7
  setupBrokenInteractions(container) {
    
    // TODO: Implement broken interaction patterns:
    // - Offset hover zones by 50px
    // - Misalign interactive elements
    // - Add unintended draggable behavior
    // - Create wrong hover targets
    
    this.logInteraction('broken_setup', { condition: 7 });
  }

  // Set up poor interactions for condition 8
  setupPoorInteractions(container) {
    
    // TODO: Implement poor UX patterns:
    // - Force clicks instead of hover
    // - Add timed disappearing elements
    // - Create unstable positioning
    // - Add artificial delays
    
    this.logInteraction('poor_setup', { condition: 8 });
  }

  // Create deliberate interaction delays (for condition 8)
  addInteractionDelay(element, callback, delay = 500) {
    element.addEventListener('click', (e) => {
      this.logInteraction('delayed_interaction', { delay: delay });
      
      setTimeout(() => {
        callback(e);
      }, delay);
    });
  }

  // Create unstable element positioning (for condition 8)
  addPositionInstability(elements, interval = 10000, maxOffset = 5) {
    setInterval(() => {
      elements.forEach(element => {
        const offsetX = (Math.random() - 0.5) * 2 * maxOffset;
        const offsetY = (Math.random() - 0.5) * 2 * maxOffset;
        
        d3.select(element)
          .transition()
          .duration(200)
          .style('transform', `translate(${offsetX}px, ${offsetY}px)`);
      });
      
      this.logInteraction('position_instability', { maxOffset: maxOffset });
    }, interval);
  }

  // Create disappearing tooltips (for condition 8)
  createDisappearingTooltip(content, x, y, duration = 2000) {
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'disappearing-tooltip')
      .style('position', 'absolute')
      .style('left', x + 'px')
      .style('top', y + 'px')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('opacity', 0)
      .html(content);
    
    tooltip.transition()
      .duration(200)
      .style('opacity', 1)
      .transition()
      .delay(duration)
      .duration(200)
      .style('opacity', 0)
      .remove();
    
    this.logInteraction('disappearing_tooltip', { duration: duration, content: content });
  }

  // Get interaction statistics
  getInteractionStats() {
    const totalInteractions = this.loggedInteractions.length;
    const interactionTypes = [...new Set(this.loggedInteractions.map(i => i.type))];
    const duration = this.loggedInteractions.length > 0 ? 
      Math.max(...this.loggedInteractions.map(i => i.timestamp)) : 0;
    
    return {
      totalInteractions: totalInteractions,
      interactionTypes: interactionTypes,
      totalDuration: duration,
      interactionsPerSecond: totalInteractions / (duration / 1000)
    };
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.InteractionController = InteractionController;
}