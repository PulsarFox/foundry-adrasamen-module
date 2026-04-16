# Phase 0: Adrasamen Class Foundation

_Design Date: April 16, 2026_

## Overview

Create a custom "Adrasamen" class for D&D5e that serves as a completely configurable foundation for the classless magic system. This class provides the necessary structure for D&D5e compatibility while allowing maximum customization of all character mechanics.

## Core Requirements

### Custom Class Definition

- **Class Name**: "Adrasamen"
- **Hit Die**: Configurable (default d8)
- **Primary Abilities**: All abilities equally valid (no class restrictions)
- **Saving Throw Proficiencies**: Manually configurable per character
- **Skill Proficiencies**: Manually selectable from full list
- **Equipment Proficiencies**: Manually configurable (armor, weapons, tools)

### Configurable Core Mechanics

#### Health & Vitality

- **HP Formula**: Editable formula field (default: `@classes.adrasamen.levels * (@abilities.con.mod + @scale.adrasamen.hp-per-level)`)
- **HP per Level**: Configurable scale value (default: 5)
- **Manual Override**: Allow direct HP value input bypassing formula
- **Hit Die Options**: d4, d6, d8, d10, d12 selectable per character

#### Armor Class System

- **AC Formula**: Completely editable (default: `10 + @abilities.dex.mod`)
- **AC Components**: Support for custom AC calculations
- **Equipment Integration**: Standard D&D5e armor bonuses still apply
- **Manual Override**: Direct AC value input available

#### Spell System Integration

- **Spell Attack Bonus**: Based on affinity system (Phase 2)
- **Spell Save DC**: Based on affinity system (Phase 2)
- **No Spell Slots**: Compatible with mana system (Phase 1)
- **Ritual Casting**: Available if character knows the spell

### Class Features

#### Level 1: Adrasamen Foundation

- **Affinity Awakening**: Gain primary and secondary affinities (Phase 2)
- **Mana Pool**: Gain initial mana points (Phase 1)
- **Spell Learning**: Ability to learn spells through play/discovery
- **Equipment Attunement**: Can attune to quadralithes (Phase 4)

#### Progression Features

- **No Fixed Features**: Class doesn't grant automatic features at levels
- **Custom Advancement**: Players/GMs define character growth
- **Flexible Progression**: Advancement through affinity levels and equipment
- **Open Skill Selection**: Gain skills based on character development

### Integration Points

#### Character Creation Process

1. **Select Adrasamen Class**: Choose as character's class
2. **Configure Base Stats**: Set HP formula, AC formula, hit die
3. **Choose Proficiencies**: Select saving throws, skills, equipment
4. **Set Affinities**: Choose primary/secondary affinities (Phase 2)
5. **Initial Mana**: Set starting mana pool (Phase 1)
6. **Starting Spells**: Select initial known spells (Phase 3)

#### Spell Acquisition System

- **No Automatic Spells**: Class doesn't grant spells by level
- **Discovery-Based**: Learn spells through gameplay, research, teaching
- **Affinity-Restricted**: Can only learn spells matching character affinities
- **GM Flexibility**: Complete control over spell access and timing

## Data Model

### Class Configuration

```javascript
// Class definition in CONFIG.DND5E.classes
CONFIG.DND5E.classes.adrasamen = {
	name: "Adrasamen",
	hitDie: "d8", // Configurable per character
	primaryAbility: ["str", "dex", "con", "int", "wis", "cha"], // All valid
	saves: [], // No default saves, manually configured
	skills: {
		// All skills available
		number: 2, // Default skill choices
		choices: Object.keys(CONFIG.DND5E.skills),
	},
	armorProf: [], // Manually configured
	weaponProf: [], // Manually configured
	toolProf: [], // Manually configured

	// Custom Adrasamen properties
	adrasamen: {
		configurableHP: true,
		configurableAC: true,
		customFormulas: true,
		affinityBased: true,
	},
};
```

### Character Data Extensions

```javascript
// Actor system data extensions
actor.system.details.class = "adrasamen";
actor.system.adrasamen = {
	// Configurable mechanics
	hpFormula:
		"@classes.adrasamen.levels * (@abilities.con.mod + @scale.adrasamen.hp-per-level)",
	hpPerLevel: 5,
	hpManualOverride: null,

	acFormula: "10 + @abilities.dex.mod",
	acManualOverride: null,

	hitDie: "d8",

	// Proficiency customization
	customSaves: ["con", "wis"], // Manually selected
	customSkills: ["arcana", "medicine"], // Manually selected
	customArmorProf: ["light"], // Manually selected
	customWeaponProf: ["simple"], // Manually selected

	// Spell system integration
	spellAttackFormula: "@affinityBonus.primary + @prof", // From Phase 2
	spellSaveFormula: "8 + @affinityBonus.primary + @prof", // From Phase 2
	ritualCasting: true,
};
```

## Character Sheet Integration

### Class Configuration Panel

