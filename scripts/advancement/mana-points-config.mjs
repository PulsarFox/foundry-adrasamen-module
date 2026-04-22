/**
 * Configuration application for ManaPointsAdvancement
 */

/**
 * Configuration application for mana points advancement.
 */
export default class ManaPointsConfig
	extends dnd5e.applications.advancement.AdvancementConfigV2 {
	/** @override */
	static DEFAULT_OPTIONS = {
		classes: ["mana-points"],
	};

	/* -------------------------------------------- */

	/** @override */
	static PARTS = {
		...super.PARTS,
		manaPoints: {
			template:
				"modules/adrasamen/templates/advancement/mana-points-config.hbs",
		},
	};

	/* -------------------------------------------- */
	/*  Rendering                                   */
	/* -------------------------------------------- */

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		// Ensure configuration exists
		if (!this.advancement.configuration) {
			this.advancement.configuration = { manaDie: "1d4" };
		}

		context.configuration = this.advancement.configuration;
		context.manaDieOptions = {
			"1d4": "1d4",
			"1d6": "1d6",
			"1d8": "1d8",
			"1d10": "1d10",
			"1d12": "1d12",
		};

		return context;
	}
}
