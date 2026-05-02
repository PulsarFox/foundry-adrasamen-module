/**
 * Core Mana Data Management
 * Handles mana storage, retrieval, and manipulation
 */

import { getEquippedQuadralithe, calculateNexusEffects } from "../quadralithe/quadralithe-core.mjs";

/**
 * @import {ManaData} from "../types.mjs";
 */

/**
 * Get mana data from actor, with defaults if missing
 * @param {Actor} actor - The actor to get mana data from
 * @returns {ManaData} Mana data object with current and max properties
 */
export function getManaData(actor) {
	if (!actor) return { current: 0, max: 0, percentage: 0 };

	const manaData = actor.getFlag("adrasamen", "mana") || {
		current: 0,
		max: 0,
	};

	// Ensure we have valid numbers
	manaData.current = Number(manaData.current) || 0;
	manaData.max = Number(manaData.max) || 0;

	// Calculate percentage for UI
	manaData.percentage =
		manaData.max > 0
			? Math.floor((manaData.current / manaData.max) * 100)
			: 0;

	return manaData;
}

/**
 * Set mana values for an actor
 * @param {Actor} actor - The actor to update
 * @param {number} current - Current mana points
 * @param {number} max - Maximum mana points
 * @returns {Promise<void>}
 */
export async function setMana(actor, current, max) {
	if (!actor) return;

	const validatedData = validateMana(current, max);

	const previousMana = getManaData(actor);

	await actor.setFlag("adrasamen", "mana", {
		current: validatedData.current,
		max: validatedData.max,
	});

	// Fire custom event for other systems to react
	if (validatedData.current !== previousMana.current) {
		Hooks.callAll("adrasamen.currentManaChanged", actor, validatedData, previousMana);
	}
}

/**
 * Spend mana points from an actor
 * @param {Actor} actor - The actor spending mana
 * @param {number} amount - Amount of mana to spend
 * @returns {Promise<boolean>} True if mana was spent, false if insufficient mana
 */
export async function spendMana(actor, amount) {
	if (!actor || amount < 0) return false;

	const manaData = getManaData(actor);
	const newCurrent = Math.max(0, manaData.current - amount);

	// Check if we have enough mana
	if (manaData.current < amount) {
		ui.notifications.warn(game.i18n.localize("ADRASAMEN.InsufficientMana"));
		return false;
	}

	await setMana(actor, newCurrent, manaData.max);

	return true;
}

/**
 * Gain mana points for an actor
 * @param {Actor} actor - The actor gaining mana
 * @param {number} amount - Amount of mana to gain
 * @returns {Promise<void>}
 */
export async function gainMana(actor, amount) {
	if (!actor || amount < 0) return;

	const manaData = getManaData(actor);
	const newCurrent = Math.min(manaData.max, manaData.current + amount);

	await setMana(actor, newCurrent, manaData.max);
}

/**
 * Validate mana values to ensure they're valid numbers
 * @param {number} current - Current mana value
 * @param {number} max - Maximum mana value
 * @returns {ManaData} Validated mana data
 */
export function validateMana(current, max) {
	const validCurrent = Math.max(0, Number(current) || 0);
	const validMax = Math.max(0, Number(max) || 0);

	return {
		current: Math.min(validCurrent, validMax), // Current can't exceed max
		max: validMax,
	};
}

/**
 * Handle mana exhaustion (reaching 0 mana)
 * @param {Actor} actor - The exhausted actor
 * @returns {Promise<void>}
 */
async function handleManaExhaustion(actor) {
	// Import conditions module dynamically to avoid circular dependencies
	const { applyManaExhaustionConditions } = await import("./conditions.mjs");
	await applyManaExhaustionConditions(actor);

	// Notify about mana exhaustion
	ui.notifications.warn(
		game.i18n.format("ADRASAMEN.ManaExhausted", { name: actor.name }),
	);
}

/**
 * Handle recovery from mana exhaustion
 * @param {Actor} actor - The recovering actor
 * @returns {Promise<void>}
 */
async function handleManaRecovery(actor) {
	// Import conditions module dynamically to avoid circular dependencies
	const { removeManaExhaustionConditions } = await import("./conditions.mjs");
	await removeManaExhaustionConditions(actor);

	// Notify about recovery
	ui.notifications.info(
		game.i18n.format("ADRASAMEN.ManaRecovered", { name: actor.name }),
	);
}

/**
 * Recalculate maximum mana based on affinity levels and Nexus quadralithe bonuses
 * @param {Actor} actor - The actor to recalculate mana for
 * @returns {Promise<void>}
 */
export async function affinityRecalculateMaxMana(actor) {
	if (!actor) return;

	// Import affinity function dynamically to avoid circular dependencies
	const { getHighestAffinityLevel } =
		await import("../affinity/affinity-core.mjs");
	console.log("Adrasamen | Recalculating max mana for", actor.name);

	const highestAffinityLevel = getHighestAffinityLevel(actor);

	// Get base mana from Nexus quadralithe bonus (or 0 if none equipped)
	const nexusItem = getEquippedQuadralithe(actor, "nexus");
	let nexusBonus = 0;

	if (nexusItem) {
		try {
			const nexusEffects = calculateNexusEffects(actor, nexusItem);
			nexusBonus = nexusEffects.maxManaBonus || 0;
		} catch (error) {
			console.warn(`Adrasamen | Error calculating Nexus effects for ${actor.name}:`, error);
			nexusBonus = 0;
		}
	}

	// Calculate max mana: nexusBonus (base) + highest affinity level
	const calculatedMaxMana = nexusBonus + highestAffinityLevel;

	const currentManaData = getManaData(actor);

	if (calculatedMaxMana > currentManaData.max) {
		await setMana(actor, currentManaData.current, calculatedMaxMana);

		// Notify about the recalculation
		ui.notifications.info(
			game.i18n.format("ADRASAMEN.ManaMaxRecalculated", {
				name: actor.name,
				newMax: calculatedMaxMana,
			}),
		);

		console.log(
			`Adrasamen | Max mana for ${actor.name} recalculated to ${calculatedMaxMana}`,
		);
	}
}

/**
 * Compute mana exhaustion and recovery for an actor
 * @param {Actor} actor - The actor to compute mana exhaustion for
 * @param {ManaData} manaData - The current mana data of the actor
 * @param {ManaData} previousMana - The previous mana data of the actor
 * @returns {Promise<void>}
 */
async function computeManaExhaustion(actor, manaData, previousMana) {
	// Handle mana exhaustion if we hit 0
	if (manaData.current <= 0) {
		await handleManaExhaustion(actor);
	} else if (manaData.current > 0 && previousMana.current <= 0) {
		// Handle recovery if we were previously exhausted
		await handleManaRecovery(actor);
	}
}

/**
 * Initialize mana system hooks for affinity integration
 */
export function initManaHooks() {
	// Listen for affinity changes to recalculate max mana
	Hooks.on(
		"adrasamen.affinityChanged",
		async (actor, affinityName, value) => {
			// Recalculate max mana when any affinity level changes
			await affinityRecalculateMaxMana(actor);
		},
	);

	Hooks.on("adrasamen.currentManaChanged", async (actor, manaData, previousMana) => {
		console.log(
			`Adrasamen | Current mana changed for ${actor.name}: Current ${manaData.current} (Previous Current: ${previousMana.current})`,
		);

		await computeManaExhaustion(actor, manaData, previousMana);
	});

	console.log("Adrasamen | Mana-Affinity integration hooks initialized");
}
