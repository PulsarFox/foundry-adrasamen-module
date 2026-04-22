/**
 * Extends D&D5e's actor data schema to include mana attributes
 */

const { NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Mana attributes field definition matching HP structure exactly
 * @type {Object}
 */
export const manaAttributes = {
	max: new NumberField({
		nullable: true,
		integer: true,
		min: 0,
		initial: null,
		label: "ADRASAMEN.ManaPointsOverride",
		hint: "ADRASAMEN.ManaPointsOverrideHint",
	}),
	value: new NumberField({
		nullable: true,
		integer: true,
		min: 0,
		initial: null,
		label: "ADRASAMEN.ManaPointsCurrent",
	}),
	temp: new NumberField({
		integer: true,
		initial: 0,
		min: 0,
		label: "ADRASAMEN.ManaPointsTemp",
	}),
	tempmax: new NumberField({
		integer: true,
		initial: 0,
		label: "ADRASAMEN.ManaPointsTempMax",
		hint: "ADRASAMEN.ManaPointsTempMaxHint",
	}),
	bonuses: new SchemaField({
		level: new StringField({
			required: true,
			blank: true,
			label: "ADRASAMEN.ManaPointsBonusLevel",
		}),
		overall: new StringField({
			required: true,
			blank: true,
			label: "ADRASAMEN.ManaPointsBonusOverall",
		}),
	}),
};

/**
 * Extend D&D5e character data schema to include mana
 */
export function extendCharacterSchema() {
	// Get the original defineSchema method
	const originalDefineSchema =
		dnd5e.dataModels.actor.CharacterData.defineSchema;

	// Override to include mana in attributes
	dnd5e.dataModels.actor.CharacterData.defineSchema = function () {
		const schema = originalDefineSchema.call(this);

		// Add mana to attributes schema
		schema.attributes.fields.mana = new SchemaField(manaAttributes, {
			label: "ADRASAMEN.ManaPoints",
		});

		return schema;
	};

	console.log(
		"Adrasamen | Extended D&D5e character schema with mana attributes",
	);
}

/**
 * Make mana trackable as a token resource like HP
 */
export function registerManaAsTrackableAttribute() {
	// Ensure the trackable attributes structure exists
	if (!CONFIG.Actor.trackableAttributes) {
		CONFIG.Actor.trackableAttributes = {};
	}
	if (!CONFIG.Actor.trackableAttributes.character) {
		CONFIG.Actor.trackableAttributes.character = { bar: [], value: [] };
	}

	// Add mana to trackable attributes for tokens if not already present
	if (
		!CONFIG.Actor.trackableAttributes.character.bar.includes(
			"attributes.mana",
		)
	) {
		CONFIG.Actor.trackableAttributes.character.bar.push("attributes.mana");
	}

	console.log("Adrasamen | Registered mana as trackable attribute");
}

/**
 * Prepare mana points for a character (matches D&D5e prepareHitPoints exactly)
 * @param {Object} mana - The mana attributes object
 * @param {Object} options - Options for preparation
 * @param {Array} options.advancement - Array of mana advancement objects
 * @param {number} options.mod - Modifier to add per level (max affinity level)
 * @param {number} options.bonus - Additional bonus to add
 */
export function prepareManaPoints(
	mana,
	{ advancement = [], mod = 0, bonus = 0 } = {},
) {
	// Calculate the base from advancement
	const base = advancement.reduce(
		(total, advancement) => total + advancement.getAdjustedTotal(mod),
		0,
	);

	// Calculate the effective max for display (don't modify stored max)
	let effectiveMax = mana.max ?? 0;
	if (mana.max === null) {
		// Only when max is null, calculate from advancement + bonuses
		effectiveMax = base + bonus;
	}
	effectiveMax = Math.floor(effectiveMax);

	// Set derived display properties
	mana.effectiveMax = Math.max(effectiveMax + (mana.tempmax ?? 0), 0);
	mana.value = Math.min(mana.value || 0, mana.effectiveMax);
	mana.pct = Math.clamp(
		mana.effectiveMax ? (mana.value / mana.effectiveMax) * 100 : 0,
		0,
		100,
	);

	// Set a display property for the calculated max (for UI)
	mana.calculatedMax = effectiveMax;
}
