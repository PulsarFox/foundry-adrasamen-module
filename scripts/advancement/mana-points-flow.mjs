/**
 * Flow application for ManaPointsAdvancement
 */

/**
 * Inline application that presents mana points selection during character advancement.
 */
export default class ManaPointsFlow
	extends dnd5e.applications.advancement.AdvancementFlow
{
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			rollManaPoints: ManaPointsFlow.#rollManaPoints,
			selectAverage: ManaPointsFlow.#selectAverage,
			selectMaximum: ManaPointsFlow.#selectMaximum,
		},
	};

	/* -------------------------------------------- */

	/** @override */
	static PARTS = {
		...super.PARTS,
		content: {
			template:
				"modules/adrasamen/templates/advancement/mana-points-flow.hbs",
		},
	};

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const level = this.level;
		const maxAffinityLevel = this.advancement._getMaxAffinityLevel();

		// Calculate possible values
		const average =
			Math.floor(this.advancement.manaDieValue / 2) +
			1 +
			maxAffinityLevel;
		const maximum = this.advancement.manaDieValue + maxAffinityLevel;

		// Check if already configured
		const existingValue = this.advancement.value[level];

		context.data = {
			level: level,
			manaDie: this.advancement.manaDie,
			maxAffinityLevel: maxAffinityLevel,
			values: {
				average: average,
				maximum: maximum,
			},
			isConfigured: existingValue !== undefined,
			selectedValue: existingValue,
			value:
				existingValue === "avg"
					? average
					: Number.isInteger(existingValue)
						? existingValue
						: "",
			useAverage: existingValue === "avg",
		};

		return context;
	}

	/* -------------------------------------------- */
	/*  Event Handlers                              */
	/* -------------------------------------------- */

	/**
	 * Handle rolling for mana points.
	 * @param {Event} event         Triggering click event.
	 * @param {HTMLElement} target  Button that was clicked.
	 */
	static async #rollManaPoints(event, target) {
		const maxAffinityLevel = this.advancement._getMaxAffinityLevel();
		const roll = await new Roll(
			`${this.advancement.manaDie} + ${maxAffinityLevel}`,
		).evaluate();

		// Show the roll in chat
		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.advancement.actor }),
			flavor: game.i18n.format(
				"ADRASAMEN.ADVANCEMENT.ManaPoints.RollFlavor",
				{
					level: this.level,
					die: this.advancement.manaDie,
					bonus: maxAffinityLevel,
				},
			),
		});

		// Update the value
		await this.advancement.update({ [`value.${this.level}`]: roll.total });
		this.render();
	}

	/* -------------------------------------------- */

	/**
	 * Handle selecting the average value.
	 * @param {Event} event         Triggering click event.
	 * @param {HTMLElement} target  Button that was clicked.
	 */
	static async #selectAverage(event, target) {
		await this.advancement.update({ [`value.${this.level}`]: "avg" });
		this.options.manager?.complete?.();
	}

	/* -------------------------------------------- */

	/**
	 * Handle selecting the maximum value.
	 * @param {Event} event         Triggering click event.
	 * @param {HTMLElement} target  Button that was clicked.
	 */
	static async #selectMaximum(event, target) {
		await this.advancement.update({ [`value.${this.level}`]: "max" });
		this.options.manager?.complete?.();
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	get title() {
		return this.advancement.title;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	async _prepareContext() {
		const level = this.options.level;
		const maxAffinityLevel = this.advancement._getMaxAffinityLevel();

		// Calculate possible values
		const average =
			Math.floor(this.advancement.manaDieValue / 2) +
			1 +
			maxAffinityLevel;
		const maximum = this.advancement.manaDieValue + maxAffinityLevel;

		// Check if already configured
		const existingValue = this.advancement.value[level];

		const context = {
			advancement: this.advancement,
			level: level,
			manaDie: this.advancement.manaDie,
			maxAffinityLevel: maxAffinityLevel,
			values: {
				average: average,
				maximum: maximum,
				roll: null, // Will be set when rolled
			},
			isConfigured: existingValue !== undefined,
			selectedValue: existingValue,
		};

		return context;
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	_onRender(context, options) {
		super._onRender(context, options);

		// Add event listeners
		this.element
			.querySelector('[data-action="roll"]')
			?.addEventListener("click", this._onRoll.bind(this));
		this.element
			.querySelector('[data-action="average"]')
			?.addEventListener("click", this._onAverage.bind(this));
		this.element
			.querySelector('[data-action="maximum"]')
			?.addEventListener("click", this._onMaximum.bind(this));
	}

	/* -------------------------------------------- */

	/**
	 * Handle rolling for mana points.
	 * @param {Event} event  Triggering click event.
	 * @protected
	 */
	async _onRoll(event) {
		event.preventDefault();

		const maxAffinityLevel = this.advancement._getMaxAffinityLevel();
		const roll = await new Roll(
			`${this.advancement.manaDie} + ${maxAffinityLevel}`,
		).evaluate();

		// Show the roll in chat
		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.advancement.actor }),
			flavor: game.i18n.format(
				"ADRASAMEN.ADVANCEMENT.ManaPoints.RollFlavor",
				{
					level: this.options.level,
					die: this.advancement.manaDie,
					bonus: maxAffinityLevel,
				},
			),
		});

		// Update the value and re-render
		await this._setValue(roll.total);
		this.render();
	}

	/* -------------------------------------------- */

	/**
	 * Handle selecting the average value.
	 * @param {Event} event  Triggering click event.
	 * @protected
	 */
	async _onAverage(event) {
		event.preventDefault();
		await this._setValue("avg");
		this._resolveAdvancement();
	}

	/* -------------------------------------------- */

	/**
	 * Handle selecting the maximum value.
	 * @param {Event} event  Triggering click event.
	 * @protected
	 */
	async _onMaximum(event) {
		event.preventDefault();
		await this._setValue("max");
		this._resolveAdvancement();
	}

	/* -------------------------------------------- */

	/**
	 * Set the mana points value for the current level.
	 * @param {number|string} value  Value to set.
	 * @protected
	 */
	async _setValue(value) {
		const level = this.options.level;
		const updates = { [`value.${level}`]: value };
		await this.advancement.update(updates);
	}

	/* -------------------------------------------- */

	/**
	 * Complete the advancement flow.
	 * @protected
	 */
	_resolveAdvancement() {
		this.options.manager?.complete?.();
	}
}
