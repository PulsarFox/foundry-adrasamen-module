# Phase 1.5: Mana System Attributes Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate mana system with D&D5e's native attributes system and create a working advancement system for mana points.

**Architecture:** Extend D&D5e's actor data model to include mana as a native attribute alongside HP/AC. Create data synchronization between flags and attributes. Fix the existing mana advancement system to work with the new attribute structure.

**Tech Stack:** FoundryVTT D&D5e system hooks, actor data model extensions, advancement system integration

---

## File Structure

**Extensions Required:**

- Extend: `scripts/mana/mana-core.mjs` - Add attributes integration
- Create: `scripts/mana/attributes-integration.mjs` - D&D5e attributes extension
- Modify: `scripts/advancement/mana-points.mjs` - Fix advancement system
- Modify: `main.mjs` - Register attribute extensions
- Create: `scripts/mana/data-sync.mjs` - Sync flags with attributes

**Files being created/modified:**

- Create: `scripts/mana/attributes-integration.mjs` - Extends D&D5e schema
- Create: `scripts/mana/data-sync.mjs` - Bidirectional sync system
- Modify: `scripts/mana/mana-core.mjs` - Add attributes support
- Modify: `scripts/mana/mana.mjs` - Update sheet rendering for attributes
- Modify: `templates/mana-bar.hbs` - Update template for attributes
- Modify: `scripts/advancement/mana-points.mjs` - Fix to work with attributes
- Modify: `main.mjs` - Hook registration

---

## Task 1: D&D5e Attributes Schema Extension

**Files:**

- Create: `scripts/mana/attributes-integration.mjs`

- [ ] **Step 1: Create attributes integration module**

```javascript
// scripts/mana/attributes-integration.mjs
/**
 * Extends D&D5e's actor data schema to include mana attributes
 */

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * Mana attributes field definition matching HP structure
 * @type {Object}
 */
export const manaAttributes = {
	max: new NumberField({
		nullable: true,
		integer: true,
		min: 0,
		initial: null,
		label: "ADRASAMEN.ManaPointsMax",
	}),
	value: new NumberField({
		nullable: true,
		integer: true,
		min: 0,
		initial: null,
		label: "ADRASAMEN.ManaPointsCurrent",
	}),
	temp: new NumberField({
		integer: true,
		initial: 0,
		min: 0,
		label: "ADRASAMEN.ManaPointsTemp",
	}),
	tempmax: new NumberField({
		integer: true,
		initial: 0,
		label: "ADRASAMEN.ManaPointsTempMax",
	}),
	bonuses: new SchemaField({
		level: new NumberField({
			integer: true,
			initial: 0,
			label: "ADRASAMEN.ManaPointsBonusLevel",
		}),
		overall: new NumberField({
			integer: true,
			initial: 0,
			label: "ADRASAMEN.ManaPointsBonusOverall",
		}),
	}),
};

/**
 * Extend D&D5e character data schema to include mana
 */
export function extendCharacterSchema() {
	// Get the original defineSchema method
	const originalDefineSchema =
		dnd5e.dataModels.actor.CharacterData.defineSchema;

	// Override to include mana in attributes
	dnd5e.dataModels.actor.CharacterData.defineSchema = function () {
		const schema = originalDefineSchema.call(this);

		// Add mana to attributes schema
		schema.attributes.fields.mana = new SchemaField(manaAttributes, {
			label: "ADRASAMEN.ManaPoints",
		});

		return schema;
	};

	console.log(
		"Adrasamen | Extended D&D5e character schema with mana attributes",
	);
}

/**
 * Make mana trackable as a token resource like HP
 */
export function registerManaAsTrackableAttribute() {
	// Add mana to trackable attributes for tokens
	CONFIG.Actor.trackableAttributes.character.push("attributes.mana");

	console.log("Adrasamen | Registered mana as trackable attribute");
}
```

- [ ] **Step 2: Verify schema extension works by testing in FoundryVTT console**

---

## Task 2: Data Synchronization System

**Files:**

