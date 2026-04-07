# Adrasamen Mana System

This module adds a mana system to D&D 5e characters in Foundry VTT.

## Features

- **Mana Bar**: Displays current/max mana similar to the health bar
- **Configurable**: Click the gear icon to configure mana values and formulas
- **Rest Integration**: Automatically restores mana on short/long rests
- **Click to Edit**: Click on the mana bar to quickly adjust current mana
- **Formula Support**: Customizable formulas for level-up mana gains and rest recovery

## Usage

1. **Initial Setup**: New characters automatically get 10 max mana
2. **Manual Configuration**: Click the gear icon next to "MANA" to set:
    - Current mana value
    - Maximum mana value
    - Mana formula per level up (default: `1d4 + @abilities.int.mod`)
    - Short rest recovery formula (default: `floor(@maxMana / 2)`)

3. **Quick Editing**:
    - Click anywhere on the mana bar to set mana to that percentage
    - Use the configuration dialog for precise values

4. **Rest Recovery**:
    - **Short Rest**: Recovers mana based on the short rest formula
    - **Long Rest**: Fully restores mana to maximum

## Formulas

Formulas support standard Foundry VTT roll syntax and can reference actor data:

- `@abilities.int.mod` - Intelligence modifier
- `@maxMana` - Maximum mana value
- `@currentMana` - Current mana value
- `@details.level` - Character level

### Example Formulas

- Level up mana: `1d4 + @abilities.int.mod`
- Short rest recovery: `floor(@maxMana / 2)`
- Class-based recovery: `@details.level + @abilities.int.mod`

## Data Structure

Mana data is stored as actor flags under `adrasamen.mana`:

```javascript
{
  currentMana: 8,
  maxMana: 15,
  isExhausted: false,
  config: {
    manaFormulaPerLevelUp: "1d4 + @abilities.int.mod",
    manaShortRestFormula: "floor(@maxMana / 2)"
  }
}
```
