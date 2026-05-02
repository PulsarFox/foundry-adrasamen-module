/**
 * Quadralithe Configuration Helpers and Utilities
 * Provides functions for applying, importing, exporting, and managing quadralithe configurations
 */

import { validateQuadralitheConfig, validateQuadralitheItem, formatValidationReport } from "./validation.mjs";
import { getPreset, getDefaultConfig } from "./templates.mjs";
import { getEquippedQuadralitheItems, calculateAllQuadralitheEffects } from "./quadralithe-core.mjs";
import { evaluateFormula } from "./formula-evaluator.mjs";

/**
 * Apply a preset configuration to an item
 * @param {Item} item - Item to configure
 * @param {string} presetName - Name of preset to apply (e.g., "balanced", "strength_focused")
 * @param {string} type - Quadralithe type of the preset
 * @returns {Promise<boolean>} Success status
 */
export async function applyPresetToItem(item, presetName, type) {
    // Validate inputs
    if (!item || !item.system) {
        console.warn("Adrasamen | applyPresetToItem: Invalid item provided");
        return false;
    }

    // Get the preset
    const preset = getPreset(type, presetName);
    if (!preset) {
        const message = game.i18n.format("ADRASAMEN.Error.PresetNotFound", {
            preset: presetName,
            type
        });
        console.warn(`Adrasamen | ${message}`);
        ui.notifications.warn(message);
        return false;
    }

    // Validate the preset
    const validation = validateQuadralitheConfig(preset, type, item.actor);
    if (!validation.valid) {
        const message = game.i18n.localize("ADRASAMEN.Error.PresetValidationFailed");
        console.warn(`Adrasamen | ${message}:`, formatValidationReport(validation));
        ui.notifications.error(message);
        return false;
    }

    try {
        // Apply the preset configuration to the item
        await item.update({
            "system.quadralithe": preset
        });

        const successMessage = game.i18n.format("ADRASAMEN.Success.PresetApplied", {
            item: item.name,
            preset: presetName
        });
        ui.notifications.info(successMessage);
        console.log(`Adrasamen | Preset "${presetName}" applied to "${item.name}"`);

        // Fire hook for preset application
        Hooks.callAll("adrasamen.presetApplied", item, presetName, type);

        return true;
    } catch (error) {
        const errorMessage = game.i18n.format("ADRASAMEN.Error.PresetApplicationFailed", {
            error: error.message
        });
        console.error(`Adrasamen | ${errorMessage}:`, error);
        ui.notifications.error(errorMessage);
        return false;
    }
}

/**
 * Export quadralithe configuration from an item
 * @param {Item} item - Item to export configuration from
 * @returns {Object} Exportable configuration object
 */
export function exportConfiguration(item) {
    if (!item || !item.system?.quadralithe) {
        console.warn("Adrasamen | exportConfiguration: Invalid item provided");
        return null;
    }

    const config = item.system.quadralithe;

    return {
        version: 1,
        exportDate: new Date().toISOString(),
        itemName: item.name,
        itemId: item.id,
        type: config.type,
        effects: JSON.parse(JSON.stringify(config.effects)), // Deep copy
        metadata: {
            description: `Exported from ${item.name}`,
            system: game.system.id,
            foundryVersion: game.version
        }
    };
}

/**
 * Import quadralithe configuration to an item
 * @param {Item} item - Item to configure
 * @param {Object} config - Configuration to import (can be a preset or export data)
 * @returns {Promise<boolean>} Success status
 */
export async function importConfiguration(item, config) {
    if (!item || !item.system) {
        console.warn("Adrasamen | importConfiguration: Invalid item provided");
        return false;
    }

    if (!config || typeof config !== "object") {
        console.warn("Adrasamen | importConfiguration: Invalid configuration provided");
        return false;
    }

    // Extract configuration type
    const type = config.type;
    if (!type) {
        const errorMessage = game.i18n.localize("ADRASAMEN.Error.MissingConfigType");
        console.warn(`Adrasamen | ${errorMessage}`);
        ui.notifications.warn(errorMessage);
        return false;
    }

    // Validate the configuration
    const validation = validateQuadralitheConfig(config, type, item.actor);
    if (!validation.valid) {
        const report = formatValidationReport(validation);
        console.warn(`Adrasamen | Configuration validation failed:\n${report}`);
        ui.notifications.error(game.i18n.localize("ADRASAMEN.Error.ConfigValidationFailed"));
        return false;
    }

    try {
        // Update item with imported configuration
        await item.update({
            "system.quadralithe": {
                type: config.type,
                effects: config.effects
            }
        });

        const message = game.i18n.format("ADRASAMEN.Success.ConfigImported", {
            item: item.name
        });
        ui.notifications.info(message);
        console.log(`Adrasamen | Configuration imported to "${item.name}"`);

        // Fire hook for configuration import
        Hooks.callAll("adrasamen.configImported", item, config);

        return true;
    } catch (error) {
        const errorMessage = game.i18n.format("ADRASAMEN.Error.ConfigImportFailed", {
            error: error.message
        });
        console.error(`Adrasamen | ${errorMessage}:`, error);
        ui.notifications.error(errorMessage);
        return false;
    }
}

