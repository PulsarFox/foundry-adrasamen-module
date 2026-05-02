/**
 * Spell Cost Calculation System
 * Handles affinity-based cost reductions and spell cost calculations
 * Integrates with quadralithe effects for Nexus cost reductions and Radiant bonuses
 */

import { AFFINITIES, AFFINITY_CONFIG } from "../affinity/constants.mjs";
import { getAffinityLevel, getHighestAffinityLevel } from "../affinity/affinity-core.mjs";
import { getEquippedQuadralithe, calculateNexusEffects, calculateRadiantEffects } from "../quadralithe/quadralithe-core.mjs";

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
 * Check if character should receive zero affinity penalty
 * Characters with no affinity levels receive a +2 mana cost penalty
 * unless they have a Nexus quadralithe equipped
 * @param {Actor} actor - The actor to check
 * @returns {Object} Penalty info { shouldApply: boolean, penalty: number, reason: string }
 */
function getZeroAffinityPenalty(actor) {
    if (!actor) {
        return { shouldApply: false, penalty: 0, reason: "No actor" };
    }

    // Check if character has any affinity levels
    const highestAffinity = getHighestAffinityLevel(actor);

    if (highestAffinity > 0) {
        return { shouldApply: false, penalty: 0, reason: "Has affinity levels" };
    }

    // Character has no affinity - check if Nexus exempts them
    try {
        const nexusItem = getEquippedQuadralithe(actor, "nexus");
        if (nexusItem) {
            return {
                shouldApply: false,
                penalty: 0,
                reason: "Exempted by Nexus quadralithe"
            };
        }
    } catch (error) {
        console.warn(`Error checking Nexus exemption for zero affinity: ${error.message}`);
    }

    // No exemption - apply penalty
    return {
        shouldApply: true,
        penalty: 2,
        reason: "Zero affinity penalty"
    };
}

/**
 * Get Nexus cost reduction for a spell
 * @param {Actor} actor - The casting actor
 * @returns {Object} Cost reduction info { reduction: number, item: Item|null }
 */
function getNexusCostReduction(actor) {
    if (!actor) {
        return { reduction: 0, item: null };
    }

    try {
        const nexusItem = getEquippedQuadralithe(actor, "nexus");
        if (!nexusItem) {
            return { reduction: 0, item: null };
        }

        const nexusEffects = calculateNexusEffects(actor, nexusItem);
        const costReduction = Math.max(0, nexusEffects.costReduction || 0);

        return {
            reduction: costReduction,
            item: nexusItem
        };
    } catch (error) {
        console.warn(`Error calculating Nexus cost reduction: ${error.message}`);
        return { reduction: 0, item: null };
    }
}

/**
 * Get Radiant attack roll bonus for a spell
 * @param {Actor} actor - The casting actor
 * @returns {Object} Attack bonus info { bonus: number, item: Item|null }
 */
export function getRadiantAttackBonus(actor) {
    if (!actor) {
        return { bonus: 0, item: null };
    }

    try {
        const radiantItem = getEquippedQuadralithe(actor, "radiant");
        if (!radiantItem) {
            return { bonus: 0, item: null };
        }

        const radiantEffects = calculateRadiantEffects(actor, radiantItem);
        const formulaBonus = radiantEffects.formulaBonus || 0;

        return {
            bonus: formulaBonus,
            item: radiantItem
        };
    } catch (error) {
        console.warn(`Error calculating Radiant attack bonus: ${error.message}`);
        return { bonus: 0, item: null };
    }
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
 * Incorporates affinity reductions, Nexus cost reductions, and zero affinity penalties
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
            reductions: [],
            totalReductions: 0,
            nexusReduction: 0,
            zeroAffinityPenalty: 0,
            radiantBonus: 0
        };
    }

    // Get base costs from spell
    const baseCosts = getSpellAffinityCosts(spell);
    let healthCost = getSpellHealthCost(spell);

    // Get available reductions from affinities
    const reductions = getCostReductions(actor);

    // Calculate final costs by applying affinity reductions
    const finalCosts = { ...baseCosts };
    let totalReductions = 0;

    Object.values(AFFINITIES).forEach(affinityId => {
        if (baseCosts[affinityId] > 0) {
            // Find matching reduction from affinities
            const reduction = reductions.find(r => r.type === "affinity" && r.affinityId === affinityId);
            if (reduction) {
                const reductionAmount = Math.min(baseCosts[affinityId], reduction.amount);
                finalCosts[affinityId] = Math.max(0, baseCosts[affinityId] - reductionAmount);
                totalReductions += reductionAmount;
            }
        }
    });

    // Apply Nexus cost reduction (reduces total mana cost)
    const nexusReductionInfo = getNexusCostReduction(actor);
    let totalMana = Object.values(finalCosts).reduce((sum, cost) => sum + cost, 0);
    const nexusReduction = Math.min(totalMana, nexusReductionInfo.reduction);
    totalMana = Math.max(0, totalMana - nexusReduction);

    // Apply zero affinity penalty (adds to total mana cost)
    // Only applies to Adrasamen method spells
    let zeroAffinityPenalty = 0;
    if (spell.system?.method === "adrasamen") {
        const penaltyInfo = getZeroAffinityPenalty(actor);
        if (penaltyInfo.shouldApply) {
            zeroAffinityPenalty = penaltyInfo.penalty;
            totalMana += zeroAffinityPenalty;
            console.log(
                `Adrasamen | Applied zero affinity penalty (+${zeroAffinityPenalty} mana) to ${actor.name} casting ${spell.name}`
            );
        }
    }

    // Get Radiant attack bonus for included in result
    const radiantBonusInfo = getRadiantAttackBonus(actor);
    const radiantBonus = radiantBonusInfo.bonus;

    if (radiantBonus !== 0 && spell.system?.method === "adrasamen") {
        console.log(
            `Adrasamen | Radiant attack bonus (+${radiantBonus}) available for ${actor.name} casting ${spell.name}`
        );
    }

    return {
        baseCosts,
        finalCosts,
        totalMana,
        healthCost,
        reductions,
        totalReductions,
        nexusReduction,
        zeroAffinityPenalty,
        radiantBonus
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