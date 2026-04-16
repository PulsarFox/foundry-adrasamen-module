# Phase 0 Implementation Plan (Simplified)

## Minimal Adrasamen Class for D&D5e

_Date: April 16, 2026_
_Status: Ready for Implementation_

## Overview

Create a basic Adrasamen class that works as a standard D&D5e class. No special features, no future phase preparation - just a functional class that can be selected and used normally.

## Implementation Tasks

### Task 1: Define Adrasamen Class

**Files**: `scripts/class/adrasamen-class.mjs`
**Purpose**: Register the class in D&D5e's class system

```javascript
CONFIG.DND5E.classes.adrasamen = {
	name: "Adrasamen",
	hitDie: "d8",
	primaryAbility: ["str", "dex", "con", "int", "wis", "cha"],
	saves: [],
	skills: {
		number: 2,
		choices: Object.keys(CONFIG.DND5E.skills),
	},
	armorProf: [],
	weaponProf: [],
	toolProf: [],
};
```

### Task 2: Module Registration

**Files**: `main.mjs`, `module.json`
**Purpose**: Load and register the class during module initialization

```javascript
// main.mjs: Import and call registration function on "init" hook
// module.json: Update esmodules array if needed
```

### Task 3: Testing

**Files**: In-game testing
**Purpose**: Verify the class works normally

```
1. Start FoundryVTT with module enabled
2. Create new character
3. Select "Adrasamen" from class dropdown
4. Verify character sheet functions normally
5. Test saving/loading character
```

## What This Creates

✅ **Selectable Class**: "Adrasamen" appears in character creation
✅ **Standard Behavior**: Works like any other D&D5e class
✅ **Normal Proficiencies**: Uses D&D5e's standard proficiency system
✅ **Regular Character Sheet**: No custom UI, just standard D&D5e sheet

## What This Does NOT Include

❌ No custom mechanics
❌ No special data fields
❌ No future phase preparation
❌ No custom styling
❌ No hooks or modifications

## File Structure

```
scripts/class/
  adrasamen-class.mjs      # Class definition only
main.mjs                   # Module initialization
```

## Success Criteria

1. **Module Loads**: No console errors when enabling module
2. **Class Available**: "Adrasamen" appears in class selection dropdown
3. **Character Creation**: Can create characters with Adrasamen class
4. **Normal Function**: Character sheet works exactly like other D&D5e classes
5. **Data Persistence**: Characters save and load properly

Total implementation: ~30-50 lines of code max. Pure D&D5e integration with zero custom features.
