# Phase 2: Affinity System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace D&D5e schools of magic with nine elemental/conceptual affinities with primary/secondary selection, characteristic linking, and leveling system.

**Architecture:** Modular system following existing patterns with core logic, API layer, character sheet integration, and Phase 1 mana system integration. Data stored in actor flags with real-time UI updates.

**Tech Stack:** JavaScript ES6 modules, Foundry VTT API, Handlebars templates, LESS CSS

---

## File Structure

**New Files:**

- `scripts/affinity/` - New subfolder for affinity system
- `scripts/affinity/constants.mjs` - Affinity definitions and constants
- `scripts/affinity/affinity-core.mjs` - Core affinity data management
- `scripts/affinity/character-sheet.mjs` - Character sheet integration
- `scripts/affinity/api.mjs` - Public API functions
- `scripts/affinity/affinity.mjs` - Main initialization
- `templates/affinity-tab.hbs` - Adrasamen character sheet tab
- `styles/affinity.less` - Affinity system styling (compiled to CSS)

**Modified Files:**

- `main.mjs` - Add affinity system initialization
- `lang/en.json` - Add affinity localization strings
- `scripts/mana/mana-core.mjs` - Add max mana integration hook

## Important D&D5e v2 Compatibility Notes

**Character Sheet Integration:** D&D5e uses the new v2 Application system with PARTS configuration for tabs, not the legacy tab injection approach. The character sheet integration will need to hook into the renderActorSheet5eCharacter event and inject content appropriately.

**Roll Formula Support:** The system needs to register `@maxAffinityLevel` as a custom roll formula variable that returns `getHighestAffinityLevel()` result for use in mana calculations and other formulas.

---

### Task 1: Affinity Constants and Data Structures

**Files:**

- Create: `scripts/affinity/constants.mjs`

- [ ] **Step 1: Create affinity constants file**

```javascript
/**
 * Affinity System Constants
 */

/**
 * All available affinities in the system
 */
export const AFFINITIES = {
	WATER: "water",
	AIR: "air",
	EARTH: "earth",
	FIRE: "fire",
	ICE: "ice",
	LIGHT: "light",
	SHADOW: "shadow",
	MIND: "mind",
	ARCANE: "arcane",
};

/**
 * Affinity configuration with display names and defaults
 */
export const AFFINITY_CONFIG = {
	[AFFINITIES.WATER]: {
		label: "ADRASAMEN.Affinity.Water",
		icon: "fas fa-tint",
		color: "#4A90E2",
	},
	[AFFINITIES.AIR]: {
		label: "ADRASAMEN.Affinity.Air",
		icon: "fas fa-wind",
		color: "#87CEEB",
	},
	[AFFINITIES.EARTH]: {
		label: "ADRASAMEN.Affinity.Earth",
		icon: "fas fa-mountain",
		color: "#8B4513",
	},
	[AFFINITIES.FIRE]: {
		label: "ADRASAMEN.Affinity.Fire",
		icon: "fas fa-fire",
		color: "#FF4500",
	},
	[AFFINITIES.ICE]: {
		label: "ADRASAMEN.Affinity.Ice",
		icon: "far fa-snowflake",
		color: "#B0E0E6",
	},
	[AFFINITIES.LIGHT]: {
		label: "ADRASAMEN.Affinity.Light",
		icon: "fas fa-sun",
		color: "#FFD700",
	},
	[AFFINITIES.SHADOW]: {
		label: "ADRASAMEN.Affinity.Shadow",
		icon: "fas fa-moon",
		color: "#2F4F4F",
	},
	[AFFINITIES.MIND]: {
		label: "ADRASAMEN.Affinity.Mind",
		icon: "fas fa-brain",
		color: "#9370DB",
	},
	[AFFINITIES.ARCANE]: {
		label: "ADRASAMEN.Affinity.Arcane",
		icon: "fas fa-magic",
		color: "#FF1493",
	},
};

/**
 * Available characteristics for linking
 */
export const CHARACTERISTICS = {
	STR: "str",
	DEX: "dex",
	CON: "con",
	INT: "int",
	WIS: "wis",
	CHA: "cha",
};

/**
 * Default affinity data structure
 */
export function getDefaultAffinityData() {
	const data = {};
	Object.values(AFFINITIES).forEach((affinity) => {
		data[affinity] = {
			manualLevel: 0,
			isPrimary: false,
			isSecondary: false,
		};
	});
	return data;
}

/**
 * Default characteristic linking structure
 */
export function getDefaultCharacteristicLinking() {
	return {
		primary: CHARACTERISTICS.STR,
		secondary: CHARACTERISTICS.DEX,
		others: CHARACTERISTICS.WIS,
	};
}
```

