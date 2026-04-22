/**
 * Configuration application for ManaPointsAdvancement
 */

/**
 * Configuration application for mana points advancement.
 */
export default class ManaPointsConfig
	extends dnd5e.applications.advancement.AdvancementConfigV2
{
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
			this.advancement.configuration = { manaDie: "d4" };
		}

		context.configuration = this.advancement.configuration;
		context.manaDieOptions = {
			d4: "d4",
			d6: "d6",
			d8: "d8",
			d10: "d10",
			d12: "d12",
		};

		return context;
	}
}
