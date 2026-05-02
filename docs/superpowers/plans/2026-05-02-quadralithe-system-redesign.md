# Quadralithe Equipment System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement redesigned quadralithe equipment system with formula-based effects, D&D5e integration, and 2x2 grid functionality

**Architecture:** Hybrid system maintaining existing 2x2 grid UI while implementing robust D&D5e equipment backend with formula evaluation engine and deep integration with mana/affinity/spell systems

**Tech Stack:** Foundry VTT v14, D&D5e system v4, JavaScript ES modules, Handlebars templates

---

## File Structure Overview

### New Files
- `scripts/quadralithe/quadralithe-core.mjs` - Core equipment management and actor integration
- `scripts/quadralithe/formula-evaluator.mjs` - Universal formula evaluation system
- `scripts/quadralithe/equipment-integration.mjs` - D&D5e equipment type and item sheet integration  
- `scripts/quadralithe/ui-integration.mjs` - Grid UI, drag & drop, and inventory integration
- `templates/quadralithe-config.hbs` - Equipment configuration template for item sheets

### Modified Files
- `scripts/mana/mana-core.mjs` - Replace hardcoded "4" with Nexus calculation
- `scripts/affinity/affinity-core.mjs` - Add Morphos bonuses to affinity level calculation
- `scripts/spells/cost-calculation.mjs` - Add Nexus reductions and zero affinity penalty
- `scripts/spells/spell-casting.mjs` - Add Radiant attack bonuses and spellcasting modifier
- `templates/affinity-tab.hbs` - Convert grid placeholder to functional interface
- `main.mjs` - Import and initialize quadralithe system

---

## Implementation Tasks

### Task 1: Formula Evaluation Engine

**Files:**
- Create: `scripts/quadralithe/formula-evaluator.mjs`

- [ ] **Step 1: Create formula evaluator module structure**

```javascript
/**
 * Universal Formula Evaluation System
 * Handles @variable substitution and safe formula evaluation for quadralithe effects
 */

import { AFFINITIES } from "../affinity/constants.mjs";
import { getAffinityLevel } from "../affinity/affinity-core.mjs";

/**
 * Evaluate a formula string with actor context
 * @param {string} formula - Formula to evaluate (e.g., "1", "@str + 1", "@level * 2")
 * @param {Actor} actor - Actor for context variables
 * @param {Object} extraContext - Additional variables (e.g., radiantBaseCost)
 * @returns {number} Evaluated result
 */
export function evaluateFormula(formula, actor, extraContext = {}) {
    // Implementation details
}

/**
 * Get all available context variables for an actor
 * @param {Actor} actor - Actor to generate context for
 * @param {Object} extraContext - Additional context variables
 * @returns {Object} Context object with all available variables
 */
function getFormulaContext(actor, extraContext = {}) {
    // Implementation details
}
```

- [ ] **Step 2: Implement simple formula handling**

Add number parsing and validation logic

- [ ] **Step 3: Implement context variable generation**

Add actor abilities, level, affinity levels to context object

- [ ] **Step 4: Implement @variable substitution**

Replace @variables with actual values using regex

- [ ] **Step 5: Implement safe evaluation**

Use Function constructor with error handling and console warnings

### Task 2: Core Quadralithe Management System

**Files:**
- Create: `scripts/quadralithe/quadralithe-core.mjs`

- [ ] **Step 1: Create core module structure**

```javascript
/**
 * Core Quadralithe Equipment Management
 * Handles equipment tracking, effect calculation, and actor integration
 */

import { evaluateFormula } from "./formula-evaluator.mjs";

/**
 * Get equipped quadralithes from actor flags
 * @param {Actor} actor - Actor to get equipment from
 * @returns {Object} Equipped quadralithes by type
 */
export function getEquippedQuadralithes(actor) {
    // Implementation
}

/**
 * Equip a quadralithe to a specific slot
 * @param {Actor} actor - Actor to equip on
 * @param {Item} item - Quadralithe item to equip
 * @param {string} type - Quadralithe type (morphos, nexus, radiant, drain)
 * @returns {Promise<boolean>} Success status
 */
export async function equipQuadralithe(actor, item, type) {
    // Implementation with validation and conflict checking
}

/**
 * Unequip quadralithe from slot
 * @param {Actor} actor - Actor to unequip from  
 * @param {string} type - Quadralithe type to unequip
 * @returns {Promise<boolean>} Success status
 */
export async function unequipQuadralithe(actor, type) {
    // Implementation
}
```