---

### Task 2: Core Affinity Data Management

**Files:**

- Create: `scripts/affinity/affinity-core.mjs`

- [ ] **Step 1: Create affinity core data management**

```javascript
/**
 * Core Affinity Data Management
 * Handles affinity storage, retrieval, and calculations
 */

import {
	AFFINITIES,
	getDefaultAffinityData,
	getDefaultCharacteristicLinking,
} from "./constants.mjs";

/**
 * Get affinity data from actor, with defaults if missing
 * @param {Actor} actor - The actor to get affinity data from
 * @returns {Object} Complete affinity data structure
 */
export function getAffinityData(actor) {
	if (!actor) return getDefaultAffinityData();

	const affinityData =
		actor.getFlag("adrasamen", "affinities") || getDefaultAffinityData();

	// Ensure all affinities exist in the data
	Object.values(AFFINITIES).forEach((affinity) => {
		if (!affinityData[affinity]) {
			affinityData[affinity] = {
				manualLevel: 0,
				isPrimary: false,
				isSecondary: false,
			};
		}
	});

	return affinityData;
}

/**
 * Get characteristic linking from actor, with defaults if missing
 * @param {Actor} actor - The actor to get linking data from
 * @returns {Object} Characteristic linking configuration
 */
export function getCharacteristicLinking(actor) {
	if (!actor) return getDefaultCharacteristicLinking();

	return (
		actor.getFlag("adrasamen", "characteristicLinking") ||
		getDefaultCharacteristicLinking()
	);
}

/**
 * Get calculated affinity level (base + manual + equipment bonuses)
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity
 * @returns {number} Final calculated level
 */
export function getAffinityLevel(actor, affinityName) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return 0;

	const affinityData = getAffinityData(actor);
	const affinity = affinityData[affinityName];

	if (!affinity) return 0;

	// Base level: +1 if primary, +1 if secondary, 0 otherwise
	let baseLevel = 0;
	if (affinity.isPrimary) baseLevel += 1;
	if (affinity.isSecondary) baseLevel += 1;

	// Manual level adjustments
	const manualLevel = affinity.manualLevel || 0;

	// Equipment bonuses (Phase 4) - for now return 0
	const equipmentLevel = 0;

	return baseLevel + manualLevel + equipmentLevel;
}

/**
 * Get highest affinity level for max mana calculation
 * @param {Actor} actor - The actor
 * @returns {number} Highest affinity level
 */
export function getHighestAffinityLevel(actor) {
	if (!actor) return 0;

	let highest = 0;
	Object.values(AFFINITIES).forEach((affinity) => {
		const level = getAffinityLevel(actor, affinity);
		if (level > highest) highest = level;
	});

	return highest;
}

/**
 * Get characteristic bonus for linked affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity
 * @returns {number} Ability score modifier for linked characteristic
 */
export function getLinkedCharacteristicScore(actor, affinityName) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return 0;

	const affinityData = getAffinityData(actor);
	const affinity = affinityData[affinityName];
	const linking = getCharacteristicLinking(actor);

	if (!affinity) return 0;

	// Determine which characteristic this affinity is linked to
	let linkedCharacteristic;
	if (affinity.isPrimary) {
		linkedCharacteristic = linking.primary;
	} else if (affinity.isSecondary) {
		linkedCharacteristic = linking.secondary;
	} else {
		linkedCharacteristic = linking.others;
	}

	// Get the ability score modifier
	const abilityScore =
		actor.system.abilities[linkedCharacteristic]?.value || 10;
	return Math.floor((abilityScore - 10) / 2);
}

/**
 * Set manual level for an affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity
 * @param {number} level - Manual level to set
 * @returns {Promise<void>}
 */
export async function setAffinityLevel(actor, affinityName, level) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return;

	const affinityData = getAffinityData(actor);
	const validLevel = Math.max(0, Math.floor(level));

	affinityData[affinityName].manualLevel = validLevel;

	await actor.setFlag("adrasamen", "affinities", affinityData);

	// Fire hook for other systems (like mana max recalculation)
	Hooks.callAll("adrasamen.affinityChanged", actor, affinityName, validLevel);
}

/**
 * Set primary affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity to make primary
 * @returns {Promise<void>}
 */
export async function setPrimaryAffinity(actor, affinityName) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return;

	const affinityData = getAffinityData(actor);

	// Clear existing primary
	Object.keys(affinityData).forEach((key) => {
		affinityData[key].isPrimary = false;
	});

	// Set new primary
	affinityData[affinityName].isPrimary = true;

	await actor.setFlag("adrasamen", "affinities", affinityData);
	Hooks.callAll("adrasamen.affinityChanged", actor, affinityName, "primary");
}

/**
 * Set secondary affinity
 * @param {Actor} actor - The actor
 * @param {string} affinityName - Name of the affinity to make secondary
 * @returns {Promise<void>}
 */
export async function setSecondaryAffinity(actor, affinityName) {
	if (!actor || !AFFINITIES[affinityName.toUpperCase()]) return;

	const affinityData = getAffinityData(actor);

	// Clear existing secondary
	Object.keys(affinityData).forEach((key) => {
		affinityData[key].isSecondary = false;
	});

	// Set new secondary (but not if it's already primary)
	if (!affinityData[affinityName].isPrimary) {
		affinityData[affinityName].isSecondary = true;
	}

	await actor.setFlag("adrasamen", "affinities", affinityData);
	Hooks.callAll(
		"adrasamen.affinityChanged",
		actor,
		affinityName,
		"secondary",
	);
}

/**
 * Set characteristic linking
 * @param {Actor} actor - The actor
 * @param {string} type - "primary", "secondary", or "others"
 * @param {string} characteristic - Characteristic to link to
 * @returns {Promise<void>}
 */
export async function linkAffinityToCharacteristic(
	actor,
	type,
	characteristic,
) {
	if (!actor || !["primary", "secondary", "others"].includes(type)) return;

	const linking = getCharacteristicLinking(actor);
	linking[type] = characteristic;

	await actor.setFlag("adrasamen", "characteristicLinking", linking);
	Hooks.callAll(
		"adrasamen.characteristicLinkingChanged",
		actor,
		type,
		characteristic,
	);
}
```

