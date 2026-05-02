/**
 * @global
 * @typedef {object} ManaData
 * @property {string} current - Current mana points
 * @property {string} max - Maximum mana points
 * @property {string} [percentage] - Percentage of mana remaining (for UI)
 */

/**
 * @global
 * @typedef {object} AffinityCosts
 * @property {number} water - Water affinity cost
 * @property {number} air - Air affinity cost
 * @property {number} earth - Earth affinity cost
 * @property {number} fire - Fire affinity cost
 * @property {number} ice - Ice affinity cost
 * @property {number} light - Light affinity cost
 * @property {number} shadow - Shadow affinity cost
 * @property {number} mind - Mind affinity cost
 * @property {number} arcane - Arcane affinity cost
 */

/**
 * @global
 * @typedef {object} CostReduction
 * @property {string} type - Type of reduction (e.g., "affinity", "equipment")
 * @property {string} affinityId - The affinity providing the reduction
 * @property {number} amount - Amount of reduction provided
 */

/**
 * @global
 * @typedef {object} CalculatedSpellCosts
 * @property {AffinityCosts} baseCosts - Base affinity costs before reductions
 * @property {AffinityCosts} finalCosts - Final affinity costs after reductions
 * @property {number} totalMana - Total mana cost after reductions
 * @property {number} healthCost - Health cost (not affected by reductions)
 * @property {CostReduction[]} reductions - Array of applied reductions
 * @property {number} totalReductions - Total amount of reductions applied
 */

/**
 * @global
 * @typedef {object} SpellSystemAPI
 * @property {function(Item): AffinityCosts} getSpellAffinityCosts - Get affinity costs from spell
 * @property {function(Item, AffinityCosts): Promise<void>} setSpellAffinityCosts - Set spell affinity costs
 * @property {function(Item): number} getSpellHealthCost - Get health cost from spell
 * @property {function(Item, number): Promise<void>} setSpellHealthCost - Set spell health cost
 * @property {function(Actor): CostReduction[]} getCostReductions - Get available cost reductions
 * @property {function(Actor, Item): CalculatedSpellCosts} calculateSpellCosts - Calculate final spell costs
 */

