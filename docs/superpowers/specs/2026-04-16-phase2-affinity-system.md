# Phase 2: Affinity Foundation System

_Design Date: April 16, 2026_

## Overview

Replace D&D5e schools of magic with nine elemental/conceptual affinities. Characters select primary and secondary affinities linked to ability scores, with a leveling system that affects spell costs and effectiveness.

## Core Requirements

### Affinity Types

Nine distinct affinities replace traditional schools:

- **Water**
- **Air**
- **Earth**
- **Fire**
- **Ice**
- **Light**
- **Shadow**
- **Mind**
- **Arcane**

### Affinity Selection System

- **Primary Affinity**: Character's main magical focus (+1 base level)
- **Secondary Affinity**: Character's second focus (+1 base level)
- **Other Affinities**: All others start at 0 level
- **Characteristic Linking**: The primary, secondary, and all other affinities links to one ability score (STR, DEX, CON, INT, WIS, CHA)
- **Advanced Characteristic linking**: We need to be able to get the bonus characteristic of any linked affinity. So if the primary is fire, and the primary is linked to STR, and STR is 16, we need to have the +3 bonus easily available.
- **Restrictions**: Primary, secondary and others must link to different characteristics (all others links to the same ability score)

### Affinity Level System

- **Base Levels**: Primary +1, Secondary +1, Others 0
- **Manual Adjustment**: Players can increase levels as they advance
- **Level Effects**: Higher levels reduce mana costs and improve spell effects
- **Display Formula**: Final Level = Base Level + Manual Level + Equipment Bonuses (Morphos from Phase 4)

### Character Sheet Integration

New "Adrasamen" tab containing:

#### Affinity Management Panel

- **Affinity List**: All 9 affinities with current levels displayed
- **Characteristic Selects**: 3 dropdowns for Primary/Secondary/Other assignments
- **Primary/Secondary Radio**: Buttons to select which affinity is primary/secondary
- **Level Inputs**: Editable fields for manual level increases
- **Visual Feedback**: Clear indication of final calculated levels

#### Future Equipment Panel (Phase 4)

- **2x2 Quadralithe Grid**: Visual equipment slots
- **Equipment Effects**: Display of current bonuses/modifications

## Data Model

```javascript
flags.adrasamen.affinities = {
	water: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: false,
	},
	air: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: true,
	},
	earth: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: false,
	},
	fire: {
		manualLevel: 1,
		isPrimary: true,
		isSecondary: false,
	},
	ice: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: false,
	},
	light: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: false,
	},
	shadow: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: false,
	},
	mind: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: false,
	},
	arcane: {
		manualLevel: 0,
		isPrimary: false,
		isSecondary: false,
	},
};
```

### Max Mana Integration

- **Formula**: `1d4 + highest affinity level`
- **Automatic Calculation**: Updates when affinity levels change
- **Manual Override**: GM can still manually set max mana if needed

## UI Layout Design

### Affinity Tab Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ADRASAMEN TAB                                               │
├─────────────────────────────────────────────────────────────┤
│ AFFINITY MANAGEMENT                                         │
│                                                             │
│ Primary:   [Strength  ▼]                                    │
│ Secondary: [Dexterity ▼]                                    │
│ Others:    [Wisdom    ▼]                                    │
│                                                             │
│ AFFINITY LEVELS                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Water  │ Wis │ [○] [○] │ Manual: [0] │ Final: 0        │ │
│ │ Air    │ Dex │ [○] [●] │ Manual: [0] │ Final: 1 (S)    │ │
│ │ Earth  │ Con │ [○] [○] │ Manual: [0] │ Final: 0        │ │
│ │ Fire   │ Str │ [●] [○] │ Manual: [1] │ Final: 2 (P)    │ │
│ │ Ice    │ Int │ [○] [○] │ Manual: [0] │ Final: 0        │ │
│ │ Light  │ Cha │ [○] [○] │ Manual: [0] │ Final: 0        │ │
│ │ Shadow │ Cha │ [○] [○] │ Manual: [0] │ Final: 0        │ │
│ │ Mind   │ Int │ [○] [○] │ Manual: [0] │ Final: 0        │ │
│ │ Arcane │ Int │ [○] [○] │ Manual: [0] │ Final: 0        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ QUADRALITHE EQUIPMENT (Phase 4)                            │
│ ┌─────────────┬─────────────┐                               │
│ │    [Slot1]  │   [Slot2]   │                               │
│ │             │             │                               │
│ ├─────────────┼─────────────┤                               │
│ │    [Slot3]  │   [Slot4]   │                               │
│ │             │             │                               │
│ └─────────────┴─────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