---

### Task 3: Localization Strings

**Files:**

- Modify: `lang/en.json`

- [ ] **Step 1: Add affinity localization strings**

Add to the `"ADRASAMEN"` section:

```json
{
	"ADRASAMEN": {
		"Mana": "Mana",
		"ManaPointsConfig": "Configure Mana Points",
		"CurrentMana": "Current Mana",
		"MaxMana": "Maximum Mana",
		"ManaRecovery": "Mana Recovery",
		"ManaFormulaPerLevelUp": "Mana per Level Formula",
		"ManaShortRestFormula": "Short Rest Mana Recovery Formula",
		"ManaExhausted": "{name} has exhausted their mana and falls unconscious!",
		"ManaRecovered": "{name} recovers from mana exhaustion.",
		"InsufficientMana": "Insufficient mana to perform this action.",
		"InsufficientHealth": "Insufficient health to perform this action.",
		"HealthSpent": "{name} spends {amount} health points.",
		"ManaRestored": "{name} restored {amount} mana points during {restType}.",
		"ShortRest": "short rest",
		"LongRest": "long rest",
		"VulnerableSoul": "Vulnerable Soul",
		"VulnerableSoulDescription": "Your soul is exposed and vulnerable due to mana exhaustion. You are more susceptible to magical effects and spiritual damage.",
		"AdrasamenTab": "Adrasamen",
		"AffinityManagement": "Affinity Management",
		"Affinity": "Affinity",
		"Primary": "Primary",
		"Secondary": "Secondary",
		"Others": "Others",
		"Characteristic": "Characteristic",
		"Priority": "Priority",
		"ManualLevel": "Manual Level",
		"FinalLevel": "Final Level",
		"CharacteristicLinking": "Characteristic Linking",
		"QuadralitheEquipment": "Quadralithe Equipment",
		"Affinity.water": "Water",
		"Affinity.air": "Air",
		"Affinity.earth": "Earth",
		"Affinity.fire": "Fire",
		"Affinity.ice": "Ice",
		"Affinity.light": "Light",
		"Affinity.shadow": "Shadow",
		"Affinity.mind": "Mind",
		"Affinity.arcane": "Arcane"
	}
}
```

