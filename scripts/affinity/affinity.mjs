/**
 * Main Affinity System Module
 * Coordinates initialization of all affinity components
 */

import { initCharacterSheetIntegration } from "./character-sheet.mjs";
import { initAffinityAPI } from "./api.mjs";

/**
 * Initialize the complete affinity system
 */
export function initAffinity() {
	console.log("Adrasamen | Initializing affinity system...");

	// Initialize API first so other components can use it
	initAffinityAPI();

	console.log("Adrasamen | Affinity system initialization complete");
}

/**
 * Initialize components that need the world to be ready
 */
export function initAffinityReady() {
	console.log("Adrasamen | Initializing affinity ready components...");

	// Initialize character sheet integration
	initCharacterSheetIntegration();

	console.log("Adrasamen | Affinity ready components initialized");
}
