# Affinity Reroll Spell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Affinity Shift" spell that, when cast, deducts mana normally and then rolls `1d7` to assign a new secondary affinity from the 7 eligible ones, posting the result as a Foundry roll chat message.

**Architecture:** A new isolated module `scripts/affinity/affinity-reroll.mjs` holds the constant spell name and the async reroll function. The existing `onActivityConsumption` handler in `scripts/spells/spell-casting.mjs` calls it after mana/health deduction when `item.name` matches. No new hooks, no new templates, no changes to `main.mjs`.

**Tech Stack:** Foundry VTT v14, D&D5e system v4, vanilla ES modules

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/affinity/affinity-reroll.mjs` | **Create** | Spell name constant, reroll logic, chat message |
| `scripts/spells/spell-casting.mjs` | **Modify** | Import and call `performAffinityReroll` after cost deduction |
| `lang/en.json` | **Modify** | Two new localization keys |

---

## Task 1: Create `affinity-reroll.mjs`

**Files:**
- Create: `scripts/affinity/affinity-reroll.mjs`

- [ ] **Step 1: Create the file with the spell name constant, imports, and `performAffinityReroll`**

Create `c:\Users\Foxy\AppData\Local\FoundryVTT\Data\modules\adrasamen\scripts\affinity\affinity-reroll.mjs` with this exact content:

```javascript
/**
 * Affinity Reroll Spell
 * Handles the "Affinity Shift" spell logic: rolls 1d7 to pick a new secondary affinity.
 */

import { AFFINITIES, AFFINITY_CONFIG } from "./constants.mjs";
import { getAffinityData, setSecondaryAffinity } from "./affinity-core.mjs";

/**
 * The exact spell name that triggers the affinity reroll.
 * The GM must create a spell with this exact name (case-sensitive).
 */
export const AFFINITY_REROLL_SPELL_NAME = "Affinity Shift";

/**
 * Perform the secondary affinity reroll for the given actor.
 * Must be called AFTER mana has been deducted.
 *
 * @param {Actor} actor - The actor casting the spell
 * @returns {Promise<void>}
 */
export async function performAffinityReroll(actor) {
    // Read current affinity state
    const affinityData = getAffinityData(actor);

    // Find primary and current secondary
    const primaryAffinity = Object.entries(affinityData)
        .find(([, data]) => data.isPrimary)?.[0];
    const currentSecondary = Object.entries(affinityData)
        .find(([, data]) => data.isSecondary)?.[0];

    // Build the eligible pool: all affinities sorted alphabetically,
    // excluding primary and current secondary
    const pool = Object.values(AFFINITIES)
        .sort()
        .filter(a => a !== primaryAffinity && a !== currentSecondary);

    // Roll 1dN where N is the pool size
    const roll = new Roll(`1d${pool.length}`);
    await roll.evaluate();

    // Map result (1-based) to pool index (0-based)
    const newAffinity = pool[roll.total - 1];

    // Get localized display names for the chat message
    const oldLabel = currentSecondary
        ? game.i18n.localize(AFFINITY_CONFIG[currentSecondary]?.label ?? currentSecondary)
        : game.i18n.localize("ADRASAMEN.None");
    const newLabel = game.i18n.localize(AFFINITY_CONFIG[newAffinity]?.label ?? newAffinity);

    // Apply the new secondary affinity (fires adrasamen.affinityChanged automatically)
    await setSecondaryAffinity(actor, newAffinity);

    // Build chat message content
    const content = game.i18n.format("ADRASAMEN.AffinityReroll.ChatContent", {
        name: actor.name,
        oldAffinity: oldLabel,
        newAffinity: newLabel,
    });

    // Post a standard Foundry roll chat message
    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.localize("ADRASAMEN.AffinityReroll.ChatFlavor"),
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        rolls: [roll],
        content,
    });

    console.log(`Adrasamen | Affinity Shift: ${actor.name} ${currentSecondary} → ${newAffinity}`);
}
```

---

## Task 2: Add localization keys

**Files:**
- Modify: `lang/en.json`

- [ ] **Step 1: Add the two new keys inside the `"ADRASAMEN"` object**

In `c:\Users\Foxy\AppData\Local\FoundryVTT\Data\modules\adrasamen\lang\en.json`, find the `"AffinityReroll"` key if it exists, otherwise add a new `"AffinityReroll"` block. The file already ends with the closing `}` of the `"ADRASAMEN"` object. Add the block before the last closing brace of `"ADRASAMEN"`.

The existing `"Success"` block ends with:
```json
    "Success": {
      "PresetApplied": "Applied preset '{preset}' to {item}",
      "ConfigImported": "Configuration imported to {item}",
      "ConfigExported": "Configuration exported successfully"
    },
```

After the last key in the `"ADRASAMEN"` object (which currently ends just before the outer `}`), add:

```json
    "AffinityReroll": {
      "ChatFlavor": "Affinity Shift",
      "ChatContent": "{name}'s secondary affinity shifts from {oldAffinity} to {newAffinity}."
    }