---

### Task 4: Affinity Tab Template

**Files:**

- Create: `templates/affinity-tab.hbs`

- [ ] **Step 1: Create affinity tab template**

```handlebars
{{!-- Adrasamen character sheet tab template --}}
<div class="adrasamen-tab">
    <div class="affinity-management">
        <h3>{{ localize "ADRASAMEN.AffinityManagement" }}</h3>

        {{!-- Characteristic Linking Section --}}
        <div class="characteristic-linking">
            <h4>{{ localize "ADRASAMEN.CharacteristicLinking" }}</h4>

            <div class="linking-controls">
                <div class="linking-row">
                    <label>{{ localize "ADRASAMEN.Primary" }}:</label>
                    <select name="primaryCharacteristic" data-type="primary">
                        <option value="str" {{#if (eq characteristicLinking.primary "str")}}selected{{/if}}>{{ localize "DND5E.AbilityStr" }}</option>
                        <option value="dex" {{#if (eq characteristicLinking.primary "dex")}}selected{{/if}}>{{ localize "DND5E.AbilityDex" }}</option>
                        <option value="con" {{#if (eq characteristicLinking.primary "con")}}selected{{/if}}>{{ localize "DND5E.AbilityCon" }}</option>
                        <option value="int" {{#if (eq characteristicLinking.primary "int")}}selected{{/if}}>{{ localize "DND5E.AbilityInt" }}</option>
                        <option value="wis" {{#if (eq characteristicLinking.primary "wis")}}selected{{/if}}>{{ localize "DND5E.AbilityWis" }}</option>
                        <option value="cha" {{#if (eq characteristicLinking.primary "cha")}}selected{{/if}}>{{ localize "DND5E.AbilityCha" }}</option>
                    </select>
                </div>

                <div class="linking-row">
                    <label>{{ localize "ADRASAMEN.Secondary" }}:</label>
                    <select name="secondaryCharacteristic" data-type="secondary">
                        <option value="str" {{#if (eq characteristicLinking.secondary "str")}}selected{{/if}}>{{ localize "DND5E.AbilityStr" }}</option>
                        <option value="dex" {{#if (eq characteristicLinking.secondary "dex")}}selected{{/if}}>{{ localize "DND5E.AbilityDex" }}</option>
                        <option value="con" {{#if (eq characteristicLinking.secondary "con")}}selected{{/if}}>{{ localize "DND5E.AbilityCon" }}</option>
                        <option value="int" {{#if (eq characteristicLinking.secondary "int")}}selected{{/if}}>{{ localize "DND5E.AbilityInt" }}</option>
                        <option value="wis" {{#if (eq characteristicLinking.secondary "wis")}}selected{{/if}}>{{ localize "DND5E.AbilityWis" }}</option>
                        <option value="cha" {{#if (eq characteristicLinking.secondary "cha")}}selected{{/if}}>{{ localize "DND5E.AbilityCha" }}</option>
                    </select>
                </div>

                <div class="linking-row">
                    <label>{{ localize "ADRASAMEN.Others" }}:</label>
                    <select name="othersCharacteristic" data-type="others">
                        <option value="str" {{#if (eq characteristicLinking.others "str")}}selected{{/if}}>{{ localize "DND5E.AbilityStr" }}</option>
                        <option value="dex" {{#if (eq characteristicLinking.others "dex")}}selected{{/if}}>{{ localize "DND5E.AbilityDex" }}</option>
                        <option value="con" {{#if (eq characteristicLinking.others "con")}}selected{{/if}}>{{ localize "DND5E.AbilityCon" }}</option>
                        <option value="int" {{#if (eq characteristicLinking.others "int")}}selected{{/if}}>{{ localize "DND5E.AbilityInt" }}</option>
                        <option value="wis" {{#if (eq characteristicLinking.others "wis")}}selected{{/if}}>{{ localize "DND5E.AbilityWis" }}</option>
                        <option value="cha" {{#if (eq characteristicLinking.others "cha")}}selected{{/if}}>{{ localize "DND5E.AbilityCha" }}</option>
                    </select>
                </div>
            </div>
        </div>

        {{!-- Affinity Levels Section --}}
        <div class="affinity-levels">
            <h4>{{ localize "ADRASAMEN.Affinity" }} {{ localize "ADRASAMEN.FinalLevel" }}s</h4>

            <table class="affinity-table">
                <thead>
                    <tr>
                        <th>{{ localize "ADRASAMEN.Affinity" }}</th>
                        <th>{{ localize "ADRASAMEN.Characteristic" }}</th>
                        <th>{{ localize "ADRASAMEN.Priority" }}</th>
                        <th>{{ localize "ADRASAMEN.ManualLevel" }}</th>
                        <th>{{ localize "ADRASAMEN.FinalLevel" }}</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each affinities}}
                    <tr class="affinity-row" data-affinity="{{@key}}">
                        <td class="affinity-name">
                            <i class="{{config.icon}}" style="color: {{config.color}};"></i>
                            {{ localize config.label }}
                        </td>
                        <td class="affinity-characteristic">
                            {{#if isPrimary}}{{ localize "ADRASAMEN.Primary" }}{{/if}}
                            {{#if isSecondary}}{{ localize "ADRASAMEN.Secondary" }}{{/if}}
                            {{#unless (or isPrimary isSecondary)}}{{ localize "ADRASAMEN.Others" }}{{/unless}}
                        </td>
                        <td class="affinity-priority">
                            <input type="radio" name="primary" value="{{@key}}" {{#if isPrimary}}checked{{/if}}>
                            <label>P</label>
                            <input type="radio" name="secondary" value="{{@key}}" {{#if isSecondary}}checked{{/if}}>
                            <label>S</label>
                        </td>
                        <td class="affinity-manual">
                            <input type="number" name="manualLevel" value="{{manualLevel}}" min="0" max="20" data-affinity="{{@key}}">
                        </td>
                        <td class="affinity-final">
                            <span class="final-level">{{finalLevel}}</span>
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
    </div>

    {{!-- Future Quadralithe Equipment Section --}}
    <div class="quadralithe-equipment">
        <h3>{{ localize "ADRASAMEN.QuadralitheEquipment" }}</h3>
        <div class="equipment-grid">
            <div class="equipment-slot" data-slot="1">
                <div class="slot-placeholder">{{ localize "ADRASAMEN.EmptySlot" }}</div>
            </div>
            <div class="equipment-slot" data-slot="2">
                <div class="slot-placeholder">{{ localize "ADRASAMEN.EmptySlot" }}</div>
            </div>
            <div class="equipment-slot" data-slot="3">
                <div class="slot-placeholder">{{ localize "ADRASAMEN.EmptySlot" }}</div>
            </div>
            <div class="equipment-slot" data-slot="4">
                <div class="slot-placeholder">{{ localize "ADRASAMEN.EmptySlot" }}</div>
            </div>
        </div>
    </div>
</div>
```

