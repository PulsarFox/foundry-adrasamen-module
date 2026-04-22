/// <reference path="./foundry.d.ts" />

import { registerAdrasamenClass } from "./scripts/class/adrasamen-class.mjs";
import { initClassSheetIntegration } from "./scripts/class/class-sheet-integration.mjs";
import { initMana } from "./scripts/mana/mana.mjs";
import { initRestIntegration } from "./scripts/mana/rest-integration.mjs";
import { initTokenIntegration } from "./scripts/mana/token-integration.mjs";
import { initAPI } from "./scripts/mana/api.mjs";
import {
	initAffinity,
	initAffinityReady,
} from "./scripts/affinity/affinity.mjs";
import { initAdvancementSystem } from "./scripts/advancement/_module.mjs";
import {
	extendCharacterSchema,
	registerManaAsTrackableAttribute,
} from "./scripts/mana/attributes-integration.mjs";
import { initDataSync } from "./scripts/mana/data-sync.mjs";
import { initActorExtensions } from "./scripts/mana/actor-extensions.mjs";
import { initManaDataPreparation } from "./scripts/mana/data-preparation.mjs";
import { initAdvancementHooks } from "./scripts/advancement/advancement-hooks.mjs";
import { debugManaState } from "./scripts/mana/debug.mjs";

Hooks.once("init", async () => {
	console.log("Adrasamen | Initializing module...");

	// Extend D&D5e character schema BEFORE anything else (schema must be extended first)
	extendCharacterSchema();

	// Initialize data synchronization
	initDataSync();

	// Initialize actor extensions
	initActorExtensions();

	// Initialize mana data preparation
	initManaDataPreparation();

	// Initialize mana system components
	initMana();
	initAPI();

	// Initialize affinity system components
	initAffinity();

	// Initialize advancement system
	initAdvancementSystem();

	// Initialize class sheet integration
	initClassSheetIntegration();

	console.log("Adrasamen | Module initialization complete");
});

Hooks.once("setup", async () => {
	console.log("Adrasamen | Setting up module...");

	// Register mana as trackable attribute for tokens (after D&D5e has set up trackable attributes)
	registerManaAsTrackableAttribute();

	console.log("Adrasamen | Module setup complete");
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

	// Initialize advancement hooks
	initAdvancementHooks();

	// Update global API with new sync methods
	game.adrasamen = {
		...game.adrasamen,
		// Add new sync methods
		syncFlagsToAttributes: async (actor) => {
			const { syncFlagsToAttributes } =
				await import("./scripts/mana/data-sync.mjs");
			return syncFlagsToAttributes(actor);
		},
		syncAttributesToFlags: async (actor) => {
			const { syncAttributesToFlags } =
				await import("./scripts/mana/data-sync.mjs");
			return syncAttributesToFlags(actor);
		},
		// Debug utilities
		debugManaState: debugManaState,
	};

	console.log("Adrasamen | All systems operational");
});