/**
 * Configure multiple items with different presets
 * @param {Array} itemConfigs - Array of { item, preset, type } objects
 * @returns {Promise<Object>} Results with success/failure counts and details
 */
export async function configureBatch(itemConfigs) {
    const results = {
        total: itemConfigs.length,
        successful: 0,
        failed: 0,
        details: []
    };

    if (!itemConfigs || !Array.isArray(itemConfigs)) {
        console.warn("Adrasamen | configureBatch: Invalid input");
        return results;
    }

    // Process each item configuration
    for (const config of itemConfigs) {
        const { item, preset, type } = config;

        if (!item) {
            results.failed++;
            results.details.push({
                success: false,
                reason: "No item provided"
            });
            continue;
        }

        const success = await applyPresetToItem(item, preset, type);
        if (success) {
            results.successful++;
            results.details.push({
                item: item.name,
                success: true,
                preset
            });
        } else {
            results.failed++;
            results.details.push({
                item: item.name,
                success: false,
                preset
            });
        }
    }

    // Report summary
    const summary = game.i18n.format("ADRASAMEN.BatchOperation.Summary", {
        total: results.total,
        successful: results.successful,
        failed: results.failed
    });
    console.log(`Adrasamen | ${summary}`);

    return results;
}

/**
 * Validate all quadralithe items in an actor's inventory
 * @param {Actor} actor - Actor to validate items for
 * @returns {Object} Validation report
 */
export function validateActorQuadralithes(actor) {
    const report = {
        actor: actor.name,
        totalItems: 0,
        validItems: 0,
        invalidItems: 0,
        itemReports: [],
        summary: {
            errors: [],
            warnings: []
        }
    };

    if (!actor || !actor.items) {
        report.summary.errors.push("Invalid actor provided");
        return report;
    }

    // Find all quadralithe items
    const quadralithes = actor.items.filter(item => item.system?.quadralithe);
    report.totalItems = quadralithes.length;

    // Validate each item
    for (const item of quadralithes) {
        const validation = validateQuadralitheItem(item);
        const itemReport = {
            item: item.name,
            type: item.system.quadralithe.type,
            valid: validation.valid,
            errors: validation.errors || [],
            warnings: validation.warnings || []
        };

        report.itemReports.push(itemReport);

        if (validation.valid) {
            report.validItems++;
        } else {
            report.invalidItems++;
            report.summary.errors.push(...validation.errors);
        }

        if (validation.warnings) {
            report.summary.warnings.push(...validation.warnings);
        }
    }

    return report;
}

/**
 * Get comprehensive quadralithe system status for an actor
 * @param {Actor} actor - Actor to analyze
 * @returns {Object} Complete system status
 */