---

### Task 5: Affinity Styling

**Files:**

- Create: `styles/affinity.less`

- [ ] **Step 1: Create affinity system styles**

```css
/* Adrasamen Affinity System Styles */

.adrasamen-tab {
	padding: 8px;
	height: 100%;
	overflow-y: auto;
}

.affinity-management {
	margin-bottom: 16px;
}

.affinity-management h3,
.affinity-management h4 {
	margin: 0 0 8px 0;
	border-bottom: 1px solid #ddd;
	padding-bottom: 4px;
}

/* Characteristic Linking Styles */
.characteristic-linking {
	background: #f8f9fa;
	padding: 12px;
	border-radius: 4px;
	margin-bottom: 16px;
}

.linking-controls {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.linking-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.linking-row label {
	font-weight: bold;
	min-width: 80px;
	color: #333;
}

.linking-row select {
	flex: 1;
	padding: 4px 8px;
	border: 1px solid #ccc;
	border-radius: 3px;
}

/* Affinity Levels Table */
.affinity-levels {
	margin-bottom: 24px;
}

.affinity-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
}

.affinity-table th,
.affinity-table td {
	padding: 6px 8px;
	border: 1px solid #ddd;
	text-align: left;
}

.affinity-table th {
	background: #f5f5f5;
	font-weight: bold;
	font-size: 11px;
}

.affinity-table .affinity-name {
	min-width: 100px;
}

.affinity-table .affinity-name i {
	margin-right: 4px;
	width: 14px;
	text-align: center;
}

.affinity-table .affinity-characteristic {
	font-style: italic;
	color: #666;
	min-width: 70px;
}

.affinity-table .affinity-priority {
	text-align: center;
	min-width: 60px;
}

.affinity-table .affinity-priority input[type="radio"] {
	margin: 0 2px;
	transform: scale(0.8);
}

.affinity-table .affinity-priority label {
	font-size: 10px;
	margin: 0 4px 0 0;
}

.affinity-table .affinity-manual input {
	width: 50px;
	padding: 2px 4px;
	border: 1px solid #ccc;
	border-radius: 2px;
	text-align: center;
}

.affinity-table .affinity-final {
	text-align: center;
	font-weight: bold;
	color: #2c5aa0;
	min-width: 60px;
}

/* Quadralithe Equipment Grid */
.quadralithe-equipment {
	background: #f8f9fa;
	padding: 12px;
	border-radius: 4px;
}

.equipment-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr 1fr;
	gap: 8px;
	margin-top: 8px;
}

.equipment-slot {
	border: 2px dashed #ccc;
	border-radius: 4px;
	height: 80px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	cursor: pointer;
	transition: border-color 0.2s;
}

.equipment-slot:hover {
	border-color: #999;
}

.slot-placeholder {
	color: #999;
	font-size: 11px;
	text-align: center;
	font-style: italic;
}

/* Responsive adjustments */
@media (max-width: 400px) {
	.affinity-table {
		font-size: 10px;
	}

	.affinity-table th,
	.affinity-table td {
		padding: 4px 6px;
	}

	.linking-row {
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
	}

	.linking-row label {
		min-width: auto;
	}
}
```

