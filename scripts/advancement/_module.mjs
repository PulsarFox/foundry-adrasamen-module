/**
 * Adrasamen Advancement Types
 * Custom advancement types for the Adrasamen magic system
 */

import ManaPointsAdvancement from "./mana-points.mjs";

/**
 * Initialize advancement system integration
 */
export function initAdvancementSystem() {
	console.log("Adrasamen | Initializing advancement system integration");

	// Wait for Foundry to be fully loaded
	Hooks.once("ready", () => {
		// Register custom advancement types in D&D5e CONFIG
		if (!CONFIG.DND5E.advancementTypes) {
			CONFIG.DND5E.advancementTypes = {};
		}

		CONFIG.DND5E.advancementTypes.ManaPoints = {
			documentClass: ManaPointsAdvancement,
			validItemTypes: new Set(["class"]),
		};

		// Call localize on our advancement class
		try {
			ManaPointsAdvancement.localize();
		} catch (error) {
			console.warn(
				"Adrasamen | Could not localize ManaPointsAdvancement:",
				error,
			);
		}

		console.log("Adrasamen | Mana Points advancement type registered");
	});

	// Hook into advancement creation to validate our advancement types
	Hooks.on("preCreateDocument", (document, data, options, userId) => {
		if (document.documentName !== "Item") return true;

		// Validate advancement types in the item
		const advancements = data.system?.advancement;
		if (!advancements) return true;

		for (const advancement of Object.values(advancements)) {
			if (advancement.type === "ManaPoints") {
				// Ensure only one mana points advancement per class
				const existingManaAdvancement = Object.values(
					advancements,
				).filter((a) => a.type === "ManaPoints").length;
				if (existingManaAdvancement > 1) {
					ui.notifications.error(
						game.i18n.localize(
							"ADRASAMEN.ADVANCEMENT.ManaPoints.OnlyOneAllowed",
						),
					);
					return false;
				}
			}
		}

		return true;
	});

	console.log("Adrasamen | Advancement system hooks registered");
}
