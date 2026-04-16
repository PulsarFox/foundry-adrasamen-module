# Phase 3: Spell Integration System

_Design Date: April 16, 2026_

## Overview

Extend D&D5e spell system to support Adrasamen affinity costs while preserving existing spells and creation interface. When spell type is set to "adrasamen", the spell sheet shows affinity configuration instead of traditional school/level restrictions.

## Core Requirements

### D&D5e Spell Integration

- **Preserve Existing Spells**: All existing D&D5e spells remain functional
- **Extend Spell Sheet**: Add affinity configuration when spell type = "adrasamen"
- **Dual Operation**: Spells can work with either D&D5e slots OR Adrasamen mana+affinities
- **Migration Path**: Convert existing D&D5e spells to Adrasamen configuration
- **Standard Interface**: Use normal D&D5e spell creation, just with affinity fields

### Adrasamen Spell Type

- **New Spell Type**: Add "adrasamen" to spell type dropdown
- **Modified Interface**: When "adrasamen" selected, show affinity configuration instead of school/level
- **Backward Compatibility**: "spell" type still works with D&D5e rules
- **Automatic Detection**: Characters with Adrasamen class default to "adrasamen" spell type

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

### Conversion System

- **Optional Migration**: Button to convert D&D5e spells to Adrasamen type
- **Preserve Original**: Keep original spell data, add affinity overlay
- **Suggested Costs**: Auto-suggest affinity costs based on school/level
- **Manual Override**: Full manual control over affinity assignments

### Cost Calculation System

- **Base Cost**: Sum of all affinity costs from spell configuration
- **Cost Reduction**: Handled by Nexus in phase 4
- **Display**: Show both base cost and calculated cost in character sheet

### Spell Casting Integration

- **Mana Check**: Verify sufficient mana before casting
- **Cost Deduction**: Automatically deduct calculated cost on successful cast
- **Failure Handling**: Warn caster if insufficient mana
- **Chat Integration**: Show mana cost and affinity requirements in spell chat cards
- **Attack Roll Integration**: Ready for Phase 4 quadralithe bonuses

### Character Sheet Spell Display

For each spell, show:

- **Affinity Requirements**: Visual icons for required affinities with amounts
- **Calculated Cost**: Final mana cost with current affinity levels
- **Cost Breakdown**: Tooltip showing calculation details
- **Castability**: Visual indication if spell is affordable (grayed out if not)
- **Affinity Icons**: Color-coded icons for each affinity type

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

spell.flags.adrasamen.metadata = {
	converted: true, // Was this converted from D&D5e spell?
	originalSchool: "evocation", // Original D&D5e school (if converted)
	originalLevel: 3, // Original D&D5e level (if converted)
	customDescription: "Destructive fire magic", // Custom description
	creationDate: "2026-04-16", // When configured
	lastModified: "2026-04-16", // Last change
};

