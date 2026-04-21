/**
 * Rest Integration for Mana System
 * Handles mana recovery during short and long rests
 */

import { getManaData, gainMana } from "./mana-core.mjs";

/**
 * Initialize rest integration hooks
 */
export function initRestIntegration() {
	// Hook into D&D5e rest completion
	Hooks.on("dnd5e.restCompleted", onRestCompleted);

	// Also hook into specific rest types for immediate feedback
	Hooks.on("dnd5e.shortRest", onShortRest);
	Hooks.on("dnd5e.longRest", onLongRest);

	console.log("Adrasamen | Rest integration initialized");
}

/**
 * Handle short rest for mana recovery
 * @param {Actor} actor - The actor taking a short rest
 * @param {Object} config - Rest configuration data
 */
async function onShortRest(actor, config) {
	console.log("Adrasamen | Short rest detected for", actor.name);
	// The actual recovery will be handled in onRestCompleted
	// This is just for logging/debugging
}

/**
 * Handle long rest for mana recovery
 * @param {Actor} actor - The actor taking a long rest
 * @param {Object} config - Rest configuration data
 */
async function onLongRest(actor, config) {
	console.log("Adrasamen | Long rest detected for", actor.name);
	// The actual recovery will be handled in onRestCompleted
	// This is just for logging/debugging
}

/**
 * Handle rest completion for mana recovery
 * @param {Actor} actor - The actor completing the rest
 * @param {Object} result - Rest result data
 * @param {Object} config - Rest configuration data
 */
async function onRestCompleted(actor, result, config) {
	if (!actor) {
		console.log("Adrasamen | No actor in rest completion");
		return;
	}

	console.log(
		"Adrasamen | Rest completed for",
		actor.name,
		"- Type:",
		config.type,
	);

	const manaData = getManaData(actor);
	console.log("Adrasamen | Current mana data:", manaData);

	if (manaData.max === 0) {
		console.log("Adrasamen | No mana pool configured, skipping recovery");
		return; // No mana pool configured
	}

	let restoredMana = 0;

	// Calculate mana restoration based on rest type
	if (config.type === "long") {
		// Long rest: restore full mana
		restoredMana = manaData.max - manaData.current;
		console.log("Adrasamen | Long rest - restoring", restoredMana, "mana");
	} else if (config.type === "short") {
		// Short rest: use configurable formula
		const manaConfig = actor.getFlag("adrasamen", "mana.config") || {
			manaShortRestFormula: "floor(@maxMana / 2)",
		};

		console.log(
			"Adrasamen | Short rest formula:",
			manaConfig.manaShortRestFormula,
		);

		try {
			// Create roll data context for the formula
			const rollData = actor.getRollData();
			rollData.maxMana = manaData.max;
			rollData.currentMana = manaData.current;

			// Evaluate the short rest formula
			const roll = new Roll(manaConfig.manaShortRestFormula, rollData);
			await roll.evaluate();

			const restorationAmount = Math.floor(roll.total || 0);
			restoredMana = Math.min(
				restorationAmount,
				manaData.max - manaData.current,
			);
			console.log(
				"Adrasamen | Short rest - formula result:",
				restorationAmount,
				"restoring:",
				restoredMana,
			);
		} catch (error) {
			console.warn(
				"Adrasamen | Invalid short rest formula, using default half mana:",
				error,
			);
			// Fallback to half mana if formula is invalid
			const halfMana = Math.floor(manaData.max / 2);
			restoredMana = Math.min(halfMana, manaData.max - manaData.current);
		}
	}

	if (restoredMana > 0) {
		console.log("Adrasamen | Restoring", restoredMana, "mana points");
		await gainMana(actor, restoredMana);

		// Create chat message about mana restoration
		await createManaRestorationMessage(
			actor,
			restoredMana,
			config.type === "long",
		);
	} else {
		console.log("Adrasamen | No mana to restore");
	}
}

/**
 * Create a chat message about mana restoration
 * @param {Actor} actor - The actor who restored mana
 * @param {number} amount - Amount of mana restored
 * @param {boolean} isLongRest - Whether this was a long rest
 */
async function createManaRestorationMessage(actor, amount, isLongRest) {
	const restType = isLongRest ? "ADRASAMEN.LongRest" : "ADRASAMEN.ShortRest";
	const content = game.i18n.format("ADRASAMEN.ManaRestored", {
		name: actor.name,
		amount: amount,
		restType: game.i18n.localize(restType),
	});

	await ChatMessage.create({
		user: game.user.id,
		speaker: ChatMessage.getSpeaker({ actor }),
		content: content,
	});
}
