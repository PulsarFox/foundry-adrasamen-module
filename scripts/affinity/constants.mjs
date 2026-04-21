/**
 * Affinity System Constants
 */

/**
 * All available affinities in the system
 */
export const AFFINITIES = {
	WATER: "water",
	AIR: "air",
	EARTH: "earth",
	FIRE: "fire",
	ICE: "ice",
	LIGHT: "light",
	SHADOW: "shadow",
	MIND: "mind",
	ARCANE: "arcane",
};

/**
 * Affinity configuration with display names and defaults
 */
export const AFFINITY_CONFIG = {
	[AFFINITIES.WATER]: {
		label: "ADRASAMEN.Affinity.water",
		icon: "fas fa-tint",
		color: "var(--dnd5e-color-blue)",
	},
	[AFFINITIES.AIR]: {
		label: "ADRASAMEN.Affinity.air",
		icon: "fas fa-wind",
		color: "var(--dnd5e-color-faint)",
	},
	[AFFINITIES.EARTH]: {
		label: "ADRASAMEN.Affinity.earth",
		icon: "fas fa-mountain",
		color: "var(--dnd5e-color-olive)",
	},
	[AFFINITIES.FIRE]: {
		label: "ADRASAMEN.Affinity.fire",
		icon: "fas fa-fire",
		color: "var(--dnd5e-color-red)",
	},
	[AFFINITIES.ICE]: {
		label: "ADRASAMEN.Affinity.ice",
		icon: "far fa-snowflake",
		color: "var(--dnd5e-color-faint)",
	},
	[AFFINITIES.LIGHT]: {
		label: "ADRASAMEN.Affinity.light",
		icon: "fas fa-sun",
		color: "var(--dnd5e-color-gold)",
	},
	[AFFINITIES.SHADOW]: {
		label: "ADRASAMEN.Affinity.shadow",
		icon: "fas fa-moon",
		color: "var(--dnd5e-color-dark)",
	},
	[AFFINITIES.MIND]: {
		label: "ADRASAMEN.Affinity.mind",
		icon: "fas fa-brain",
		color: "var(--dnd5e-color-tan)",
	},
	[AFFINITIES.ARCANE]: {
		label: "ADRASAMEN.Affinity.arcane",
		icon: "fas fa-magic",
		color: "var(--dnd5e-color-crimson)",
	},
};

/**
 * Available characteristics for linking
 */
export const CHARACTERISTICS = {
	STR: "str",
	DEX: "dex",
	CON: "con",
	INT: "int",
	WIS: "wis",
	CHA: "cha",
};

/**
 * Default affinity data structure
 */
export function getDefaultAffinityData() {
	const data = {};
	Object.values(AFFINITIES).forEach((affinity) => {
		data[affinity] = {
			manualLevel: 0,
			isPrimary: false,
			isSecondary: false,
		};
	});
	return data;
}

/**
 * Default characteristic linking structure
 */
export function getDefaultCharacteristicLinking() {
	return {
		primary: CHARACTERISTICS.STR,
		secondary: CHARACTERISTICS.DEX,
		others: CHARACTERISTICS.WIS,
	};
}
