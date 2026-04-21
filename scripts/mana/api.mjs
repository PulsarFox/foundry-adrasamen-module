/**
 * Public API for Adrasamen Mana System
 * Exposes clean interface for external modules and macros
 */

import {
	getManaData,
	setMana,
	spendMana,
	gainMana,
	advanceMaxMana,
	calculateTotalMaxMana,
} from "./mana-core.mjs";

/**
 * Initialize the Adrasamen API
 */
export function initAPI() {
	// Create global API namespace
	if (!game.adrasamen) {
		game.adrasamen = {};
	}

	// Export mana functions
	game.adrasamen.getManaData = getManaData;
	game.adrasamen.setMana = setMana;
	game.adrasamen.spendMana = spendMana;
	game.adrasamen.gainMana = gainMana;
	game.adrasamen.advanceMaxMana = advanceMaxMana;
	game.adrasamen.calculateTotalMaxMana = calculateTotalMaxMana;
	game.adrasamen.spendHealth = spendHealth;
	game.adrasamen.canAffordCosts = canAffordCosts;

	console.log("Adrasamen | Public API initialized");
}

/**
 * Spend health points from an actor (for health-based spell costs in Phase 3)
 * @param {Actor} actor - The actor spending health
 * @param {number} amount - Amount of health to spend
 * @returns {Promise<boolean>} True if health was spent, false if insufficient health
 */
export async function spendHealth(actor, amount) {
	if (!actor || amount < 0) return false;

	const hp = actor.system.attributes.hp;
	if (hp.value < amount) {
		ui.notifications.warn(
			game.i18n.localize("ADRASAMEN.InsufficientHealth"),
		);
		return false;
	}

	const newHP = Math.max(0, hp.value - amount);
	await actor.update({ "system.attributes.hp.value": newHP });

	// Notify about health spending
	ui.notifications.info(
		game.i18n.format("ADRASAMEN.HealthSpent", {
			name: actor.name,
			amount: amount,
		}),
	);

	return true;
}

/**
 * Check if actor can afford both mana and health costs
 * @param {Actor} actor - The actor to check
 * @param {number} manaCost - Required mana cost
 * @param {number} healthCost - Required health cost
 * @returns {Object} Object with canAfford boolean and missing resources
 */
export function canAffordCosts(actor, manaCost = 0, healthCost = 0) {
	if (!actor) return { canAfford: false, missing: ["actor"] };

	const manaData = getManaData(actor);
	const hp = actor.system.attributes.hp;
	const missing = [];

	if (manaCost > 0 && manaData.current < manaCost) {
		missing.push("mana");
	}

	if (healthCost > 0 && hp.value < healthCost) {
		missing.push("health");
	}

	return {
		canAfford: missing.length === 0,
		missing: missing,
	};
}