## API Foundation

- `actor.getAffinityLevel(affinityName)`: Get calculated affinity level (base + manual + equipment)
- `actor.setAffinityLevel(affinityName, manualLevel)`: Set manual level
- `actor.linkAffinityToCharacteristic(affinityName, characteristic)`: Link affinity
- `actor.setPrimaryAffinity(affinityName)`: Set primary affinity
- `actor.setSecondaryAffinity(affinityName)`: Set secondary affinity
- `actor.getHighestAffinityLevel()`: Get highest total affinity level (for max mana, should also be a formula access like @maxAffinity)
- `actor.getLinkedCharacteristicScore(affinityName)`: Gets the bonus characteristic score of the linked affinity (for example fire is primary, primary is STR, STR is 14, this should return 2)

## Technical Implementation

### File Structure

- **Core Logic**: `scripts/affinity/affinity.mjs` (new)
- **UI Templates**: `templates/affinity-tab.hbs` (new)
- **Styles**: `styles/affinity.css` (new)
- **Character Sheet**: Extend existing character sheet hooks

### Handlebars Template Design

```handlebars
{{!-- templates/affinity-tab.hbs --}}
<div class="affinity-management">
    <h3>{{ localize "ADRASAMEN.AffinityManagement" }}</h3>

    {{!-- Primary/Secondary Selection --}}
    <div class="affinity-selection">
        <div class="selection-row">
            <label>{{ localize "ADRASAMEN.Primary" }}:</label>
            <select name="primaryCharacteristic">
                {{#each characteristics}}
                <option value="{{@key}}" {{#if (eq @key ../primaryCharacteristic)}}selected{{/if}}>
                    {{ localize @key }}
                </option>
                {{/each}}
            </select>
        </div>

        {{!-- Secondary and Others similar structure --}}
    </div>

    {{!-- Affinity Levels Table --}}
    <div class="affinity-levels">
        <table>
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
                <tr data-affinity="{{@key}}">
                    <td>{{ localize (concat "ADRASAMEN.Affinity." @key) }}</td>
                    <td>{{ characteristic }}</td>
                    <td>
                        <input type="radio" name="primary" value="{{@key}}" {{#if isPrimary}}checked{{/if}}>
                        <input type="radio" name="secondary" value="{{@key}}" {{#if isSecondary}}checked{{/if}}>
                    </td>
                    <td><input type="number" name="manualLevel" value="{{manualLevel}}" min="0"></td>
                    <td>{{finalLevel}}</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>
</div>
```

## Integration with Phase 1

- **Max Mana Recalculation**: When affinity levels change, trigger mana max recalculation
- **Event Hooks**: Use Phase 1's event system to communicate changes
- **API Integration**: Use Phase 1's `actor.setMana()` to update max mana

## Future Phase Integration

### Phase 3 (Spell Costs)

- Affinity levels ready for spell cost reduction calculations
- API methods provide spell cost modifiers
- Character sheet displays calculated spell costs

### Phase 4 (Quadralithe Equipment)

- Equipment bonuses integrate into affinity level calculations
- 2x2 equipment grid ready for implementation
- Real-time bonus calculation for equipment effects

## Success Criteria

1. Character sheet has functional "Adrasamen" tab
2. Primary/secondary affinity selection with characteristic linking works
3. Affinity levels display correctly with all bonuses calculated
4. Max mana updates automatically based on highest affinity level
5. All affinity data persists across sessions
6. UI prevents invalid configurations (same characteristic for primary/secondary)
7. Manual level adjustments work correctly
8. API methods provide clean access to affinity data
