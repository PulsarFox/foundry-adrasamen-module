/**
 * Public API for Adrasamen Affinity System
 * Exposes clean interface for external modules and macros
 */

import {
	getAffinityData,
	getCharacteristicLinking,
	getAffinityLevel,
	getHighestAffinityLevel,
	getLinkedCharacteristicScore,
	setAffinityLevel,
	setPrimaryAffinity,
	setSecondaryAffinity,
	linkAffinityToCharacteristic,
} from "./affinity-core.mjs";

import { initRollFormulas } from "./roll-formulas.mjs";

/**
 * Initialize the Affinity API
 */
export function initAffinityAPI() {
	// Ensure the API namespace exists
	if (!game.adrasamen) {
		game.adrasamen = {};
	}

	// Export affinity functions to global API
	game.adrasamen.getAffinityData = getAffinityData;
	game.adrasamen.getCharacteristicLinking = getCharacteristicLinking;
	game.adrasamen.getAffinityLevel = getAffinityLevel;
	game.adrasamen.getHighestAffinityLevel = getHighestAffinityLevel;
	game.adrasamen.getLinkedCharacteristicScore = getLinkedCharacteristicScore;
	game.adrasamen.setAffinityLevel = setAffinityLevel;
	game.adrasamen.setPrimaryAffinity = setPrimaryAffinity;
	game.adrasamen.setSecondaryAffinity = setSecondaryAffinity;
	game.adrasamen.linkAffinityToCharacteristic = linkAffinityToCharacteristic;

	// Initialize roll formula support
	initRollFormulas();

	console.log("Adrasamen | Affinity API initialized");
}
