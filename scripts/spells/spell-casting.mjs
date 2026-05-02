/**
 * Spell Casting Integration
 * Handles Adrasamen spell casting hooks and cost deduction
 */

import { calculateSpellCosts } from "./cost-calculation.mjs";

/**
 * Initialize spell casting hooks
 */
export function initSpellCastingHooks() {
    // Hook into pre-activity consumption to add cost information to chat cards
    Hooks.on("dnd5e.preActivityConsumption", onPreActivityConsumption);

    // Hook into post-activity consumption to deduct costs
    Hooks.on("dnd5e.activityConsumption", onActivityConsumption);

    // Hook into message creation to add cost information using dnd5e's template system
    Hooks.on("dnd5e.preCreateUsageMessage", onPreCreateUsageMessage);

    console.log("Adrasamen | Spell casting hooks initialized");
}

/**
 * Handle pre-activity consumption hook for Adrasamen spells
 * @param {Activity} activity - The activity being used
 * @param {ActivityUseConfiguration} usageConfig - Configuration data for the activation
 * @param {ActivityMessageConfiguration} messageConfig - Configuration info for the created chat message
 */
function onPreActivityConsumption(activity, usageConfig, messageConfig) {
    // Early return if messageConfig is not provided (happens for some activity types)
    if (!messageConfig) {

        console.log("Adrasamen | No messageConfig provided for activity consumption - skipping cost calculation");
        return true;
    }

    const item = activity.item;

    // Only process Adrasamen spells
    if (item.type !== "spell" || item.system?.method !== "adrasamen") {
        return true; // Continue normal processing
    }

    const actor = item.actor;
    if (!actor) return true;

    // Calculate spell costs
    const costs = calculateSpellCosts(actor, item);

    // Add cost information to the message data flags for chat card display
    if (!messageConfig.data) messageConfig.data = {};
    if (!messageConfig.data.flags) messageConfig.data.flags = {};
    if (!messageConfig.data.flags.dnd5e) messageConfig.data.flags.dnd5e = {};
    if (!messageConfig.data.flags.dnd5e.use) messageConfig.data.flags.dnd5e.use = {};
    if (!messageConfig.data.flags.dnd5e.use.adrasamen) messageConfig.data.flags.dnd5e.use.adrasamen = {};

    messageConfig.data.flags.dnd5e.use.adrasamen.costs = costs;
    messageConfig.data.flags.dnd5e.use.adrasamen.isAdrasamenSpell = true;

    console.log(`Adrasamen | Pre-casting ${item.name} - costs:`, costs);

    // Never block spell casting - always return true
    return true;
}

/**
 * Handle post-activity consumption hook for Adrasamen spells
 * @param {Activity} activity - The activity that was used
 * @param {ActivityUseConfiguration} usageConfig - Configuration data for the activation
 * @param {ActivityMessageConfiguration} messageConfig - Configuration info for the created chat message
 * @param {ActivityUsageUpdates} updates - Updates to apply to the actor and other documents
 */
async function onActivityConsumption(activity, usageConfig, messageConfig, updates) {
    // Early return if messageConfig is not provided (happens for some activity types)
    if (!messageConfig) {
        return;
    }

    const item = activity.item;

    // Only process Adrasamen spells
    if (item.type !== "spell" || item.system?.method !== "adrasamen") {
        return;
    }

    const actor = item.actor;
    if (!actor) return;

    // Get costs from message data flags (set in preActivityConsumption hook)
    const costs = messageConfig.data?.flags?.dnd5e?.use?.adrasamen?.costs;
    if (!costs) {
        console.warn("Adrasamen | No cost information found for spell:", item.name);
        return;
    }

    console.log(`Adrasamen | Post-casting ${item.name} - deducting costs:`, costs);

    try {
        // Deduct mana cost if any
        if (costs.totalMana > 0) {
            await game.adrasamen.spendMana(actor, costs.totalMana);
        }

        // Deduct health cost if any
        if (costs.healthCost > 0) {
            await game.adrasamen.spendHealth(actor, costs.healthCost);
        }

        console.log(`Adrasamen | Successfully deducted costs for ${item.name}`);
    } catch (error) {
        console.error("Adrasamen | Error deducting spell costs:", error);
        ui.notifications.warn(`Failed to deduct costs for ${item.name}: ${error.message}`);
    }
}

/**
 * Handle pre-usage message creation to add Adrasamen cost information as supplements
 * Uses dnd5e's template system to integrate costs naturally with other spell information
 * @param {Activity} activity - The activity being used
 * @param {ActivityMessageConfiguration} messageConfig - Configuration info for the created message
 */
function onPreCreateUsageMessage(activity, messageConfig) {
    // Only process Adrasamen spells
    if (activity.item.system?.method !== "adrasamen") {
        return;
    }

    // Get costs from message flags (set in preActivityConsumption hook)
    const costs = messageConfig.data?.flags?.dnd5e?.use?.adrasamen?.costs;
    if (!costs) {
        return;
    }

    // Build cost display text in dnd5e supplement format
    const costParts = [];

    if (costs.totalMana > 0) {
        costParts.push(`<span style="color: var(--dnd5e-color-blue);">${costs.totalMana} mana</span>`);
    }

    if (costs.healthCost > 0) {
        costParts.push(`<span style="color: var(--dnd5e-color-red);">${costs.healthCost} health</span>`);
    }

    if (costParts.length === 0) {
        return; // No costs to display
    }

    let costText = costParts.join(' • ');
    if (costs.totalReductions > 0) {
        costText += ` <em>(reduced by ${costs.totalReductions})</em>`;
    }

    const costSupplement = `<strong>Adrasamen Costs:</strong> ${costText}`;

    // Simply append the cost supplement to the content
    // This is much more reliable than trying to parse the HTML structure
    messageConfig.data.content += `<p class="supplement">${costSupplement}</p>`;

    console.log(`Adrasamen | Added cost supplement to ${activity.item.name} chat card`);
}