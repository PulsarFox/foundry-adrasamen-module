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
		const { getManaData } = await import("./mana-core.mjs");

		const manaData = getManaData(this.actor);
		const manaConfig = this.actor.getFlag("adrasamen", "mana.config") || {
			manaFormulaPerLevelUp: "1d4 + @abilities.int.mod",
			manaShortRestFormula: "floor(@maxMana / 2)",
		};

		context.currentMana = manaData.current;
		context.maxMana = manaData.max;
		context.manaFormulaPerLevelUp = manaConfig.manaFormulaPerLevelUp;
		context.manaShortRestFormula = manaConfig.manaShortRestFormula;

		// Add class information similar to hit points
		context.classes = [];
		const classes = this.actor.itemTypes.class || [];
		for (const cls of classes) {
			if (cls.system.levels > 0) {
				context.classes.push({
					anchor: cls.toAnchor().outerHTML, // Create clickable link like hit points
					levels: cls.system.levels,
					manaPerLevel: cls.system.hp?.value || 1, // Use hit die as mana per level base
				});
			}
		}

		return context;
	}

	/* -------------------------------------------- */

	/**
	 * Handle form submission.
	 * @param {Event} event - The form submission event
	 * @param {HTMLFormElement} form - The submitted form
	 * @param {FormDataExtended} formData - The form data
	 */
	async _handleFormSubmission(event, form, formData) {
		const { setMana } = await import("./mana-core.mjs");

		// Update mana values
		await setMana(
			this.actor,
			formData.object.currentMana,
			formData.object.maxMana,
		);

		// Update configuration
		await this.actor.setFlag("adrasamen", "mana.config", {
			manaFormulaPerLevelUp: formData.object.manaFormulaPerLevelUp,
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
