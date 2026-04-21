/**
 * Mana Points Advancement for Adrasamen
 * Based on D&D5e HitPointsAdvancement but for mana points
 */

import ManaPointsConfig from "./mana-points-config.mjs";
import ManaPointsFlow from "./mana-points-flow.mjs";

/**
 * Advancement that presents the player with the option to roll mana points at each level or select the average value.
 * Uses customizable formula (default: 1d4 + maxAffinityLevel) instead of hit dice.
 * **Can only be added to classes and each class can only have one.**
 */
export default class ManaPointsAdvancement
	extends dnd5e.documents.advancement.Advancement
{
	/** @inheritDoc */
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			name: "ManaPoints",
			label: "ADRASAMEN.ADVANCEMENT.ManaPoints.Label",
			order: 15,
			icon: "icons/magic/symbols/element-water-drop-blue.webp",
			typeIcon: "modules/adrasamen/icons/mana-advancement.svg",
			title: game.i18n.localize("ADRASAMEN.ADVANCEMENT.ManaPoints.Title"),
			hint: game.i18n.localize("ADRASAMEN.ADVANCEMENT.ManaPoints.Hint"),
			multiLevel: true,
			validItemTypes: new Set(["class"]),
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
				initial: "1d4",
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
		const maxAffinityLevel = this._getMaxAffinityLevel();
		return this.manaDieValue / 2 + 1 + maxAffinityLevel;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	get levels() {
		return Array.fromRange(CONFIG.DND5E.maxLevel + 1).slice(1);
	}

	/* -------------------------------------------- */

	/**
	 * The mana die formula used by this advancement.
	 * @returns {string}
	 */
	get manaDie() {
		return this.configuration.manaDie || "1d4";
	}

	/* -------------------------------------------- */

	/**
	 * The face value of the mana die used.
	 * @returns {number}
	 */
	get manaDieValue() {
		const match = this.manaDie.match(/\d*d(\d+)/);
		return match ? Number(match[1]) : 4;
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
			this._getMaxAffinityLevel(),
		);
	}

	/* -------------------------------------------- */

	/**
	 * Mana points given at the provided level.
	 * @param {object} data           Contents of `value` used to determine this value.
	 * @param {number} manaDieValue   Face value of the mana die used by this advancement.
	 * @param {number} level          Level for which to get mana points.
	 * @param {number} maxAffinityLevel Maximum affinity level bonus.
	 * @returns {number|null}         Mana points for level or null if none have been taken.
	 */
	static valueForLevel(data, manaDieValue, level, maxAffinityLevel = 0) {
		const value = data[level];
		if (!value) return null;

		if (value === "max") return manaDieValue + maxAffinityLevel;
		if (value === "avg") return manaDieValue / 2 + 1 + maxAffinityLevel;
		return value + maxAffinityLevel;
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
	 * Apply the mana points advancement to the actor.
	 * @param {number} level                          Level being advanced.
	 * @param {object} data                          Data from the advancement flow.
	 * @param {object} [options={}]                  Additional options.
	 * @returns {Promise<object>}                    Updates to apply to the actor.
	 */
	async apply(level, data, options = {}) {
		const manaGained = this.valueForLevel(level);
		if (!manaGained) return {};

		// Get current mana data
		const currentMana = this.actor.getFlag("adrasamen", "mana") || {
			current: 0,
			max: 0,
		};

		// Add the mana points to max mana
		const newMaxMana = currentMana.max + manaGained;
		const newCurrentMana = Math.min(currentMana.current, newMaxMana);

		// Update the actor's mana
		await this.actor.setFlag("adrasamen", "mana", {
			current: newCurrentMana,
			max: newMaxMana,
		});

		// Show notification
		ui.notifications.info(
			game.i18n.format("ADRASAMEN.ADVANCEMENT.ManaPoints.Applied", {
				name: this.actor.name,
				amount: manaGained,
				newMax: newMaxMana,
			}),
		);

		return {};
	}

	/* -------------------------------------------- */

	/**
	 * Reverse the mana points advancement from the actor.
	 * @param {number} level                          Level being reversed.
	 * @param {object} [options={}]                   Additional options.
	 * @returns {Promise<object>}                     Updates to apply to the actor.
	 */
	async reverse(level, options = {}) {
		const manaLost = this.valueForLevel(level);
		if (!manaLost) return {};

		// Get current mana data
		const currentMana = this.actor.getFlag("adrasamen", "mana") || {
			current: 0,
			max: 0,
		};

		// Remove the mana points from max mana
		const newMaxMana = Math.max(0, currentMana.max - manaLost);
		const newCurrentMana = Math.min(currentMana.current, newMaxMana);

		// Update the actor's mana
		await this.actor.setFlag("adrasamen", "mana", {
			current: newCurrentMana,
			max: newMaxMana,
		});

		// Show notification
		ui.notifications.warn(
			game.i18n.format("ADRASAMEN.ADVANCEMENT.ManaPoints.Reversed", {
				name: this.actor.name,
				amount: manaLost,
				newMax: newMaxMana,
			}),
		);

		return {};
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
