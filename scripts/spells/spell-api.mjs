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
import { getAffinityData, getCharacteristicLinking } from "../affinity/affinity-core.mjs";

/**
 * Get the spellcasting modifier for an Adrasamen spell
 * Uses the characteristic linked to the highest-cost affinity
 * @param {Actor} actor - The actor casting the spell
 * @param {Item} spell - The spell being cast
 * @returns {number} The ability modifier for spellcasting
 */
export function getSpellcastingModifier(actor, spell) {
    if (!actor || !spell) return 0;

    // Get spell costs
    const costs = getSpellAffinityCosts(spell);
    if (!costs || Object.keys(costs).length === 0) return 0;

    // Find highest cost
    const maxCost = Math.max(...Object.values(costs));
    if (maxCost === 0) return 0;

    // Get all affinities with max cost
    const maxAffinities = Object.keys(costs).filter(affinity => costs[affinity] === maxCost);
    if (maxAffinities.length === 0) return 0;

    // Priority system: primary > secondary > others
    const affinityData = getAffinityData(actor);
    const linking = getCharacteristicLinking(actor);

    // Find primary affinity with max cost
    let selectedAffinity = maxAffinities.find(affinity =>
        affinityData[affinity]?.isPrimary
    );

    // If no primary, find secondary
    if (!selectedAffinity) {
        selectedAffinity = maxAffinities.find(affinity =>
            affinityData[affinity]?.isSecondary
        );
    }

    // If no primary/secondary, use first available (others)
    if (!selectedAffinity) {
        selectedAffinity = maxAffinities[0];
    }

    // Get linked characteristic based on affinity priority type
    let characteristic;
    if (affinityData[selectedAffinity]?.isPrimary) {
        characteristic = linking.primary;
    } else if (affinityData[selectedAffinity]?.isSecondary) {
        characteristic = linking.secondary;
    } else {
        characteristic = linking.others;
    }

    // Return characteristic modifier
    if (!characteristic) return 0;
    const abilityMod = actor.system.abilities[characteristic]?.mod || 0;

    console.log(`Adrasamen | Spell ${spell.name}: Highest affinity ${selectedAffinity} → ${characteristic} (${abilityMod})`);
    return abilityMod;
}

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

    // Export spellcasting modifier function
    game.adrasamen.getSpellcastingModifier = getSpellcastingModifier;

    console.log("Adrasamen | Spell API initialized");
}