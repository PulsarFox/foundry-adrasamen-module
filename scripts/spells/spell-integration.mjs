/**
 * Spell Integration Main Module
 * Coordinates the Adrasamen spell system initialization
 * 
 * This module serves as the main entry point for the Adrasamen spell integration system.
 * It initializes all spell-related subsystems including:
 * - Adrasamen spellcasting method registration
 * - Spell cost calculation API
 * - Spell sheet UI extensions
 * - Character sheet spell display enhancements
 * - Spell casting hooks and cost deduction
 * 
 * @example
 * // Initialize the complete spell system
 * initSpellSystem();
 */

import { registerAdrasamenMethod } from "./adrasamen-method.mjs";
import { initSpellAPI } from "./spell-api.mjs";
import { initSheetExtensions } from "./sheet-extensions.mjs";
import { initCharacterSheetSpellExtensions } from "./character-sheet-spells.mjs";
import { initSpellCastingHooks } from "./spell-casting.mjs";
import { initEnhancedTooltips } from "./enhanced-tooltips.mjs";

/**
 * Initialize the spell system
 * Main entry point for spell integration functionality
 * 
 * Coordinates initialization of all spell system components:
 * 1. Registers "Adrasamen" as a D&D5e spellcasting method
 * 2. Adds spell API functions to game.adrasamen namespace
 * 3. Sets up spell sheet UI injection for affinity costs
 * 4. Enhances character sheet spell display with cost information
 * 5. Hooks into spell casting to deduct mana and health costs
 * 
 * @function initSpellSystem
 * @returns {void}
 */
export function initSpellSystem() {
    console.log("Adrasamen | Initializing spell system...");

    // Register the Adrasamen spellcasting method
    // registerAdrasamenMethod();

    // Initialize spell API
    initSpellAPI();

    // Initialize sheet extensions
    initSheetExtensions();

    // Initialize spell casting hooks
    initSpellCastingHooks();

    // Initialize character sheet spell extensions
    initCharacterSheetSpellExtensions();

    // Initialize enhanced tooltips for Adrasamen spells
    initEnhancedTooltips();
}