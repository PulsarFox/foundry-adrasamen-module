/**
 * Token Integration for Mana System
 * Adds mana as a configurable token resource
 */

/**
 * Initialize token integration
 */
export function initTokenIntegration() {
	// Add mana to trackable attributes when ready
	addManaToTrackableAttributes();

	// Hook into token data preparation
	Hooks.on("preUpdateToken", onTokenUpdate);

	console.log("Adrasamen | Token integration initialized");
}

/**
 * Add mana to the list of trackable attributes for tokens
 * Called after D&D5e has set up its trackable attributes
 */
function addManaToTrackableAttributes() {
	// Ensure CONFIG.Actor.trackableAttributes exists and is properly structured
	if (!CONFIG.Actor.trackableAttributes) {
		console.warn(
			"Adrasamen | CONFIG.Actor.trackableAttributes not available, skipping mana integration",
		);
		return;
	}

	// Ensure the character trackable attributes exist
	if (!CONFIG.Actor.trackableAttributes.character) {
		console.warn(
			"Adrasamen | CONFIG.Actor.trackableAttributes.character not available",
		);
		return;
	}

	// Ensure the character bar array exists
	if (!CONFIG.Actor.trackableAttributes.character.bar) {
		CONFIG.Actor.trackableAttributes.character.bar = [];
	}

	// Add mana to the character trackable bar attributes if not already present
	const manaAttribute = "flags.adrasamen.mana";
	if (
		!CONFIG.Actor.trackableAttributes.character.bar.includes(manaAttribute)
	) {
		CONFIG.Actor.trackableAttributes.character.bar.push(manaAttribute);
		console.log("Adrasamen | Added mana to trackable attributes");
	}

	// Add display name for the mana attribute
	if (!CONFIG.Actor.trackableAttributeNames) {
		CONFIG.Actor.trackableAttributeNames = {};
	}

	CONFIG.Actor.trackableAttributeNames["flags.adrasamen.mana"] =
		game.i18n?.localize("ADRASAMEN.Mana") ?? "Mana";
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
