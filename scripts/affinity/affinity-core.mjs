/**
 * Core Affinity Data Management
 * Handles affinity storage, retrieval, and calculations
 */

import {
	AFFINITIES,
	getDefaultAffinityData,
	getDefaultCharacteristicLinking,
} from "./constants.mjs";

/**
 * Get affinity data from actor, with defaults if missing
 * @param {Actor} actor - The actor to get affinity data from
 * @returns {Object} Complete affinity data structure
 */
export function getAffinityData(actor) {
	if (!actor) return getDefaultAffinityData();

	const affinityData =
		actor.getFlag("adrasamen", "affinities") || getDefaultAffinityData();

	// Ensure all affinities exist in the data
	Object.values(AFFINITIES).forEach((affinity) => {
		if (!affinityData[affinity]) {
			affinityData[affinity] = {
				manualLevel: 0,
				isPrimary: false,
				isSecondary: false,
			};
		}
	});

	return affinityData;
}

/**
 * Get characteristic linking from actor, with defaults if missing
 * @param {Actor} actor - The actor to get linking data from
 * @returns {Object} Characteristic linking configuration
 */
export function getCharacteristicLinking(actor) {
	if (!actor) return getDefaultCharacteristicLinking();

	return (
		actor.getFlag("adrasamen", "characteristicLinking") ||
		getDefaultCharacteristicLinking()
	);
}

/**
 * Get calculated affinity level (base + manual + equipment bonuses)
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity
 * @returns {number} Final calculated level
 */
export function getAffinityLevel(actor, affinityName) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return 0;

	const affinityData = getAffinityData(actor);
	const affinity = affinityData[affinityName];

	if (!affinity) return 0;

	// Base level: +1 if primary, +1 if secondary, 0 otherwise
	let baseLevel = 0;
	if (affinity.isPrimary) baseLevel += 1;
	if (affinity.isSecondary) baseLevel += 1;

	// Manual level adjustments
	const manualLevel = affinity.manualLevel || 0;

	// Equipment bonuses (Phase 4) - for now return 0
	const equipmentLevel = 0;

	return baseLevel + manualLevel + equipmentLevel;
}

/**
 * Get highest affinity level for max mana calculation
 * @param {Actor} actor - The actor
 * @returns {number} Highest affinity level
 */
export function getHighestAffinityLevel(actor) {
	if (!actor) return 0;

	let highest = 0;
	Object.values(AFFINITIES).forEach((affinity) => {
		const level = getAffinityLevel(actor, affinity);
		if (level > highest) highest = level;
	});

	return highest;
}

/**
 * Get characteristic bonus for linked affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity
 * @returns {number} Ability score modifier for linked characteristic
 */
export function getLinkedCharacteristicScore(actor, affinityName) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return 0;

	const affinityData = getAffinityData(actor);
	const affinity = affinityData[affinityName];
	const linking = getCharacteristicLinking(actor);

	if (!affinity) return 0;

	// Determine which characteristic this affinity is linked to
	let linkedCharacteristic;
	if (affinity.isPrimary) {
		linkedCharacteristic = linking.primary;
	} else if (affinity.isSecondary) {
		linkedCharacteristic = linking.secondary;
	} else {
		linkedCharacteristic = linking.others;
	}

	// Get the ability score modifier
	const abilityScore =
		actor.system.abilities[linkedCharacteristic]?.value || 10;
	return Math.floor((abilityScore - 10) / 2);
}

/**
 * Set manual level for an affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity
 * @param {number} level - Manual level to set
 * @returns {Promise<void>}
 */
export async function setAffinityLevel(actor, affinityName, level) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return;

	const affinityData = getAffinityData(actor);
	const validLevel = Math.max(0, Math.floor(level));

	affinityData[affinityName].manualLevel = validLevel;

	await actor.setFlag("adrasamen", "affinities", affinityData);

	// Fire hook for other systems (like mana max recalculation)
	Hooks.callAll("adrasamen.affinityChanged", actor, affinityName, validLevel);
}

/**
 * Set primary affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity to make primary
 * @returns {Promise<void>}
 */
export async function setPrimaryAffinity(actor, affinityName) {
	if (!actor || !Object.values(AFFINITIES).includes(affinityName)) return;

	console.log(`Adrasamen | Setting primary affinity to: ${affinityName}`);
	const affinityData = getAffinityData(actor);

	// Clear existing primary
	Object.keys(affinityData).forEach((key) => {
		affinityData[key].isPrimary = false;
	});

	// Set new primary
	affinityData[affinityName].isPrimary = true;

	// If this affinity was secondary, clear that
	affinityData[affinityName].isSecondary = false;

	await actor.setFlag("adrasamen", "affinities", affinityData);
	console.log(`Adrasamen | Primary affinity set, data:`, affinityData);
	Hooks.callAll("adrasamen.affinityChanged", actor, affinityName, "primary");
}

/**
 * Set secondary affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity to make secondary
 * @returns {Promise<void>}
 */
export async function setSecondaryAffinity(actor, affinityName) {
	if (!actor || !Object.values(AFFINITIES).includes(affinityName)) return;

	console.log(`Adrasamen | Setting secondary affinity to: ${affinityName}`);
	const affinityData = getAffinityData(actor);

	// Don't allow setting secondary if this affinity is already primary
	if (affinityData[affinityName].isPrimary) {
		console.log(
			`Adrasamen | Cannot set ${affinityName} as secondary - it's already primary`,
		);
		return;
	}

	// Clear existing secondary
	Object.keys(affinityData).forEach((key) => {
		affinityData[key].isSecondary = false;
	});

	// Set new secondary
	affinityData[affinityName].isSecondary = true;

	await actor.setFlag("adrasamen", "affinities", affinityData);
	console.log(`Adrasamen | Secondary affinity set, data:`, affinityData);
	Hooks.callAll(
		"adrasamen.affinityChanged",
		actor,
		affinityName,
		"secondary",
	);
}

/**
 * Set characteristic linking
 * @param {Actor} actor - The actor
 * @param {string} type - "primary", "secondary", or "others"
 * @param {string} characteristic - Characteristic to link to
 * @returns {Promise<void>}
 */
export async function linkAffinityToCharacteristic(
	actor,
	type,
	characteristic,
) {
	if (!actor || !["primary", "secondary", "others"].includes(type)) return;

	const linking = getCharacteristicLinking(actor);
	linking[type] = characteristic;

	await actor.setFlag("adrasamen", "characteristicLinking", linking);
	Hooks.callAll(
		"adrasamen.characteristicLinkingChanged",
		actor,
		type,
		characteristic,
	);
}