- [ ] **Step 2: Implement equipment tracking functions**

Add getEquippedQuadralithes with flag access and validation

- [ ] **Step 3: Implement equip function with validation**

Add conflict checking, type validation, and flag updates

- [ ] **Step 4: Implement unequip function**

Add flag cleanup and effect recalculation triggers

- [ ] **Step 5: Add quadralithe effect calculation functions**

Implement calculateMorphosEffects, calculateNexusEffects, etc.

### Task 3: D&D5e Equipment Integration  

**Files:**
- Create: `scripts/quadralithe/equipment-integration.mjs`
- Create: `templates/quadralithe-config.hbs`

- [ ] **Step 1: Create D&D5e equipment type extension**

```javascript
/**
 * D&D5e Equipment System Integration
 * Extends equipment types and item sheet functionality for quadralithes
 */

/**
 * Initialize quadralithe equipment integration
 */
export function initEquipmentIntegration() {
    // Add "quadralithe" to DND5E.miscEquipmentTypes
    // Hook into item sheet rendering
    // Register custom item configuration
}

/**
 * Handle quadralithe item sheet rendering
 */
function onRenderItemSheet(sheet, html, data) {
    // Add custom quadralithe configuration UI
}
```

- [ ] **Step 2: Extend DND5E.miscEquipmentTypes**

Add "quadralithe" type to equipment types configuration

- [ ] **Step 3: Create quadralithe configuration template**

Build handlebars template for item configuration with formula inputs

- [ ] **Step 4: Hook into item sheet rendering**

Add renderItemSheet hook for custom quadralithe configuration

- [ ] **Step 5: Implement item sheet enhancement logic**

Add configuration UI when equipment type is "quadralithe"

### Task 4: Mana System Integration

**Files:**
- Modify: `scripts/mana/mana-core.mjs:152-170` (affinityRecalculateMaxMana function)

- [ ] **Step 1: Import quadralithe functions**

Add import for calculateNexusEffects from quadralithe-core.mjs

- [ ] **Step 2: Replace hardcoded "4" with Nexus calculation**

```javascript
// OLD: const calculatedMaxMana = 4 + highestAffinityLevel;
// NEW: 
const nexusBaseMana = calculateNexusBaseMana(actor);
const calculatedMaxMana = nexusBaseMana + highestAffinityLevel;
```

- [ ] **Step 3: Add Nexus base mana calculation function**

Implement helper function to get mana bonus from equipped Nexus quadralithe

- [ ] **Step 4: Add equipment change hook listener**

Listen for quadralithe equipment changes to recalculate max mana

### Task 5: Affinity System Integration

**Files:**  
- Modify: `scripts/affinity/affinity-core.mjs:50-70` (getAffinityLevel function)

- [ ] **Step 1: Import quadralithe functions**

Add import for calculateMorphosEffects from quadralithe-core.mjs

- [ ] **Step 2: Extend getAffinityLevel with equipment bonuses**

```javascript
// Add after manual level calculation:
// Equipment bonuses from Morphos quadralithes
const morphosBonus = getMorphosAffinityBonus(actor, affinityName);
return baseLevel + manualLevel + morphosBonus;
```

- [ ] **Step 3: Implement getMorphosAffinityBonus helper**

Add function to calculate Morphos affinity bonuses using formula evaluation

### Task 6: Spell Cost System Integration

**Files:**
- Modify: `scripts/spells/cost-calculation.mjs:67-88` (getCostReductions function)
- Modify: `scripts/spells/cost-calculation.mjs:94-130` (calculateSpellCosts function)

- [ ] **Step 1: Extend getCostReductions with Nexus support**

```javascript
// Add after affinity-based reductions:
// Nexus quadralithe reductions (applies to all affinities)
const equippedQuadralithes = actor.getFlag("adrasamen", "equippedQuadralithes") || {};
if (equippedQuadralithes.nexus) {
    const nexusItem = actor.items.get(equippedQuadralithes.nexus);
    if (nexusItem) {
        const costReduction = evaluateFormula(
            nexusItem.system.quadralithe.effects.costReduction, 
            actor
        );
        if (costReduction !== 0) {
            // Add same reduction to ALL affinities
            Object.values(AFFINITIES).forEach(affinityId => {
                reductions.push({
                    type: "affinity",
                    affinityId: affinityId,
                    amount: costReduction,
                    origin: "nexus"
                });
            });
        }
    }
}
```

