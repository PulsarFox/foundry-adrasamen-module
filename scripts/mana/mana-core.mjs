/**
 * Core Mana Data Management
 * Handles mana storage, retrieval, and manipulation
 */

/**
 * Get mana data from actor, with defaults if missing
 * @param {Actor} actor - The actor to get mana data from
 * @returns {Object} Mana data object with current and max properties
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

	await actor.setFlag("adrasamen", "mana", {
		current: validatedData.current,
		max: validatedData.max,
	});

	// Fire custom event for other systems to react
	Hooks.callAll("adrasamen.manaChanged", actor, validatedData);
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

	// Handle mana exhaustion if we hit 0
	if (newCurrent === 0 && manaData.current > 0) {
		await handleManaExhaustion(actor);
	}

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
	const wasExhausted = manaData.current === 0;
	const newCurrent = Math.min(manaData.max, manaData.current + amount);

	await setMana(actor, newCurrent, manaData.max);

	// Handle recovery from mana exhaustion
	if (wasExhausted && newCurrent > 0) {
		await handleManaRecovery(actor);
	}
}

/**
 * Validate mana values to ensure they're valid numbers
 * @param {number} current - Current mana value
 * @param {number} max - Maximum mana value
 * @returns {Object} Validated mana data
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
