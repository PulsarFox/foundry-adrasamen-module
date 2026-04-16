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

	console.log("Adrasamen | Rest integration initialized");
}

/**
 * Handle rest completion for mana recovery
 * @param {Actor} actor - The actor completing the rest
 * @param {Object} restData - Rest completion data
 */
async function onRestCompleted(actor, restData) {
	if (!actor) return;

	const manaData = getManaData(actor);
	if (manaData.max === 0) return; // No mana pool configured

	let restoredMana = 0;

	// Calculate mana restoration based on rest type
	if (restData.longRest) {
		// Long rest: restore full mana
		restoredMana = manaData.max - manaData.current;
	} else if (restData.shortRest) {
		// Short rest: restore half mana (rounded up)
		const halfMana = Math.ceil(manaData.max / 2);
		restoredMana = Math.min(halfMana, manaData.max - manaData.current);
	}

	if (restoredMana > 0) {
		await gainMana(actor, restoredMana);

		// Create chat message about mana restoration
		await createManaRestorationMessage(
			actor,
			restoredMana,
			restData.longRest,
		);
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
		type: CONST.CHAT_MESSAGE_TYPES.OTHER,
	});
}
