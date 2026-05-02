/**
 * Universal Formula Evaluation System
 * Handles @variable substitution and safe formula evaluation for quadralithe effects
 */

import { AFFINITIES } from "../affinity/constants.mjs";
import { getAffinityLevel } from "../affinity/affinity-core.mjs";

/**
 * Evaluate a formula string with actor context
 * @param {string} formula - Formula to evaluate (e.g., "1", "@str + 1", "@level * 2")
 * @param {Actor} actor - Actor for context variables
 * @param {Object} extraContext - Additional variables (e.g., radiantBaseCost)
 * @returns {number} Evaluated result
 */
export function evaluateFormula(formula, actor, extraContext = {}) {
    // Handle null or undefined formulas
    if (formula === null || formula === undefined || formula === "") {
        return 0;
    }

    // Convert to string and trim
    const formulaStr = String(formula).trim();

    // Try to parse as a simple number
    const numValue = Number(formulaStr);
    if (!isNaN(numValue) && formulaStr === numValue.toString()) {
        return numValue;
    }

    // Get the context for variable substitution
    const context = getFormulaContext(actor, extraContext);

    // Perform @variable substitution
    let processedFormula = substituteVariables(formulaStr, context);

    // Evaluate the processed formula safely
    return evaluateExpression(processedFormula);
}

/**
 * Get all available context variables for an actor
 * @param {Actor} actor - Actor to generate context for
 * @param {Object} extraContext - Additional context variables
 * @returns {Object} Context object with all available variables
 */
function getFormulaContext(actor, extraContext = {}) {
    const context = { ...extraContext };

    // Return early if no actor provided
    if (!actor) {
        return context;
    }

    // Add ability modifiers (str, dex, con, int, wis, cha)
    const abilityNames = ["str", "dex", "con", "int", "wis", "cha"];
    abilityNames.forEach((ability) => {
        const abilityData = actor.system?.abilities?.[ability];
        if (abilityData) {
            // Store the modifier for easy access
            context[ability] = abilityData.mod ?? 0;
        } else {
            context[ability] = 0;
        }
    });

    // Add actor level
    context.level = actor.system?.details?.level ?? 0;

    // Add all affinity levels
    Object.values(AFFINITIES).forEach((affinityName) => {
        context[affinityName] = getAffinityLevel(actor, affinityName) ?? 0;
    });

    return context;
}

/**
 * Perform @variable substitution in a formula
 * @param {string} formula - The formula with @variables
 * @param {Object} context - Context object with available variables
 * @returns {string} Formula with variables replaced by their values
 */
function substituteVariables(formula, context) {
    // Find all @variable patterns
    return formula.replace(/@([a-zA-Z_]\w*)/g, (match, varName) => {
        if (varName in context) {
            return context[varName];
        } else {
            // Variable not found - warn and replace with 0
            console.warn(
                `Adrasamen Formula Evaluator: Unknown variable "${varName}" in formula "${formula}"`
            );
            return 0;
        }
    });
}

/**
 * Validate that expression contains only safe mathematical operations
 * @param {string} expression - Expression to validate
 * @returns {boolean} True if safe to evaluate
 */
function isValidMathExpression(expression) {
    // Only allow numbers, basic math operators, parentheses, and whitespace
    // This prevents code injection by rejecting any non-mathematical content
    const safePattern = /^[\d\s+\-*/.()%]+$/;
    return safePattern.test(expression);
}

/**
 * Safely evaluate a mathematical expression
 * @param {string} expression - The expression to evaluate
 * @returns {number} Result of the evaluation
 */
function evaluateExpression(expression) {
    expression = expression.trim();

    if (!expression) return 0;

    // CRITICAL SECURITY FIX: Validate expression is safe before evaluation
    // This prevents code injection attacks by only allowing mathematical operations
    if (!isValidMathExpression(expression)) {
        console.warn(`Adrasamen | Unsafe formula rejected: ${expression}`);
        return 0;
    }

    try {
        // Now safe to evaluate since we validated input contains only math operations
        const result = eval(expression);
        return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
        console.warn(`Adrasamen | Formula evaluation failed: ${expression}`, error);
        return 0;
    }
}
