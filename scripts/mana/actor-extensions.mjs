/**
 * Extensions to the Actor class for mana functionality
 */

/**
 * Initialize actor extensions for mana
 */
export function initActorExtensions() {
	// Add rollClassManaPoints method to actors
	CONFIG.Actor.documentClass.prototype.rollClassManaPoints = async function (
		item,
		{ chatMessage = true } = {},
	) {
		if (item.type !== "class")
			throw new Error("Mana points can only be rolled for a class item.");

		// Get mana advancement for this class
		const manaAdvancement = item.advancement.byType.ManaPoints?.[0];
		if (!manaAdvancement) {
			throw new Error(
				"This class does not have mana point advancement configured.",
			);
		}

		const config = {
			formula: `1${manaAdvancement.manaDie}`, // Use the mana die from advancement
			data: item.getRollData(),
			chatMessage,
		};

		const flavor =
			game.i18n.format(
				"ADRASAMEN.ADVANCEMENT.ManaPoints.Action.RollClass",
				{ class: item.name },
			) || `Roll Mana Points for ${item.name}`;

		const messageData = {
			title: `${flavor}: ${this.name}`,
			flavor,
			speaker: ChatMessage.implementation.getSpeaker({ actor: this }),
			"flags.adrasamen.roll": { type: "manaPoints" },
		};

		/**
		 * A hook event that fires before mana points are rolled for a character's class.
		 * @function adrasamen.preRollClassManaPoints
		 * @memberof hookEvents
		 * @param {Actor5e} actor            Actor for which the mana points are being rolled.
		 * @param {Item5e} item              The class item whose mana dice will be rolled.
		 * @param {object} config
		 * @param {string} config.formula    The string formula to parse.
		 * @param {object} config.data       The data object against which to parse attributes within the formula.
		 * @param {object} messageData       The data object to use when creating the message.
		 */
		Hooks.callAll(
			"adrasamen.preRollClassManaPoints",
			this,
			item,
			config,
			messageData,
		);

		const roll = new Roll(config.formula, config.data);
		await roll.evaluate();

		/**
		 * A hook event that fires after mana points have been rolled for a character's class.
		 * @function adrasamen.rollClassManaPoints
		 * @memberof hookEvents
		 * @param {Actor5e} actor  Actor for which the mana points have been rolled.
		 * @param {Roll} roll      The resulting roll.
		 */
		Hooks.callAll("adrasamen.rollClassManaPoints", this, roll);

		if (config.chatMessage) await roll.toMessage(messageData);
		return roll;
	};

	console.log("Adrasamen | Actor extensions initialized");
}
