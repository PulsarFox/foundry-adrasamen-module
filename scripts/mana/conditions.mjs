/**
 * Mana-related Condition Management
 * Handles "Vulnerable Soul" and mana exhaustion effects
 */

/**
 * Create the "Vulnerable Soul" active effect
 * @returns {Object} Active effect data for Vulnerable Soul
 */
export function createVulnerableSoulEffect() {
	return {
		name: game.i18n.localize("ADRASAMEN.VulnerableSoul"),
		icon: "icons/svg/aura.svg", // Using default FoundryVTT icon for now
		origin: "Adrasamen.ManaExhaustion",
		duration: {},
		disabled: false,
		flags: {
			adrasamen: {
				type: "vulnerableSoul",
				source: "manaExhaustion",
			},
		},
		changes: [],
		description: game.i18n.localize("ADRASAMEN.VulnerableSoulDescription"),
	};
}

/**
 * Apply mana exhaustion conditions (Vulnerable Soul + Unconscious)
 * @param {Actor} actor - The actor to apply conditions to
 * @returns {Promise<void>}
 */
export async function applyManaExhaustionConditions(actor) {
	if (!actor) return;

	// Apply Vulnerable Soul custom condition
	const vulnerableSoul = createVulnerableSoulEffect();
	await actor.createEmbeddedDocuments("ActiveEffect", [vulnerableSoul]);

	// Apply Unconscious condition from D&D5e
	const unconsciousId = CONFIG.DND5E.conditionTypes.unconscious.id;
	if (
		unconsciousId &&
		!actor.effects.find((e) => e.statuses.has(unconsciousId))
	) {
		await actor.toggleStatusEffect(unconsciousId, { active: true });
	}

	console.log(
		`Adrasamen | Applied mana exhaustion conditions to ${actor.name}`,
	);
}

/**
 * Remove mana exhaustion conditions (Vulnerable Soul only, leave Unconscious)
 * @param {Actor} actor - The actor to remove conditions from
 * @returns {Promise<void>}
 */
export async function removeManaExhaustionConditions(actor) {
	if (!actor) return;

	// Remove only the Vulnerable Soul effect
	const vulnerableEffect = actor.effects.find(
		(effect) => effect.getFlag("adrasamen", "type") === "vulnerableSoul",
	);

	if (vulnerableEffect) {
		await vulnerableEffect.delete();
		console.log(
			`Adrasamen | Removed Vulnerable Soul condition from ${actor.name}`,
		);
	}

	// Note: We deliberately leave the Unconscious condition for manual removal
}

/**
 * Check if actor has Vulnerable Soul condition
 * @param {Actor} actor - The actor to check
 * @returns {boolean} True if actor has Vulnerable Soul condition
 */
export function hasVulnerableSoul(actor) {
	if (!actor) return false;

	return !!actor.effects.find(
		(effect) => effect.getFlag("adrasamen", "type") === "vulnerableSoul",
	);
}
