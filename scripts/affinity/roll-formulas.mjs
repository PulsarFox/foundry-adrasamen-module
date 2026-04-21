/**
 * Roll Formula Integration for Affinity System
 * Registers custom roll formula variables for use in sheets and macros
 */

import { getHighestAffinityLevel } from "./affinity-core.mjs";

/**
 * Register custom roll formula variables
 */
export function initRollFormulas() {
	// Register @maxAffinityLevel for use in formulas
	if (CONFIG.DND5E.rollMatchers) {
		// D&D5e v2 approach - add to roll matchers if available
		CONFIG.DND5E.rollMatchers.maxAffinityLevel = (actor) => {
			return getHighestAffinityLevel(actor);
		};
	} else {
		// Fallback approach - hook into roll data preparation
		Hooks.on("prepareDerivedData", (actor) => {
			if (actor.type === "character") {
				// Add to roll data for formula access
				actor.getRollData = (function (originalGetRollData) {
					return function () {
						const data = originalGetRollData?.call(this) || {};
						data.maxAffinityLevel = getHighestAffinityLevel(this);
						return data;
					};
				})(actor.getRollData);
			}
		});
	}

	console.log("Adrasamen | Roll formula @maxAffinityLevel registered");
}