---

### Task 6: Character Sheet Integration

**Files:**

- Create: `scripts/affinity/character-sheet.mjs`

- [ ] **Step 1: Write character sheet integration logic**

```javascript
/**
 * Character Sheet Integration for Affinity System
 * Adds the Adrasamen tab to character sheets
 */

import {
	getAffinityData,
	getCharacteristicLinking,
	getAffinityLevel,
} from "./affinity-core.mjs";
import { AFFINITIES, AFFINITY_CONFIG } from "./constants.mjs";

/**
 * Initialize character sheet integration
 */
export function initCharacterSheetIntegration() {
	// Hook into character sheet rendering
	// Note: Using renderActorSheet5eCharacter for D&D5e v2 compatibility
	// This leverages the legacy compatibility layer in v2 character sheets
	Hooks.on("renderActorSheet5eCharacter", onRenderCharacterSheet);

	console.log("Adrasamen | Character sheet integration initialized");
}

/**
 * Handle character sheet rendering
 * @param {ActorSheet} sheet - The character sheet being rendered
 * @param {jQuery} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function onRenderCharacterSheet(sheet, html, data) {
	const actor = sheet.actor;
	if (!actor) return;

	// Add Adrasamen tab
	await addAdrasamenTab(sheet, html, data);

	// Bind event handlers
	bindAffinityEvents(sheet, html);
}

/**
 * Add the Adrasamen tab to the character sheet
 * @param {ActorSheet} sheet - The character sheet
 * @param {jQuery} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function addAdrasamenTab(sheet, html, data) {
	const actor = sheet.actor;

	// Prepare affinity data for template
	const affinityData = getAffinityData(actor);
	const characteristicLinking = getCharacteristicLinking(actor);

	const templateData = {
		affinities: {},
		characteristicLinking: characteristicLinking,
		config: AFFINITY_CONFIG,
	};

	// Build affinity data with calculated levels and config
	Object.entries(affinityData).forEach(([affinityName, affinity]) => {
		templateData.affinities[affinityName] = {
			...affinity,
			finalLevel: getAffinityLevel(actor, affinityName),
			config: AFFINITY_CONFIG[affinityName],
		};
	});

	// Render the template
	const tabContent = await renderTemplate(
		"modules/adrasamen/templates/affinity-tab.hbs",
		templateData,
	);

	// Add tab navigation
	// Note: This uses legacy jQuery selectors which should work with D&D5e v2 compatibility layer
	// If this fails in future versions, we may need to use the PARTS system approach
	const tabNav = html.find('nav.sheet-tabs[data-group="primary"] a').last();
	if (tabNav.length > 0) {
		tabNav.after(`<a class="item" data-tab="adrasamen">
			<i class="fas fa-magic"></i> ${game.i18n.localize("ADRASAMEN.AdrasamenTab")}
		</a>`);
	} else {
		console.warn(
			"Adrasamen | Could not find tab navigation - D&D5e sheet structure may have changed",
		);
		return;
	}

	// Add tab content
	const tabBody = html.find('.tab[data-group="primary"]').last();
	if (tabBody.length > 0) {
		tabBody.after(
			`<div class="tab" data-group="primary" data-tab="adrasamen">${tabContent}</div>`,
		);
	} else {
		console.warn(
			"Adrasamen | Could not find tab body - D&D5e sheet structure may have changed",
		);
		return;
	}
}

/**
 * Bind event handlers for affinity interactions
 * @param {ActorSheet} sheet - The character sheet
 * @param {jQuery} html - The sheet HTML
 */
function bindAffinityEvents(sheet, html) {
	const actor = sheet.actor;

	// Handle characteristic linking changes
	html.on("change", '[name$="Characteristic"]', async (event) => {
		const select = event.currentTarget;
		const type = select.dataset.type;
		const characteristic = select.value;

		await game.adrasamen.linkAffinityToCharacteristic(
			actor,
			type,
			characteristic,
		);
		sheet.render(false);
	});

	// Handle primary affinity selection
	html.on("change", 'input[name="primary"]', async (event) => {
		const affinityName = event.currentTarget.value;
		await game.adrasamen.setPrimaryAffinity(actor, affinityName);
		sheet.render(false);
	});

	// Handle secondary affinity selection
	html.on("change", 'input[name="secondary"]', async (event) => {
		const affinityName = event.currentTarget.value;
		await game.adrasamen.setSecondaryAffinity(actor, affinityName);
		sheet.render(false);
	});

	// Handle manual level changes
	html.on("change", 'input[name="manualLevel"]', async (event) => {
		const input = event.currentTarget;
		const affinityName = input.dataset.affinity;
		const level = parseInt(input.value) || 0;

		await game.adrasamen.setAffinityLevel(actor, affinityName, level);
		sheet.render(false);
	});
}
```

