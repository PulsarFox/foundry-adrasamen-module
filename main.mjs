/// <reference path="./foundry.d.ts" />

import { registerAdrasamenClass } from "./scripts/class/adrasamen-class.mjs";
import { initMana } from "./scripts/mana/mana.mjs";
import { initRestIntegration } from "./scripts/mana/rest-integration.mjs";
import { initTokenIntegration } from "./scripts/mana/token-integration.mjs";
import { initAPI } from "./scripts/mana/api.mjs";

Hooks.once("init", async () => {
	console.log("Adrasamen | Initializing module...");

	// Register the Adrasamen class
	registerAdrasamenClass();

	// Initialize mana system components
	initMana();
	initTokenIntegration();
	initAPI();

	console.log("Adrasamen | Module initialization complete");
});

Hooks.once("ready", async () => {
	console.log("Adrasamen | Module ready");

	// Initialize systems that need the world to be loaded
	initRestIntegration();

	console.log("Adrasamen | All systems operational");
