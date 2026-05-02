/**
 * Character Sheet Spell Extensions
 * Extends character sheet functionality for Adrasamen spells using D&D5e's column system
 */

import { calculateSpellCosts } from "./cost-calculation.mjs";

/**
 * Initialize character sheet spell extensions
 */
export function initCharacterSheetSpellExtensions() {
    // Register the cost column globally with D&D5e's inventory system
    registerCostColumn();

    // Override the _prepareSpellbook method to include our cost column
    overrideSpellbookPreparation();

    // Hook into character sheet rendering to calculate costs  
    Hooks.on("renderCharacterActorSheet", onRenderCharacterSheet);

    console.log("Adrasamen | Character sheet spell extensions initialized");
}

/**
 * Register the cost column with D&D5e's inventory system
 */
function registerCostColumn() {
    const Inventory = customElements.get("dnd5e-inventory");
    if (Inventory && Inventory.COLUMNS) {
        // Add our cost column to the global column registry
        Inventory.COLUMNS.cost = {
            id: "cost",
            width: 50,
            order: 150, // Between school (100) and time (200)  
            priority: 700,
            label: "ADRASAMEN.Spell.Cost",
            template: "modules/adrasamen/templates/columns/cost.hbs"
        };

        console.log("Adrasamen | Registered cost column with D&D5e inventory system");
    } else {
        console.warn("Adrasamen | Could not access D&D5e inventory system to register cost column");
    }
}

/**
 * Override spellbook preparation to include cost column in default column list
 */
function overrideSpellbookPreparation() {
    // Find the CharacterActorSheet class
    const CharacterSheet = CONFIG.Actor.sheetClasses.character["dnd5e.CharacterActorSheet"]?.cls;
    if (!CharacterSheet) {
        console.warn("Adrasamen | Could not find CharacterActorSheet class to override");
        return;
    }

    console.log("Adrasamen | DIAGNOSTIC: Found CharacterSheet:", CharacterSheet.name);
    console.log("Adrasamen | DIAGNOSTIC: Original _prepareSpellbook exists:", typeof CharacterSheet.prototype._prepareSpellbook);

    // Store the original _prepareSpellbook method
    const originalPrepareSpellbook = CharacterSheet.prototype._prepareSpellbook;

    // Override the method to include our cost column
    CharacterSheet.prototype._prepareSpellbook = function (context) {
        console.log("Adrasamen | DIAGNOSTIC: _prepareSpellbook override called");

        // Check if this actor has Adrasamen spells BEFORE calling original method
        const hasAdrasamenSpells = this.actor.items.some(item =>
            item.type === "spell" && item.system.method === "adrasamen"
        );

        console.log("Adrasamen | DIAGNOSTIC: hasAdrasamenSpells:", hasAdrasamenSpells);

        if (hasAdrasamenSpells) {
            // TEMPORARILY modify the default column list to include cost
            const Inventory = customElements.get(this.options.elements.inventory);
            const originalMapColumns = Inventory.mapColumns;

            Inventory.mapColumns = function (columnIds) {
                // Modify column list for Adrasamen spells: remove school, add cost
                const modifiedIds = [...columnIds];

                // Remove school column
                const schoolIndex = modifiedIds.findIndex(col =>
                    (typeof col === "string" && col === "school") ||
                    (typeof col === "object" && col.id === "school")
                );

                if (schoolIndex !== -1) {
                    // Replace school with cost
                    modifiedIds[schoolIndex] = "cost";
                } else {
                    // Fallback: add cost at beginning
                    modifiedIds.unshift("cost");
                }

                console.log("Adrasamen | Modified column IDs for spellbook:", modifiedIds);
                return originalMapColumns.call(this, modifiedIds);
            };

            // Call the original method with modified mapColumns
            const result = originalPrepareSpellbook.call(this, context);

            // Restore original mapColumns
            Inventory.mapColumns = originalMapColumns;

            // Calculate costs for Adrasamen spells now that spellbook is prepared
            this.actor.items.forEach(item => {
                if (item.type === "spell" && item.system.method === "adrasamen") {
                    const costs = calculateSpellCosts(this.actor, item);

                    // Get current mana using the existing Adrasamen mana API
                    const currentMana = game.adrasamen?.getManaData ?
                        game.adrasamen.getManaData(this.actor).current : 0;

                    // Attach cost data directly to the item for template use
                    item.adrasamenCosts = {
                        totalMana: costs.totalMana,
                        healthCost: costs.healthCost,
                        affordable: costs.totalMana <= currentMana,
                        tooltip: generateCostTooltip(costs)
                    };

                    console.log(`Adrasamen | Calculated costs for ${item.name}: ${costs.totalMana}m${costs.healthCost > 0 ? '+' + costs.healthCost + 'h' : ''}`);
                }
            });

            console.log("Adrasamen | Added cost column to spellbook via mapColumns override");
            return result;
        } else {
            // No Adrasamen spells, use original method unchanged
            return originalPrepareSpellbook.call(this, context);
        }
    };

    console.log("Adrasamen | Overrode spellbook preparation to include cost column");
}

/**
 * Handle character sheet rendering to modify spellbook columns and calculate costs
 * @param {CharacterActorSheet} sheet - The character sheet being rendered
 * @param {jQuery} html - The sheet HTML  
 * @param {Object} context - The sheet context data
 */
async function onRenderCharacterSheet(sheet, html, context) {
    // Cost calculation now happens during spellbook preparation
    // This hook can be used for other rendering tasks if needed in the future
}

/**
 * Generate detailed cost tooltip content
 * @param {Object} costs - Calculated spell costs
 * @returns {string} Tooltip content
 */
function generateCostTooltip(costs) {
    const lines = [];

    // Add base costs if there were reductions
    if (costs.totalReductions > 0) {
        lines.push("Cost Breakdown:");

        // Show individual affinity costs with reductions
        Object.entries(costs.baseCosts).forEach(([affinity, baseCost]) => {
            if (baseCost > 0) {
                const finalCost = costs.finalCosts[affinity];
                const affinityName = affinity.charAt(0).toUpperCase() + affinity.slice(1);

                if (baseCost !== finalCost) {
                    lines.push(`${affinityName}: ${baseCost} → ${finalCost}`);
                } else {
                    lines.push(`${affinityName}: ${finalCost}`);
                }
            }
        });

        lines.push(`Total: ${costs.totalMana} mana`);
    } else {
        lines.push(`Total: ${costs.totalMana} mana`);
    }

    if (costs.healthCost > 0) {
        lines.push(`Health: ${costs.healthCost}`);
    }

    return lines.join('\n');
}