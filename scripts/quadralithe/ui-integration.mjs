/**
 * Quadralithe UI Integration for Affinity Tab
 * Displays quadralithe equipment status and active effects in the Adrasamen character sheet tab
 */

import {
    getEquippedQuadralitheItems,
    calculateMorphosEffects,
    calculateNexusEffects,
    calculateRadiantEffects,
    calculateDrainEffects,
} from "./quadralithe-core.mjs";
import { AFFINITIES, AFFINITY_CONFIG } from "../affinity/constants.mjs";

/**
 * Prepare quadralithe display data for template rendering
 * @param {Actor} actor - Actor to prepare data for
 * @returns {Object} Formatted data for template rendering
 */
export function prepareQuadralitheDisplayData(actor) {
    const equipped = getEquippedQuadralitheItems(actor);

    const quadralithes = [
        {
            type: "morphos",
            icon: "fas fa-leaf",
            label: "ADRASAMEN.QuadralitheType.Morphos",
        },
        {
            type: "nexus",
            icon: "fas fa-link",
            label: "ADRASAMEN.QuadralitheType.Nexus",
        },
        {
            type: "radiant",
            icon: "fas fa-sun",
            label: "ADRASAMEN.QuadralitheType.Radiant",
        },
        {
            type: "drain",
            icon: "fas fa-droplet",
            label: "ADRASAMEN.QuadralitheType.Drain",
        },
    ];

    const quadralithesData = quadralithes.map((quad) => {
        const item = equipped[quad.type];

        if (!item) {
            return {
                type: quad.type,
                icon: quad.icon,
                label: quad.label,
                equipped: null,
                effects: [],
            };
        }

        // Calculate effects based on type
        let effects = [];
        if (quad.type === "morphos") {
            effects = formatMorphosEffects(actor, item);
        } else if (quad.type === "nexus") {
            effects = formatNexusEffects(actor, item);
        } else if (quad.type === "radiant") {
            effects = formatRadiantEffects(actor, item);
        } else if (quad.type === "drain") {
            effects = formatDrainEffects(actor, item);
        }

        return {
            type: quad.type,
            icon: quad.icon,
            label: quad.label,
            equipped: {
                name: item.name,
                uuid: item.uuid,
            },
            effects: effects,
        };
    });

    return {
        quadralithes: quadralithesData,
    };
}

/**
 * Format morphos effects for display
 * @param {Actor} actor - Actor context
 * @param {Item} item - Morphos item
 * @returns {string[]} Formatted effect strings
 */
function formatMorphosEffects(actor, item) {
    const effects = [];
    const morphosData = calculateMorphosEffects(actor, item);
    const bonuses = morphosData.affinityBonuses;

    // Display only non-zero bonuses
    Object.entries(bonuses).forEach(([affinity, bonus]) => {
        if (bonus > 0) {
            const affinityLabel = game.i18n.localize(
                AFFINITY_CONFIG[affinity]?.label || `ADRASAMEN.Affinity.${affinity}`,
            );
            effects.push(`${affinityLabel} +${bonus}`);
        }
    });

    if (effects.length === 0) {
        effects.push(game.i18n.localize("ADRASAMEN.NoActiveEffects"));
    }

    return effects;
}

/**
 * Format nexus effects for display
 * @param {Actor} actor - Actor context
 * @param {Item} item - Nexus item
 * @returns {string[]} Formatted effect strings
 */
function formatNexusEffects(actor, item) {
    const effects = [];
    const nexusData = calculateNexusEffects(actor, item);

    if (nexusData.maxManaBonus > 0) {
        effects.push(
            `${game.i18n.localize("ADRASAMEN.MaxMana")} +${nexusData.maxManaBonus}`,
        );
    }

    if (nexusData.costReduction !== 0) {
        const costLabel = nexusData.costReduction < 0 ? "-" : "+";
        effects.push(
            `${game.i18n.localize("ADRASAMEN.CostReduction")} ${costLabel}${Math.abs(nexusData.costReduction)}`,
        );
    }

    if (effects.length === 0) {
        effects.push(game.i18n.localize("ADRASAMEN.NoActiveEffects"));
    }

    return effects;
}

/**
 * Format radiant effects for display
 * @param {Actor} actor - Actor context
 * @param {Item} item - Radiant item
 * @returns {string[]} Formatted effect strings
 */
function formatRadiantEffects(actor, item) {
    const effects = [];
    const radiantData = calculateRadiantEffects(actor, item);

    if (radiantData.formulaBonus > 0) {
        effects.push(
            `${game.i18n.localize("ADRASAMEN.FormulaBonus")} +${radiantData.formulaBonus}`,
        );
    }

    if (effects.length === 0) {
        effects.push(game.i18n.localize("ADRASAMEN.NoActiveEffects"));
    }

    return effects;
}

/**
 * Format drain effects for display
 * @param {Actor} actor - Actor context
 * @param {Item} item - Drain item
 * @returns {string[]} Formatted effect strings
 */
function formatDrainEffects(actor, item) {
    const effects = [];
    const drainData = calculateDrainEffects(actor, item);

    if (drainData.manaGeneration > 0) {
        const rangeStr =
            drainData.range.special ||
            `${drainData.range.value}${drainData.range.units}`;
        effects.push(
            `${game.i18n.localize("ADRASAMEN.ManaGeneration")} ${drainData.manaGeneration}, ${game.i18n.localize("ADRASAMEN.Range")} ${rangeStr}`,
        );
    }

    if (effects.length === 0) {
        effects.push(game.i18n.localize("ADRASAMEN.NoActiveEffects"));
    }

    return effects;
}

/**
 * Bind event handlers for quadralithe interactions in affinity tab
 * @param {ActorSheet} sheet - The character sheet
 * @param {HTMLElement} html - The affinity tab HTML content
 */
export function bindQuadralitheEvents(sheet, html) {
    const actor = sheet.actor;

    // Listen for quadralithe equipment changes and refresh display
    Hooks.on("adrasamen.quadralitheEquipped", (affectedActor, item, type) => {
        if (affectedActor.uuid === actor.uuid) {
            // Refresh the quadralithe section in the affinity tab
            refreshQuadralitheInAffinityTab(sheet, html, actor);
        }
    });

    Hooks.on("adrasamen.quadralitheUnequipped", (affectedActor, type) => {
        if (affectedActor.uuid === actor.uuid) {
            // Refresh the quadralithe section in the affinity tab
            refreshQuadralitheInAffinityTab(sheet, html, actor);
        }
    });

    console.log("Adrasamen | Quadralithe events bound to affinity tab");
}

/**
 * Refresh the quadralithe section in the affinity tab
 * @param {ActorSheet} sheet - The character sheet
 * @param {HTMLElement} html - The affinity tab HTML
 * @param {Actor} actor - The actor
 */
async function refreshQuadralitheInAffinityTab(sheet, html, actor) {
    console.log("Adrasamen | Refreshing quadralithe status in affinity tab");

    // Prepare new quadralithe data
    const displayData = await prepareQuadralitheDisplayData(actor);

    // Find the quadralithe section in the affinity tab
    const quadSection = html.querySelector(".quadralithe-equipment");
    if (quadSection) {
        // Re-render just the quadralithe status template
        const statusHTML = await renderTemplate(
            "modules/adrasamen/templates/quadralithe-status.hbs",
            displayData,
        );

        // Replace the content
        quadSection.innerHTML = statusHTML;
        console.log("Adrasamen | Quadralithe section refreshed in affinity tab");
    }
}
