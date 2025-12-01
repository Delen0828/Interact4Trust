/**
 * Base interaction handling for chart visualizations
 * Provides utilities for hover, click, and transition management
 */
export class InteractionManager {
    constructor(svgId) {
        this.svgId = svgId;
        this.svg = d3.select(`#${svgId}`);
        this.timeouts = new Map(); // Track timeouts for cleanup
    }

    /**
     * Get current opacity values from control sliders
     */
    getOpacityValues() {
        // const alternativeOpacity = parseFloat(document.getElementById('alternativeOpacitySlider')?.value || 0.2);
        // const shadeOpacity = parseFloat(document.getElementById('shadeOpacitySlider')?.value || 0.2);
        const alternativeOpacity = 1;
		const shadeOpacity = 0.2;
		return { alternativeOpacity, shadeOpacity };
    }

    /**
     * Create hover zone for a line/area
     */
    createHoverZone(container, data, className, lineGenerator, strokeWidth = 15) {
        return container.append("path")
            .datum(data)
            .attr("class", className)
            .attr("fill", "none")
            .attr("stroke", "transparent")
            .attr("stroke-width", strokeWidth)
            .attr("d", lineGenerator)
            .style("cursor", "pointer");
    }

    /**
     * Create hover zone for an area (confidence bounds)
     */
    createAreaHoverZone(container, data, className, areaGenerator) {
        return container.append("path")
            .datum(data)
            .attr("class", className)
            .attr("fill", "transparent")
            .attr("stroke", "transparent")
            .attr("stroke-width", 5)
            .attr("d", areaGenerator)
            .style("cursor", "pointer");
    }

    /**
     * Standard hover interaction: show/hide on mouse enter/leave
     */
    addHoverInteraction(hoverZone, targetElement, options = {}) {
        const {
            showOpacity = null, // Will use slider value if null
            hideDuration = 200,
            showDuration = 200,
            useAlternativeOpacity = true
        } = options;

        hoverZone
            .on("mouseenter", () => {
                const opacity = showOpacity || (useAlternativeOpacity 
                    ? this.getOpacityValues().alternativeOpacity 
                    : this.getOpacityValues().shadeOpacity);

                if (targetElement.transition) {
                    targetElement.transition()
                        .duration(showDuration)
                        .style("opacity", opacity);
                } else {
                    targetElement.transition()
                        .duration(showDuration)
                        .attr("opacity", opacity);
                }
            })
            .on("mouseleave", () => {
                if (targetElement.transition) {
                    targetElement.transition()
                        .duration(hideDuration)
                        .style("opacity", 0);
                } else {
                    targetElement.transition()
                        .duration(hideDuration)
                        .attr("opacity", 0);
                }
            });
    }

    /**
     * Transformation hover: fade out one element while fading in another
     */
    addTransformationHover(hoverZone, elementToHide, elementToShow, options = {}) {
        const {
            duration = 400,
            useShadeOpacity = true
        } = options;

        hoverZone
            .on("mouseenter", () => {
                const { alternativeOpacity, shadeOpacity } = this.getOpacityValues();
                
                // Fade out first element, fade in second element
                elementToHide.transition()
                    .duration(duration)
                    .attr("opacity", 0);
                
                elementToShow.transition()
                    .duration(duration)
                    .style("opacity", alternativeOpacity);
            })
            .on("mouseleave", () => {
                const { shadeOpacity } = this.getOpacityValues();
                
                // Reverse: fade in first element, fade out second element
                elementToHide.transition()
                    .duration(duration)
                    .attr("opacity", shadeOpacity);
                
                elementToShow.transition()
                    .duration(duration)
                    .style("opacity", 0);
            });
    }

    /**
     * Buggy hover interaction: show wrong target on hover
     */
    addBuggyHover(hoverZoneA, hoverZoneB, targetA, targetB, options = {}) {
        const { duration = 200 } = options;
        const { alternativeOpacity } = this.getOpacityValues();

        // Hover A shows B (BUG!)
        hoverZoneA
            .on("mouseenter", () => {
                targetB.transition()
                    .duration(duration)
                    .style("opacity", alternativeOpacity);
            })
            .on("mouseleave", () => {
                targetB.transition()
                    .duration(duration)
                    .style("opacity", 0);
            });

        // Hover B shows A (BUG!)
        hoverZoneB
            .on("mouseenter", () => {
                targetA.transition()
                    .duration(duration)
                    .style("opacity", alternativeOpacity);
            })
            .on("mouseleave", () => {
                targetA.transition()
                    .duration(duration)
                    .style("opacity", 0);
            });
    }

    /**
     * Click-to-reveal interaction: show one alternative line per click
     */
    addClickToReveal(clickZone, alternativeLines, stock) {
        let currentClickCount = 0;
        const totalAlternatives = alternativeLines.size();
        
        clickZone
            .style("cursor", "pointer")
            .on("click", () => {
                const { alternativeOpacity } = this.getOpacityValues();
                
                // Show one more alternative line each click
                if (currentClickCount < totalAlternatives) {
                    alternativeLines.nodes()[currentClickCount].style.opacity = alternativeOpacity;
                    currentClickCount++;
                } else {
                    // Reset: hide all alternatives and start over
                    alternativeLines.style("opacity", 0);
                    currentClickCount = 0;
                }
            });
    }

    /**
     * Delayed hover interaction with timeout management
     */
    addDelayedHover(hoverZone, targetElement, delay = 3000, stock = 'A') {
        const timeoutKey = `${this.svgId}-${stock}`;
        
        hoverZone
            .on("mouseenter", () => {
                const { alternativeOpacity } = this.getOpacityValues();
                
                // Clear any existing timeout
                if (this.timeouts.has(timeoutKey)) {
                    clearTimeout(this.timeouts.get(timeoutKey));
                }
                
                // Set delay timeout
                const timeout = setTimeout(() => {
                    targetElement.transition()
                        .duration(200)
                        .style("opacity", alternativeOpacity);
                }, delay);
                
                this.timeouts.set(timeoutKey, timeout);
            })
            .on("mouseleave", () => {
                // Clear timeout if mouse leaves before delay completes
                if (this.timeouts.has(timeoutKey)) {
                    clearTimeout(this.timeouts.get(timeoutKey));
                    this.timeouts.delete(timeoutKey);
                }
                
                // Hide element immediately
                targetElement.transition()
                    .duration(200)
                    .style("opacity", 0);
            });
    }

    /**
     * Remove all event handlers from a selection
     */
    removeInteractions(selection) {
        selection
            .on("mouseenter", null)
            .on("mouseleave", null)
            .on("click", null);
    }

    /**
     * Cleanup all timeouts
     */
    cleanup() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();
    }

    /**
     * Get selection by class name within this SVG
     */
    select(className) {
        return this.svg.select(`.${className}`);
    }

    /**
     * Get multiple selections by class name within this SVG
     */
    selectAll(className) {
        return this.svg.selectAll(`.${className}`);
    }
}