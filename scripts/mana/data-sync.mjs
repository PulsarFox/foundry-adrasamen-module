// scripts/mana/data-sync.mjs
/**
 * Bidirectional synchronization between flags and attributes for mana
 */

/**
 * Sync mana from flags to attributes
 * @param {Actor} actor - The actor to sync
 */
export async function syncFlagsToAttributes(actor) {
	if (actor.type !== "character") return;

	const flagMana = actor.getFlag("adrasamen", "mana");
	if (!flagMana) return;

	const attributeMana = actor.system.attributes?.mana;
	if (!attributeMana) return;

	// Only sync if different
	const needsSync =
		attributeMana.value !== flagMana.current ||
		attributeMana.max !== flagMana.max;

	if (needsSync) {
		await actor.update(
			{
				"system.attributes.mana.value": flagMana.current || 0,
				"system.attributes.mana.max": null, // Always set to null so it's calculated dynamically
			},
			{ adrasamenSync: true },
		); // Flag to prevent infinite loops

		console.log("Adrasamen | Synced flags to attributes");
	}
}

/**
 * Sync mana from attributes to flags
 * @param {Actor} actor - The actor to sync
 */
export async function syncAttributesToFlags(actor) {
	if (actor.type !== "character") return;

	const attributeMana = actor.system.attributes?.mana;
	if (!attributeMana) return;

	const flagMana = actor.getFlag("adrasamen", "mana") || {};

	// Only sync if different (use effectiveMax for calculated max)
	const effectiveMax =
		attributeMana.calculatedMax ??
		attributeMana.effectiveMax ??
		attributeMana.max ??
		null;
	const needsSync =
		flagMana.current !== attributeMana.value ||
		flagMana.max !== effectiveMax;

	if (needsSync) {
		await actor.setFlag("adrasamen", "mana", {
			...flagMana,
			current: attributeMana.value || 0,
			max: effectiveMax === 0 ? null : effectiveMax,
		});

		console.log("Adrasamen | Synced attributes to flags");
	}
}

/**
 * Initialize sync hooks for automatic synchronization
 */
export function initDataSync() {
	// Sync flags to attributes when actor is created/updated
	Hooks.on("createActor", syncFlagsToAttributes);

	// Sync attributes to flags when system data changes
	Hooks.on("updateActor", (actor, updates, options) => {
		// Avoid infinite loops
		if (options.adrasamenSync) return;

		// Check if mana attributes were updated
		if (updates.system?.attributes?.mana) {
			syncAttributesToFlags(actor);
		}
	});

	// Sync flags to attributes when flags change
	Hooks.on("updateActor", (actor, updates, options) => {
		// Avoid infinite loops
		if (options.adrasamenSync) return;

		// Check if mana flags were updated
		if (updates.flags?.adrasamen?.mana) {
			syncFlagsToAttributes(actor);
		}
	});

	console.log("Adrasamen | Initialized mana data synchronization");
}