```
┌─────────────────────────────────────────────────────────────┐
│ ADRASAMEN CLASS CONFIGURATION                               │
├─────────────────────────────────────────────────────────────┤
│ CORE MECHANICS                                              │
│                                                             │
│ Hit Points:                                                 │
│ ☐ Use Formula: [formula field................................................] │
│ ☑ Manual Override: [150] HP                                │
│                                                             │
│ Armor Class:                                                │
│ ☑ Use Formula: [10 + @abilities.dex.mod + @equipment.ac]   │
│ ☐ Manual Override: [  ] AC                                 │
│                                                             │
│ Hit Die: [d8 ▼]    HP per Level: [5]                       │
│                                                             │
│ PROFICIENCIES                                               │
│                                                             │
│ Saving Throws: ☑ STR ☐ DEX ☑ CON ☐ INT ☑ WIS ☐ CHA        │
│                                                             │
│ Skills: [Arcana ▼] [Medicine ▼] [+ Add Skill]              │
│                                                             │
│ Armor: ☑ Light ☐ Medium ☐ Heavy ☐ Shields                 │
│ Weapons: ☑ Simple ☐ Martial ☐ Firearms                    │
│ Tools: [Alchemist's Supplies ▼] [+ Add Tool]               │
│                                                             │
│ SPELL SYSTEM                                                │
│                                                             │
│ Spell Attack: Based on Primary Affinity                    │
│ Spell Save DC: 8 + Primary Affinity + Proficiency         │
│ Ritual Casting: ☑ Enabled                                  │
└─────────────────────────────────────────────────────────────┘
```

### Character Creation Workflow

1. **Choose Adrasamen Class** in character creation
2. **Configure Core Stats** using the configuration panel
3. **Select Proficiencies** from full available lists
4. **Set Initial Values** for HP, AC, etc.
5. **Integration Ready** for Phases 1-4 systems

## Technical Implementation

### File Structure

- **Class Definition**: `scripts/class/adrasamen-class.mjs` (new)
- **Configuration UI**: `scripts/class/class-config.mjs` (new)
- **Formula System**: `scripts/class/custom-formulas.mjs` (new)
- **Templates**: `templates/class-config-panel.hbs` (new)
- **Styles**: `styles/class-config.css` (new)

### D&D5e Integration Hooks

```javascript
// Register custom class during initialization
Hooks.once("init", () => {
	// Add Adrasamen to available classes
	CONFIG.DND5E.classes.adrasamen = AdrasamenClass.definition;

	// Register custom advancement types
	CONFIG.DND5E.advancementTypes.adrasamen = AdrasamenAdvancement;

	// Override specific calculations for Adrasamen characters
	CONFIG.Actor.documentClass.prototype.prepareAdrasamenData = function () {
		if (this.system.details.class !== "adrasamen") return;

		// Apply custom HP calculation
		this._prepareAdrasamenHP();

		// Apply custom AC calculation
		this._prepareAdrasamenAC();

		// Apply custom spell bonuses
		this._prepareAdrasamenSpells();
	};
});

// Hook into character sheet rendering
Hooks.on("renderCharacterActorSheet", (sheet, html) => {
	if (sheet.actor.system.details.class === "adrasamen") {
		AdrasamenClassUI.addConfigurationPanel(sheet, html);
	}
});
```

### Formula Evaluation System

```javascript
class AdrasamenFormulas {
	static evaluateHP(actor, formula) {
		const rollData = actor.getRollData();

		// Add Adrasamen-specific variables
		rollData.adrasamen = actor.system.adrasamen;
		rollData.affinityLevels = actor.getAffinityLevels(); // From Phase 2

		try {
			const roll = new Roll(formula, rollData);
			return roll.evaluate({ async: false }).total;
		} catch (error) {
			console.warn(`Invalid HP formula for ${actor.name}: ${formula}`);
			return actor.system.adrasamen.hpManualOverride || 1;
		}
	}

	static evaluateAC(actor, formula) {
		// Similar pattern for AC calculation
	}
}
```

## Integration with Future Phases

### Phase 1 (Mana System)

- **Initial Mana**: Adrasamen characters start with configurable mana
- **Mana Formula**: Can be tied to class level or affinity levels
- **No Spell Slots**: Class is designed to work with mana instead

### Phase 2 (Affinity System)

- **Affinity Selection**: Integrated into Adrasamen character creation
- **Spell Bonuses**: Spell attack and save DC come from affinities
- **No Class Restrictions**: All affinities available to Adrasamen

### Phase 3 (Spell Integration)

- **Spell Learning**: Adrasamen characters learn spells through discovery
- **No Level Restrictions**: Spells limited by affinity, not class level
- **Flexible Progression**: Spell access controlled by GM and gameplay

### Phase 4 (Quadralithe System)

- **Attunement**: Adrasamen characters can attune to quadralithes
- **Equipment Effects**: Integrate with configurable AC/HP formulas
- **No Class Limitations**: All quadralithe types available

## Compatibility & Migration

### Existing Character Conversion

- **Migration Tool**: Convert existing characters to Adrasamen class
- **Preserve Progress**: Maintain levels, abilities, equipment
- **Optional Conversion**: Keep existing classes working alongside Adrasamen
- **Backup System**: Always preserve original character data

### Multi-Class Compatibility

- **Pure Adrasamen**: Recommended for full system integration
- **Hybrid Characters**: Partial compatibility with existing D&D5e classes
- **GM Flexibility**: Configure integration level per campaign

## Success Criteria

1. Adrasamen class appears in D&D5e character creation
2. All core mechanics (HP, AC, saves) are configurable per character
3. Proficiency system allows manual selection from full lists
4. Formula system works correctly with custom expressions
5. Character sheet shows configuration options clearly
6. Integration hooks ready for Phases 1-4 systems
7. No interference with existing D&D5e classes
8. Migration tools preserve existing character data
9. Formula evaluation handles edge cases gracefully
10. Configuration persists correctly across sessions
