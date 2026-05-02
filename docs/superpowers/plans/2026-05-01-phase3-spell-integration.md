# Phase 3: Spell Integration Implementation Plan

_Created: May 1, 2026_  
_Spec: [Phase 3 Spell Integration](../specs/2026-04-16-phase3-spell-integration.md)_

## Overview

Implement Adrasamen spell integration using native D&D5e spellcasting method architecture. Add "Adrasamen" as a new spellcasting method with affinity-based mana costs, smart cost reduction system, and reactive character sheet displays.

## Prerequisites

- Phase 1 (Mana System) and Phase 2 (Affinity System) must be functional
- Existing `game.adrasamen.spendMana()` and `game.adrasamen.spendHealth()` APIs
- Existing `adrasamen.affinityChanged` hook system

## File Structure

### New Files

**Core System Files:**
- `scripts/spells/spell-integration.mjs` - Main spell system initialization and coordination
- `scripts/spells/adrasamen-method.mjs` - D&D5e spellcasting method registration  
- `scripts/spells/cost-calculation.mjs` - Smart cost reduction system and calculations
- `scripts/spells/sheet-extensions.mjs` - Spell sheet UI injection and modification
- `scripts/spells/spell-api.mjs` - Extended API functions for spell management
- `scripts/spells/_module.mjs` - Spell system module coordination

**UI Files:**
- `templates/spell-affinity-grid.hbs` - 3x3 affinity cost input grid template
- `styles/spell-affinity.less` - Styling for affinity grid and spell displays to be imported to styles/styles.less

**Localization:**
- Update `lang/en.json` - Add Adrasamen spell-related localization keys

### Modified Files

**Core Module:**
- `scripts/_module.mjs` - Import and initialize spell system
- `main.mjs` - Add spell system to module initialization

**Character Sheet:**
- `scripts/affinity/character-sheet.mjs` - Add spell cost update listeners

**Types**
- `scripts/types.mjs` - Types for jsdoc definitions

## Task Breakdown

### Phase 1: Foundation Setup

#### Task 1.1: Create spell system module structure
- Create `scripts/spells/_module.mjs` 
- Export initialization function for spell system
- Add import to `scripts/_module.mjs`

#### Task 1.2: Add localization keys
- Add spell-related keys to `lang/en.json`:
  - `ADRASAMEN.SpellcastingMethod.Adrasamen`
  - `ADRASAMEN.Spell.AffinityCosts`
  - `ADRASAMEN.Spell.HealthCost`
  - `ADRASAMEN.Spell.CalculatedCost`

#### Task 1.3: Create main spell integration file
- Create `scripts/spells/spell-integration.mjs`
- Export `initSpellSystem()` function (empty implementation)
- Import and call from `scripts/spells/_module.mjs`

### Phase 2: D&D5e Method Registration

#### Task 2.1: Create Adrasamen method configuration
- Create `scripts/spells/adrasamen-method.mjs`
- Export `registerAdrasamenMethod()` function
- Define Adrasamen spellcasting method config object:
  ```javascript
  {
    label: "ADRASAMEN.SpellcastingMethod.Adrasamen",
    type: "none", // No spell slots
    order: 25,
    img: "modules/adrasamen/icons/adrasamen-spell.webp"
  }
  ```

#### Task 2.2: Register method with D&D5e
- Implement `registerAdrasamenMethod()` function
- Use `Hooks.once("init")` to add to `CONFIG.DND5E.spellcasting`
- Call from `initSpellSystem()`

#### Task 2.3: Test method selection
- Create test spell in game
- Verify "Adrasamen" appears in Method dropdown
- Select "Adrasamen" and verify it persists

### Phase 3: Cost Calculation System

#### Task 3.1: Create cost calculation module
- Create `scripts/spells/cost-calculation.mjs`
- Export `getCostReductions(actor)` function (return empty array for now)
- Export `calculateSpellCosts(actor, spell)` function (return base costs for now)

#### Task 3.2: Implement base cost extraction
- Implement `getSpellAffinityCosts(spell)` function
- Read affinity costs from `spell.flags.adrasamen.affinityCosts`
- Return default structure (all costs = 0) if not set
- Implement `getSpellHealthCost(spell)` function

#### Task 3.3: Implement affinity-based reductions
- Implement `getCostReductions(actor)` function
- Create reduction array from actor's affinity levels
- Use existing `game.adrasamen.getAffinityLevel()` API
- Structure: `[{type: "affinity", affinityId: "fire", amount: 3}]`

#### Task 3.4: Implement cost calculation logic
- Implement `calculateSpellCosts(actor, spell)` function
- Apply cost reductions to base affinity costs (direct 1:1 reduction)
- Ensure individual affinity costs never go below 0
- Calculate total mana cost and preserve health cost
- Return complete cost structure for UI display

