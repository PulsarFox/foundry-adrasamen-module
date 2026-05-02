# Phase 3: Spell Integration System

_Design Date: April 16, 2026_  
_Revised: May 1, 2026_

## Overview

Integrate D&D5e spell system with Adrasamen affinity-based mana costs using native D&D5e spellcasting method architecture. When spell method is set to "adrasamen", spells consume mana based on affinity costs instead of traditional spell slots, with intelligent cost reduction based on character affinity levels.

## Core Requirements

### D&D5e Spell Integration

- **Preserve Existing Spells**: All existing D&D5e spells remain functional
- **Dual Operation**: Spells can work with either D&D5e slots OR Adrasamen mana+affinities
- **Standard Interface**: Use normal D&D5e spell creation, just with affinity fields

### Adrasamen Spellcasting Method

- **Native D&D5e Integration**: Add "adrasamen" to `CONFIG.DND5E.spellcasting` as new spellcasting method
- **Method Selection**: Use existing D&D5e "Method" dropdown (not spell type)
- **Dynamic Interface**: When "adrasamen" method selected, show affinity costs instead of school/level
- **No Conversion Required**: Players manually select existing spells and change method to "adrasamen"
- **Backward Compatibility**: All existing D&D5e spellcasting methods remain functional

### Spell Affinity Configuration

- **Affinity Costs Replace Slots**: Instead of consuming spell slots, Adrasamen spells consume mana based on affinity costs
- **Multiple Affinities**: Spells can require multiple affinities (e.g., "Hand of Magma" = 1 Fire + 1 Earth)
- **Zero-Cost Spells**: Cantrips and minor spells can have zero mana cost
- **Health-Based Costs**: Spells can cost both mana and health (e.g., "1 Fire + 1 Health")
- **Existing Spell Conversion**: D&D5e spells can be converted to use affinity costs
- **Cost Examples**:
    - Prestidigitation (cantrip): 0 cost
    - Magic Missile (converted): 1 Arcane
    - Cure Light Wounds (converted): 1 Light
    - Fireball (converted): 2 Fire + 1 Arcane
    - Stone Shape (converted): 2 Earth + 1 Arcane
    - Hand of Magma (new): 1 Fire + 1 Earth
    - Lightning Bolt (converted): 2 Air
    - Shadow Step (new): 1 Shadow + 1 Arcane
    - Life Drain (new): 1 Shadow + 1 Health
    - Blood Magic (new): 2 Arcane + 2 Health

### Spell Sheet Extension

When spell type is "adrasamen":

- **School Field**: Replaced with affinity cost configuration panel
- **Level Field**: Hidden or repurposed for spell complexity display
- **Components**: Keep standard V/S/M components
- **Duration/Range/etc**: Keep all standard D&D5e spell properties
- **Affinity Cost Panel**: New section for configuring the 9 affinity requirements

### Manual Configuration Workflow

- **No Automated Conversion**: Players manually select spells from compendium
- **Method Selection**: Change spell method from "spell" to "adrasamen" in dropdown
- **Affinity Configuration**: Configure affinity costs using 3x3 grid interface
- **Preserve Original Data**: D&D5e school/level data preserved for compatibility
- **Flexible Assignment**: Full manual control over affinity cost assignment

### Smart Cost Reduction System

- **Base Cost**: Sum of all affinity costs from spell configuration
- **Affinity Reduction**: Direct 1:1 reduction based on character affinity levels (Fire Level 3 reduces Fire costs by 3)
- **Extensible Framework**: Array-based reduction system ready for Phase 4 equipment bonuses
- **Reactive Updates**: Listens to `adrasamen.affinityChanged` hook for automatic cost recalculation when affinity changes
- **No Overflow**: Excess reduction on one affinity doesn't carry over to others

### Spell Casting Integration

- **No Blocking**: Spells are never prevented from casting, regardless of mana/health availability
- **Cost Deduction**: Automatically deduct calculated mana and health costs after successful cast
- **Risk-Based Gameplay**: Players can cast spells even with insufficient resources (creating tactical decisions)
- **Chat Integration**: Show mana and health costs in enhanced spell chat cards
- **Hook Integration**: Uses existing `dnd5e.preUseItem` and `dnd5e.useItem` hooks

