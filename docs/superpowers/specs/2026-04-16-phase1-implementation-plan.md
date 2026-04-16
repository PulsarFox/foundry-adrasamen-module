# Phase 1 Implementation Plan: Mana System

_Date: April 16, 2026_
_Status: Ready for Implementation_

## Overview

Build a complete mana system that integrates with D&D5e's existing mechanics. Focus on core functionality: mana tracking, spending/gaining, rest recovery, and condition management.

## Implementation Tasks

### Task 1: Core Mana Data Management

**Files**: `scripts/mana/mana-core.mjs`
**Purpose**: Basic mana storage and manipulation

```javascript
// Actor flag structure: flags.adrasamen.mana = { current: 0, max: 0 }
// Core methods:
// - getManaData(actor)
// - setMana(actor, current, max)
// - spendMana(actor, amount)
// - gainMana(actor, amount)
// - validateMana(current, max)
```

### Task 2: Condition System

**Files**: `scripts/mana/conditions.mjs`
**Purpose**: Handle "Vulnerable Soul" custom condition

```javascript
// Functions:
// - createVulnerableSoulEffect()
// - applyManaExhaustionConditions(actor) // Both Vulnerable Soul + Unconscious
// - removeManaExhaustionConditions(actor) // Remove Vulnerable Soul only
// - hasVulnerableSoul(actor)
```

### Task 3: Rest Integration

**Files**: `scripts/mana/rest-integration.mjs`
**Purpose**: Hook into D&D5e rest system

```javascript
// Hook: "dnd5e.restCompleted"
// Short rest: restore Math.ceil(maxMana / 2)
// Long rest: restore full maxMana
// Chat message showing mana restored
```

### Task 4: Character Sheet UI

**Files**: Extend existing `templates/mana-bar.hbs`, `scripts/mana/mana.mjs`
**Purpose**: Complete the mana bar integration

```handlebars
<!-- Mana bar with current/max editing, matches D&D5e health bar style -->
<div class="mana-resource">
	<input
		type="number"
		name="flags.adrasamen.mana.current"
		value="{{mana.current}}"
	/>
	<span class="sep"> / </span>
	<input type="number" name="flags.adrasamen.mana.max" value="{{mana.max}}" />
</div>
```

### Task 5: Token Integration

**Files**: `scripts/mana/token-integration.mjs`
**Purpose**: Add mana as token resource option

```javascript
// Extend CONFIG.Actor.trackableAttributes
// Add mana to token bar configuration options
// Handle token bar updates on mana changes
```

### Task 6: Public API

**Files**: `scripts/mana/api.mjs`, update `main.mjs`
**Purpose**: Expose clean API for external use

```javascript
// Global API methods:
// game.adrasamen.spendMana(actor, amount)
// game.adrasamen.gainMana(actor, amount)
// game.adrasamen.getManaData(actor)
// game.adrasamen.spendHealth(actor, amount) // For Phase 3
```

### Task 7: Styling & Polish

**Files**: Update `styles/mana.less`
**Purpose**: Complete mana bar styling to match D&D5e theme

```less
// Blue mana theme matching D&D5e health bars
// Responsive design for different sheet sizes
// Condition icon styling
```

### Task 8: Integration & Testing

**Files**: Update `main.mjs` with all registrations
**Purpose**: Wire everything together and test

```javascript
// Register all hooks and APIs
// Test: mana spending, gaining, rest recovery, conditions
// Verify token bars work
// Test API methods
```

## Data Flow

```
1. Actor has mana data in flags.adrasamen.mana
2. UI shows mana bar on character sheet + token
3. Spending mana triggers condition checks
4. Rest hooks restore mana automatically
5. API methods allow external access
```

## File Structure

```
scripts/mana/
  mana-core.mjs          # Core data management
  conditions.mjs         # Status effects
  rest-integration.mjs   # Rest hooks
  token-integration.mjs  # Token bar support
  api.mjs               # Public API
  mana.mjs              # Main coordination (extend existing)
templates/
  mana-bar.hbs          # UI template (extend existing)
styles/
  mana.less             # Styling (extend existing)
```

## Success Criteria

1. **Data Persistence**: Mana current/max saved with character
2. **UI Integration**: Mana bar visible and editable on character sheet
3. **Spending Logic**: `spendMana()` reduces current, triggers conditions at 0
4. **Gaining Logic**: `gainMana()` increases current, removes Vulnerable Soul
5. **Rest Recovery**: Short rest = half mana, long rest = full mana
6. **Token Support**: Mana configurable as token bar resource
7. **Public API**: External modules can interact with mana system
8. **Condition Management**: Vulnerable Soul + Unconscious applied/removed correctly

## Implementation Notes

- **Minimal Footprint**: Extend existing files where possible
- **D&D5e Integration**: Use standard hooks and patterns
- **Error Handling**: Graceful failures, validate all inputs
- **Performance**: Efficient updates, avoid unnecessary re-renders
- **Future Ready**: API designed for Phase 3 spell integration

Total estimated code: ~200-300 lines across all files.
