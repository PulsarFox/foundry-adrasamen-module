# Phase 4: Quadralithe Equipment System

_Design Date: April 16, 2026_

## Overview

Implement magical equipment system with four types of quadralithes that modify mana costs, affinity levels, and spell effectiveness. Equipment appears in a 2x2 grid on the character sheet and can be upgraded with additional abilities.

## Core Requirements

### Quadralithe Types

#### Morphos (Affinity Level Boosts)

- **Basic Effect**: +1 level to primary affinity
- **Advanced Effects**: Custom formulas for multiple affinities
- **Configuration**:
    ```javascript
    {
      type: "morphos",
      affinityBonus: {
        fire: 1,      // +1 to fire affinity
        earth: 2      // +2 to earth affinity
      },
      formula: "@level * 2"  // Advanced: dynamic bonus
    }
    ```
- **Examples**:
    - Basic Fire Morphos: +1 Fire affinity
    - Advanced Elemental Morphos: +1 to all elemental affinities (Fire, Earth, Air, Water, Ice)

#### Nexus (Mana Cost Reduction)

- **Basic Effect**: -1 mana cost to all spells (minimum 1)
- **Advanced Effects**: Custom reduction formulas or affinity-specific reductions
- **Configuration**:
    ```javascript
    {
      type: "nexus",
      costReduction: 1,                    // Flat reduction
      affinitySpecific: { fire: 2 },      // Extra reduction for fire spells
      formula: "Math.floor(@level / 2)"   // Advanced: level-based reduction
    }
    ```
- **Examples**:
    - Basic Nexus: -1 mana cost to all spells
    - Fire Nexus: -1 to all spells, -2 additional to fire spells
    - Master Nexus: Reduction scales with quadralithe level

#### Radiant (Attack Roll Bonuses)

- **Basic Effect**: +affinity level to spell attack rolls
- **Advanced Effects**: Custom formulas for attack roll calculation
- **Configuration**:
    ```javascript
    {
      type: "radiant",
      attackBonus: "@affinityLevel",           // Basic: add affinity level
      affinitySpecific: { arcane: 2 },        // Extra bonus for arcane spells
      formula: "@affinityLevel * 2 + @level"  // Advanced: complex calculation
    }
    ```
- **Examples**:
    - Basic Fire Radiant: +Fire affinity level to fire spell attacks
    - Arcane Radiant: +Arcane level to all spell attacks, +2 extra to arcane spells
    - Master Radiant: Complex scaling based on multiple factors

#### Drain (Mana Generation)

- **Basic Effect**: Action to gain 1 mana
- **Advanced Effects**: Custom mana generation amounts or conditions
- **Configuration**:
    ```javascript
    {
      type: "drain",
      manaGeneration: 1,
      actionType: "action",        // "action", "bonus", "reaction"
      usesPerRest: 3,             // Limited uses
      triggerCondition: "onHit",   // Advanced: conditional generation
      formula: "@level + 1"        // Advanced: scaling generation
    }
    ```
- **Examples**:
    - Basic Drain: Action to gain 1 mana, 3 uses per long rest
    - Vampiric Drain: Gain mana when dealing damage with spells
    - Master Drain: Generation amount scales with quadralithe level

### Equipment Grid Interface

#### 2x2 Visual Grid Layout

```
┌─────────────────────────────────────────────────────────────┐
│ QUADRALITHE EQUIPMENT                                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┬─────────────────┐                       │
│ │     SLOT 1      │     SLOT 2      │                       │
│ │   [Morphos]     │    [Nexus]      │                       │
│ │ Fire Crystal    │ Mana Conduit    │                       │
│ │ +2 Fire Aff.    │ -1 Spell Cost   │                       │
│ ├─────────────────┼─────────────────┤                       │
│ │     SLOT 3      │     SLOT 4      │                       │
│ │   [Radiant]     │    [Empty]      │                       │
│ │ Lightning Rod   │                 │                       │
│ │ +Air Lvl Atk    │                 │                       │
│ └─────────────────┴─────────────────┘                       │
│                                                             │
│ ACTIVE EFFECTS:                                             │
│ • Fire Affinity: +2 (Morphos)                             │
│ • Spell Cost: -1 (Nexus)                                   │
│ • Air Spell Attacks: +3 (Radiant)                         │
│                                                             │
│ EQUIPPED SPELLS:                                            │
│ • Flame Burst (from Fire Crystal)                         │
│ • Chain Lightning (from Lightning Rod)                     │
└─────────────────────────────────────────────────────────────┘
```