#### Task 3.5: Add API integration
- Create `scripts/spells/spell-api.mjs`
- Export functions to `game.adrasamen` namespace:
  - `getSpellAffinityCosts(spell)`
  - `setSpellAffinityCosts(spell, costs)`
  - `getSpellHealthCost(spell)`
  - `getCostReductions(actor)`
  - `calculateSpellCosts(actor, spell)`

### Phase 4: Spell Sheet UI Extension

#### Task 4.1: Create affinity grid template
- Create `templates/spell-affinity-grid.hbs`
- Create 3x3 grid using D&D5e's checkbox-grid styling
- Use affinity icons from existing AFFINITY_CONFIG
- Use numerical inputs instead of checkboxes
- Include health cost input field below grid

#### Task 4.2: Create spell sheet extension module
- Create `scripts/spells/sheet-extensions.mjs`
- Export `initSheetExtensions()` function
- Set up `Hooks.on("renderItemSheet")` listener
- Detect when spell method === "adrasamen"

#### Task 4.3: Implement UI injection logic
- Implement `injectAffinityUI(sheet, html)` function
- Hide school and level dropdowns when method="adrasamen"
- Render and inject affinity grid template
- Populate grid with current spell affinity costs

#### Task 4.4: Implement affinity grid interactions
- Add event listeners for affinity cost inputs
- Update spell flags when inputs change
- Add event listener for health cost input
- Validate inputs (non-negative integers)

#### Task 4.5: Add calculated cost display
- Show calculated costs below affinity grid
- Display base costs vs reduced costs
- Update display when inputs change
- Format: "Calculated: 3 mana → 2 mana • 0 health"

#### Task 4.6: Create affinity grid styling
- Create `styles/spell-affinity.less`
- Style 3x3 grid to match D&D5e checkbox-grid appearance
- Ensure icons are clearly visible and properly sized
- Add hover effects and proper spacing

### Phase 5: Character Sheet Integration

#### Task 5.1: Extend character sheet spell display
- Modify character sheet spell rendering
- Add "Cost" column (replace "School" column)
- Add "HCost" column (only show when > 0)
- Calculate costs for each Adrasamen spell

#### Task 5.2: Implement cost color coding
- Color mana costs blue when affordable, grey when not
- Color health costs red always
- Use existing mana check from Phase 1 API

#### Task 5.3: Add detailed cost tooltips
- Create tooltip showing complete cost breakdown
- Show base costs, reductions, and final costs
- Display affinity icons with amounts
- Format: "Fire: 2→1, Arcane: 1→1, Total: 2 mana"

#### Task 5.4: Implement reactive cost updates
- Listen to `adrasamen.affinityChanged` hook
- Refresh character sheet spell displays when affinity levels change
- Update calculated costs in real-time

### Phase 6: Spell Casting Integration

#### Task 6.1: Implement spell casting hooks
- Set up `Hooks.on("dnd5e.preUseItem")` listener
- Detect Adrasamen spells (method="adrasamen")
- Calculate costs and add to chat card data
- Never block spell casting (no return false)

#### Task 6.2: Implement cost deduction
- Set up `Hooks.on("dnd5e.useItem")` listener
- Deduct mana and health costs after successful spell use
- Use existing `game.adrasamen.spendMana()` and `spendHealth()`
- Handle cases where costs exceed available resources

#### Task 6.3: Enhance spell chat cards
- Modify chat card display for Adrasamen spells
- Show mana cost breakdown with affinity details
- Show health cost when applicable
- Display remaining mana and health after casting

### Phase 8: Documentation and Cleanup

#### Task 8.1: Update module documentation
- Add spell system documentation to main README
- Document new API functions
- Add usage examples for players

#### Task 8.2: Add code documentation
- Add JSDoc comments to all public functions
- Document cost calculation algorithm
- Add examples for API usage

#### Task 8.3: Final integration test
- Reload module completely
- Test all functionality from scratch
- Verify no console errors
- Test with fresh character and spells

## Success Criteria

- [ ] "Adrasamen" appears in D&D5e spellcasting method dropdown
- [ ] Affinity cost grid appears when Adrasamen method selected
- [ ] Cost calculations correctly apply affinity level reductions
- [ ] Character sheet shows Cost/HCost columns with proper colors
- [ ] Spell costs update reactively when affinity levels change
- [ ] Spell casting never blocks, always deducts calculated costs
- [ ] Chat cards show enhanced cost information for Adrasamen spells
- [ ] Existing D&D5e spellcasting methods remain unaffected
- [ ] System integrates cleanly with Phase 1 & 2 APIs

## Notes

- Preserve all existing D&D5e functionality
- Follow existing module patterns and coding style
- Use existing affinity icons and color schemes
- Leverage established hook system for reactivity
- Don't use type Object in jsdoc but add new types in scripts/types.mjs