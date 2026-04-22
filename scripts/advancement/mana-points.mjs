/**
 * Mana Points Advancement for Adrasamen
 * Based on D&D5e HitPointsAdvancement but for mana points
 */

import ManaPointsConfig from "./mana-points-config.mjs";
import ManaPointsFlow from "./mana-points-flow.mjs";

/**
 * Advancement that presents the player with the option to roll mana points at each level or select the average value.
 * Keeps track of player mana point rolls or selection for each class level. **Can only be added to classes and each
 * class can only have one.**
 */
export default class ManaPointsAdvancement
	extends dnd5e.documents.advancement.Advancement {
	/** @inheritDoc */
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			order: 15,
			icon: "icons/magic/symbols/element-water-drop-blue.webp",
			typeIcon: "modules/adrasamen/icons/mana-advancement.svg",
			title: game.i18n.localize("ADRASAMEN.ADVANCEMENT.ManaPoints.Title"),
			hint: game.i18n.localize("ADRASAMEN.ADVANCEMENT.ManaPoints.Hint"),
			multiLevel: true,
			apps: {
				config: ManaPointsConfig,
				flow: ManaPointsFlow,
			},
		});
	}

	/* -------------------------------------------- */
	/*  Data Schema                                 */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static defineSchema() {
		const fields = foundry.data.fields;
		const schema = super.defineSchema();
		schema.configuration = new fields.SchemaField({
			manaDie: new fields.StringField({
				required: false,
				blank: false,
				initial: "d4",
			}),
		});
		schema.value = new fields.ObjectField();
		return schema;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	static get typeName() {
		return "ManaPoints";
	}

	/* -------------------------------------------- */
	/*  Instance Properties                         */
	/* -------------------------------------------- */

	/**
	 * The amount gained if the average is taken.
	 * @type {number}
	 */
	get average() {
		return this.manaDieValue / 2 + 1;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	get levels() {
		return Array.fromRange(CONFIG.DND5E.maxLevel + 1).slice(1);
	}

	/* -------------------------------------------- */

	/**
	 * Shortcut to the mana die used by the class.
	 * @returns {string}
	 */
	get manaDie() {
		return this.configuration.manaDie || "d4";
	}

	/* -------------------------------------------- */

	/**
	 * The face value of the mana die used.
	 * @returns {number}
	 */
	get manaDieValue() {
		return Number(this.manaDie.substring(1));
	}

	/* -------------------------------------------- */

	/**
	 * Get the maximum affinity level bonus for the character.
	 * @returns {number}
	 */
	_getMaxAffinityLevel() {
		if (!this.actor) return 0;

		// Import dynamically to avoid circular dependencies
		try {
			const { getHighestAffinityLevel } = game.adrasamen || {};
			if (!getHighestAffinityLevel) return 0;
			return getHighestAffinityLevel(this.actor) || 0;
		} catch (error) {
			console.warn("Adrasamen | Could not get affinity level:", error);
			return 0;
		}
	}

	/* -------------------------------------------- */

	/**
	 * Get the mana formula from the class item.
	 * @returns {string} The mana formula configured in the class
	 */
	getManaFormula() {
		if (!this.item) return "1d4 + @maxAffinityLevel";

		const formula = this.item.getFlag("adrasamen", "manaFormula");
		return formula || "1d4 + @maxAffinityLevel";
	}

	/* -------------------------------------------- */
	/*  Display Methods                             */
	/* -------------------------------------------- */

	/** @inheritDoc */
	configuredForLevel(level) {
		return this.valueForLevel(level) !== null;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	titleForLevel(level, { configMode = false, legacyDisplay = false } = {}) {
		const mana = this.valueForLevel(level);
		if (!mana || configMode || !legacyDisplay) return this.title;
		return `${this.title}: <strong>${mana}</strong>`;
	}

	/* -------------------------------------------- */

	/**
	 * Mana points given at the provided level.
	 * @param {number} level   Level for which to get mana points.
	 * @returns {number|null}  Mana points for level or null if none have been taken.
	 */
	valueForLevel(level) {
		return this.constructor.valueForLevel(
			this.value,
			this.manaDieValue,
			level,
		);
	}

	/* -------------------------------------------- */

	/**
	 * Mana points given at the provided level.
	 * @param {object} data         Contents of `value` used to determine this value.
	 * @param {number} manaDieValue Face value of the mana die used by this advancement.
	 * @param {number} level        Level for which to get mana points.
	 * @returns {number|null}       Mana points for level or null if none have been taken.
	 */
	static valueForLevel(data, manaDieValue, level) {
		const value = data[level];
		if (!value) return null;

		if (value === "max") return manaDieValue;
		if (value === "avg") return manaDieValue / 2 + 1;
		return value;
	}

	/* -------------------------------------------- */

	/**
	 * Total mana points provided by this advancement.
	 * @returns {number}  Mana points currently selected.
	 */
	total() {
		return Object.keys(this.value).reduce((total, level) => {
			return total + this.valueForLevel(parseInt(level));
		}, 0);
	}

	/* -------------------------------------------- */

	/**
	 * Total mana points taking the provided modifier into account, with a minimum of 1 per level.
	 * @param {number} mod  Modifier to add per level.
	 * @returns {number}    Total mana points plus modifier.
	 */
	getAdjustedTotal(mod) {
		return Object.keys(this.value).reduce((total, level) => {
			return (
				total + Math.max(this.valueForLevel(parseInt(level)) + mod, 1)
			);
		}, 0);
	}

	/* -------------------------------------------- */
	/*  Editing Methods                             */
	/* -------------------------------------------- */

	/** @inheritDoc */
	static availableForItem(item) {
		return !item.advancement.byType.ManaPoints?.length;
	}

	/* -------------------------------------------- */
	/*  Application Methods                         */
	/* -------------------------------------------- */

	/**
	 * Add the max affinity level modifier and any bonuses to the provided mana points value to get the number to apply.
	 * @param {number} value  Mana points taken at a given level.
	 * @returns {number}      Mana points adjusted with max affinity level modifier and per-level bonuses.
	 */
	#getApplicableValue(value) {
		const maxAffinityLevel = this._getMaxAffinityLevel();
		value = Math.max(value + maxAffinityLevel, 1);

		// Add level bonuses if available (using D&D5e utils)
		const levelBonus = this.actor.system.attributes.mana.bonuses?.level;
		if (levelBonus) {
			try {
				// Use D&D5e's simplifyBonus function from global utils
				value += dnd5e.utils.simplifyBonus(
					levelBonus,
					this.actor.getRollData(),
				);
			} catch (error) {
				console.warn(
					"Adrasamen | Could not calculate mana level bonus:",
					error,
				);
			}
		}

		return value;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async apply(level, data, options = {}) {
		if (options.initial) {
			if (level === 1 && this.item.isOriginalClass) data[level] = "max";
			else if (this.value[level - 1] === "avg") data[level] = "avg";
		}

		let value = this.constructor.valueForLevel(
			data,
			this.manaDieValue,
			level,
		);
		if (value === undefined) return;
		if (this.value[level] !== undefined) await this.reverse(level);

		console.log("Adrasamen | Mana advancement apply - before:", {
			level,
			value,
			currentMaxMana: this.actor.system.attributes.mana.max,
			advancementValue: this.value
		});

		this.updateSource({ value: data });

		// Update current mana by adding the new mana gained (like HP system)
		const applicableValue = this.#getApplicableValue(value);
		const newCurrentMana = (this.actor.system.attributes.mana.value || 0) + applicableValue;

		// Use both updateSource and direct update to ensure persistence
		this.actor.updateSource({
			"system.attributes.mana.value": newCurrentMana,
		});

		// Also update via actor.update to ensure database persistence
		await this.actor.update({
			"system.attributes.mana.value": newCurrentMana
		});

		console.log("Adrasamen | Mana advancement apply - after:", {
			level,
			applicableValue,
			newMaxMana: this.actor.system.attributes.mana.max,
			newCurrentMana: this.actor.system.attributes.mana.value,
			savedCurrentMana: newCurrentMana,
			advancementValue: this.value
		});
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async restore(level, data, options = {}) {
		const existing = this.reverse(level, { source: true });
		if (existing) await this.apply(level, data, options);
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async reverse(level, options = {}) {
		let value = this.valueForLevel(level);
		if (value === undefined) return;
		const source = { [level]: this.value[level] };
		this.updateSource({ [`value.-=${level}`]: null });

		// Update current mana by removing the mana lost (like HP system)
		const applicableValue = this.#getApplicableValue(value);
		this.actor.updateSource({
			"system.attributes.mana.value":
				(this.actor.system.attributes.mana.value || 0) - applicableValue,
		});

		return options.source ? source : null;
	}

	/* -------------------------------------------- */
	/*  Data Preparation                            */
	/* -------------------------------------------- */

	/** @inheritDoc */
	prepareData() {
		super.prepareData();

		// Ensure we have a configuration object
		if (!this.configuration) {
			this.configuration = {
				manaDie: "1d4",
			};
		}

		// Ensure we have a value object
		if (!this.value) {
			this.value = {};
		}
	}
}
