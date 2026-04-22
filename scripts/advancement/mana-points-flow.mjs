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

	/** @inheritDoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		const source = this.advancement.value;
		const value = source[this.level];
		const mana = this.advancement.actor.system.attributes.mana;
		const maxAffinityLevel = this.advancement._getMaxAffinityLevel();
		const bonus = 0; // TODO: Add mana level bonuses if needed

		return {
			...context,
			data: {
				value:
					value === "avg"
						? this.advancement.average
						: Number.isInteger(value)
							? value
							: "",
				useAverage: value === "avg",
			},
			mana: {
				average: this.advancement.average,
				bonus,
				max: this.advancement.manaDieValue,
				modifier: {
					label: game.i18n.localize("ADRASAMEN.MaxAffinityLevel"),
					value: maxAffinityLevel,
				},
				previous: Object.keys(this.advancement.value).reduce(
					(total, level) => {
						if (parseInt(level) === this.level) return total;
						return (
							total +
							Math.max(
								this.advancement.valueForLevel(parseInt(level)) +
								maxAffinityLevel,
								1,
							) +
							bonus
						);
					},
					0,
				),
				// Show current mana max like HP does (simple!)
				total: value ? mana.max : "—",
			},
			manaDie: this.advancement.manaDie,
			isFirstClassLevel:
				this.level === 1 && this.advancement.item.isOriginalClass,
			manual: !["avg", "max"].includes(value),
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
		const roll = await this.advancement.actor.rollClassManaPoints?.(this.advancement.item);
		if (roll) {
			await this.advancement.apply(this.level, {
				[this.level]: roll.total,
			});
			this.render();
		}
	}

	/* -------------------------------------------- */
	/*  Form Handling                               */
	/* -------------------------------------------- */

	/** @override */
	async _handleForm(event, form, formData) {
		let newValue;
		if (event.target?.name === "useAverage") {
			newValue = event.target.checked ? "avg" : null;
		} else if (event.target?.name === "value") {
			newValue = Number.isInteger(event.target.valueAsNumber)
				? event.target.valueAsNumber
				: null;
		} else {
			// If neither the value input nor the useAverage checkbox is present, this is the first-class-level case where
			// max mana is shown statically and no user input is required.
			if (form.querySelector("[name=value], [name=useAverage]")) {
				const { useAverage, value } = formData.object;
				if (!useAverage && !Number.isInteger(value)) {
					const errorType = value === null ? "Empty" : "Invalid";
					throw new dnd5e.documents.advancement.Advancement.ERROR(
						game.i18n.localize(`ADRASAMEN.ADVANCEMENT.ManaPoints.Warning.${errorType}`),
						{ selector: ".roll-result" }
					);
				}
			}
			return;
		}

		if (((typeof newValue === "string") && newValue) || Number.isInteger(newValue)) {
			await this.advancement.apply(this.level, { [this.level]: newValue });
		} else {
			await this.advancement.reverse(this.level);
		}
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
