/**
 * Quadralithe Configuration Validation
 * Provides comprehensive validation for quadralithe configurations and formulas
 */

import { evaluateFormula } from "./formula-evaluator.mjs";
import { AFFINITIES } from "../affinity/constants.mjs";

// Quadralithe types
const QUADRALITHE_TYPES = ["morphos", "nexus", "radiant", "drain"];

/**
 * Validate a quadralithe formula string
 * @param {string} formula - Formula to validate
 * @param {string} context - Context for error reporting
 * @param {Actor|null} actor - Optional actor for testing formula with actual values
 * @returns {Object} Validation result { valid: boolean, error?: string, warning?: string }
 */
export function validateFormula(formula, context = "formula", actor = null) {
    // Handle null, undefined, or empty formulas (these are valid defaults)
    if (formula === null || formula === undefined || formula === "") {
        return { valid: true };
    }

    const formulaStr = String(formula).trim();

    // Try to parse as a simple number
    const numValue = Number(formulaStr);
    if (!isNaN(numValue) && formulaStr === numValue.toString()) {
        return { valid: true };
    }

    // Check for valid @variable pattern
    const variablePattern = /@([a-zA-Z_]\w*)/g;
    const variables = [...formulaStr.matchAll(variablePattern)].map(m => m[1]);

    // List of valid variables for context
    const validVariables = [
        "str", "dex", "con", "int", "wis", "cha",  // Ability modifiers
        "level",                                     // Level
        ...Object.values(AFFINITIES),               // Affinity levels
    ];

    // Check for unknown variables
    const unknownVars = variables.filter(v => !validVariables.includes(v));
    if (unknownVars.length > 0) {
        return {
            valid: false,
            error: game.i18n.format("ADRASAMEN.ValidationError.UnknownVariable", {
                context,
                variables: unknownVars.join(", "),
                valid: validVariables.join(", ")
            })
        };
    }

    // Check for dangerous patterns that might indicate code injection
    const dangerousPattern = /[;{}[\]:|`"'\\]/;
    if (dangerousPattern.test(formulaStr)) {
        return {
            valid: false,
            error: game.i18n.format("ADRASAMEN.ValidationError.UnsafeFormula", {
                context,
                formula: formulaStr
            })
        };
    }

    // Validate mathematical expression structure
    const safePattern = /^[\d\s+\-*/.()%@a-zA-Z_]+$/;
    if (!safePattern.test(formulaStr)) {
        return {
            valid: false,
            error: game.i18n.format("ADRASAMEN.ValidationError.InvalidCharacters", {
                context,
                formula: formulaStr
            })
        };
    }

    // Try to evaluate with test actor to catch syntax errors
    if (actor) {
        try {
            const result = evaluateFormula(formulaStr, actor);
            if (typeof result !== 'number' || isNaN(result)) {
                return {
                    valid: false,
                    error: game.i18n.format("ADRASAMEN.ValidationError.EvaluationFailed", {
                        context,
                        formula: formulaStr
                    })
                };
            }

            // Warn if result seems unreasonable (e.g., negative when positive expected)
            if (result < 0 && context.includes("bonus")) {
                return {
                    valid: true,
                    warning: game.i18n.format("ADRASAMEN.ValidationWarning.NegativeBonus", {
                        context,
                        formula: formulaStr,
                        result
                    })
                };
            }

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: game.i18n.format("ADRASAMEN.ValidationError.EvaluationException", {
                    context,
                    formula: formulaStr,
                    error: error.message
                })
            };
        }
    }

    return { valid: true };
}

/**
 * Validate an entire quadralithe configuration
 * @param {Object} config - Quadralithe configuration object
 * @param {string} type - Quadralithe type (morphos, nexus, radiant, drain)
 * @param {Actor|null} actor - Optional actor for testing formulas
 * @returns {Object} Validation result { valid: boolean, errors: Array, warnings: Array }
 */
export function validateQuadralitheConfig(config, type, actor = null) {
    const errors = [];
    const warnings = [];

    // Validate type
    if (!QUADRALITHE_TYPES.includes(type)) {
        errors.push({
            type: "invalid_type",
            field: "type",
            message: game.i18n.format("ADRASAMEN.ValidationError.InvalidType", {
                type,
                valid: QUADRALITHE_TYPES.join(", ")
            })
        });
        return { valid: false, errors, warnings };
    }

    // Validate configuration structure
    if (!config || typeof config !== "object") {
        errors.push({
            type: "invalid_config",
            field: "root",
            message: game.i18n.localize("ADRASAMEN.ValidationError.ConfigNotObject")
        });
        return { valid: false, errors, warnings };
    }

    // Type-specific validation
    switch (type) {
        case "morphos":
            validateMorphosConfig(config, errors, warnings, actor);
            break;
        case "nexus":
            validateNexusConfig(config, errors, warnings, actor);
            break;
        case "radiant":
            validateRadiantConfig(config, errors, warnings, actor);
            break;
        case "drain":
            validateDrainConfig(config, errors, warnings, actor);
            break;
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate morphos configuration
 * @private
 */
function validateMorphosConfig(config, errors, warnings, actor) {
    if (!config.effects) {
        errors.push({
            type: "missing_field",
            field: "effects",
            message: game.i18n.localize("ADRASAMEN.ValidationError.MissingEffects")
        });
        return;
    }

    if (!config.effects.affinityBonus) {
        errors.push({
            type: "missing_field",
            field: "effects.affinityBonus",
            message: game.i18n.localize("ADRASAMEN.ValidationError.MissingAffinityBonus")
        });
        return;
    }

    const affinityBonus = config.effects.affinityBonus;

    // Validate formula for each affinity
    for (const affinity of Object.values(AFFINITIES)) {
        const formula = affinityBonus[affinity];
        if (formula !== undefined && formula !== null && formula !== "") {
            const validation = validateFormula(formula, `effects.affinityBonus.${affinity}`, actor);
            if (!validation.valid) {
                errors.push({
                    type: "formula_error",
                    field: `effects.affinityBonus.${affinity}`,
                    message: validation.error,
                    suggestion: `Use format like '1', '@str + 1', or '@level / 2'`
                });
            }
            if (validation.warning) {
                warnings.push({
                    type: "formula_warning",
                    field: `effects.affinityBonus.${affinity}`,
                    message: validation.warning
                });
            }
        }
    }
}

/**
 * Validate nexus configuration
 * @private
 */
function validateNexusConfig(config, errors, warnings, actor) {
    if (!config.effects) {
        errors.push({
            type: "missing_field",
            field: "effects",
            message: game.i18n.localize("ADRASAMEN.ValidationError.MissingEffects")
        });
        return;
    }

    // Validate maxManaBonus formula
    if (config.effects.maxManaBonus !== undefined && config.effects.maxManaBonus !== null && config.effects.maxManaBonus !== "") {
        const validation = validateFormula(config.effects.maxManaBonus, "effects.maxManaBonus", actor);
        if (!validation.valid) {
            errors.push({
                type: "formula_error",
                field: "effects.maxManaBonus",
                message: validation.error,
                suggestion: `Use format like '4', '@con + 2', or '@level / 3'`
            });
        }
        if (validation.warning) {
            warnings.push({
                type: "formula_warning",
                field: "effects.maxManaBonus",
                message: validation.warning
            });
        }
    }

    // Validate costReduction formula
    if (config.effects.costReduction !== undefined && config.effects.costReduction !== null && config.effects.costReduction !== "") {
        const validation = validateFormula(config.effects.costReduction, "effects.costReduction", actor);
        if (!validation.valid) {
            errors.push({
                type: "formula_error",
                field: "effects.costReduction",
                message: validation.error,
                suggestion: `Use format like '1', '@conMod', or '@level / 4'`
            });
        }
        if (validation.warning) {
            warnings.push({
                type: "formula_warning",
                field: "effects.costReduction",
                message: validation.warning
            });
        }
    }
}

/**
 * Validate radiant configuration
 * @private
 */
function validateRadiantConfig(config, errors, warnings, actor) {
    if (!config.effects) {
        errors.push({
            type: "missing_field",
            field: "effects",
            message: game.i18n.localize("ADRASAMEN.ValidationError.MissingEffects")
        });
        return;
    }

    // Validate formulaBonus formula
    if (config.effects.formulaBonus !== undefined && config.effects.formulaBonus !== null && config.effects.formulaBonus !== "") {
        const validation = validateFormula(config.effects.formulaBonus, "effects.formulaBonus", actor);
        if (!validation.valid) {
            errors.push({
                type: "formula_error",
                field: "effects.formulaBonus",
                message: validation.error,
                suggestion: `Use format like '2', '@int - 1', or '@level / 5'`
            });
        }
        if (validation.warning) {
            warnings.push({
                type: "formula_warning",
                field: "effects.formulaBonus",
                message: validation.warning
            });
        }
    }
}

/**
 * Validate drain configuration
 * @private
 */
function validateDrainConfig(config, errors, warnings, actor) {
    if (!config.effects) {
        errors.push({
            type: "missing_field",
            field: "effects",
            message: game.i18n.localize("ADRASAMEN.ValidationError.MissingEffects")
        });
        return;
    }

    // Validate manaGeneration formula
    if (config.effects.manaGeneration !== undefined && config.effects.manaGeneration !== null && config.effects.manaGeneration !== "") {
        const validation = validateFormula(config.effects.manaGeneration, "effects.manaGeneration", actor);
        if (!validation.valid) {
            errors.push({
                type: "formula_error",
                field: "effects.manaGeneration",
                message: validation.error,
                suggestion: `Use format like '1', '@wis / 2', or '@level - 1'`
            });
        }
        if (validation.warning) {
            warnings.push({
                type: "formula_warning",
                field: "effects.manaGeneration",
                message: validation.warning
            });
        }
    }

    // Validate range configuration if present
    if (config.effects.range) {
        if (typeof config.effects.range.value !== "number" || config.effects.range.value < 0) {
            errors.push({
                type: "invalid_range",
                field: "effects.range.value",
                message: game.i18n.localize("ADRASAMEN.ValidationError.InvalidRangeValue")
            });
        }

        const validUnits = ["ft", "m", "km"];
        if (!validUnits.includes(config.effects.range.units)) {
            errors.push({
                type: "invalid_range_units",
                field: "effects.range.units",
                message: game.i18n.format("ADRASAMEN.ValidationError.InvalidRangeUnits", {
                    valid: validUnits.join(", ")
                })
            });
        }
    }

    // Validate target configuration if present
    if (config.effects.target) {
        const validTargetTypes = ["ally", "enemy", "any"];
        if (config.effects.target.type && !validTargetTypes.includes(config.effects.target.type)) {
            errors.push({
                type: "invalid_target_type",
                field: "effects.target.type",
                message: game.i18n.format("ADRASAMEN.ValidationError.InvalidTargetType", {
                    valid: validTargetTypes.join(", ")
                })
            });
        }

        if (typeof config.effects.target.count === "number" && config.effects.target.count < 1) {
            errors.push({
                type: "invalid_target_count",
                field: "effects.target.count",
                message: game.i18n.localize("ADRASAMEN.ValidationError.InvalidTargetCount")
            });
        }
    }
}

/**
 * Validate an item as a quadralithe
 * @param {Item} item - Item to validate
 * @returns {Object} Validation result
 */
export function validateQuadralitheItem(item) {
    const errors = [];

    if (!item) {
        return {
            valid: false,
            errors: [{ type: "missing_item", message: "Item is null or undefined" }]
        };
    }

    if (!item.system?.quadralithe) {
        return {
            valid: false,
            errors: [{
                type: "missing_quadralithe_data",
                field: "system.quadralithe",
                message: `Item "${item.name}" does not have quadralithe data`
            }]
        };
    }

    const quadData = item.system.quadralithe;

    // Validate type
    if (!QUADRALITHE_TYPES.includes(quadData.type)) {
        errors.push({
            type: "invalid_type",
            field: "system.quadralithe.type",
            message: `Invalid quadralithe type: ${quadData.type}`
        });
    }

    // Get actor if item is equipped
    const actor = item.actor;

    // Validate configuration
    const configValidation = validateQuadralitheConfig(quadData, quadData.type, actor);
    if (!configValidation.valid) {
        errors.push(...configValidation.errors);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings: configValidation.warnings || []
    };
}

/**
 * Get a human-readable validation report
 * @param {Object} validationResult - Result from validateQuadralitheConfig or similar
 * @returns {string} Formatted validation report
 */
export function formatValidationReport(validationResult) {
    let report = `Validation: ${validationResult.valid ? "✓ VALID" : "✗ INVALID"}\n`;

    if (validationResult.errors && validationResult.errors.length > 0) {
        report += `\nErrors (${validationResult.errors.length}):\n`;
        validationResult.errors.forEach((error, index) => {
            report += `  ${index + 1}. [${error.type}] ${error.field || "root"}: ${error.message}\n`;
            if (error.suggestion) {
                report += `     Suggestion: ${error.suggestion}\n`;
            }
        });
    }

    if (validationResult.warnings && validationResult.warnings.length > 0) {
        report += `\nWarnings (${validationResult.warnings.length}):\n`;
        validationResult.warnings.forEach((warning, index) => {
            report += `  ${index + 1}. [${warning.type}] ${warning.field || "root"}: ${warning.message}\n`;
        });
    }

    return report;
}
