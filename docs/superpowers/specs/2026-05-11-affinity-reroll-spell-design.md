# Affinity Reroll Spell — Design Spec

_Specification Date: May 11, 2026_

## Overview

A spell named **"Affinity Shift"** allows a player to reroll their secondary affinity. When cast, it deducts mana normally via the existing adrasamen spell system, then rolls `1d7` to select a new secondary affinity from the 7 eligible ones (all 9 affinities minus the actor's primary and current secondary). The result is applied immediately and announced in chat as a standard Foundry roll message.

## Spell Setup (GM)

Create a spell item in Foundry with:
- **Name:** `Affinity Shift` (exact, case-sensitive)
- **Spellcasting method:** Adrasamen
- **Affinity costs:** set as desired for the campaign
- **Description:** optional flavour text

No flags or special configuration needed. The name alone triggers the reroll logic.

## Architecture

### New file: `scripts/affinity/affinity-reroll.mjs`

Contains all reroll logic, isolated from the rest of the spell system.

**Exports:**
- `AFFINITY_REROLL_SPELL_NAME` — string constant `"Affinity Shift"`
- `performAffinityReroll(actor)` — async function, main entry point

**`performAffinityReroll(actor)` logic:**
1. Read affinity data via `getAffinityData(actor)` from `affinity-core.mjs`
2. Find current primary affinity (the one with `isPrimary: true`)
3. Find current secondary affinity (the one with `isSecondary: true`)
4. Build eligible pool: all 9 affinity values from `AFFINITIES`, sorted alphabetically, excluding primary and current secondary → 7 entries
5. Roll `new Roll("1d7")`, evaluate it
6. Map roll result (1–7) to pool index (result − 1)
7. Call `setSecondaryAffinity(actor, newAffinity)` — this fires `adrasamen.affinityChanged` automatically
8. Build and post a `ChatMessage` with:
   - `speaker`: `ChatMessage.getSpeaker({ actor })`
   - `flavor`: localized string `"Affinity Shift"` (or plain text if not localized)
   - `type`: `CONST.CHAT_MESSAGE_TYPES.ROLL`
   - `rolls`: `[roll]`
   - `content`: HTML showing old secondary → new secondary (affinity display names from `AFFINITY_CONFIG`)

### Modified file: `scripts/spells/spell-casting.mjs`

In `onActivityConsumption`, after the existing try/catch block that deducts mana and health, add:

```javascript
// Affinity reroll — must run after mana deduction
if (item.name === AFFINITY_REROLL_SPELL_NAME) {
    await performAffinityReroll(actor);
}
```

Import `AFFINITY_REROLL_SPELL_NAME` and `performAffinityReroll` from `../affinity/affinity-reroll.mjs`.

### `main.mjs`

No changes required. `affinity-reroll.mjs` registers no hooks of its own — all triggering flows through the existing `dnd5e.activityConsumption` hook in `spell-casting.mjs`, which is already initialized in the `ready` hook.

## Data Flow

```
Player casts "Affinity Shift"
  → dnd5e.preActivityConsumption: cost calculated, stored in messageConfig flags
  → dnd5e.activityConsumption:
      1. Mana deducted (existing logic)
      2. Health deducted (existing logic)
      3. item.name === "Affinity Shift" → performAffinityReroll(actor)
          a. Build pool of 7 eligible affinities
          b. Roll 1d7
          c. setSecondaryAffinity(actor, newAffinity)  ← fires adrasamen.affinityChanged
          d. ChatMessage.create with roll result
```

## Chat Message Content

The message shows:
- **Flavor:** `"Affinity Shift"`
- **Roll:** the `1d7` result (expandable dice tooltip in dnd5e UI)
- **Content body:** `"[ActorName]'s secondary affinity shifts from [OldAffinity] to [NewAffinity]."`

Affinity display names come from `AFFINITY_CONFIG[affinity].label`, resolved via `game.i18n.localize()`.

## Localization

Two new keys added to `lang/en.json`:

```json
"AffinityReroll.ChatFlavor": "Affinity Shift",
"AffinityReroll.ChatContent": "{name}'s secondary affinity shifts from {oldAffinity} to {newAffinity}."
```

## Files Changed

| File | Change |
|------|--------|
| `scripts/affinity/affinity-reroll.mjs` | **New** — reroll logic |
| `scripts/spells/spell-casting.mjs` | **Modified** — call `performAffinityReroll` after cost deduction |
| `lang/en.json` | **Modified** — two new localization keys |

## Out of Scope

- No compendium pack
- No GM testing automation
- No git commit step
- No UI to configure the spell name (constant is sufficient for campaign use)
