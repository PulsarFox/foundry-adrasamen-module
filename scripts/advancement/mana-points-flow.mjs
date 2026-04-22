/**
 * Flow application for ManaPointsAdvancement
 */

/**
 * Inline application that presents mana points selection during character advancement.
 */
export default class ManaPointsFlow
	extends dnd5e.applications.advancement.AdvancementFlowV2 {
	/** @override */
	static DEFAULT_OPTIONS = {
		actions: {
			rollManaPoints: ManaPointsFlow.#rollManaPoints,
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
		const value = this.advancement.value[level];
		const formula = this.advancement.getManaFormula();

		// Calculate possible values using the configured formula
		const rollData = this.advancement.actor?.getRollData() || {};
		rollData.maxAffinityLevel = maxAffinityLevel;

		// Calculate average and maximum based on the formula
		let average, maximum;
		try {
			// Create roll to get maximum value
			const maxRoll = new Roll(formula, rollData);
			await maxRoll.evaluate({maximize: true});
			maximum = maxRoll.total;

			// For average, calculate based on die size + static bonuses
			// This is a simplified approach
			if (formula.includes("1d4")) {
				average = 2.5 + maxAffinityLevel; // 1d4 average is 2.5
			} else if (formula.includes("1d6")) {
				average = 3.5 + maxAffinityLevel; // 1d6 average is 3.5
			} else if (formula.includes("1d8")) {
				average = 4.5 + maxAffinityLevel; // 1d8 average is 4.5
			} else {
				// Fallback: try to evaluate a "average" roll
				const avgRoll = new Roll(formula.replace(/\d+d\d+/g, (match) => {
					const [count, die] = match.split('d').map(Number);
					return Math.floor((die / 2 + 0.5) * count);
				}), rollData);
				await avgRoll.evaluate();
				average = avgRoll.total;
			}
			average = Math.floor(average);
		} catch (error) {
			console.warn("Adrasamen | Error calculating mana values from formula:", error);
			// Fallback to old method
			average = Math.floor(this.advancement.manaDieValue / 2) + 1 + maxAffinityLevel;
			maximum = this.advancement.manaDieValue + maxAffinityLevel;
		}

		// Calculate total mana for display
		const total = value !== undefined ?
			(value === "avg" ? average : (Number.isInteger(value) ? value : "—")) : "—";

		return {
			...context,
			data: {
				value: value === "avg" ? average : Number.isInteger(value) ? value : "",
				useAverage: value === "avg"
			},
			mana: {
				average: average,
				maximum: maximum,
				formula: formula,
				bonus: maxAffinityLevel,
				total: total
			},
			level: level,
			isConfigured: value !== undefined,
			manual: !["avg", "max"].includes(value)
		};
	}

	/* -------------------------------------------- */
	/*  Event Handlers                              */
	/* -------------------------------------------- */

	/**
	 * Handle rolling for mana points.
	 * @this {ManaPointsFlow}
	 * @param {Event} event         Triggering click event.
	 * @param {HTMLElement} target  Button that was clicked.
	 */
	static async #rollManaPoints(event, target) {
		// Get the mana formula from the class configuration
		const formula = this.advancement.getManaFormula();
		
		// Prepare roll data with maxAffinityLevel
		const rollData = this.advancement.actor?.getRollData() || {};
		rollData.maxAffinityLevel = this.advancement._getMaxAffinityLevel();
		
		const roll = await new Roll(formula, rollData).evaluate();

		// Show the roll in chat
		await roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.advancement.actor }),
			flavor: game.i18n.format(
				"ADRASAMEN.ADVANCEMENT.ManaPoints.RollFlavor",
				{
					level: this.level,
					formula: formula,
					result: roll.total,
				},
			),
		});

		// Apply the value and re-render
		await this.advancement.apply(this.level, { [this.level]: roll.total });
		this.render();
	}

	/* -------------------------------------------- */
	/*  Form Handling                               */
	/* -------------------------------------------- */

	/** @override */
	async _handleForm(event, form, formData) {
		let newValue;
		if (event.target?.name === "useAverage") {
			newValue = formData.useAverage ? "avg" : undefined;
		} else {
			newValue = formData.value ? parseInt(formData.value) : undefined;
		}

		if (newValue !== undefined) {
			await this.advancement.apply(this.level, { [this.level]: newValue });
		}
		return this.options.manager?.complete?.();
	}

	/* -------------------------------------------- */

	/** @inheritDoc */
	get title() {
		return this.advancement.title;
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
