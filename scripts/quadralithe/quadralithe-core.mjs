/**
 * Core Quadralithe Equipment Management
 * Handles equipment tracking, effect calculation, and actor integration
 */

import { evaluateFormula } from "./formula-evaluator.mjs";
import { AFFINITIES } from "../affinity/constants.mjs";

// Quadralithe types supported by the system
const QUADRALITHE_TYPES = ["morphos", "nexus", "radiant", "drain"];

/**
 * Get equipped quadralithes from actor flags
 * @param {Actor} actor - Actor to get equipment from
 * @returns {Object} Equipped quadralithes by type (UUIDs or null)
 */
export function getEquippedQuadralithes(actor) {
    // Initialize default structure if missing
    const defaults = {
        morphos: null,
        nexus: null,
        radiant: null,
        drain: null
    };

    // Get existing equipped quadralithes or use defaults
    const equipped = actor.getFlag("adrasamen", "equippedQuadralithes") || {};

    // Return merged object with defaults for missing types
    return {
        morphos: equipped.morphos || null,
        nexus: equipped.nexus || null,
        radiant: equipped.radiant || null,
        drain: equipped.drain || null
    };
}

/**
 * Get a specific equipped quadralithe item by type
 * @param {Actor} actor - Actor to get equipment from
 * @param {string} type - Quadralithe type (morphos, nexus, radiant, drain)
 * @returns {Item|null} The equipped quadralithe item or null if not equipped
 */
export function getEquippedQuadralithe(actor, type) {
    if (!QUADRALITHE_TYPES.includes(type)) {
        return null;
    }

    const equipped = getEquippedQuadralithes(actor);
    const uuid = equipped[type];

    if (!uuid) {
        return null;
    }

    // Retrieve item from UUID
    return fromUuidSync(uuid);
}

/**
 * Equip a quadralithe to a specific slot
 * @param {Actor} actor - Actor to equip on
 * @param {Item} item - Quadralithe item to equip
 * @param {string} type - Quadralithe type (morphos, nexus, radiant, drain)
 * @returns {Promise<boolean>} Success status
 */
export async function equipQuadralithe(actor, item, type) {
    // Validate type
    if (!QUADRALITHE_TYPES.includes(type)) {
        console.warn(`Invalid quadralithe type: ${type}`);
        return false;
    }

    // Validate item exists and has quadralithe data
    if (!item || !item.system?.quadralithe) {
        console.warn("Item is missing quadralithe data");
        return false;
    }

    // Validate item type matches requested type
    if (item.system.quadralithe.type !== type) {
        console.warn(`Item quadralithe type (${item.system.quadralithe.type}) does not match requested type (${type})`);
        return false;
    }

    // Check if slot already occupied
    const equipped = getEquippedQuadralithes(actor);
    if (equipped[type] !== null) {
        console.warn(`Quadralithe slot ${type} is already occupied`);
        return false;
    }

    // Store item UUID in the appropriate slot
    try {
        const updateData = {};
        updateData[`flags.adrasamen.equippedQuadralithes.${type}`] = item.uuid;
        await actor.update(updateData);

        // Also set D&D5e equipped property for synchronization
        if (!item.system.equipped) {
            await item.update({ "system.equipped": true }, { skipAdrasamenHooks: true });
        }

        // Fire custom hook
        Hooks.callAll("adrasamen.quadralitheEquipped", actor, item, type);

        return true;
    } catch (error) {
        console.error(`Failed to equip quadralithe: ${error.message}`);
        return false;
    }
}

/**
 * Unequip quadralithe from slot
 * @param {Actor} actor - Actor to unequip from
 * @param {string} type - Quadralithe type to unequip
 * @returns {Promise<boolean>} Success status
 */
export async function unequipQuadralithe(actor, type) {
    // Validate type
    if (!QUADRALITHE_TYPES.includes(type)) {
        console.warn(`Invalid quadralithe type: ${type}`);
        return false;
    }

    try {
        // Get the currently equipped item to unequip it from D&D5e system
        const equipped = getEquippedQuadralithes(actor);
        const itemUuid = equipped[type];
        const item = itemUuid ? fromUuidSync(itemUuid) : null;

        // Set slot to null
        const updateData = {};
        updateData[`flags.adrasamen.equippedQuadralithes.${type}`] = null;
        await actor.update(updateData);

        // Also unset D&D5e equipped property for synchronization
        if (item && item.system.equipped) {
            await item.update({ "system.equipped": false }, { skipAdrasamenHooks: true });
        }

        // Fire custom hook
        Hooks.callAll("adrasamen.quadralitheUnequipped", actor, type);

        return true;
    } catch (error) {
        console.error(`Failed to unequip quadralithe: ${error.message}`);
        return false;
    }
}

/**
 * Calculate Morphos effects (affinity bonuses)
 * @param {Actor} actor - Actor context for formulas
 * @param {Item} morphosItem - Morphos quadralithe item
 * @returns {Object} Calculated effects { affinityBonuses: { fire: 2, earth: 1, ... } }
 */
