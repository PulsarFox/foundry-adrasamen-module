# Phase 1: Core Mana System

_Design Date: April 16, 2026_

## Overview

Implement a core mana system for the Adrasamen module that adds mana points to D&D5e characters with immediate consequences for mana depletion and integration with D&D5e rest mechanics.

## Core Requirements

### Mana Data Model

- **Storage**: Mana data stored in actor flags (`flags.adrasamen.mana`)
- **Properties**:
    - `current`: Current mana points (number, min: 0)
    - `max`: Maximum mana points (number, manually editable)
- **Persistence**: Data survives across sessions and world reloads
- **Access**: Available to other modules via public API

### Mana Mechanics

- **Spending**: `spendMana(amount)` reduces current mana, minimum 0
- **Gaining**: `gainMana(amount)` increases current mana, maximum = max mana
- **Zero Mana Consequence**: When current mana reaches 0:
    1. Immediately apply "Vulnerable Soul" custom condition
    2. Immediately apply "Unconscious" condition
- **Recovery**: When mana increases to ≥1, automatically remove "Vulnerable Soul" condition
    - Unconscious condition remains until manually cleared (allows for roleplay/tactical decisions)

### Rest Integration

- **Short Rest**: Restore `Math.ceil(maxMana / 2)` mana
- **Long Rest**: Restore full `maxMana` mana
- **Hook Integration**: Use existing D&D5e rest completion hooks
- **User Feedback**: Show mana restoration in rest dialog/chat message

### User Interface

#### Character Sheet Integration

- **Mana Bar**: Complete existing mana bar template integration
- **Visual Design**: Match D&D5e health bar styling with blue mana theme
- **Interaction**: Click to edit current mana directly
- **Configuration**: Settings button for max mana editing
- **Real-time Updates**: Bar updates immediately on mana changes

#### Token Integration

- **Token Bars**: Add mana as configurable token resource (like health/AC)
- **Display Options**: GM can choose which tokens show mana bars
- **Visual Feedback**: Mana percentage reflected in bar fill
- **Color Coding**: Blue gradient for mana, red when at 0

#### Status Effects

- **Custom Condition**: "Vulnerable Soul" status effect
- **Visual Design**: Custom icon for condition display
- **Tooltip**: Clear description of the condition's effects
- **Automation**: Automatically added/removed based on mana state

### API Foundation

Public methods for external module/macro use:

- `actor.spendMana(amount)`: Spend mana with automatic condition checking
- `actor.gainMana(amount)`: Gain mana with automatic condition removal
- `actor.setMana(current, max)`: Direct mana manipulation
- `actor.getManaData()`: Get current mana state object
- `actor.spendHealth(amount)`: Spend health points (for health-based spell costs)
- `actor.canAffordCosts(manaCost, healthCost)`: Check if actor can afford both mana and health costs

### Event System

- **Mana Change Events**: Fire custom events on mana modifications
- **Hook Points**: Allow other modules to react to mana changes
- **Future Integration**: Foundation for spell cost system (Phase 3)

## Technical Implementation

### File Structure

- **Core Logic**: `scripts/mana/mana.mjs` (extend existing)
- **UI Templates**: `templates/mana-bar.hbs` (complete existing)
- **Styles**: `styles/mana.less` (extend existing)
- **Status Effects**: `scripts/mana/conditions.mjs` (new)
- **API**: Public methods in main mana module

### Integration Points

- **Actor Data**: Use `flags.adrasamen.mana` for non-invasive storage
- **Rest Hooks**: `dnd5e.restCompleted` hook for mana restoration
- **Sheet Rendering**: `renderCharacterActorSheet` hook (already started)
- **Token Configuration**: Extend D&D5e token resource configuration

### Error Handling

- **Graceful Degradation**: Module works even if mana data is missing
- **Validation**: Ensure mana values are valid numbers
- **Edge Cases**: Handle negative inputs, missing actor data
- **User Feedback**: Clear error messages for invalid operations

## Future Phase Preparation

### Phase 2 Integration (Affinity System)

- Mana data structure ready for affinity-based max mana calculation
- Event system allows affinity changes to trigger mana recalculation
- API supports external modification for affinity bonuses

### Phase 3 Integration (Spell System)

- Event hooks ready for spell cost deduction (mana and health)
- API methods support spell casting integration with mixed costs
- Health deduction methods ready for health-based spell costs
- Condition system foundation for spell-related effects

### Phase 4 Integration (Quadralithe System)

- Modular mana modification supports quadralithe bonuses
- Token display ready for equipment-based visual changes
- API extensible for complex equipment interactions

## Success Criteria

1. Characters can have current/max mana displayed and edited
2. Mana spending/gaining works correctly with bounds checking
3. Zero mana immediately triggers both conditions as specified
4. Gaining mana removes "Vulnerable Soul" but leaves unconscious
5. Short/long rests restore correct mana amounts
6. Token mana bars configurable and functional
7. All functionality accessible via clean public API
8. No conflicts with existing D&D5e functionality

## Risk Mitigation

- **D&D5e Updates**: Using flags and hooks minimizes breakage risk
- **Performance**: Efficient event handling for frequent mana changes
- **Compatibility**: Standard FoundryVTT module patterns for broad compatibility
- **Testing**: Each feature testable independently
