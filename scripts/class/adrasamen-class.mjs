/**
 * Adrasamen Class Definition for D&D5e
 * Minimal implementation - basic class registration only
 */

/**
 * Register the Adrasamen class in D&D5e system
 */
export function registerAdrasamenClass() {
	console.log("Adrasamen | Registering Adrasamen class");

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
