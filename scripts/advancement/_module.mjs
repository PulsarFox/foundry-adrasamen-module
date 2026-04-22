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

	// Register during ready phase when everything is definitely loaded
	Hooks.once("ready", () => {
		// Verify D&D5e is available
		if (typeof dnd5e === "undefined") {
			console.error("Adrasamen | D&D5e system not available!");
			return;
		}

		// Verify CONFIG.DND5E exists
		if (!CONFIG.DND5E || !CONFIG.DND5E.advancementTypes) {
			console.error("Adrasamen | CONFIG.DND5E.advancementTypes not available!");
			return;
		}

		// Log existing advancement types for debugging
		console.log("Adrasamen | Existing advancement types:", Object.keys(CONFIG.DND5E.advancementTypes));

		// Register our advancement type
		CONFIG.DND5E.advancementTypes.ManaPoints = {
			documentClass: ManaPointsAdvancement,
			validItemTypes: new Set(["class"]),
		};

		console.log("Adrasamen | Mana Points advancement type registered");
		console.log("Adrasamen | Updated advancement types:", Object.keys(CONFIG.DND5E.advancementTypes));

		// Verify our advancement class is properly structured
		console.log("Adrasamen | ManaPointsAdvancement.typeName:", ManaPointsAdvancement.typeName);
		console.log("Adrasamen | ManaPointsAdvancement.metadata:", ManaPointsAdvancement.metadata);

		// Localize immediately after registration
		try {
			ManaPointsAdvancement.localize();
			console.log("Adrasamen | ManaPoints advancement localized successfully");
		} catch (error) {
			console.warn(
				"Adrasamen | Could not localize ManaPointsAdvancement:",
				error,
			);
		}
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