// Standard D&D5e spell data remains unchanged
spell.system.school = "evo"; // Still preserved for compatibility
spell.system.level = 3; // Still preserved for compatibility
```

### Spell Cost Display Data

```javascript
// Calculated at render time
spellDisplayData = {
	baseAffinityCosts: { fire: 2, earth: 1 },
	calculatedAffinityCosts: { fire: 1, earth: 1 },
	totalBaseCost: 3,
	totalCalculatedCost: 2,
	healthCost: 1, // Health cost (never reduced)
	canAfford: true, // Can afford both mana AND health costs
	costReductions: { fire: 1, earth: 0 }, // How much each affinity reduced
};
```

## UI Design

### Spell List Enhancement

```
┌─────────────────────────────────────────────────────────────┐
│ SPELLS                                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Fireball ──────────────────────────── Mana: 3→2 ────┐   │
│ │ 📛2 🔮1  [Cast] [Info]                              │   │
│ │ Destructive fire magic (fire, arcane)               │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ Prestidigitation ──────────────────── Mana: 0→0 ────┐   │
│ │ Free  [Cast] [Info]                                  │   │
│ │ Minor magical effect (cantrip)                       │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ Life Drain ──────────── Mana: 1→0  Health: 1 ──────┐   │
│ │ 🌑1 ❤️1  [Cast] [Info]                              │   │
│ │ Sacrificial shadow magic (shadow + health)          │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ Stone Shape ───────────────────────── Mana: 3→2 ────┐   │
│ │ 🟫2 🔮1  [Cast] [Info]                              │   │
│ │ Earth manipulation (earth, arcane)                   │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ Lightning Bolt ────────────────────── Mana: 2→1 ────┐   │
│ │ 💨2  [Cast] [Info]                                   │   │
│ │ Electrical discharge (air)                           │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Legend:
📛 Fire  💨 Air  🟫 Earth  ❄️ Ice  💧 Water
☀️ Light  🌑 Shadow  🧠 Mind  🔮 Arcane  ❤️ Health
```

### D&D5e Spell Sheet Extension

When spell type is set to "adrasamen", the spell sheet is modified:

```
┌─────────────────────────────────────────────────────────────┐
│ SPELL: Fireball                                  [✓] Adrasamen │
├─────────────────────────────────────────────────────────────┤
│ Spell Type: [adrasamen ▼] (instead of school dropdown)       │
│                                                             │
│ AFFINITY COSTS                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fire:   [2] 📛    Ice:    [0] ❄️                      │ │
│ │ Air:    [0] 💨    Water:  [0] 💧                      │ │
│ │ Earth:  [0] 🟫    Light:  [0] ☀️                      │ │
│ │ Shadow: [0] 🌑    Mind:   [0] 🧠    Arcane: [1] 🔮     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ADDITIONAL COSTS                                            │
│ Health Cost: [0] ❤️ (optional)                            │
│                                                             │
│ Total Mana Cost: 3  •  Total Health Cost: 0                │
│ [Convert from D&D5e] [Reset Costs] [Apply Template]        │
│                                                             │
│ STANDARD D&D5E FIELDS (unchanged):                         │
│ Components: V,S,M                                           │
│ Duration: Instantaneous                                     │
│ Range: 150 feet                                             │
│ Casting Time: 1 action                                      │
│                                                             │
│ Description: [standard D&D5e description field]            │
└─────────────────────────────────────────────────────────────┘
```

### Spell Type Selection

In the D&D5e spell sheet:

- **Spell Type Dropdown**: Add "adrasamen" option alongside existing school options
- **Dynamic Interface**: When "adrasamen" selected, show affinity costs instead of school
- **Backward Compatibility**: When D&D5e schools selected, show normal interface
- **Conversion Helpers**: Buttons to convert between D&D5e and Adrasamen configurations

````

## D&D5e Integration System

### Extending Existing Spells
- **Keep All Data**: Preserve all existing D&D5e spell properties (description, range, components, etc.)
- **Add Affinity Layer**: Overlay affinity costs onto existing spell structure
- **Dual Compatibility**: Spells work with both D&D5e spell slots AND Adrasamen mana system
- **Conversion Helper**: One-click conversion from D&D5e school/level to suggested affinity costs
- **Manual Override**: Full manual control after conversion

### Spell Sheet Modification
- **Hook into Rendering**: Modify D&D5e spell sheet when type is "adrasamen"
- **Replace School Section**: Show affinity cost configuration instead of school dropdown
- **Add Conversion Tools**: Buttons for converting between D&D5e and Adrasamen formats
- **Preserve Functionality**: All standard D&D5e spell features remain functional

### Suggested Conversion Rules
```javascript
const conversionSuggestions = {
  // School-based suggestions
  "evocation": (level) => ({
    fire: Math.floor(level/2) + 1,
    arcane: Math.ceil(level/3)
  }),
  "abjuration": (level) => ({
    light: Math.floor(level/2) + 1,
    arcane: Math.ceil(level/3)
  }),
  "necromancy": (level) => ({
    shadow: Math.floor(level/2) + 1,
    arcane: Math.ceil(level/3)
  }),
  "enchantment": (level) => ({
    mind: Math.floor(level/2) + 1,
    arcane: Math.ceil(level/3)
  }),
  "conjuration": (level) => ({
    arcane: level
  }),
  "transmutation": (level) => ({
    earth: Math.floor(level/2) + 1,
    arcane: Math.ceil(level/3)
  }),
  "illusion": (level) => ({
    mind: Math.floor(level/2) + 1,
    arcane: Math.ceil(level/3)
  }),
  "divination": (level) => ({
    arcane: level
  })
};
````

### Spell Creation Workflow

1. **Create D&D5e Spell**: Use standard Foundry spell creation
2. **Select "Adrasamen" Type**: Choose from spell type dropdown
3. **Configure Affinity Costs**: Use the affinity cost interface
4. **Optional Conversion**: Start from D&D5e school/level if converting existing spell
5. **Save Configuration**: Affinity data stored in spell flags

## Chat Card Integration

### Enhanced Spell Chat Cards

```
┌─────────────────────────────────────────────────────────────┐
│ 📛 FIREBALL                                    [Damage]     │
├─────────────────────────────────────────────────────────────┤
│ Gandalf casts Fireball                                      │
│ Mana Cost: 2 (📛1 🔮1) • Remaining Mana: 8/12              │
│                                                             │
│ Fire erupts in a 20-foot radius sphere...                  │
│                                                             │
│ Damage: [8d6] Fire                                          │
│ DC 15 Dexterity saving throw                                │
└─────────────────────────────────────────────────────────────┘
```

