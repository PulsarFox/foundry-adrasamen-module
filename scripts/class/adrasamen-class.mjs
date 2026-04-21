/**
 * Adrasamen Class Definition for D&D5e
 * Minimal implementation - basic class registration only
 */

/**
 * Register the Adrasamen class in D&D5e system
 */
export function registerAdrasamenClass() {
	console.log("Adrasamen | Registering Adrasamen class");

	// Verify D&D5e system is available
	if (!game.system || game.system.id !== "dnd5e") {
		console.warn(
			"Adrasamen | D&D5e system not detected, skipping class registration",
		);
		return;
	}

	// Ensure CONFIG.DND5E exists
	if (!CONFIG.DND5E) {
		console.warn(
			"Adrasamen | CONFIG.DND5E not available, skipping class registration",
		);
		return;
	}

	// Ensure CONFIG.DND5E.classes exists (modern D&D5e may not have this object)
	if (!CONFIG.DND5E.classes) {
		console.log("Adrasamen | Initializing CONFIG.DND5E.classes object");
		CONFIG.DND5E.classes = {};
	}

	// Define the Adrasamen class
	CONFIG.DND5E.classes.adrasamen = {
		name: "Adrasamen",
		hitDie: "d8",
		primaryAbility: ["str", "dex", "con", "int", "wis", "cha"],
		saves: [],
		skills: {
			number: 2,
			choices: Object.keys(CONFIG.DND5E.skills),
		},
		armorProf: [],
		weaponProf: [],
		toolProf: [],
	};

	console.log("Adrasamen | Class registered successfully");
}
