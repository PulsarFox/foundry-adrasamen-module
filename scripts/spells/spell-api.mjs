/**
 * Spell System API
 * Exports spell system functions to game.adrasamen namespace
 */

import {
    getSpellAffinityCosts,
    getSpellHealthCost,
    getCostReductions,
    calculateSpellCosts
} from "./cost-calculation.mjs";
import { AFFINITIES } from "../affinity/constants.mjs";

/**
 * Set affinity costs for a spell
 * @param {Item} spell - The spell item
 * @param {Object} costs - Affinity costs object
 * @returns {Promise<void>}
 */
export async function setSpellAffinityCosts(spell, costs) {
    if (!spell) return;

    // Validate and clean costs
    const validCosts = {};
    Object.values(AFFINITIES).forEach(affinity => {
        if (costs[affinity] !== undefined) {
            validCosts[affinity] = Math.max(0, parseInt(costs[affinity]) || 0);
        }
    });

    await spell.setFlag("adrasamen", "affinityCosts", validCosts);
}

/**
 * Set health cost for a spell
 * @param {Item} spell - The spell item
 * @param {number} cost - Health cost
 * @returns {Promise<void>}
 */
export async function setSpellHealthCost(spell, cost) {
    if (!spell) return;

    const validCost = Math.max(0, parseInt(cost) || 0);
    await spell.setFlag("adrasamen", "healthCost", validCost);
}

/**
 * Initialize spell API
 * Adds spell functions to game.adrasamen namespace
 */
export function initSpellAPI() {
    if (!game.adrasamen) {
        game.adrasamen = {};
    }

    // Export spell cost functions
    game.adrasamen.getSpellAffinityCosts = getSpellAffinityCosts;
    game.adrasamen.setSpellAffinityCosts = setSpellAffinityCosts;
    game.adrasamen.getSpellHealthCost = getSpellHealthCost;
    game.adrasamen.setSpellHealthCost = setSpellHealthCost;
    game.adrasamen.getCostReductions = getCostReductions;
    game.adrasamen.calculateSpellCosts = calculateSpellCosts;

    console.log("Adrasamen | Spell API initialized");
}