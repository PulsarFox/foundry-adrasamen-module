/**
 * Mana Configuration Dialog using D&D5e's Dialog5e system
 */
export default class ManaConfigDialog extends dnd5e.applications.api.Dialog5e {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["mana-config"],
		tag: "dialog",
		window: {
			title: "ADRASAMEN.ManaPointsConfig",
			contentClasses: ["standard-form"],
			minimizable: false,
		},
		position: {
			width: 400,
		},
		form: {
			handler: ManaConfigDialog.prototype._handleFormSubmission,
			submitOnChange: false,
		},
		buttons: [
			{
				type: "submit",
				icon: "fas fa-check",
				label: "Save",
				action: "save",
			},
			{
				type: "button",
				icon: "fas fa-times",
				label: "Cancel",
				action: "cancel",
			},
		],
	};

	/** @override */
	static PARTS = {
		...super.PARTS,
		content: {
			template: "modules/adrasamen/templates/mana-config-dialog.hbs",
		},
	};

	/* -------------------------------------------- */

	/**
	 * @param {Actor} actor - The actor to configure mana for
	 * @param {Object} options - Additional options
	 */
	constructor(actor, options = {}) {
		super(options);
		this.actor = actor;
	}

	/* -------------------------------------------- */

	/** @override */
	async _prepareContentContext(context, options) {
		const mana = this.actor.system.attributes.mana;
		const source = this.actor._source.system.attributes.mana;

		// Use the calculated effective max from data preparation
		const effectiveMax = mana.calculatedMax ?? mana.effectiveMax ?? 0;

		// Add class contributions for display
		const classes = [];
		const classItems = this.actor.itemTypes.class || [];
		for (const cls of classItems) {
			if (cls.system.levels > 0) {
				// Get mana from advancement
				const manaAdvancement = cls.advancement.byType.ManaPoints?.[0];
				let classMana = 0;
				if (manaAdvancement) {
					classMana = manaAdvancement.total();
					// Add max affinity level modifier
					const maxAffinityLevel = this._getMaxAffinityLevel();
					classMana += cls.system.levels * maxAffinityLevel;
				}

				classes.push({
					anchor: cls.toAnchor().outerHTML,
					total: classMana,
				});
			}
		}

		// Get max affinity level for display
		const maxAffinityLevel = this._getMaxAffinityLevel();

		context = {
			...context,
			data: {
				value: mana.value ?? 0,
				effectiveMax: effectiveMax,
			},
			source: {
				max: source.max,
				value: source.value,
				temp: source.temp,
				tempmax: source.tempmax,
				bonuses: source.bonuses || { level: "", overall: "" },
			},
			fields: this._getFieldDefinitions(),
			effects: {
				max: [],
				overall: [],
				bonuses: [],
			},
			showCalculation: true,
			showMaxInCalculation: mana.max === null,
			classes: classes,
			maxAffinityLevel:
				maxAffinityLevel > 0
					? {
							name: game.i18n.localize(
								"ADRASAMEN.MaxAffinityLevel",
							),
							value: maxAffinityLevel,
						}
					: null,
			levelMultiplier:
				classItems.length > 0
					? `× ${classItems.reduce((sum, cls) => sum + cls.system.levels, 0)}`
					: "",
		};

		return context;
	}

	/* -------------------------------------------- */

	/**
	 * Get field definitions for form fields
	 * @returns {Object} Field definitions
	 */
	_getFieldDefinitions() {
		// Get the actual field definitions from the actor's data schema
		const schema = this.actor.system.schema;
		const manaFields = schema.getField("attributes.mana");

		return {
			max: manaFields.getField("max"),
			value: manaFields.getField("value"),
			temp: manaFields.getField("temp"),
			tempmax: manaFields.getField("tempmax"),
			bonuses: manaFields.getField("bonuses"),
		};
	}

	/* -------------------------------------------- */

	/**
	 * Get the maximum affinity level for the actor
	 * @returns {number} The highest affinity level
	 */
	_getMaxAffinityLevel() {
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
	 * Handle form submission.
	 * @param {Event} event - The form submission event
	 * @param {HTMLFormElement} form - The submitted form
	 * @param {FormDataExtended} formData - The form data
	 */
	async _handleFormSubmission(event, form, formData) {
		const updates = {
			"system.attributes.mana.max":
				formData.get("system.attributes.mana.max") || null,
			"system.attributes.mana.value":
				formData.get("system.attributes.mana.value") || 0,
			"system.attributes.mana.temp":
				formData.get("system.attributes.mana.temp") || 0,
			"system.attributes.mana.tempmax":
				formData.get("system.attributes.mana.tempmax") || 0,
			"system.attributes.mana.bonuses.level":
				formData.get("system.attributes.mana.bonuses.level") || "",
			"system.attributes.mana.bonuses.overall":
				formData.get("system.attributes.mana.bonuses.overall") || "",
		};

		await this.actor.update(updates);

		// Update configuration
		await this.actor.setFlag("adrasamen", "mana.config", {
			manaShortRestFormula: formData.object.manaShortRestFormula,
		});

		// Re-render the character sheet
		this.actor.sheet.render(false);

		this.close();
	}

	/* -------------------------------------------- */

	/** @override */
	_onClickAction(target, event) {
		if (!target?.dataset) return;
		const action = target.dataset.action;
		switch (action) {
			case "cancel":
				this.close();
				break;
			case "roll":
				this._rollFormula(target.dataset.formula);
				break;
		}
	}

	/* -------------------------------------------- */

	/**
	 * Roll a mana formula and show the result
	 * @param {string} formula - The formula to roll
	 */
	async _rollFormula(formula) {
		if (!formula) return;

		try {
			const roll = new Roll(formula, this.actor.getRollData());
			await roll.evaluate();

			const messageData = {
				user: game.user.id,
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: `${game.i18n.localize("ADRASAMEN.Mana")} Formula Roll`,
				type: CONST.CHAT_MESSAGE_TYPES.ROLL,
				rolls: [roll],
			};

			await ChatMessage.create(messageData);
		} catch (error) {
			ui.notifications.error(`Invalid formula: ${formula}`);
			console.error("Mana formula roll error:", error);
		}
	}
}