export function calculateMorphosEffects(actor, morphosItem) {
    const affinityBonuses = {};

    if (!morphosItem || !morphosItem.system?.quadralithe?.effects?.affinityBonus) {
        // Return zero bonuses for all affinities if item is invalid
        for (const affinity of Object.keys(AFFINITIES)) {
            affinityBonuses[affinity] = 0;
        }
        return { affinityBonuses };
    }

    const bonusFormulas = morphosItem.system.quadralithe.effects.affinityBonus || {};

    // Evaluate formula for each affinity
    for (const affinity of Object.keys(AFFINITIES)) {
        const formula = bonusFormulas[affinity] || "0";
        affinityBonuses[affinity] = evaluateFormula(formula, actor);
    }

    return { affinityBonuses };
}

/**
 * Calculate Nexus effects (mana and cost modifications)
 * @param {Actor} actor - Actor context for formulas
 * @param {Item} nexusItem - Nexus quadralithe item
 * @returns {Object} Calculated effects { maxManaBonus: 4, costReduction: -1 }
 */
export function calculateNexusEffects(actor, nexusItem) {
    if (!nexusItem || !nexusItem.system?.quadralithe?.effects) {
        return {
            maxManaBonus: 0,
            costReduction: 0
        };
    }

    const effects = nexusItem.system.quadralithe.effects;

    // Evaluate mana bonuses
    const maxManaBonus = evaluateFormula(effects.maxManaBonus || "0", actor);
    const costReduction = evaluateFormula(effects.costReduction || "0", actor);

    return {
        maxManaBonus,
        costReduction
    };
}

/**
 * Calculate Radiant effects (attack roll bonuses)
 * @param {Actor} actor - Actor context for formulas
 * @param {Item} radiantItem - Radiant quadralithe item
 * @returns {Object} Calculated effects { formulaBonus: 2 }
 */
export function calculateRadiantEffects(actor, radiantItem) {
    if (!radiantItem || !radiantItem.system?.quadralithe?.effects) {
        return {
            formulaBonus: 0
        };
    }

    const effects = radiantItem.system.quadralithe.effects;

    // Evaluate formula bonus
    const formulaBonus = evaluateFormula(effects.formulaBonus || "0", actor);

    return {
        formulaBonus
    };
}

/**
 * Calculate Drain effects (mana generation configuration)
 * @param {Actor} actor - Actor context for formulas
 * @param {Item} drainItem - Drain quadralithe item
 * @returns {Object} Calculated effects { manaGeneration: 1, range: {...}, target: {...} }
 */
export function calculateDrainEffects(actor, drainItem) {
    if (!drainItem || !drainItem.system?.quadralithe?.effects) {
        return {
            manaGeneration: 0,
            range: { value: 0, units: "m", special: "" },
            target: {}
        };
    }

    const effects = drainItem.system.quadralithe.effects;

    // Evaluate mana generation amount
    const manaGeneration = evaluateFormula(effects.manaGeneration || "0", actor);

    // Return targeting info and generation amount
    return {
        manaGeneration,
        range: effects.range || { value: 0, units: "m", special: "" },
        target: effects.target || {}
    };
}

/**
 * Get all currently equipped quadralithe items (resolved from UUIDs)
 * @param {Actor} actor - Actor to get equipment from
 * @returns {Object} Equipped quadralithe items by type
 */
export function getEquippedQuadralitheItems(actor) {
    const equipped = getEquippedQuadralithes(actor);
    const items = {};

    for (const type of QUADRALITHE_TYPES) {
        const uuid = equipped[type];
        items[type] = uuid ? fromUuidSync(uuid) : null;
    }

    return items;
}

/**
 * Calculate all effects from equipped quadralithes
 * @param {Actor} actor - Actor to calculate effects for
 * @returns {Object} Combined effects from all equipped quadralithes
 */
export function calculateAllQuadralitheEffects(actor) {
    const equipped = getEquippedQuadralitheItems(actor);
    const allEffects = {
        morphos: { affinityBonuses: {} },
        nexus: { maxManaBonus: 0, costReduction: 0 },
        radiant: { formulaBonus: 0 },
        drain: { manaGeneration: 0, range: {}, target: {} }
    };

    // Calculate effects from morphos
    if (equipped.morphos) {
        allEffects.morphos = calculateMorphosEffects(actor, equipped.morphos);
    }

    // Calculate effects from nexus
    if (equipped.nexus) {
        allEffects.nexus = calculateNexusEffects(actor, equipped.nexus);
    }

    // Calculate effects from radiant
    if (equipped.radiant) {
        allEffects.radiant = calculateRadiantEffects(actor, equipped.radiant);
    }

    // Calculate effects from drain
    if (equipped.drain) {
        allEffects.drain = calculateDrainEffects(actor, equipped.drain);
    }

    return allEffects;
}
