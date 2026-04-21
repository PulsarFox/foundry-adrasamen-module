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
import { initAdvancementSystem } from "./scripts/advancement/_module.mjs";

Hooks.once("init", async () => {
	console.log("Adrasamen | Initializing module...");

	// Initialize mana system components
	initMana();
	initAPI();

	// Initialize affinity system components
	initAffinity();

	// Initialize advancement system
	initAdvancementSystem();

	console.log("Adrasamen | Module initialization complete");
});

Hooks.once("ready", async () => {
	console.log("Adrasamen | Module ready");

	// Register the Adrasamen class (moved to ready hook for better system compatibility)
	registerAdrasamenClass();

	// Initialize token integration (moved to ready hook for better timing)
	initTokenIntegration();

	// Initialize systems that need the world to be loaded
	initRestIntegration();

	// Initialize affinity ready components
	initAffinityReady();

	console.log("Adrasamen | All systems operational");
});