## API Foundation

- `spell.getAffinityCosts()`: Get affinity cost configuration from flags
- `spell.setAffinityCosts(costs)`: Set affinity costs in spell flags
- `spell.convertFromDnd5e()`: Convert D&D5e school/level to suggested affinity costs
- `spell.isAdrasamenSpell()`: Check if spell type is "adrasamen"
- `actor.calculateSpellCost(spell)`: Get final mana cost for this actor
- `actor.canCastSpell(spell)`: Check if actor has enough mana AND health (for Adrasamen spells)
- `actor.castSpell(spell)`: Perform casting with mana and health deduction (for Adrasamen spells)
- `spell.getHealthCost()`: Get health cost for spell
- `spell.getTotalCosts()`: Get object with both mana and health costs
- `game.adrasamen.convertSpellToAdrasamen(spellId)`: Convert existing D&D5e spell
- `game.adrasamen.getConversionSuggestion(school, level)`: Get suggested affinity costs

## Technical Implementation

### File Structure

- **Core Logic**: `scripts/spells/spell-integration.mjs` (new)
- **Sheet Extension**: `scripts/spells/spell-sheet-extension.mjs` (new)
- **Conversion System**: `scripts/spells/dnd5e-conversion.mjs` (new)
- **UI Components**: `scripts/spells/affinity-ui.mjs` (new)
- **Templates**: `templates/spell-affinity-section.hbs` (new)
- **Styles**: `styles/spell-affinity.css` (new)

### Hook Integration

```javascript
// Extend D&D5e spell sheet rendering
Hooks.on("renderItemSheet", (sheet, html) => {
	if (!sheet.item.type === "spell") return;

	const spellType = sheet.item.system.school;
	if (spellType === "adrasamen") {
		// Replace school section with affinity configuration
		AdrasamenSpellUI.injectAffinitySection(sheet, html);
	}
});

// Intercept spell casting for Adrasamen spells
Hooks.on("dnd5e.preUseItem", (item, config, options) => {
	if (!item.isAdrasamenSpell()) return; // Let D&D5e handle non-Adrasamen spells

	const actor = item.actor;
	const totalCosts = item.getTotalCosts();
	const manaCost = actor.calculateSpellCost(item);
	const healthCost = item.getHealthCost();

	if (!actor.canCastSpell(item)) {
		// Silently block casting - no error messages for roleplay
		return false;
	}

	// Add costs to chat card data
	config.adrasamen = {
		manaCost: manaCost,
		healthCost: healthCost,
		affinityCosts: item.getAffinityCosts(),
	};
});

// Deduct mana and health after successful Adrasamen spell cast
Hooks.on("dnd5e.useItem", (item, config, options, usage) => {
	if (!item.isAdrasamenSpell() || !usage.isSuccessful) return;

	const manaCost = config.adrasamen?.manaCost || 0;
	const healthCost = config.adrasamen?.healthCost || 0;

	if (manaCost > 0) item.actor.spendMana(manaCost);
	if (healthCost > 0) item.actor.spendHealth(healthCost);
});
```

### Hook Integration

```javascript
// Intercept spell casting
Hooks.on("dnd5e.preUseItem", (item, config, options) => {
	if (item.type !== "spell") return;

	const actor = item.actor;
	const spellCost = actor.calculateSpellCost(item);

	if (!actor.canCastSpell(item)) {
		// Silently block casting - no error messages for roleplay
		return false;
	}

	// Add mana cost to chat card data
	config.adrasamen = {
		manaCost: spellCost,
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

1. D&D5e spell sheets show affinity configuration when spell type is "adrasamen"
2. Existing D&D5e spells can be converted to use affinity costs
3. New spells can be created using standard D&D5e interface with affinity costs
4. Adrasamen spell casting automatically deducts correct mana AND health amounts
5. Regular D&D5e spells continue to work with spell slots (dual compatibility)
6. Cannot cast Adrasamen spells with insufficient mana OR health (graceful blocking)
7. Conversion suggestions work correctly based on school/level
8. Manual affinity cost override works for custom configurations
9. Chat cards display mana and health costs for Adrasamen spells, spell slot usage for D&D5e spells
10. Character sheet spell list shows affordability status for Adrasamen spells (both mana and health)
11. Cost calculations update in real-time when affinity levels change
12. Zero-cost spells (cantrips) work correctly
13. Health-based spell costs work independently of affinity levels
14. No breaking changes to existing D&D5e spell functionality
