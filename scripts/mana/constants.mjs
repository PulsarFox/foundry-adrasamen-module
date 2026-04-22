export const MODULE_ID = "adrasamen";
export const MANA_FLAG = "mana";

export const EMPTY_MANA_STATE = {
	currentMana: 0,
	maxMana: 0, // No default mana - must be gained through advancement
	isExhausted: false,
};

export const EMPTY_MANA_CONFIG = {
	manaShortRestFormula: "floor(@maxMana / 2)",
};