- Create: `scripts/mana/data-sync.mjs`

- [ ] **Step 1: Create data synchronization module**

```javascript
// scripts/mana/data-sync.mjs
/**
 * Bidirectional synchronization between flags and attributes for mana
 */

/**
 * Sync mana from flags to attributes
 * @param {Actor} actor - The actor to sync
 */
export async function syncFlagsToAttributes(actor) {
	if (actor.type !== "character") return;

	const flagMana = actor.getFlag("adrasamen", "mana");
	if (!flagMana) return;

	const attributeMana = actor.system.attributes?.mana;
	if (!attributeMana) return;

	// Only sync if different
	const needsSync =
		attributeMana.value !== flagMana.current ||
		attributeMana.max !== flagMana.max;

	if (needsSync) {
		await actor.update(
			{
				"system.attributes.mana.value": flagMana.current || 0,
				"system.attributes.mana.max": flagMana.max || 0,
			},
			{ adrasamenSync: true },
		); // Flag to prevent infinite loops

		console.log("Adrasamen | Synced flags to attributes");
	}
}

/**
 * Sync mana from attributes to flags
 * @param {Actor} actor - The actor to sync
 */
export async function syncAttributesToFlags(actor) {
	if (actor.type !== "character") return;

	const attributeMana = actor.system.attributes?.mana;
	if (!attributeMana) return;

	const flagMana = actor.getFlag("adrasamen", "mana") || {};

	// Only sync if different
	const needsSync =
		flagMana.current !== attributeMana.value ||
		flagMana.max !== attributeMana.max;

	if (needsSync) {
		await actor.setFlag("adrasamen", "mana", {
			...flagMana,
			current: attributeMana.value || 0,
			max: attributeMana.max || 0,
		});

		console.log("Adrasamen | Synced attributes to flags");
	}
}

/**
 * Initialize sync hooks for automatic synchronization
 */
export function initDataSync() {
	// Sync flags to attributes when actor is created/updated
	Hooks.on("createActor", syncFlagsToAttributes);

	// Sync attributes to flags when system data changes
	Hooks.on("updateActor", (actor, updates, options) => {
		// Avoid infinite loops
		if (options.adrasamenSync) return;

		// Check if mana attributes were updated
		if (updates.system?.attributes?.mana) {
			syncAttributesToFlags(actor);
		}
	});

	// Sync flags to attributes when flags change
	Hooks.on("updateActor", (actor, updates, options) => {
		// Avoid infinite loops
		if (options.adrasamenSync) return;

		// Check if mana flags were updated
		if (updates.flags?.adrasamen?.mana) {
			syncFlagsToAttributes(actor);
		}
	});

	console.log("Adrasamen | Initialized mana data synchronization");
}
```

- [ ] **Step 2: Test synchronization in FoundryVTT console**

---

## Task 3: Update Mana Core for Attributes

**Files:**

- Modify: `scripts/mana/mana-core.mjs`

- [ ] **Step 1: Update mana core to use attributes**

```javascript
// Update getManaData function in scripts/mana/mana-core.mjs
export function getManaData(actor) {
	if (!actor) return { current: 0, max: 0, percentage: 0 };

	// Prefer attributes over flags, but fall back to flags for compatibility
	let manaData;
	if (actor.system.attributes?.mana) {
		manaData = {
			current: actor.system.attributes.mana.value || 0,
			max: actor.system.attributes.mana.max || 0,
		};
	} else {
		// Fallback to flags for backward compatibility
		manaData = actor.getFlag("adrasamen", "mana") || {
			current: 0,
			max: 0,
		};
	}

	// Ensure we have valid numbers
	manaData.current = Number(manaData.current) || 0;
	manaData.max = Number(manaData.max) || 0;

	// Calculate percentage for UI
	manaData.percentage =
		manaData.max > 0
			? Math.floor((manaData.current / manaData.max) * 100)
			: 0;

	return manaData;
}

// Update setMana function
export async function setMana(actor, current, max) {
	if (!actor) return;

	const validatedData = validateMana(current, max);

	// Update both attributes and flags for compatibility
	const updates = {};

	if (actor.system.attributes?.mana !== undefined) {
		// Use attributes if available
		updates["system.attributes.mana.value"] = validatedData.current;
		updates["system.attributes.mana.max"] = validatedData.max;
	}

	await actor.update(updates);

	// Also update flags for backward compatibility
	await actor.setFlag("adrasamen", "mana", {
		current: validatedData.current,
		max: validatedData.max,
	});

	// Fire custom event for other systems to react
	Hooks.callAll("adrasamen.manaChanged", actor, validatedData);
}
```

