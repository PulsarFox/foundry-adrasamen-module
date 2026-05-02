/**
 * Spell Cost Calculation System
 * Handles affinity-based cost reductions and spell cost calculations
 */

import { AFFINITIES, AFFINITY_CONFIG } from "../affinity/constants.mjs";
import { getAffinityLevel } from "../affinity/affinity-core.mjs";

/**
 * Get affinity costs from a spell
 * Retrieves the affinity costs stored in spell flags, with defaults for missing data
 * 
 * @function getSpellAffinityCosts
 * @param {Item} spell - The spell item to get costs from
 * @returns {AffinityCosts} Affinity costs object with all affinities (0 for unset)
 * @example
 * const costs = getSpellAffinityCosts(spell);
 * console.log(costs.fire); // 3
 * console.log(costs.water); // 0 (if not set)
 */
export function getSpellAffinityCosts(spell) {
    if (!spell) return getDefaultAffinityCosts();

    const affinityCosts = spell.getFlag("adrasamen", "affinityCosts");
    if (!affinityCosts) return getDefaultAffinityCosts();

    // Ensure all affinities are present in the costs
    const completeCosts = getDefaultAffinityCosts();
    Object.values(AFFINITIES).forEach(affinity => {
        if (affinityCosts[affinity] !== undefined) {
            completeCosts[affinity] = Math.max(0, parseInt(affinityCosts[affinity]) || 0);
        }
    });

    return completeCosts;
}

/**
 * Get health cost from a spell
 * @param {Item} spell - The spell item
 * @returns {number} Health cost
 */
export function getSpellHealthCost(spell) {
    if (!spell) return 0;

    const healthCost = spell.getFlag("adrasamen", "healthCost");
    return Math.max(0, parseInt(healthCost) || 0);
}

/**
 * Create default affinity costs structure (all zeros)
 * @returns {Object} Default affinity costs
 */
function getDefaultAffinityCosts() {
    const costs = {};
    Object.values(AFFINITIES).forEach(affinity => {
        costs[affinity] = 0;
    });
    return costs;
}

/**
 * Get cost reductions available to an actor
 * @param {Actor} actor - The actor to get reductions for
 * @returns {Array<Object>} Array of cost reduction objects
 */
export function getCostReductions(actor) {
    if (!actor) return [];

    const reductions = [];

    // Add affinity-based reductions
    Object.values(AFFINITIES).forEach(affinityId => {
        const level = getAffinityLevel(actor, affinityId);
        if (level > 0) {
            reductions.push({
                type: "affinity",
                affinityId: affinityId,
                amount: level,
                origin: "level"
            });
        }
    });

    return reductions;
}

/**
 * Calculate final spell costs for an actor and spell
 * @param {Actor} actor - The casting actor
 * @param {Item} spell - The spell being cast
 * @returns {Object} Calculated cost structure
 */
export function calculateSpellCosts(actor, spell) {
    if (!actor || !spell) {
        return {
            baseCosts: getDefaultAffinityCosts(),
            finalCosts: getDefaultAffinityCosts(),
            totalMana: 0,
            healthCost: 0,
            reductions: []
        };
    }

    // Get base costs from spell
    const baseCosts = getSpellAffinityCosts(spell);
    const healthCost = getSpellHealthCost(spell);

    // Get available reductions
    const reductions = getCostReductions(actor);

    // Calculate final costs by applying reductions
    const finalCosts = { ...baseCosts };
    let totalReductions = 0;

    Object.values(AFFINITIES).forEach(affinityId => {
        if (baseCosts[affinityId] > 0) {
            // Find matching reduction
            const reduction = reductions.find(r => r.type === "affinity" && r.affinityId === affinityId);
            if (reduction) {
                const reductionAmount = Math.min(baseCosts[affinityId], reduction.amount);
                finalCosts[affinityId] = Math.max(0, baseCosts[affinityId] - reductionAmount);
                totalReductions += reductionAmount;
            }
        }
    });

    // Calculate total mana cost
    const totalMana = Object.values(finalCosts).reduce((sum, cost) => sum + cost, 0);

    return {
        baseCosts,
        finalCosts,
        totalMana,
        healthCost,
        reductions,
        totalReductions
    };
}

/**
 * Generate affinities section for enhanced tooltip
 * Shows only affinities with cost > 0 in format: 🔥3/🌍2/⚡1
 * @param {Object} baseCosts - Base affinity costs from spell
 * @returns {string} Formatted affinities string
 */
export function generateAffinitiesSection(baseCosts) {
    const affinityItems = [];

    Object.entries(baseCosts).forEach(([affinityId, cost]) => {
        if (cost > 0) {
            const config = AFFINITY_CONFIG[affinityId];
            if (config) {
                affinityItems.push(`<i class="${config.icon}"></i>${cost}`);
            }
        }
    });

    return affinityItems.join('/');
}

/**
 * Generate computed cost section for enhanced tooltip  
 * Shows reductions in format: 🔥Fire: -2 (level), 🔥Fire: -1 (nexus)
 * @param {Object} baseCosts - Base affinity costs from spell
 * @param {Array} reductions - Available reductions
 * @returns {string} Formatted reductions string
 */
export function generateComputedCostSection(baseCosts, reductions) {
    const reductionItems = [];

    Object.values(AFFINITIES).forEach(affinityId => {
        if (baseCosts[affinityId] > 0) {
            // Find all reductions for this affinity
            const affinityReductions = reductions.filter(r => r.affinityId === affinityId);

            affinityReductions.forEach(reduction => {
                const config = AFFINITY_CONFIG[affinityId];
                const affinityName = affinityId.charAt(0).toUpperCase() + affinityId.slice(1);
                const reductionAmount = Math.min(baseCosts[affinityId], reduction.amount);

                if (reductionAmount > 0 && config) {
                    reductionItems.push(
                        `<i class="${config.icon}"></i>${affinityName}: -${reductionAmount} (${reduction.origin})`
                    );
                }
            });
        }
    });

    return reductionItems.join(', ');
}