export function getSystemStatus(actor) {
    if (!actor) {
        return {
            valid: false,
            error: "Invalid actor provided"
        };
    }

    const equipped = getEquippedQuadralitheItems(actor);
    const effects = calculateAllQuadralitheEffects(actor);
    const validation = validateActorQuadralithes(actor);

    return {
        actor: actor.name,
        equipped: {
            morphos: equipped.morphos ? equipped.morphos.name : null,
            nexus: equipped.nexus ? equipped.nexus.name : null,
            radiant: equipped.radiant ? equipped.radiant.name : null,
            drain: equipped.drain ? equipped.drain.name : null
        },
        calculated: effects,
        validation: {
            totalQuadralithes: validation.totalItems,
            validItems: validation.validItems,
            invalidItems: validation.invalidItems,
            hasErrors: validation.invalidItems > 0,
            hasWarnings: validation.summary.warnings.length > 0
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Test formula evaluation with different actor contexts
 * @param {string} formula - Formula to test
 * @param {Array} testActors - Actors to test with
 * @returns {Object} Test results
 */
export function testFormulaEvaluation(formula, testActors) {
    const results = {
        formula,
        tests: []
    };

    if (!Array.isArray(testActors)) {
        testActors = [testActors];
    }

    for (const actor of testActors) {
        if (!actor) continue;

        try {
            const result = evaluateFormula(formula, actor);
            results.tests.push({
                actor: actor.name,
                result,
                success: true
            });
        } catch (error) {
            results.tests.push({
                actor: actor.name,
                error: error.message,
                success: false
            });
        }
    }

    return results;
}

/**
 * Export all quadralithe configurations from an actor
 * @param {Actor} actor - Actor to export from
 * @returns {Object} Export data
 */
export function exportActorConfigurations(actor) {
    const exportData = {
        version: 1,
        exportDate: new Date().toISOString(),
        actor: {
            name: actor.name,
            id: actor.id
        },
        items: [],
        metadata: {
            system: game.system.id,
            foundryVersion: game.version
        }
    };

    // Find and export all quadralithe items
    const quadralithes = actor.items.filter(item => item.system?.quadralithe);

    for (const item of quadralithes) {
        const itemConfig = exportConfiguration(item);
        if (itemConfig) {
            exportData.items.push(itemConfig);
        }
    }

    return exportData;
}

/**
 * Import quadralithe configurations to an actor
 * Looks for existing items by name and updates them, or creates new items if needed
 * @param {Actor} actor - Actor to import to
 * @param {Object} exportData - Configuration data from exportActorConfigurations
 * @returns {Promise<Object>} Import results
 */
export async function importActorConfigurations(actor, exportData) {
    const results = {
        actor: actor.name,
        total: 0,
        successful: 0,
        failed: 0,
        created: 0,
        updated: 0,
        details: []
    };

    if (!exportData || !exportData.items) {
        console.warn("Adrasamen | importActorConfigurations: Invalid export data");
        return results;
    }

    results.total = exportData.items.length;

    // Process each exported configuration
    for (const itemData of exportData.items) {
        try {
            // Try to find existing item by name
            let item = actor.items.find(i => i.name === itemData.itemName);

            if (item) {
                // Update existing item
                const success = await importConfiguration(item, itemData);
                if (success) {
                    results.successful++;
                    results.updated++;
                    results.details.push({
                        itemName: itemData.itemName,
                        action: "updated",
                        success: true
                    });
                } else {
                    results.failed++;
                    results.details.push({
                        itemName: itemData.itemName,
                        action: "update",
                        success: false,
                        reason: "Import failed"
                    });
                }
            } else {
                // Create new item
                const newItemData = {
                    name: itemData.itemName || "Quadralithe",
                    type: "loot",
                    system: {
                        quadralithe: {
                            type: itemData.type,
                            effects: itemData.effects
                        }
                    }
                };

                const createdItem = await actor.createEmbeddedDocuments("Item", [newItemData]);
                if (createdItem && createdItem.length > 0) {
                    results.successful++;
                    results.created++;
                    results.details.push({
                        itemName: itemData.itemName,
                        action: "created",
                        success: true
                    });
                } else {
                    results.failed++;
                    results.details.push({
                        itemName: itemData.itemName,
                        action: "create",
                        success: false,
                        reason: "Failed to create item"
                    });
                }
            }
        } catch (error) {
            results.failed++;
            results.details.push({
                itemName: itemData.itemName,
                action: "import",
                success: false,
                reason: error.message
            });
        }
    }

    // Report summary
    const summary = game.i18n.format("ADRASAMEN.BatchOperation.ImportSummary", {
        total: results.total,
        successful: results.successful,
        created: results.created,
        updated: results.updated,
        failed: results.failed
    });
    console.log(`Adrasamen | ${summary}`);

    return results;
}

/**
 * Clone a quadralithe configuration from one item to another
 * @param {Item} sourceItem - Item to copy from
 * @param {Item} targetItem - Item to copy to
 * @returns {Promise<boolean>} Success status
 */
export async function cloneConfiguration(sourceItem, targetItem) {
    if (!sourceItem || !sourceItem.system?.quadralithe) {
        console.warn("Adrasamen | cloneConfiguration: Source item is not a quadralithe");
        return false;
    }

    if (!targetItem || !targetItem.system) {
        console.warn("Adrasamen | cloneConfiguration: Invalid target item");
        return false;
    }

    // Export from source and import to target
    const config = exportConfiguration(sourceItem);
    return await importConfiguration(targetItem, config);
}

/**
 * Get diagnostic information about quadralithe calculations
 * @param {Item} item - Item to diagnose
 * @param {Actor} actor - Actor context for calculations
 * @returns {Object} Diagnostic information
 */
export function getDiagnostics(item, actor) {
    const diagnostics = {
        item: item?.name || "Unknown",
        actor: actor?.name || "Unknown",
        valid: false,
        details: []
    };

    if (!item || !item.system?.quadralithe) {
        diagnostics.details.push("Item is not a quadralithe or is missing quadralithe data");
        return diagnostics;
    }

    if (!actor) {
        diagnostics.details.push("No actor context provided for formula evaluation");
    }

    const quad = item.system.quadralithe;
    diagnostics.type = quad.type;
    diagnostics.valid = true;

    // Add type-specific diagnostic info
    switch (quad.type) {
        case "morphos":
            if (quad.effects?.affinityBonus) {
                diagnostics.details.push(`Affinity bonuses configured: ${Object.keys(quad.effects.affinityBonus).length}`);
            }
            break;
        case "nexus":
            diagnostics.details.push(`Max Mana Bonus Formula: ${quad.effects?.maxManaBonus || "not set"}`);
            diagnostics.details.push(`Cost Reduction Formula: ${quad.effects?.costReduction || "not set"}`);
            break;
        case "radiant":
            diagnostics.details.push(`Formula Bonus: ${quad.effects?.formulaBonus || "not set"}`);
            break;
        case "drain":
            diagnostics.details.push(`Mana Generation: ${quad.effects?.manaGeneration || "not set"}`);
            diagnostics.details.push(`Range: ${quad.effects?.range?.value || 0} ${quad.effects?.range?.units || "m"}`);
            break;
    }

    return diagnostics;
}
