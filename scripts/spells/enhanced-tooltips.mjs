/**
 * Enhanced Tooltips for Adrasamen Spells
 * Extends D&D5e's tooltip system to include Adrasamen-specific cost information
 */

import { calculateSpellCosts, generateAffinitiesSection, generateComputedCostSection } from "./cost-calculation.mjs";

/**
 * Initialize enhanced tooltips for Adrasamen spells
 */
export function initEnhancedTooltips() {
    // Override spell tooltip rendering for Adrasamen spells
    overrideSpellTooltips();

    console.log("Adrasamen | Enhanced tooltips initialized");
}

/**
 * Override spell tooltip rendering to include Adrasamen enhancements
 */
function overrideSpellTooltips() {
    // Find the SpellData class
    const SpellData = CONFIG.Item.dataModels.spell;
    if (!SpellData) {
        console.warn("Adrasamen | Could not find SpellData class for tooltip override");
        return;
    }

    // Store the original richTooltip method
    const originalRichTooltip = SpellData.prototype.richTooltip;

    // Override the richTooltip method
    SpellData.prototype.richTooltip = async function (enrichmentOptions = {}) {
        // For non-Adrasamen spells, use the original method
        if (this.method !== "adrasamen" || !this.parent.actor) {
            return originalRichTooltip.call(this, enrichmentOptions);
        }

        try {
            // Calculate spell costs for Adrasamen spells
            const costs = calculateSpellCosts(this.parent.actor, this.parent);

            // Generate enhanced sections
            const affinitiesSection = generateAffinitiesSection(costs.baseCosts);
            const computedCostSection = generateComputedCostSection(costs.baseCosts, costs.reductions);

            // Get the standard card data
            const cardData = await this.getCardData(enrichmentOptions);

            // Add our Adrasamen data
            cardData.adrasamen = {
                affinities: affinitiesSection,
                computedCost: computedCostSection,
                hasAffinities: affinitiesSection.length > 0,
                hasReductions: computedCostSection.length > 0
            };

            // Use our custom template for Adrasamen spells
            const content = await foundry.applications.handlebars.renderTemplate(
                "modules/adrasamen/templates/adrasamen-tooltip.hbs",
                cardData
            );

            console.log(`Adrasamen | Enhanced tooltip generated for ${this.parent.name}`);

            return {
                content: content,
                classes: ["dnd5e2", "dnd5e-tooltip", "item-tooltip", "themed", "theme-light"]
            };

        } catch (error) {
            console.error("Adrasamen | Error generating enhanced tooltip:", error);
            // Fall back to original method on error
            return originalRichTooltip.call(this, enrichmentOptions);
        }
    };

    console.log("Adrasamen | Overrode spell tooltip rendering for enhanced display");
}