- [ ] **Step 2: Test updated mana core in FoundryVTT**

---

## Task 4: Update Character Sheet Templates and Rendering

**Files:**

- Modify: `scripts/mana/mana.mjs`
- Modify: `templates/mana-bar.hbs`

- [ ] **Step 1: Update mana bar template to use attributes**

```handlebars
{{! Update mana-bar.hbs to work with both attributes and flags }}
<div class="meter-group mana-container">
	<div class="label roboto-condensed-upper">
		<span>{{localize "ADRASAMEN.Mana"}}</span>
		{{#if editable}}
			<button
				type="button"
				class="config-button unbutton"
				data-action="showConfiguration"
				data-config="manaPoints"
				data-tooltip="ADRASAMEN.ManaPointsConfig"
				aria-label="{{localize 'ADRASAMEN.ManaPointsConfig'}}"
			>
				<i class="fas fa-cog" inert></i>
			</button>
		{{/if}}
	</div>
	{{#with manaData}}
		<div class="meter sectioned mana-points">
			<div
				class="progress mana-points"
				role="meter"
				aria-valuemin="0"
				aria-valuenow="{{current}}"
				aria-valuemax="{{max}}"
				style="--bar-percentage: {{percentage}}%"
			>
				<div class="label">
					<span class="value">{{current}}</span>
					<span class="separator">&sol;</span>
					<span class="max">{{max}}</span>
				</div>
				{{! Use attributes path for form inputs }}
				<input
					type="number"
					name="system.attributes.mana.value"
					class="mana-current-input"
					data-dtype="Number"
					placeholder="0"
					value="{{current}}"
					hidden
				/>
				<input
					type="number"
					name="system.attributes.mana.max"
					class="mana-max-input"
					data-dtype="Number"
					placeholder="0"
					value="{{max}}"
					hidden
				/>
			</div>
		</div>
	{{/with}}
</div>
```

- [ ] **Step 2: Update mana sheet rendering to use attributes data**

```javascript
// Update onRenderCharacterActorSheet in mana.mjs
const onRenderCharacterActorSheet = async (sheet, html) => {
	console.log("Adrasamen | Rendering mana bar on character sheet");

	if (html.querySelector(".mana-container")) return;

	const anchor = html.querySelector(".stats .meter-group:last-of-type");
	if (!anchor) return;

	// Get mana data - prefer attributes, fall back to flags
	let manaData;
	if (sheet.actor.system.attributes?.mana) {
		manaData = {
			current: sheet.actor.system.attributes.mana.value || 0,
			max: sheet.actor.system.attributes.mana.max || 0,
		};
	} else {
		manaData = getManaData(sheet.actor);
	}

	// Calculate percentage
	manaData.percentage =
		manaData.max > 0
			? Math.floor((manaData.current / manaData.max) * 100)
			: 0;

	// Render the mana bar template
	const manaBarHtml = await renderTemplate(
		"modules/adrasamen/templates/mana-bar.hbs",
		{
			manaData: manaData,
			editable: sheet.isEditMode,
		},
	);

	// Insert after the last meter group
	anchor.insertAdjacentHTML("afterend", manaBarHtml);

	// Add event listeners
	addManaBarListeners(sheet, html);
};
```

- [ ] **Step 3: Update event listeners for attribute-based inputs**

