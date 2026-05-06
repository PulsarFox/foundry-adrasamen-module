/**
 * Spell Modifier Sync
 * Keeps the flat-to-hit attack bonus on adrasamen spell attack activities
 * in sync with the spellcasting modifier (ability mod + radiant bonus).
 *
 * Triggered when:
 * - A spell's affinity costs are updated (flags.adrasamen.affinityCosts)
 * - A spell's method is set to "adrasamen"
 * - A quadralithe is equipped or unequipped (via custom adrasamen hooks)
 */

import { getSpellcastingModifier } from "./spell-api.mjs";
import { getRadiantAttackBonus } from "./cost-calculation.mjs";

/**
 * Sync the flat-to-hit attack bonus for all adrasamen spells on an actor.
 * For each attack activity, sets attack.flat = true and attack.bonus to the
 * total modifier (spellcasting modifier + radiant bonus).
 * @param {Actor} actor - The actor whose spells should be synced
 */
export async function syncAdrasamenSpellModifiers(actor) {
    if (!actor) return;

    const spells = actor.items.filter(item =>
        item.type === "spell" && item.system?.method === "adrasamen"
    );

    if (spells.length === 0) return;

    // Radiant bonus is the same for all spells on this actor
    const radiantBonus = getRadiantAttackBonus(actor).bonus;

    for (const spell of spells) {
        await _syncSpellAttackBonus(actor, spell, radiantBonus);
    }
}

/**
 * Sync the flat-to-hit attack bonus for a single spell.
 * @param {Actor} actor
 * @param {Item} spell
 * @param {number} radiantBonus
 */
async function _syncSpellAttackBonus(actor, spell, radiantBonus) {
    const attackActivities = spell.system.activities?.getByType?.("attack") ?? [];
    if (attackActivities.length === 0) return;

    const spellcastingMod = getSpellcastingModifier(actor, spell);
    const totalBonus = spellcastingMod + radiantBonus;
    const bonusString = String(totalBonus);

    const updates = {};
    for (const activity of attackActivities) {
        const id = activity._id;
        // Only write if something actually changed to avoid redundant DB writes
        if (activity.attack?.flat !== true || activity.attack?.bonus !== bonusString) {
            updates[`system.activities.${id}.attack.flat`] = true;
            updates[`system.activities.${id}.attack.bonus`] = bonusString;
        }
    }

    if (Object.keys(updates).length > 0) {
        console.log(`Adrasamen | Syncing flat-to-hit for "${spell.name}": flat=true, bonus=${bonusString}`);
        await spell.update(updates);
    }
}

/**
 * Initialize spell modifier sync hooks.
 */
export function initSpellModifierSync() {
    // Trigger sync when a spell's affinity costs are updated or when the
    // method is set to "adrasamen" for the first time.
    Hooks.on("updateItem", async (item, changes) => {
        if (item.type !== "spell" || item.system?.method !== "adrasamen") return;

        const costChanged = changes.flags?.adrasamen?.affinityCosts !== undefined;
        const methodChanged = changes.system?.method === "adrasamen";
        if (!costChanged && !methodChanged) return;

        const actor = item.actor;
        if (!actor) return;

        await syncAdrasamenSpellModifiers(actor);
    });

    // Trigger sync when any quadralithe is equipped (may affect radiant bonus
    // or morphos bonus → affinity levels → which characteristic is used).
    Hooks.on("adrasamen.quadralitheEquipped", async (actor) => {
        await syncAdrasamenSpellModifiers(actor);
    });

    // Trigger sync when any quadralithe is unequipped.
    Hooks.on("adrasamen.quadralitheUnequipped", async (actor) => {
        await syncAdrasamenSpellModifiers(actor);
    });

    console.log("Adrasamen | Spell modifier sync initialized");
}
