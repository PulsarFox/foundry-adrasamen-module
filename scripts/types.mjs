/**
 * Import Foundry and DnD5e types for JSDoc comments.
 */

// Import Foundry base types
/**
 * @global
 * @typedef {import("../../../../../../../../../Program Files/Foundry Virtual Tabletop/resources/app/common/documents/_module.mjs").BaseActor} BaseActor
 * @typedef {import("../../../../../../../../../Program Files/Foundry Virtual Tabletop/resources/app/common/documents/_module.mjs").BaseItem} BaseItem
 * @typedef {import("../../../../../../../../../Program Files/Foundry Virtual Tabletop/resources/app/common/documents/_module.mjs").BaseActiveEffect} BaseActiveEffect
 * @typedef {import("../../../../../../../../../Program Files/Foundry Virtual Tabletop/resources/app/common/documents/_module.mjs").BaseChatMessage} BaseChatMessage
 * @typedef {import("../../../../../../../../../Program Files/Foundry Virtual Tabletop/resources/app/common/documents/_module.mjs").BaseCombat} BaseCombat
 * @typedef {import("../../../../../../../../../Program Files/Foundry Virtual Tabletop/resources/app/common/documents/_module.mjs").BaseCombatant} BaseCombatant
 */

// Import DnD5e types that extend Foundry types
/**
 * @global
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").Actor5e} Actor5eBase
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").Item5e} Item5eBase
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").ActiveEffect5e} ActiveEffect5e
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").Adventure5e} Adventure5e
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").ChatMessage5e} ChatMessage5eBase
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").Combat5e} Combat5eBase
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").Combatant5e} Combatant5eBase
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").CombatantGroup5e} CombatantGroup5e
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").JournalEntryPage5e} JournalEntryPage5e
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").TokenDocument5e} TokenDocument5e
 * @typedef {import("../../../systems/dnd5e/module/documents/_module.mjs").User5e} User5e
 */

// Create composite types that combine Foundry base classes with DnD5e extensions
/**
 * Complete Actor5e type that combines Foundry BaseActor methods with DnD5e Actor5e properties
 * @global
 * @typedef {Actor5eBase & BaseActor} Actor5e
 * @typedef {Item5eBase & BaseItem} Item5e
 * @typedef {ChatMessage5eBase & BaseChatMessage} ChatMessage5e
 * @typedef {Combat5eBase & BaseCombat} Combat5e
 * @typedef {Combatant5eBase & BaseCombatant} Combatant5e
 */

/**
 * @typedef {object} ManaState
 * @property {number} currentMana - The current mana points of the actor.
 * @property {number} maxMana - The maximum mana points of the actor.
 * @property {boolean} isExhausted - Indicates whether the actor is currently exhausted from using too much mana.
 */

/**
 * @typedef {object} ManaConfig
 * @property {string} manaFormulaPerLevelUp - A formula to calculate how much mana an actor gains when they level up.
 * @property {string} manaShortRestFormula - A formula to calculate how much mana an actor regenerates during a short rest.
 */

/**
 * @typedef {object} QuadralitheItemData
 * @property {string} id
 * @property {string} name
 * @property {QuadralitheType} type
 * @property {number} level
 * @property {string[]} additionalAbilityUuids
 */

/**
 * @typedef {"radiant"|"morphos"|"drain"|"nexus"} QuadralitheType
 */
