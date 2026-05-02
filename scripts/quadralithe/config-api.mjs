/**
 * Quadralithe Configuration API Initialization
 * Exposes configuration helpers through the global Adrasamen API
 */

import * as validation from "./validation.mjs";
import * as templates from "./templates.mjs";
import * as helpers from "./config-helpers.mjs";

/**
 * Initialize the configuration API
 * Exposes all configuration functions through game.adrasamen.quadralithe
 */
export function initQuadralitheConfigAPI() {
    // Ensure game.adrasamen exists
    if (!game.adrasamen) {
        game.adrasamen = {};
    }

    // Create quadralithe namespace if it doesn't exist
    if (!game.adrasamen.quadralithe) {
        game.adrasamen.quadralithe = {};
    }

    // Expose validation functions
    game.adrasamen.quadralithe.validation = {
        validateFormula: validation.validateFormula,
        validateConfig: validation.validateQuadralitheConfig,
        validateItem: validation.validateQuadralitheItem,
        formatReport: validation.formatValidationReport
    };

    // Expose template functions
    game.adrasamen.quadralithe.templates = {
        getDefault: templates.getDefaultConfig,
        getPresets: templates.getPresetConfigurations,
        getPreset: templates.getPreset,
        getPresetNames: templates.getPresetNames,
        getPresetDescriptions: templates.getPresetDescriptions,
        createCustom: templates.createCustomConfig,
        getTypes: templates.getAllTypes,
        getTypeMetadata: templates.getTypeMetadata,
        getFormulaTemplates: templates.getFormulaTemplates,
        exportPresetsJSON: templates.exportPresetsAsJSON
    };

    // Expose helper functions
    game.adrasamen.quadralithe.helpers = {
        applyPreset: helpers.applyPresetToItem,
        exportConfig: helpers.exportConfiguration,
        importConfig: helpers.importConfiguration,
        configureBatch: helpers.configureBatch,
        validateActor: helpers.validateActorQuadralithes,
        getStatus: helpers.getSystemStatus,
        testFormula: helpers.testFormulaEvaluation,
        exportActorConfigs: helpers.exportActorConfigurations,
        importActorConfigs: helpers.importActorConfigurations,
        cloneConfig: helpers.cloneConfiguration,
        getDiagnostics: helpers.getDiagnostics
    };

    // Create convenience shortcut for commonly-used functions
    game.adrasamen.quadralithe.apply = helpers.applyPresetToItem;
    game.adrasamen.quadralithe.validate = validation.validateQuadralitheConfig;
    game.adrasamen.quadralithe.export = helpers.exportConfiguration;
    game.adrasamen.quadralithe.import = helpers.importConfiguration;

    // Add documentation helper
    game.adrasamen.quadralithe.help = function () {
        const help = `
Adrasamen Quadralithe Configuration API
========================================

VALIDATION:
- validateFormula(formula, context, actor) - Validate a single formula
- validateConfig(config, type, actor) - Validate entire configuration  
- validateItem(item) - Validate a quadralithe item
- formatReport(result) - Format validation report for display

TEMPLATES:
- getDefault(type) - Get default configuration for a type
- getPresets() - Get all preset configurations
- getPreset(type, name) - Get specific preset
- getPresetNames(type) - List preset names for type
- getTypeMetadata(type) - Get type information

HELPERS:
- applyPreset(item, presetName, type) - Apply preset to item
- exportConfig(item) - Export item configuration
- importConfig(item, config) - Import configuration to item
- configureBatch(configs) - Configure multiple items
- validateActor(actor) - Validate all items in actor
- getStatus(actor) - Get complete system status
- exportActorConfigs(actor) - Export all actor configurations
- importActorConfigs(actor, data) - Import actor configurations
- cloneConfig(source, target) - Clone config between items
- getDiagnostics(item, actor) - Get diagnostic information

EXAMPLE USAGE:
- game.adrasamen.quadralithe.applyPreset(item, "balanced", "morphos")
- game.adrasamen.quadralithe.getStatus(actor)
- game.adrasamen.quadralithe.templates.getPreset("nexus", "mana_boost_basic")
		`;
        console.log(help);
        return help;
    };

    console.log("Adrasamen | Quadralithe configuration API initialized");
    console.log("Adrasamen | Use game.adrasamen.quadralithe.help() for documentation");
}
