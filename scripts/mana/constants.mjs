export const MODULE_ID = "adrasamen";
export const MANA_FLAG = "mana";

export const EMPTY_MANA_STATE = {
	currentMana: 0,
	maxMana: 10, // Default starting mana
	isExhausted: false,
};

export const EMPTY_MANA_CONFIG = {
	manaFormulaPerLevelUp: "1d4 + @maxAffinityLevel",
	manaShortRestFormula: "floor(@maxMana / 2)",
};
