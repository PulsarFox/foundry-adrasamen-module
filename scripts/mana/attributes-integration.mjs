/**
 * Extends D&D5e's actor data schema to include mana attributes
 */

const { NumberField, SchemaField, StringField } = foundry.data.fields;
const { FormulaField } = dnd5e.dataModels.fields;

/**
 * Mana attributes field definition matching HP structure exactly
 * @type {Object}
 */
export const manaAttributes = {
	max: new NumberField({
		nullable: true,
		integer: true,
		min: 0,
		initial: null, // MUST be null for calculated max
		label: "ADRASAMEN.ManaPointsCalculated",
		hint: "ADRASAMEN.ManaPointsCalculatedHint",
	}),
	overrideMax: new NumberField({
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
		initial: null, // MUST be null like HP - gets set during data preparation
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
		level: new FormulaField({ deterministic: true, label: "ADRASAMEN.ManaPointsBonusLevel" }),
		overall: new FormulaField({ deterministic: true, label: "ADRASAMEN.ManaPointsBonusOverall" })
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
	console.log("Adrasamen | prepareManaPoints called with:", {
		overrideMax: mana.overrideMax,
		currentMax: mana.max,
		currentValue: mana.value,
		advancementCount: advancement.length,
		advancementValues: advancement.map(a => a.value || {}),
		mod,
		bonus,
		stackTrace: new Error().stack.split('\n').slice(1, 4).map(line => line.trim())
	});

	// Check for absolute override first
	if (mana.overrideMax !== null && mana.overrideMax !== undefined) {
		// Absolute override - ignore all calculations, bonuses, and advancement
		mana.max = Math.floor(mana.overrideMax);
		console.log("Adrasamen | Using override max:", mana.max);
	} else {
		// Calculate the base from advancement (exactly like D&D5e)
		const base = advancement.reduce(
			(total, advancement) => total + advancement.getAdjustedTotal(mod),
			0,
		);

		console.log("Adrasamen | Calculated base from advancement:", base);

		// CRITICAL: Only calculate if we have advancement data or bonuses to apply
		// Keep as null if there's nothing to calculate (exactly like D&D5e HP system)
		const originalMax = mana.max;

		if (originalMax === null || originalMax === undefined) {
			// Only calculate if we have actual data to work with
			if (base > 0 || bonus !== 0 || advancement.length > 0) {
				mana.max = base + bonus;
				console.log("Adrasamen | Calculated new max from advancement:", mana.max);
			} else {
				console.log("Adrasamen | No advancement data, keeping max as null - EARLY RETURN");
				// Keep as null - no advancement loaded yet
				return; // Exit early, don't process further
			}
		} else {
			// CRITICAL: Only overwrite existing max if we have advancement data
			// Otherwise preserve existing values during early data preparation
			if (advancement.length > 0 || base > 0) {
				mana.max = base + bonus;
				console.log("Adrasamen | Updated max from advancement base:", mana.max);
			} else {
				// Keep existing value - advancement not loaded yet
				mana.max = originalMax;
				console.log("Adrasamen | Preserving existing max (no advancement data):", mana.max);
			}
		}

		mana.max = Math.floor(mana.max);
	}

	// Set derived display properties (same as D&D5e) - ALWAYS calculate these
	mana.effectiveMax = Math.max(mana.max + (mana.tempmax ?? 0), 0);

	console.log("Adrasamen | Before current value handling:", {
		currentValue: mana.value,
		effectiveMax: mana.effectiveMax,
		valueType: typeof mana.value,
		isNull: mana.value === null,
		isUndefined: mana.value === undefined
	});

	// Handle null value like D&D5e handles HP - set to effectiveMax on first calculation
	if (mana.value === null || mana.value === undefined) {
		mana.value = mana.effectiveMax;
		console.log("Adrasamen | Set current value to effectiveMax:", mana.value);
	}

	// Constrain value to effectiveMax (same as D&D5e)
	const oldValue = mana.value;
	mana.value = Math.min(mana.value || 0, mana.effectiveMax);
	
	if (oldValue !== mana.value) {
		console.log("Adrasamen | Current value constrained:", {
			old: oldValue,
			new: mana.value,
			effectiveMax: mana.effectiveMax
		});
	}
	mana.damage = mana.effectiveMax - mana.value;
	mana.pct = Math.clamp(
		mana.effectiveMax ? (mana.value / mana.effectiveMax) * 100 : 0,
		0,
		100,
	);

	console.log("Adrasamen | Final mana values:", {
		max: mana.max,
		effectiveMax: mana.effectiveMax,
		value: mana.value,
		damage: mana.damage,
		pct: mana.pct
	});
}
