/**
 * Token Integration for Mana System
 * Adds mana as a configurable token resource
 */

/**
 * Initialize token integration
 */
export function initTokenIntegration() {
	// Add mana to trackable attributes
	addManaToTrackableAttributes();

	// Hook into token data preparation
	Hooks.on("preUpdateToken", onTokenUpdate);

	console.log("Adrasamen | Token integration initialized");
}

/**
 * Add mana to the list of trackable attributes for tokens
 */
function addManaToTrackableAttributes() {
	// Add mana to the trackable attributes configuration
	CONFIG.Actor.trackableAttributes.character.push("flags.adrasamen.mana");

	// Add display name for the mana attribute
	if (!CONFIG.Actor.trackableAttributeNames) {
		CONFIG.Actor.trackableAttributeNames = {};
	}

	CONFIG.Actor.trackableAttributeNames["flags.adrasamen.mana"] =
		game.i18n.localize("ADRASAMEN.Mana");
}

/**
 * Handle token updates to sync mana changes
 * @param {TokenDocument} tokenDoc - The token document being updated
 * @param {Object} updateData - The update data
 * @param {Object} options - Update options
 * @param {string} userId - ID of the user making the update
 */
async function onTokenUpdate(tokenDoc, updateData, options, userId) {
	// Check if mana is being updated through token bar
	const manaPath = "flags.adrasamen.mana.current";

	if (foundry.utils.hasProperty(updateData, manaPath)) {
		const newManaValue = foundry.utils.getProperty(updateData, manaPath);
		const actor = tokenDoc.actor;

		if (actor) {
			// Use our mana system to update (this will handle conditions)
			const { setMana, getManaData } = await import("./mana-core.mjs");
			const currentManaData = getManaData(actor);
			await setMana(actor, newManaValue, currentManaData.max);
		}
	}
}
