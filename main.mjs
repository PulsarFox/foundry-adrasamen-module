/// <reference path="./foundry.d.ts" />

import { registerAdrasamenClass } from "./scripts/class/adrasamen-class.mjs";
import { initMana } from "./scripts/mana/mana.mjs";
import { initRestIntegration } from "./scripts/mana/rest-integration.mjs";
import { initTokenIntegration } from "./scripts/mana/token-integration.mjs";
import { initAPI } from "./scripts/mana/api.mjs";
import {
	initAffinity,
	initAffinityReady,
} from "./scripts/affinity/affinity.mjs";
import { initSpellCastingHooks } from "./scripts/spells/spell-casting.mjs";
import { registerAdrasamenMethod } from "./scripts/spells/adrasamen-method.mjs";
import { initializeQuadralitheEquipment, registerQuadralitheEquipmentTypes } from "./scripts/quadralithe/equipment-integration.mjs";
import { initQuadralitheConfigAPI } from "./scripts/quadralithe/config-api.mjs";


Hooks.once("init", async () => {
	console.log("Adrasamen | Starting module initialization...");

	registerQuadralitheEquipmentTypes();
	try {
		registerAdrasamenMethod();
		console.log("Adrasamen | Spellcasting method: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to register spellcasting method:", error);
	}

	// Initialize mana system components
	try {
		initMana();
		initAPI();
		console.log("Adrasamen | Mana system: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize mana system:", error);
	}

	// Initialize affinity system components
	try {
		initAffinity();
		console.log("Adrasamen | Affinity system: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize affinity system:", error);
	}

	// Initialize quadralithe equipment integration (must run in init hook)
	try {
		initializeQuadralitheEquipment();
		console.log("Adrasamen | Equipment integration: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize equipment integration:", error);
	}

	console.log("Adrasamen | Module initialization complete");
});

Hooks.once("ready", async () => {
	console.log("Adrasamen | Module ready, initializing integrations...");

	// Validate D&D5e system is available
	if (!game.dnd5e) {
		console.error(
			"Adrasamen | D&D5e system not found - quadralithe integration disabled",
		);
		return;
	}

	// Validate D&D5e CONFIG
	if (!CONFIG.DND5E) {
		console.warn("Adrasamen | CONFIG.DND5E not available");
	}

	// Check for required equipment types API
	if (!CONFIG.DND5E?.equipmentTypes) {
		console.warn("Adrasamen | D&D5e equipment types not available");
	}

	// Register the Adrasamen class (moved to ready hook for better system compatibility)
	try {
		registerAdrasamenClass();
		console.log("Adrasamen | Adrasamen class: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to register Adrasamen class:", error);
	}

	// Initialize token integration (moved to ready hook for better timing)
	try {
		initTokenIntegration();
		console.log("Adrasamen | Token integration: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize token integration:", error);
	}

	// Initialize systems that need the world to be loaded
	try {
		initRestIntegration();
		console.log("Adrasamen | Rest integration: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize rest integration:", error);
	}

	// Initialize affinity ready components
	try {
		initAffinityReady();
		console.log("Adrasamen | Affinity ready: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize affinity ready:", error);
	}

	// Initialize spell system components
	try {
		initSpellCastingHooks();
		console.log("Adrasamen | Spell system: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize spell system:", error);
	}

	// Initialize quadralithe configuration API
	try {
		initQuadralitheConfigAPI();
		console.log("Adrasamen | Quadralithe configuration API: ✓");
	} catch (error) {
		console.error("Adrasamen | Failed to initialize configuration API:", error);
	}

	console.log("Adrasamen | All systems operational");
});
