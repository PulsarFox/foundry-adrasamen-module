/**
 * Debug utilities for mana system
 */

export function debugManaState(actor, label = "Mana Debug") {
	if (actor.type !== "character") return;

	const mana = actor.system.attributes?.mana;
	const flagMana = actor.getFlag("adrasamen", "mana");

	console.log(`=== ${label} for ${actor.name} ===`);
	console.log("Mana attributes:", {
		value: mana?.value,
		max: mana?.max,
		effectiveMax: mana?.effectiveMax,
		temp: mana?.temp,
		tempmax: mana?.tempmax,
		bonuses: mana?.bonuses,
	});
	console.log("Mana flags:", flagMana);

	// Check advancement
	const advancements = Object.values(actor.classes)
		.map((c) => c.advancement.byType.ManaPoints?.[0])
		.filter((a) => a);

	console.log(
		"Mana advancements:",
		advancements.map((a) => ({
			total: a?.total(),
			value: a?.value,
			levels: Object.keys(a?.value || {}),
		})),
	);
	console.log("=== End Debug ===");
}

// Make it globally available for testing
if (typeof globalThis !== "undefined") {
	globalThis.debugManaState = debugManaState;
}
