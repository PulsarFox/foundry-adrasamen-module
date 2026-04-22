/**
 * Token Integration for Mana System with D&D5e Attributes
 */

/**
 * Register mana as a trackable attribute for tokens
 */
export function registerManaTokenResource() {
	// Add mana to trackable attributes if not already present
	const trackableAttrs = CONFIG.Actor.trackableAttributes.character;
	if (
		trackableAttrs &&
		trackableAttrs.bar &&
		!trackableAttrs.bar.includes("attributes.mana")
	) {
		trackableAttrs.bar.push("attributes.mana");
		console.log("Adrasamen | Registered mana as trackable token attribute");
	}
}

/**
 * Handle token mana bar updates
 */
export function initTokenManaHooks() {
	// Update token bars when mana changes
	Hooks.on("adrasamen.manaChanged", (actor, manaData) => {
		// Update all tokens for this actor
		actor.getActiveTokens().forEach((token) => {
			// Check if any bar is configured for mana
			const bar1Attr = token.document.bar1?.attribute;
			const bar2Attr = token.document.bar2?.attribute;

			if (
				bar1Attr === "attributes.mana" ||
				bar2Attr === "attributes.mana"
			) {
				// Force token refresh to show updated mana
				token.drawBars();
			}
		});
	});

	console.log("Adrasamen | Initialized token mana update hooks");
}

/**
 * Add mana to token resource options in UI
 */
export function enhanceTokenConfig() {
	// This enhances the token configuration dialog to better display mana
	Hooks.on("renderTokenConfig", (app, html, data) => {
		// Find mana in the attribute options and add better labeling
		const manaOptions = html.find('option[value="attributes.mana"]');
		if (manaOptions.length > 0) {
			manaOptions.text("Mana Points");
		}
	});
}

/**
 * Initialize all token integration features
 */
export function initTokenIntegration() {
	registerManaTokenResource();
	initTokenManaHooks();
	enhanceTokenConfig();

	console.log("Adrasamen | Token integration initialized");
}
