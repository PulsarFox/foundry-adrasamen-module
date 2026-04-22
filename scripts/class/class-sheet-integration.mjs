/**
 * Class Sheet Integration for Adrasamen Module
 * Since mana points now work like hit points with dice configuration in the advancement,
 * this integration is simplified and mainly for future extensions.
 */

/**
 * Initialize class sheet integration
 */
export function initClassSheetIntegration() {
	// Hook into class item sheet rendering
	Hooks.on("renderItemSheet5e", onRenderItemSheet);
	console.log("Adrasamen | Class sheet integration initialized");
}

/**
 * Handle item sheet rendering
 * @param {ItemSheet} sheet - The item sheet being rendered
 * @param {HTMLElement} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function onRenderItemSheet(sheet, html, data) {
	// Only process class items
	if (sheet.item?.type !== "class") return;

	// Currently no additional fields needed since mana die is configured in advancement
	// Future enhancements can be added here
}