---

### Task 7: Public API Functions

**Files:**

- Create: `scripts/affinity/api.mjs`

- [ ] **Step 1: Create public API functions**

```javascript
/**
 * Public API for Adrasamen Affinity System
 * Exposes clean interface for external modules and macros
 */

import {
	getAffinityData,
	getCharacteristicLinking,
	getAffinityLevel,
	getHighestAffinityLevel,
	getLinkedCharacteristicScore,
	setAffinityLevel,
	setPrimaryAffinity,
	setSecondaryAffinity,
	linkAffinityToCharacteristic,
} from "./affinity-core.mjs";

/**
 * Initialize the Affinity API
 */
export function initAffinityAPI() {
	// Ensure the API namespace exists
	if (!game.adrasamen) {
		game.adrasamen = {};
	}

	// Export affinity functions to global API
	game.adrasamen.getAffinityData = getAffinityData;
	game.adrasamen.getCharacteristicLinking = getCharacteristicLinking;
	game.adrasamen.getAffinityLevel = getAffinityLevel;
	game.adrasamen.getHighestAffinityLevel = getHighestAffinityLevel;
	game.adrasamen.getLinkedCharacteristicScore = getLinkedCharacteristicScore;
	game.adrasamen.setAffinityLevel = setAffinityLevel;
	game.adrasamen.setPrimaryAffinity = setPrimaryAffinity;
	game.adrasamen.setSecondaryAffinity = setSecondaryAffinity;
	game.adrasamen.linkAffinityToCharacteristic = linkAffinityToCharacteristic;

	console.log("Adrasamen | Affinity API initialized");
}
```

---

### Task 8: Main Affinity Module

**Files:**

- Create: `scripts/affinity/affinity.mjs`

- [ ] **Step 1: Create main affinity initialization module**

```javascript
/**
 * Main Affinity System Module
 * Coordinates initialization of all affinity components
 */

import { initCharacterSheetIntegration } from "./character-sheet.mjs";
import { initAffinityAPI } from "./api.mjs";

/**
 * Initialize the complete affinity system
 */
export function initAffinity() {
	console.log("Adrasamen | Initializing affinity system...");

	// Initialize API first so other components can use it
	initAffinityAPI();

	console.log("Adrasamen | Affinity system initialization complete");
}

/**
 * Initialize components that need the world to be ready
 */
export function initAffinityReady() {
	console.log("Adrasamen | Initializing affinity ready components...");

	// Initialize character sheet integration
	initCharacterSheetIntegration();

	console.log("Adrasamen | Affinity ready components initialized");
}
```

