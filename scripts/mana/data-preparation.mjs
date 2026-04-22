/**
 * Character data preparation hooks for mana
 */

import { prepareManaPoints } from "./attributes-integration.mjs";

/**
 * Initialize mana data preparation hooks
 */
export function initManaDataPreparation() {
	// Hook into character data model preparation specifically
	const originalPrepare =
		dnd5e.dataModels.actor.CharacterData.prototype.prepareDerivedData;

	dnd5e.dataModels.actor.CharacterData.prototype.prepareDerivedData =
		function () {
			originalPrepare.call(this);

			// Prepare mana attributes if they exist
			if (this.attributes?.mana) {
				const manaOptions = {};
				// Only calculate if max is null (exactly like HP system)
				if (this.attributes.mana.max === null) {
					const rollData = this.parent.getRollData();
					manaOptions.advancement = Object.values(this.parent.classes)
						.map((c) => c.advancement.byType.ManaPoints?.[0])
						.filter((a) => a);
					manaOptions.bonus =
						dnd5e.utils.simplifyBonus(
							this.attributes.mana.bonuses?.level || "",
							rollData,
						) *
							this.details.level +
						dnd5e.utils.simplifyBonus(
							this.attributes.mana.bonuses?.overall || "",
							rollData,
						);
					manaOptions.mod = getMaxAffinityLevel(this.parent);
				}
				prepareManaPoints(this.attributes.mana, manaOptions);
			}
		};

	console.log("Adrasamen | Mana data preparation hooks initialized");
}

/**
 * Get the maximum affinity level for an actor
 * @param {Actor} actor - The actor to get the affinity level for
 * @returns {number} The highest affinity level
 */
function getMaxAffinityLevel(actor) {
	try {
		const { getHighestAffinityLevel } = game.adrasamen || {};
		if (!getHighestAffinityLevel) return 0;
		return getHighestAffinityLevel(actor) || 0;
	} catch (error) {
		console.warn("Adrasamen | Could not get affinity level:", error);
		return 0;
	}
}