#### Drag & Drop Functionality

- **Equipment can be dragged to/from slots**
- **Visual feedback during drag operations**
- **Automatic effect calculation on equip/unequip**
- **Validation**: Only quadralithe-type items can be equipped

### Equipment Data Model

#### Actor Equipment Storage

```javascript
flags.adrasamen.equippedQuadralithes = {
	slot1: {
		itemId: "abc123",
		type: "morphos",
		name: "Fire Crystal",
		effects: {
			affinityBonus: { fire: 2 },
			attachedSpells: ["flame-burst-id"],
		},
	},
	slot2: {
		itemId: "def456",
		type: "nexus",
		name: "Mana Conduit",
		effects: {
			costReduction: 1,
			affinitySpecific: {},
		},
	},
	slot3: {
		itemId: "ghi789",
		type: "radiant",
		name: "Lightning Rod",
		effects: {
			attackBonus: "@affinityLevel",
			affinitySpecific: { air: 0 },
		},
	},
	slot4: null,
};
```

#### Quadralithe Item Configuration

```javascript
// Item data structure for quadralithe equipment
item.system.quadralithe = {
	type: "morphos", // "morphos", "nexus", "radiant", "drain"
	level: 1, // Equipment level for scaling effects

	// Type-specific effects
	effects: {
		// Morphos
		affinityBonus: { fire: 1, earth: 1 },

		// Nexus
		costReduction: 1,
		affinitySpecific: { fire: 1 },

		// Radiant
		attackBonus: "@affinityLevel",
		affinitySpecific: { arcane: 2 },

		// Drain
		manaGeneration: 1,
		actionType: "action",
		usesPerRest: 3,
	},

	// Attached spells (upgrades)
	attachedSpells: [
		{
			spellId: "custom-flame-burst",
			manaCost: 0, // Can be 0 for quadralithe spells
			description: "Launch a burst of flame",
		},
	],

	// Visual/flavor
	description: "A crystalline formation that pulses with elemental energy",
	rarity: "uncommon",
};
```

### Upgrade System

#### Custom Spell Attachment

- **Quadralithes can have attached spells** (with or without mana costs)
- **Spells appear in character's available spells when equipped**
- **Unequipping removes access to attached spells**
- **Spells can be modified through equipment properties**

#### Equipment Modification Process

1. **Unequip Current**: Remove existing quadralithe from slot
2. **Modify Item**: Change equipment properties to add/modify spells
3. **Re-equip Enhanced**: Place upgraded equipment back in slot
4. **Alternative**: Replace with entirely different quadralithe

#### Scaling and Advancement

- **Equipment Level**: Higher level quadralithes have stronger effects
- **Formula-based Effects**: Advanced quadralithes use dynamic formulas
- **Combination Effects**: Multiple quadralithes can synergize

### Effect Integration

#### Real-time Calculation System

```javascript
// Calculate total bonuses from all equipped quadralithes
actor.calculateQuadralitheEffects = function () {
	const equipped = this.flags.adrasamen?.equippedQuadralithes || {};

	let totalAffinityBonus = {};
	let totalCostReduction = 0;
	let totalAttackBonus = {};
	let availableSpells = [];

	Object.values(equipped).forEach((slot) => {
		if (!slot) return;

		const item = this.items.get(slot.itemId);
		if (!item) return;

		// Process based on quadralithe type
		switch (slot.type) {
			case "morphos":
				// Add affinity bonuses
				Object.entries(slot.effects.affinityBonus || {}).forEach(
					([affinity, bonus]) => {
						totalAffinityBonus[affinity] =
							(totalAffinityBonus[affinity] || 0) + bonus;
					},
				);
				break;

			case "nexus":
				// Add cost reductions
				totalCostReduction += slot.effects.costReduction || 0;
				break;

			case "radiant":
				// Add attack bonuses (affinity-specific)
				Object.entries(slot.effects.affinitySpecific || {}).forEach(
					([affinity, bonus]) => {
						totalAttackBonus[affinity] =
							(totalAttackBonus[affinity] || 0) + bonus;
					},
				);
				break;

			case "drain":
				// Track mana generation options (handled in actions)
				break;
		}

		// Collect attached spells
		if (slot.effects.attachedSpells) {
			availableSpells.push(...slot.effects.attachedSpells);
		}
	});

	return {
		affinityBonus: totalAffinityBonus,
		costReduction: totalCostReduction,
		attackBonus: totalAttackBonus,
		availableSpells: availableSpells,
	};
};
```