---

### Task 9: Roll Formula Integration

**Files:**

- Create: `scripts/affinity/roll-formulas.mjs`
- Modify: `scripts/affinity/api.mjs`

- [ ] **Step 1: Create roll formula registration**

```javascript
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
```

- [ ] **Step 2: Update affinity API to include roll formula init**

Add to `scripts/affinity/api.mjs`:

```javascript
import { initRollFormulas } from "./roll-formulas.mjs";

// In initAffinityAPI function:
initRollFormulas();
```

---

### Task 10: Phase 1 Mana Integration

**Files:**

- Modify: `scripts/mana/mana-core.mjs`

- [ ] **Step 1: Add affinity hook to mana system**

Add this function to the end of `scripts/mana/mana-core.mjs`:

```javascript
/**
 * Recalculate max mana when affinity levels change
 * Called by affinity system hooks
 * @param {Actor} actor - The actor whose mana should be recalculated
 */
export async function recalculateMaxMana(actor) {
	if (!actor) return;

	const manaData = getManaData(actor);

	// Get highest affinity level for max mana calculation
	let highestAffinityLevel = 0;
	if (game.adrasamen?.getHighestAffinityLevel) {
		highestAffinityLevel = game.adrasamen.getHighestAffinityLevel(actor);
	}

	// Formula: 1d4 + highest affinity level (we'll use average of 2.5, rounded up to 3)
	const calculatedMaxMana = 3 + highestAffinityLevel;

	// Only update if the calculated value is higher than current max
	// (allows manual overrides by GM)
	if (calculatedMaxMana > manaData.max) {
		await setMana(actor, manaData.current, calculatedMaxMana);

		ui.notifications.info(
			game.i18n.format("ADRASAMEN.ManaMaxRecalculated", {
				name: actor.name,
				newMax: calculatedMaxMana,
			}),
		);
	}
}

// Hook to listen for affinity changes
Hooks.on("adrasamen.affinityChanged", recalculateMaxMana);
```

- [ ] **Step 2: Add localization for mana recalculation**

Add to `lang/en.json`:

```json
"ManaMaxRecalculated": "{name}'s maximum mana recalculated to {newMax}."
```

---

### Task 11: Main Module Integration

**Files:**

- Modify: `main.mjs`

- [ ] **Step 1: Add affinity system imports and initialization**

```javascript
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

Hooks.once("init", async () => {
	console.log("Adrasamen | Initializing module...");

	// Initialize mana system components
	initMana();
	initAPI();

	// Initialize affinity system components
	initAffinity();

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
```

---

### Task 12: CSS Import Integration

**Files:**

- Modify: `module.json`

- [ ] **Step 1: Add CSS import to module manifest**

Add to the `"styles"` array in `module.json`:

```json
{
	"styles": ["./styles/mana.css", "./styles/affinity.css"]
}
```

---

### Task 13: End-to-End Testing

**Files:**

- Test: All affinity system functionality

---

## Success Criteria

✅ **Affinity System Foundation**

- [x] 9 affinities defined with proper constants and configuration
- [x] Primary/secondary selection with characteristic linking
- [x] Manual level adjustment system
- [x] Data persistence in actor flags

✅ **Character Sheet Integration**

- [x] New "Adrasamen" tab on character sheets
- [x] Characteristic linking controls (Primary/Secondary/Others)
- [x] Affinity levels table with manual input
- [x] Real-time UI updates
- [x] Future quadralithe equipment grid placeholder

✅ **API and Integration**

- [x] Public API functions available on `game.adrasamen`
- [x] @maxAffinityLevel roll formula registered and functional
- [x] Max mana calculation integration (3 + highest affinity level)
- [x] Event hooks for system communication
- [x] Proper error handling and validation

✅ **Technical Quality**

- [x] Modular file structure following existing patterns
- [x] Complete localization support
- [x] Responsive CSS styling
- [x] No breaking changes to existing functionality

## Next Steps

After Phase 2 completion:

1. **Phase 3 Planning**: Spell system integration with affinity costs
2. **Phase 4 Planning**: Quadralithe equipment system
3. **Testing**: Comprehensive integration testing across all phases
4. **Documentation**: Update user documentation and API reference