```javascript
// Update addManaBarListeners function
function addManaBarListeners(sheet, html) {
	// Listen for mana configuration button clicks
	html.querySelector(
		".config-button[data-config='manaPoints']",
	)?.addEventListener("click", async (event) => {
		event.preventDefault();
		await showManaConfiguration(sheet.actor);
	});

	// Listen for direct mana value changes (attributes-based)
	const currentInput = html.querySelector(".mana-current-input");
	const maxInput = html.querySelector(".mana-max-input");

	if (currentInput) {
		currentInput.addEventListener("change", async (event) => {
			const newValue = parseInt(event.target.value) || 0;
			await sheet.actor.update({
				"system.attributes.mana.value": newValue,
			});
			sheet.render(false);
		});
	}

	if (maxInput) {
		maxInput.addEventListener("change", async (event) => {
			const newMax = parseInt(event.target.value) || 0;
			await sheet.actor.update({
				"system.attributes.mana.max": newMax,
			});
			sheet.render(false);
		});
	}

	// Listen for mana bar clicks to show/hide inputs
	const manaBar = html.querySelector(".mana-points .progress");
	if (manaBar) {
		manaBar.addEventListener("click", (event) => {
			const currentInput = html.querySelector(".mana-current-input");
			if (currentInput) {
				currentInput.hidden = !currentInput.hidden;
				if (!currentInput.hidden) {
					currentInput.focus();
					currentInput.select();
				}
			}
		});
	}
}
```

- [ ] **Step 4: Test template and rendering updates in FoundryVTT**

---

## Task 5: Fix Mana Points Advancement

**Files:**

- Modify: `scripts/advancement/mana-points.mjs`

- [ ] **Step 1: Fix advancement system to work with attributes**

```javascript
// Update apply method in scripts/advancement/mana-points.mjs
async apply(level, data, options = {}) {
	// Handle initial application like D&D5e does for hit points
	if (options.initial) {
		if (level === 1 && this.item.isOriginalClass) data[level] = "max";
		else if (this.value[level - 1] === "avg") data[level] = "avg";
	}

	let value = this.constructor.valueForLevel(
		data,
		this.manaDieValue,
		level,
	);
	if (value === undefined) return;
	if (this.value[level] !== undefined) await this.reverse(level);
	this.updateSource({ value: data });

	const applicableValue = this.#getApplicableValue(value);

	// Update actor's mana using system.attributes (preferred) or flags (fallback)
	const updates = {};

	if (this.actor.system.attributes?.mana !== undefined) {
		// Use D&D5e attributes system
		const currentManaValue = this.actor.system.attributes.mana.value || 0;
		const currentManaMax = this.actor.system.attributes.mana.max || 0;

		updates["system.attributes.mana.value"] = Math.min(
			currentManaValue + applicableValue,
			currentManaMax + applicableValue,
		);
		updates["system.attributes.mana.max"] = currentManaMax + applicableValue;
	} else {
		// Fallback to flags for backward compatibility
		const flagMana = this.actor.getFlag("adrasamen", "mana") || { current: 0, max: 0 };

		await this.actor.setFlag("adrasamen", "mana", {
			current: Math.min(
				flagMana.current + applicableValue,
				flagMana.max + applicableValue
			),
			max: flagMana.max + applicableValue
		});
	}

	if (Object.keys(updates).length > 0) {
		await this.actor.update(updates);
	}

	return {};
}

// Update reverse method similarly
async reverse(level, options = {}) {
	let value = this.valueForLevel(level);
	if (value === undefined) return;
	const source = { [level]: this.value[level] };
	this.updateSource({ [`value.-=${level}`]: null });

	const applicableValue = this.#getApplicableValue(value);

	// Update actor's mana using system.attributes (preferred) or flags (fallback)
	const updates = {};

	if (this.actor.system.attributes?.mana !== undefined) {
		// Use D&D5e attributes system
		const currentManaValue = this.actor.system.attributes.mana.value || 0;
		const currentManaMax = this.actor.system.attributes.mana.max || 0;
		const newManaMax = Math.max(0, currentManaMax - applicableValue);

		updates["system.attributes.mana.value"] = Math.min(currentManaValue, newManaMax);
		updates["system.attributes.mana.max"] = newManaMax;
	} else {
		// Fallback to flags for backward compatibility
		const flagMana = this.actor.getFlag("adrasamen", "mana") || { current: 0, max: 0 };
		const newManaMax = Math.max(0, flagMana.max - applicableValue);

		await this.actor.setFlag("adrasamen", "mana", {
			current: Math.min(flagMana.current, newManaMax),
			max: newManaMax
		});
	}

	if (Object.keys(updates).length > 0) {
		await this.actor.update(updates);
	}

	return source;
}
```