- [ ] **Step 2: Implement zero affinity penalty in calculateSpellCosts**

Add penalty calculation before applying reductions

- [ ] **Step 3: Update cost calculation logic to handle penalties**

Modify final cost calculation to include zero affinity penalty

### Task 7: Spell Attack System Integration

**Files:**
- Modify: `scripts/spells/spell-casting.mjs` (spell attack roll functions)

- [ ] **Step 1: Implement spellcasting modifier calculation**

```javascript
/**
 * Get spellcasting modifier based on highest cost affinity's linked characteristic
 */
function getSpellcastingModifier(actor, spell) {
    // Find highest affinity cost
    // Get linked characteristic through primary/secondary system  
    // Return ability modifier
}
```

- [ ] **Step 2: Implement Radiant attack bonus calculation**

Add calculateRadiantAttackBonus function with base + formula calculation

- [ ] **Step 3: Integrate new modifiers into spell attack rolls**

Update existing spell attack roll functions to use new modifiers

### Task 8: UI Grid Integration

**Files:**
- Create: `scripts/quadralithe/ui-integration.mjs`
- Modify: `templates/affinity-tab.hbs:95-112` (equipment grid section)

- [ ] **Step 1: Create UI integration module**

```javascript
/**
 * Quadralithe UI Integration
 * Handles 2x2 grid functionality, drag & drop, and inventory indicators
 */

export class QuadralitheGridManager {
    static init(html, actor) {
        // Initialize grid drag & drop
    }
    
    static async _onDropItem(actor, event) {
        // Handle item drop validation and equipping
    }
    
    static async _onUnequipClick(actor, event) {
        // Handle unequip button clicks
    }
}
```

- [ ] **Step 2: Update affinity-tab template with functional grid**

Replace placeholder grid with dynamic equipped item display

- [ ] **Step 3: Implement drag & drop handlers**

Add event listeners for dragover, drop, and drag start events

- [ ] **Step 4: Add inventory integration**

Hook into actor sheet rendering to show equipped indicators

- [ ] **Step 5: Implement equipment validation logic**

Add type checking and duplicate prevention for equipment slots

### Task 9: Module Integration & Initialization

**Files:**
- Modify: `main.mjs` (main module imports and initialization)

- [ ] **Step 1: Import quadralithe modules**

```javascript
import { initEquipmentIntegration } from "./quadralithe/equipment-integration.mjs";
import { QuadralitheGridManager } from "./quadralithe/ui-integration.mjs";
```

- [ ] **Step 2: Add initialization to init hook**

Call initEquipmentIntegration() during module initialization

- [ ] **Step 3: Add actor sheet integration**

Hook QuadralitheGridManager into renderActorSheet events

- [ ] **Step 4: Add equipment change hooks**

Register hooks for quadralithe equip/unequip events

### Task 10: Language and Configuration Updates

**Files:**  
- Modify: `lang/en.json` (localization strings)

- [ ] **Step 1: Add quadralithe localization strings**

```json
{
  "ADRASAMEN.QuadralitheEquipment": "Quadralithe Equipment",
  "ADRASAMEN.QuadralitheSlot": "{type} Slot",
  "ADRASAMEN.QuadralitheConfig": "Quadralithe Configuration",
  "ADRASAMEN.QuadralitheType": "Quadralithe Type",
  "ADRASAMEN.FormulaEffect": "Formula Effect",
  "ADRASAMEN.AlreadyEquipped": "A {type} quadralithe is already equipped. Unequip it first.",
  "ADRASAMEN.InvalidQuadralithe": "Only quadralithe equipment can be placed here",
  "ADRASAMEN.WrongSlotType": "This slot is for {type} quadralithes only"
}
```

- [ ] **Step 2: Add error message localization**

Add strings for validation errors and warnings

- [ ] **Step 3: Add formula help text**

Add tooltips and help text for formula configuration

## Implementation Order

1. **Foundation Layer**: Tasks 1-2 (Formula engine + Core management)
2. **Integration Layer**: Tasks 3-7 (D&D5e, Mana, Affinity, Spell systems)  
3. **UI Layer**: Tasks 8-9 (Grid interface + Module integration)
4. **Polish Layer**: Task 10 (Localization + Configuration)

Each task produces working, incremental functionality that can be verified before proceeding to the next task. The modular approach allows for easy debugging and ensures each system integrates properly with existing functionality.