#### Integration with Previous Phases

- **Phase 1 (Mana)**: Nexus quadralithes modify spell costs
- **Phase 2 (Affinity)**: Morphos quadralithes add to affinity levels
- **Phase 3 (Spells)**: Radiant quadralithes modify attack rolls, Nexus affects costs

### Visual Design Guidelines

#### Quadralithe Type Visual Identity

- **Morphos**: Crystalline, geometric, pulsing with affinity colors
- **Nexus**: Flowing, circuit-like patterns, blue energy
- **Radiant**: Sharp, angular, bright/glowing elements
- **Drain**: Dark, absorptive, void-like or vampiric aesthetics

#### UI Color Coding

- **Morphos**: Green border/accent (growth/enhancement)
- **Nexus**: Blue border/accent (mana/energy)
- **Radiant**: Yellow/Gold border/accent (power/light)
- **Drain**: Purple/Dark border/accent (absorption)

## API Foundation

- `actor.equipQuadralithe(slot, itemId)`: Equip quadralithe to specific slot
- `actor.unequipQuadralithe(slot)`: Remove quadralithe from slot
- `actor.getQuadralitheBonus(type)`: Get total bonus from equipped quadralithes
- `actor.calculateSpellCost(spell)`: Get final spell cost with all modifiers (integrates Nexus)
- `actor.calculateSpellAttack(spell)`: Get spell attack roll with bonuses (integrates Radiant)
- `actor.getAvailableQuadralitheSpells()`: Get spells from equipped quadralithes
- `actor.useDrainQuadralithe(slotNumber)`: Activate drain quadralithe for mana

## Technical Implementation

### File Structure

- **Core Logic**: `scripts/quadralithe/quadralithe-system.mjs` (new)
- **Equipment UI**: `scripts/quadralithe/equipment-grid.mjs` (new)
- **Item Types**: `scripts/quadralithe/quadralithe-item.mjs` (new)
- **Templates**: `templates/quadralithe-grid.hbs` (new)
- **Templates**: `templates/quadralithe-config.hbs` (new)
- **Styles**: `styles/quadralithe.css` (new)

### Item Type Extension

```javascript
// Extend D&D5e item system for quadralithe equipment
class QuadralitheItem extends CONFIG.Item.documentClass {
	get isQuadralithe() {
		return this.system.quadralithe?.type;
	}

	get quadralitheType() {
		return this.system.quadralithe?.type;
	}

	calculateEffects(actor) {
		const config = this.system.quadralithe;
		if (!config) return {};

		// Process formulas with actor context
		const context = {
			level: config.level || 1,
			affinityLevel: actor.getAffinityLevel(/* relevant affinity */),
			actorLevel: actor.system.details.level,
		};

		return this._processEffectFormulas(config.effects, context);
	}

	_processEffectFormulas(effects, context) {
		// Handle @variable substitution in effect formulas
		// Return calculated effect values
	}
}
```

## Integration Testing Strategy

### Phase Integration Tests

1. **Morphos + Affinity System**: Verify affinity bonuses apply correctly
2. **Nexus + Spell Costs**: Verify spell cost reductions work
3. **Radiant + Spell Attacks**: Verify attack roll bonuses apply
4. **Drain + Mana System**: Verify mana generation works
5. **Multi-Equipment**: Verify multiple quadralithes stack correctly

### Edge Case Handling

- **Empty Slots**: Handle missing/null equipment gracefully
- **Invalid Items**: Prevent non-quadralithe items from being equipped
- **Formula Errors**: Graceful fallback for invalid formulas
- **Circular References**: Prevent infinite loops in effect calculations

## Success Criteria

1. 2x2 equipment grid displays and functions correctly
2. Drag & drop equipment works smoothly
3. All four quadralithe types provide their intended effects
4. Equipment effects integrate correctly with mana, affinity, and spell systems
5. Attached spells appear/disappear correctly when equipping/unequipping
6. Real-time effect calculation updates character stats immediately
7. Equipment data persists across sessions
8. Multiple quadralithes stack appropriately without conflicts
9. Visual design clearly distinguishes quadralithe types
10. Advanced formula-based effects work for high-level equipment