- [ ] **Step 2: Test advancement system in FoundryVTT with level-up**

---

## Task 6: Integration and Module Registration

**Files:**

- Modify: `main.mjs`

- [ ] **Step 1: Update main module registration**

```javascript
// Add to main.mjs import section
import {
	extendCharacterSchema,
	registerManaAsTrackableAttribute,
} from "./scripts/mana/attributes-integration.mjs";
import { initDataSync } from "./scripts/mana/data-sync.mjs";

// Update Hooks.once("init", async function() {}) section
Hooks.once("init", async function () {
	console.log("Adrasamen | Initializing module");

	// Register module configuration
	registerModuleSettings();

	// Extend D&D5e character schema BEFORE anything else
	extendCharacterSchema();

	// Register mana as trackable attribute for tokens
	registerManaAsTrackableAttribute();

	// Initialize data synchronization
	initDataSync();

	// Initialize existing systems
	initMana();
	initAffinity();
	initAdvancement();
	initAdrasamenClass();

	// Register API
	game.adrasamen = {
		// Existing API methods
		getManaData,
		setMana,
		spendMana,
		gainMana,
		// Add new methods
		syncFlagsToAttributes: (actor) =>
			import("./scripts/mana/data-sync.mjs").then((m) =>
				m.syncFlagsToAttributes(actor),
			),
		syncAttributesToFlags: (actor) =>
			import("./scripts/mana/data-sync.mjs").then((m) =>
				m.syncAttributesToFlags(actor),
			),
	};

	console.log("Adrasamen | Module initialization complete");
});

// Add ready hook for post-initialization sync
Hooks.once("ready", async function () {
	console.log("Adrasamen | Running post-initialization tasks");

	// Sync existing actors on world load
	for (let actor of game.actors.filter((a) => a.type === "character")) {
		if (actor.getFlag("adrasamen", "mana")) {
			await game.adrasamen.syncFlagsToAttributes(actor);
		}
	}

	console.log("Adrasamen | Post-initialization complete");
});
```

- [ ] **Step 2: Test full integration in FoundryVTT**

---

## Task 7: Token Resource Configuration

**Files:**

- Modify: `scripts/mana/token-integration.mjs`

- [ ] **Step 1: Update token integration for attributes**

```javascript
// Update scripts/mana/token-integration.mjs
/**
 * Token Integration for Mana System with D&D5e Attributes
 */

/**
 * Register mana as a trackable attribute for tokens
 */
export function registerManaTokenResource() {
	// Add mana to trackable attributes if not already present
	const trackableAttrs = CONFIG.Actor.trackableAttributes.character;
	if (!trackableAttrs.includes("attributes.mana")) {
		trackableAttrs.push("attributes.mana");
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
```

- [ ] **Step 2: Test token integration in FoundryVTT with token bars**

---

## Self-Review

**Spec coverage:**
✓ Add mana to `actor.system.attributes` - Task 1 extends D&D5e schema
✓ Create advancement system for mana - Task 4 fixes existing advancement
✓ Handle difference between flags and attributes - Task 2 creates bidirectional sync
✓ Make advancement work properly - Tasks 3,4,5 integrate everything
✓ Token integration - Task 6 ensures tokens work with attributes

**Placeholder scan:** No TBD, TODO, or incomplete implementations found.

**Type consistency:** All mana data uses consistent structure with value/max properties matching D&D5e HP patterns.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-22-mana-attributes-integration.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