### Character Sheet Spell Display

**Column Layout**:
- **Cost Column**: Replaces "School" column, shows calculated mana cost (blue if affordable, grey if insufficient mana)
- **HCost Column**: Shows health cost in red, only visible when > 0
- **Higher Priority**: Cost column positioned with higher priority than casting time (won't be hidden when resizing)

**Tooltip Details**: Hover shows complete breakdown:
- Base affinity costs vs. reduced costs
- Affinity icons with amounts
- Total mana and health costs
- Reduction sources (affinity levels, future equipment)

## Data Model Extension

### Spell Item Configuration

```javascript
// Spell item data extension - added to existing D&D5e spell
spell.flags.adrasamen.affinityCosts = {
	fire: 2, // Required fire affinity cost
	air: 0, // No air requirement
	earth: 0, // No earth requirement
	ice: 0, // No ice requirement
	water: 0, // No water requirement
	light: 0, // No light requirement
	shadow: 0, // No shadow requirement
	mind: 0, // No mind requirement
	arcane: 1, // Required arcane cost
};

spell.flags.adrasamen.healthCost = 0; // Optional health cost (0 = no health cost)

//Standard D&D5e spell data remains unchanged
```

### Spell Cost Display Data

```javascript
// Cost reduction system structure
costReductions = [
	{ type: "affinity", affinityId: "fire", amount: 3 },
	{ type: "affinity", affinityId: "earth", amount: 1 },
	// Phase 4: { type: "equipment", source: "nexus", target: "all", amount: 1 }
];

// Calculated at render time
spellDisplayData = {
	baseAffinityCosts: { fire: 2, earth: 1 },
	calculatedAffinityCosts: { fire: 0, earth: 0 }, // After reductions applied
	totalBaseCost: 3,
	totalCalculatedCost: 0, // 2-3=0 for fire, 1-1=0 for earth
	healthCost: 1, // Health cost (never reduced)
	isAffordable: { mana: true, health: true }, // Separate affordability tracking
	costReductions: costReductions
};
```

## UI Design

### Character Sheet Spell List Display

```
┌─────────────────────────────────────────────────────────────┐
│ SPELLS                                       Cost    HCost  │
├─────────────────────────────────────────────────────────────┤
│ Fireball                                       2             │
│ Prestidigitation                               0             │  
│ Life Drain                                     0      1      │
│ Stone Shape                                    2             │
│ Lightning Bolt (insufficient mana)             1             │
└─────────────────────────────────────────────────────────────┘

Cost Display Rules:
• Cost column: Blue (affordable) or Grey (insufficient mana)
• HCost column: Red, only visible when > 0
• Tooltip shows: "Fire: 2→1, Arcane: 1→1, Total: 2 mana"
```

### D&D5e Spell Sheet Extension

When spell method is set to "adrasamen", the spell sheet is modified:

```
┌─────────────────────────────────────────────────────────────┐
│ SPELL: Fireball                                             │
├─────────────────────────────────────────────────────────────┤
│ Method: [Adrasamen ▼] (uses D&D5e method dropdown)         │
│                                                             │
│ AFFINITY COSTS (replaces school/level section)             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔥[2]  ❄️[0]  💧[0]                                   │ │
│ │ 💨[0]  🌍[0]  ☀️[0]                                   │ │
│ │ 🌑[0]  🧠[0]  🔮[1]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Health Cost: ❤️[0]                                         │
│                                                             │
│ Calculated Costs: 3 mana → 2 mana • 0 health               │
│                                                             │
│ STANDARD D&D5E FIELDS (unchanged):                         │
│ Components: V,S,M                                           │
│ Duration: Instantaneous • Range: 150 feet                   │
│ Casting Time: 1 action                                      │
│                                                             │
│ Description: [standard D&D5e description field]            │
└─────────────────────────────────────────────────────────────┘
```

**UI Design Notes**:
- Uses D&D5e's existing `checkbox-grid` CSS classes adapted for numerical inputs
- 3x3 grid layout for the 9 affinity types
- Icons only (no text labels) for clean, compact appearance
- School and Level fields hidden when method="adrasamen"

### Method Selection

In the D&D5e spell sheet:

- **Method Dropdown**: Add "Adrasamen" option to existing D&D5e spellcasting method dropdown
- **Dynamic Interface**: When "Adrasamen" method selected, hide school/level and show affinity costs
- **Backward Compatibility**: When D&D5e methods selected, show normal interface
- **Seamless Integration**: Uses D&D5e's native method system for maximum compatibility

## D&D5e Native Integration

### Spellcasting Method Architecture
- **Preserve All D&D5e Data**: Keep all existing spell properties (description, range, components, etc.)
- **Method-Based Detection**: Use `spell.system.method` instead of overloading school field
- **Dual Compatibility**: Spells work with either D&D5e spell slots OR Adrasamen mana system
- **No Breaking Changes**: Existing D&D5e spellcasting methods unaffected

### Sheet Modification Strategy
- **Native Hook Integration**: Uses D&D5e's `renderItemSheet` hook with method detection
- **Conditional UI**: Show affinity costs only when method="adrasamen"
- **Preserve Standard Features**: All D&D5e spell functionality remains intact
- **Method-Based Detection**: Hook into D&D5e spell sheet rendering, detect when method="adrasamen"
- **Hide Standard Fields**: Hide school and level dropdowns when Adrasamen method selected
- **Inject Affinity UI**: Add 3x3 affinity cost grid and health cost input
- **Preserve D&D5e Features**: All standard spell properties (range, duration, components) remain unchanged


## Chat Card Integration

### Enhanced Spell Chat Cards

```
┌─────────────────────────────────────────────────────────────┐
│ � FIREBALL                                    [Damage]     │
├─────────────────────────────────────────────────────────────┤
│ Gandalf casts Fireball                                      │
│ Mana: 2 (🔥Fire 2→1, 🔮Arcane 1→1) • Health: 0              │
│ Remaining: 8/12 mana • 24/24 HP                            │
│                                                             │
│ Fire erupts in a 20-foot radius sphere...                  │
│ Damage: [8d6] Fire • DC 15 Dexterity saving throw          │
└─────────────────────────────────────────────────────────────┘
```

## API Foundation

**Core Spell Functions**:
- `game.adrasamen.getSpellAffinityCosts(spell)`: Get base affinity costs from flags
- `game.adrasamen.setSpellAffinityCosts(spell, costs)`: Set affinity costs in flags
- `game.adrasamen.getSpellHealthCost(spell)`: Get health cost from flags
- `game.adrasamen.isAdrasamenSpell(spell)`: Check if method="adrasamen"

**Cost Calculation System**:
- `game.adrasamen.getCostReductions(actor)`: Get all active cost reductions (affinity + equipment)
- `game.adrasamen.calculateSpellCosts(actor, spell)`: Get final costs after all reductions
- `game.adrasamen.getSpellAffordability(actor, spell)`: Check mana/health availability

**Integration Functions**:
- Leverages existing `game.adrasamen.spendMana(actor, amount)`
- Leverages existing `game.adrasamen.spendHealth(actor, amount)` 
- Listens to existing `adrasamen.affinityChanged` hook for reactive updates

## Technical Implementation

### File Structure

- **Core Logic**: `scripts/spells/spell-integration.mjs` (main system integration)
- **Method Config**: `scripts/spells/adrasamen-method.mjs` (D&D5e method registration)
- **Cost Calculation**: `scripts/spells/cost-calculation.mjs` (smart reduction system)
- **Sheet Extensions**: `scripts/spells/sheet-extensions.mjs` (UI injection and modification)
- **Spell API**: `scripts/spells/spell-api.mjs` (extended API functions)
- **Templates**: `templates/spell-affinity-grid.hbs` (3x3 affinity input grid)
- **Styles**: `styles/spell-affinity.less` (affinity grid styling in less style, to be imported in styles/styles.less)

### Hook Integration

```javascript
// Register Adrasamen as D&D5e spellcasting method
Hooks.once("init", () => {
	CONFIG.DND5E.spellcasting.adrasamen = {
		label: "ADRASAMEN.SpellcastingMethod.Adrasamen",
		type: "none", // No spell slots
		order: 25,
		img: "modules/adrasamen/icons/adrasamen-spell.webp"
	};
});

// Extend D&D5e spell sheet rendering
Hooks.on("renderItemSheet", (sheet, html) => {
	if (sheet.item.type !== "spell") return;

	if (sheet.item.system.method === "adrasamen") {
		// Hide school/level, inject affinity configuration
		AdrasamenSpellUI.injectAffinitySection(sheet, html);
	}
});

// Intercept spell casting for Adrasamen spells  
Hooks.on("dnd5e.preUseItem", (item, config, options) => {
	if (item.type !== "spell" || item.system.method !== "adrasamen") return;

	const actor = item.actor;
	const costs = game.adrasamen.calculateSpellCosts(actor, item);

	// Never block casting - always allow attempts
	// Add costs to chat card data for display and deduction
	config.adrasamen = {
		manaCost: costs.totalCalculatedCost,
		healthCost: costs.healthCost,
		affinityCosts: costs.baseAffinityCosts,
		costReductions: costs.costReductions
	};
});

// Deduct mana and health after successful Adrasamen spell cast
Hooks.on("dnd5e.useItem", (item, config, options, usage) => {
	if (item.type !== "spell" || item.system.method !== "adrasamen") return;
	if (!config.adrasamen) return;

	const manaCost = config.adrasamen.manaCost || 0;
	const healthCost = config.adrasamen.healthCost || 0;

	// Always deduct costs, even if insufficient resources
	if (manaCost > 0) game.adrasamen.spendMana(item.actor, manaCost);
	if (healthCost > 0) game.adrasamen.spendHealth(item.actor, healthCost);
});

// React to affinity changes to update spell costs
Hooks.on("adrasamen.affinityChanged", (actor) => {
	// Refresh any open character sheets to update spell costs
	actor.sheet?.render(false);
});
```

## Integration with Previous Phases

### Phase 1 (Mana System)

- Use `actor.spendMana()` for spell mana costs
- Use `actor.spendHealth()` for spell health costs
- Use `actor.canCastSpell()` to check mana AND health availability
- Leverage existing mana change events
- Extend health tracking for health-based spell costs

### Phase 2 (Affinity System)

- Use `actor.getAffinityLevel()` for cost calculations
- React to affinity level changes to update spell costs
- Display affinity-based cost reductions in UI

## Future Phase 4 Integration (Quadralithe Equipment)

- Spell cost calculations ready for Nexus quadralithe modifications
- Attack roll system prepared for Radiant quadralithe bonuses
- API extensible for equipment-based spell enhancements

## Success Criteria

1. **Native Integration**: "Adrasamen" appears in D&D5e method dropdown alongside "spell", "pact", etc.
2. **Dynamic UI**: Spell sheets show affinity grid when method="adrasamen", hide school/level
3. **Manual Configuration**: Players can set affinity costs using 3x3 grid with icon-only inputs
4. **Cost Calculation**: Smart reduction system applies affinity-based reductions correctly
5. **Character Sheet Display**: Cost/HCost columns show calculated costs with proper color coding
6. **No Blocking**: All spells can be attempted regardless of resource availability
7. **Automatic Deduction**: Mana and health costs deducted after successful spell use
8. **Reactive Updates**: Spell costs update when affinity levels change via `adrasamen.affinityChanged`
9. **Chat Integration**: Enhanced chat cards show cost breakdown and resource changes
10. **Dual Compatibility**: D&D5e spells continue working with spell slots unchanged
11. **Health Cost Support**: Health-based spells work independently of mana system
12. **Tooltip Details**: Hover shows complete affinity cost breakdown and reductions
13. **Phase 4 Ready**: Cost reduction system extensible for equipment-based bonuses