```

The exact edit: find the last line that reads `}` closing the `"ADRASAMEN"` object and add the block before it. The current last entry in `"ADRASAMEN"` is `"ValidationError"` / `"BatchOperation"` / etc — locate the final closing `}` of the outer `ADRASAMEN` object and add a comma + the new block above it. Concretely, the end of the file looks like:

```json
      "UnsafeFormula": "In {context}: Formula contains unsafe characters: {formula}"
    }
  }
}
```

Change it to:

```json
      "UnsafeFormula": "In {context}: Formula contains unsafe characters: {formula}"
    },
    "AffinityReroll": {
      "ChatFlavor": "Affinity Shift",
      "ChatContent": "{name}'s secondary affinity shifts from {oldAffinity} to {newAffinity}."
    }
  }
}
```

---

## Task 3: Wire up `spell-casting.mjs`

**Files:**
- Modify: `scripts/spells/spell-casting.mjs`

- [ ] **Step 1: Add the import at the top of `spell-casting.mjs`**

The file currently starts with:

```javascript
/**
 * Spell Casting Integration
 * Handles Adrasamen spell casting hooks and cost deduction
 */

import { calculateSpellCosts } from "./cost-calculation.mjs";
```

Change it to:

```javascript
/**
 * Spell Casting Integration
 * Handles Adrasamen spell casting hooks and cost deduction
 */

import { calculateSpellCosts } from "./cost-calculation.mjs";
import { AFFINITY_REROLL_SPELL_NAME, performAffinityReroll } from "../affinity/affinity-reroll.mjs";
```

- [ ] **Step 2: Call `performAffinityReroll` after the cost deduction try/catch**

The current end of `onActivityConsumption` looks like:

```javascript
    try {
        // Deduct mana cost if any
        if (costs.totalMana > 0) {
            await game.adrasamen.spendMana(actor, costs.totalMana);
        }

        // Deduct health cost if any
        if (costs.healthCost > 0) {
            await game.adrasamen.spendHealth(actor, costs.healthCost);
        }

        console.log(`Adrasamen | Successfully deducted costs for ${item.name}`);
    } catch (error) {
        console.error("Adrasamen | Error deducting spell costs:", error);
        const errorMessage = game.i18n.format("ADRASAMEN.Errors.CostDeductionFailed", {
            item: item.name,
            error: error.message
        });
        ui.notifications.warn(errorMessage);
    }
}
```

Change it to:

```javascript
    try {
        // Deduct mana cost if any
        if (costs.totalMana > 0) {
            await game.adrasamen.spendMana(actor, costs.totalMana);
        }

        // Deduct health cost if any
        if (costs.healthCost > 0) {
            await game.adrasamen.spendHealth(actor, costs.healthCost);
        }

        console.log(`Adrasamen | Successfully deducted costs for ${item.name}`);
    } catch (error) {
        console.error("Adrasamen | Error deducting spell costs:", error);
        const errorMessage = game.i18n.format("ADRASAMEN.Errors.CostDeductionFailed", {
            item: item.name,
            error: error.message
        });
        ui.notifications.warn(errorMessage);
    }

    // Affinity reroll — runs after mana deduction so costs are calculated
    // against the pre-change affinity configuration
    if (item.name === AFFINITY_REROLL_SPELL_NAME) {
        await performAffinityReroll(actor);
    }
}
```

---

## Task 4: Manual spell creation (GM step)

No code changes. GM instructions:

- [ ] **Step 1: Create the spell in Foundry**

  1. Open the Items directory (sidebar → Items tab)
  2. Create a new Item → type: **Spell**
  3. Set **Name** to exactly: `Affinity Shift`
  4. In the spell's Details tab, set **Spellcasting method** to `Adrasamen`
  5. In the Adrasamen tab (spell affinity costs), set the mana cost appropriate for the campaign
  6. Drag the spell onto the target player's character sheet

- [ ] **Step 2: Verify the spell appears under Adrasamen spells on the sheet**

---

## Task 5: Manual testing in Foundry

- [ ] **Step 1: Reload the Foundry module** (F5 or `game.modules.get("adrasamen").reload()` in console)

- [ ] **Step 2: Check the browser console for errors** on module load — there should be none related to `affinity-reroll.mjs`

- [ ] **Step 3: Cast "Affinity Shift" with a character that has primary and secondary affinities set**

  Expected:
  - Mana is deducted (same as any other Adrasamen spell)
  - A second chat message appears with the `Affinity Shift` flavor and a `1d7` roll result
  - The roll result is expandable in chat (dnd5e dice tooltip)
  - The message body reads: `"[Name]'s secondary affinity shifts from [Old] to [New]."`
  - The Adrasamen tab on the character sheet shows the new secondary affinity

- [ ] **Step 4: Open the browser console and verify the log line**

  Expected: `Adrasamen | Affinity Shift: [ActorName] [old] → [new]`

- [ ] **Step 5: Cast the spell a second time and verify the old secondary from the first cast is now excluded from the pool**

  The new secondary must differ from: primary, and the affinity assigned in Step 3.
