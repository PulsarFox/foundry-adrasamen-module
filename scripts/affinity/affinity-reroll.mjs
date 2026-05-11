/**
 * Affinity Reroll Spell
 * Handles the "Affinity Shift" spell logic: rolls 1d7 to pick a new secondary affinity.
 */

import { AFFINITIES, AFFINITY_CONFIG } from "./constants.mjs";
import { getAffinityData, setSecondaryAffinity } from "./affinity-core.mjs";

/**
 * The exact spell name that triggers the affinity reroll.
 * The GM must create a spell with this exact name (case-sensitive).
 */
export const AFFINITY_REROLL_SPELL_NAME = "Affinity Shift";

/**
 * Perform the secondary affinity reroll for the given actor.
 * Must be called AFTER mana has been deducted.
 *
 * @param {Actor} actor
 * @returns {Promise<void>}
 */
export async function performAffinityReroll(actor) {
    const affinityData = getAffinityData(actor);

    const primaryAffinity = Object.entries(affinityData).find(([, d]) => d.isPrimary)?.[0];
    const currentSecondary = Object.entries(affinityData).find(([, d]) => d.isSecondary)?.[0];

    // Sorted pool of eligible affinities (excludes primary and current secondary)
    const pool = Object.values(AFFINITIES)
        .sort()
        .filter(a => a !== primaryAffinity && a !== currentSecondary);

    const roll = new Roll(`1d${pool.length}`);
    await roll.evaluate();

    const newAffinity = pool[roll.total - 1];

    const oldLabel = currentSecondary
        ? game.i18n.localize(AFFINITY_CONFIG[currentSecondary]?.label ?? currentSecondary)
        : "";
    const newLabel = game.i18n.localize(AFFINITY_CONFIG[newAffinity]?.label ?? newAffinity);

    // Build icon + bold label for each affinity
    const oldIcon = AFFINITY_CONFIG[currentSecondary]?.icon ?? "fas fa-question";
    const newIcon = AFFINITY_CONFIG[newAffinity]?.icon ?? "fas fa-question";
    const oldFormatted = `<i class="${oldIcon}"></i> <strong>${oldLabel}</strong>`;
    const newFormatted = `<i class="${newIcon}"></i> <strong>${newLabel}</strong>`;

    // Apply the new secondary affinity (fires adrasamen.affinityChanged automatically)
    await setSecondaryAffinity(actor, newAffinity);

    // Post roll message with new affinity in the flavor
    const resultText = game.i18n.format("ADRASAMEN.AffinityReroll.ChatContent", {
        name: `<strong>${actor.name}</strong>`,
        newAffinity: newFormatted,
    });
    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `<strong>${game.i18n.localize("ADRASAMEN.AffinityReroll.ChatFlavor")}</strong><br>${resultText}`,
    });

    console.log(`Adrasamen | Affinity Shift: ${actor.name} ${currentSecondary} → ${newAffinity}`);
}
