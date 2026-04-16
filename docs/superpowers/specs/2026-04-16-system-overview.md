# Adrasamen Magic System - Overview

_Specification Date: April 16, 2026_

## System Overview

The Adrasamen module replaces D&D5e's Vancian magic system with a comprehensive mana-based magic system featuring affinity-based spellcasting and magical equipment (quadralithes). The system consists of five integrated phases that build upon each other, starting with a foundational classless character system.

## Complete Phase Breakdown

### Phase 0: Adrasamen Class Foundation

Custom configurable class that provides D&D5e compatibility for the classless system.

- Completely configurable HP/AC formulas and proficiencies
- No fixed class features, entirely customizable progression
- Spell system integration ready for mana-based casting
- Foundation for all subsequent phases

### Phase 1: Core Mana System

Foundational mana points system with rest integration and vulnerability mechanics.

- Mana points (current/max) with manual editing
- "Vulnerable Soul" condition when mana reaches 0
- Short/long rest integration for mana recovery
- Token mana bars and character sheet integration

### Phase 2: Affinity Foundation

Nine magical affinities replace schools of magic, with characteristic linking and leveling system.

- 9 affinities: Water, Air, Earth, Fire, Ice, Light, Shadow, Mind, Arcane
- Primary/secondary affinity selection linked to ability scores
- Affinity leveling system affecting spell costs
- New "Adrasamen" character sheet tab

### Phase 3: Spell Integration

Spells use pure affinity costs (no schools or levels), with mana deduction and cost calculation.

- Spell affinity cost configuration (no D&D5e schools or levels)
- Multi-affinity spell requirements (e.g., Fire + Earth)
- Cost reduction based on affinity levels
- Character sheet spell display with calculated costs

### Phase 4: Quadralithe Equipment System

Magical equipment that modifies mana costs, affinity levels, and spell effectiveness.

- 4 types: Morphos (affinity bonuses), Nexus (cost reduction), Radiant (attack bonuses), Drain (mana generation)
- 2x2 equipment grid in character sheet
- Equipment upgrading with custom spells
- Real-time effect calculation

## Cross-Phase Integration

1. **Phase 0 → 1**: Adrasamen class provides configurable foundation for mana integration
2. **Phase 1 → 2**: Mana system provides foundation for affinity-based max mana calculation
3. **Phase 2 → 3**: Affinity levels determine spell costs and effectiveness
4. **Phase 3 → 4**: Spell system ready for quadralithe cost/attack modifications
5. **Phase 4 → All**: Equipment bonuses feed back into affinity levels, mana costs, and attack rolls
6. **Phase 3 → 4**: Spell system ready for quadralithe cost/attack modifications
7. **Phase 4 → All**: Equipment bonuses feed back into affinity levels, mana costs, and attack rolls

## Technical Architecture

- **Modular Design**: Each phase builds on previous without breaking existing functionality
- **Flag-based Storage**: All data in `flags.adrasamen.*` for clean separation
- **Event System**: Custom events allow phases to communicate without tight coupling
- **API Consistency**: Unified API patterns across all phases

## Implementation Strategy

- **Sequential Development**: Complete Phase 0 → Phase 1 → Plan/Implement Phase 2 → Plan/Implement Phase 3 → Plan/Implement Phase 4
- **Testing at Each Phase**: Verify functionality before moving to next phase
- **Rollback Safety**: Each phase can be disabled independently if issues arise
