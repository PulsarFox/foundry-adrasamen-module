/**
 * Quadralithe Configuration Templates and Presets
 * Provides common preset configurations and default values for each quadralithe type
 */

import { AFFINITIES } from "../affinity/constants.mjs";

const QUADRALITHE_TYPES = ["morphos", "nexus", "radiant", "drain"];

/**
 * Get default configuration for a quadralithe type
 * @param {string} type - Quadralithe type (morphos, nexus, radiant, drain)
 * @returns {Object} Default configuration for the type
 */
export function getDefaultConfig(type) {
    switch (type) {
        case "morphos":
            return {
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "0",
                        air: "0",
                        earth: "0",
                        fire: "0",
                        ice: "0",
                        light: "0",
                        shadow: "0",
                        mind: "0",
                        arcane: "0"
                    }
                }
            };

        case "nexus":
            return {
                type: "nexus",
                effects: {
                    maxManaBonus: "0",
                    costReduction: "0"
                }
            };

        case "radiant":
            return {
                type: "radiant",
                effects: {
                    formulaBonus: "0"
                }
            };

        case "drain":
            return {
                type: "drain",
                effects: {
                    manaGeneration: "0",
                    range: {
                        value: 0,
                        units: "m",
                        special: ""
                    },
                    target: {
                        type: "any",
                        count: 1,
                        choice: false
                    }
                }
            };

        default:
            console.warn(`Unknown quadralithe type: ${type}`);
            return null;
    }
}

/**
 * Get all preset configurations organized by type
 * @returns {Object} Preset configurations indexed by type and name
 */
export function getPresetConfigurations() {
    return {
        morphos: {
            balanced: {
                name: "Balanced Affinity Boost",
                description: "Provides equal +1 bonus to all affinities",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "1",
                        air: "1",
                        earth: "1",
                        fire: "1",
                        ice: "1",
                        light: "1",
                        shadow: "1",
                        mind: "1",
                        arcane: "1"
                    }
                }
            },

            strength_focused: {
                name: "Strength-Focused Bonuses",
                description: "Fire and Earth affinities gain STR modifier bonus",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "0",
                        air: "0",
                        earth: "@str",
                        fire: "@str",
                        ice: "0",
                        light: "0",
                        shadow: "0",
                        mind: "0",
                        arcane: "0"
                    }
                }
            },

            intelligence_focused: {
                name: "Intelligence-Focused Bonuses",
                description: "Mind and Arcane affinities gain INT modifier bonus",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "0",
                        air: "0",
                        earth: "0",
                        fire: "0",
                        ice: "0",
                        light: "0",
                        shadow: "0",
                        mind: "@int",
                        arcane: "@int"
                    }
                }
            },

            wisdom_focused: {
                name: "Wisdom-Focused Bonuses",
                description: "Light and Shadow affinities gain WIS modifier bonus",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "0",
                        air: "0",
                        earth: "0",
                        fire: "0",
                        ice: "0",
                        light: "@wis",
                        shadow: "@wis",
                        mind: "0",
                        arcane: "0"
                    }
                }
            },

            dexterity_focused: {
                name: "Dexterity-Focused Bonuses",
                description: "Air and Water affinities gain DEX modifier bonus",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "@dex",
                        air: "@dex",
                        earth: "0",
                        fire: "0",
                        ice: "0",
                        light: "0",
                        shadow: "0",
                        mind: "0",
                        arcane: "0"
                    }
                }
            },

            constitution_focused: {
                name: "Constitution-Focused Bonuses",
                description: "Earth and Ice affinities gain CON modifier bonus",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "0",
                        air: "0",
                        earth: "@con",
                        fire: "0",
                        ice: "@con",
                        light: "0",
                        shadow: "0",
                        mind: "0",
                        arcane: "0"
                    }
                }
            },

            level_scaling: {
                name: "Level-Scaled Bonuses",
                description: "Each affinity gains +1 bonus per 3 character levels",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "@level / 3",
                        air: "@level / 3",
                        earth: "@level / 3",
                        fire: "@level / 3",
                        ice: "@level / 3",
                        light: "@level / 3",
                        shadow: "@level / 3",
                        mind: "@level / 3",
                        arcane: "@level / 3"
                    }
                }
            },

            hybrid_strength_wisdom: {
                name: "Strength-Wisdom Hybrid",
                description: "STR/Fire/Earth focused with WIS/Light/Shadow secondary",
                type: "morphos",
                effects: {
                    affinityBonus: {
                        water: "@str / 2",
                        air: "@dex / 2",
                        earth: "@str",
                        fire: "@str",
                        ice: "0",
                        light: "@wis",
                        shadow: "@wis / 2",
                        mind: "0",
                        arcane: "0"
                    }
                }
            }
        },

        nexus: {
            mana_boost_basic: {
                name: "Basic Mana Boost",
                description: "Provides +4 maximum mana and -1 cost reduction",
                type: "nexus",
                effects: {
                    maxManaBonus: "4",
                    costReduction: "1"
                }
            },

            mana_boost_advanced: {
                name: "Advanced Mana Boost",
                description: "Provides +8 maximum mana and -2 cost reduction",
                type: "nexus",
                effects: {
                    maxManaBonus: "8",
                    costReduction: "2"
                }
            },

            constitution_based: {
                name: "Constitution-Based Mana",
                description: "Maximum mana bonus scales with CON modifier, -1 base cost reduction",
                type: "nexus",
                effects: {
                    maxManaBonus: "@con + 2",
                    costReduction: "1"
                }
            },

            level_scaling_mana: {
                name: "Level-Scaled Mana",
                description: "Maximum mana bonus increases with character level",
                type: "nexus",
                effects: {
                    maxManaBonus: "@level",
                    costReduction: "@level / 4"
                }
            },

            cost_reduction_focus: {
                name: "Cost Reduction Focus",
                description: "Emphasizes cost reduction over maximum mana",
                type: "nexus",
                effects: {
                    maxManaBonus: "2",
                    costReduction: "@con"
                }
            },

            charisma_based: {
                name: "Charisma-Based Nexus",
                description: "Mana bonuses scale with CHA modifier",
                type: "nexus",
                effects: {
                    maxManaBonus: "@cha + 1",
                    costReduction: "@cha / 2"
                }
            }
        },

        radiant: {
            formula_boost_basic: {
                name: "Basic Formula Boost",
                description: "Provides +2 bonus to spell formulas",
                type: "radiant",
                effects: {
                    formulaBonus: "2"
                }
            },

            formula_boost_advanced: {
                name: "Advanced Formula Boost",
                description: "Provides +4 bonus to spell formulas",
                type: "radiant",
                effects: {
                    formulaBonus: "4"
                }
            },

            intelligence_based: {
                name: "Intelligence-Based Radiant",
                description: "Formula bonus scales with INT modifier",
                type: "radiant",
                effects: {
                    formulaBonus: "@int / 2"
                }
            },

            level_scaling_formula: {
                name: "Level-Scaled Formula",
                description: "Formula bonus increases with character level",
                type: "radiant",
                effects: {
                    formulaBonus: "@level / 3"
                }
            },

            high_level_scaling: {
                name: "High-Level Formula Scaling",
                description: "Stronger scaling for high-level characters",
                type: "radiant",
                effects: {
                    formulaBonus: "@level / 2"
                }
            }
        },

        drain: {
            basic_mana_drain: {
                name: "Basic Mana Drain",
                description: "Generates 1 mana per round, 30 ft range, any target",
                type: "drain",
                effects: {
                    manaGeneration: "1",
                    range: {
                        value: 30,
                        units: "ft",
                        special: ""
                    },
                    target: {
                        type: "any",
                        count: 1,
                        choice: false
                    }
                }
            },

            advanced_mana_drain: {
                name: "Advanced Mana Drain",
                description: "Generates 2 mana per round, 60 ft range, any target, 2 targets",
                type: "drain",
                effects: {
                    manaGeneration: "2",
                    range: {
                        value: 60,
                        units: "ft",
                        special: ""
                    },
                    target: {
                        type: "any",
                        count: 2,
                        choice: true
                    }
                }
            },

            enemy_drain: {
                name: "Enemy-Only Drain",
                description: "Drains 1 mana from enemies only, 30 ft range",
                type: "drain",
                effects: {
                    manaGeneration: "1",
                    range: {
                        value: 30,
                        units: "ft",
                        special: ""
                    },
                    target: {
                        type: "enemy",
                        count: 1,
                        choice: false
                    }
                }
            },

            ally_drain: {
                name: "Ally Drain (Support)",
                description: "Draws 1 mana from allies to support caster, 30 ft range",
                type: "drain",
                effects: {
                    manaGeneration: "1",
                    range: {
                        value: 30,
                        units: "ft",
                        special: ""
                    },
                    target: {
                        type: "ally",
                        count: 1,
                        choice: false
                    }
                }
            },

            charisma_based_drain: {
                name: "Charisma-Based Drain",
                description: "Mana generation scales with CHA modifier",
                type: "drain",
                effects: {
                    manaGeneration: "@cha",
                    range: {
                        value: 30,
                        units: "ft",
                        special: ""
                    },
                    target: {
                        type: "any",
                        count: 1,
                        choice: false
                    }
                }
            },

            wisdom_based_drain: {
                name: "Wisdom-Based Drain",
                description: "Mana generation scales with WIS modifier, 60 ft range",
                type: "drain",
                effects: {
                    manaGeneration: "@wis",
                    range: {
                        value: 60,
                        units: "ft",
                        special: ""
                    },
                    target: {
                        type: "any",
                        count: 1,
                        choice: false
                    }
                }
            },

            aoe_drain: {
                name: "Area Drain",
                description: "Drains all creatures in 20 ft radius, 1 mana each",
                type: "drain",
                effects: {
                    manaGeneration: "1",
                    range: {
                        value: 60,
                        units: "ft",
                        special: "20 ft radius"
                    },
                    target: {
                        type: "any",
                        count: 0,
                        choice: false
                    }
                }
            }
        }
    };
}

/**
 * Get a specific preset configuration
 * @param {string} type - Quadralithe type
 * @param {string} presetName - Name of the preset
 * @returns {Object|null} Preset configuration or null if not found
 */
export function getPreset(type, presetName) {
    const presets = getPresetConfigurations();
    if (!presets[type]) {
        console.warn(`Unknown quadralithe type: ${type}`);
        return null;
    }

    const preset = presets[type][presetName];
    if (!preset) {
        console.warn(`Unknown preset "${presetName}" for type "${type}"`);
        return null;
    }

    return preset;
}

/**
 * Get list of available presets for a type
 * @param {string} type - Quadralithe type
 * @returns {Array} Array of preset names
 */
export function getPresetNames(type) {
    const presets = getPresetConfigurations();
    if (!presets[type]) {
        return [];
    }
    return Object.keys(presets[type]);
}

/**
 * Get all presets for a type with their descriptions
 * @param {string} type - Quadralithe type
 * @returns {Object} Object with preset names as keys and descriptions as values
 */
export function getPresetDescriptions(type) {
    const presets = getPresetConfigurations();
    if (!presets[type]) {
        return {};
    }

    const descriptions = {};
    for (const [name, preset] of Object.entries(presets[type])) {
        descriptions[name] = preset.description || preset.name || name;
    }
    return descriptions;
}

/**
 * Create a custom configuration from a partial object
 * Merges provided values with defaults for the type
 * @param {string} type - Quadralithe type
 * @param {Object} partial - Partial configuration to merge
 * @returns {Object} Complete configuration with defaults
 */
export function createCustomConfig(type, partial = {}) {
    const defaults = getDefaultConfig(type);
    if (!defaults) {
        return null;
    }

    // Deep merge the partial configuration with defaults
    return deepMerge(defaults, partial);
}

/**
 * Deep merge objects
 * @private
 */
function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }

    return result;
}

/**
 * Get a list of all quadralithe types
 * @returns {Array} Array of quadralithe type names
 */
export function getAllTypes() {
    return QUADRALITHE_TYPES;
}

/**
 * Get metadata about a quadralithe type
 * @param {string} type - Quadralithe type
 * @returns {Object} Type metadata
 */
export function getTypeMetadata(type) {
    const typeData = {
        morphos: {
            name: game.i18n.localize("ADRASAMEN.QuadralitheType.Morphos"),
            description: "Enhances elemental affinities with magical bonuses",
            effectFields: ["affinityBonus"],
            icon: "fas fa-leaf"
        },
        nexus: {
            name: game.i18n.localize("ADRASAMEN.QuadralitheType.Nexus"),
            description: "Provides mana bonuses and reduces spell costs",
            effectFields: ["maxManaBonus", "costReduction"],
            icon: "fas fa-link"
        },
        radiant: {
            name: game.i18n.localize("ADRASAMEN.QuadralitheType.Radiant"),
            description: "Improves spell formula effectiveness",
            effectFields: ["formulaBonus"],
            icon: "fas fa-star"
        },
        drain: {
            name: game.i18n.localize("ADRASAMEN.QuadralitheType.Drain"),
            description: "Generates mana from nearby targets",
            effectFields: ["manaGeneration", "range", "target"],
            icon: "fas fa-drain"
        }
    };

    return typeData[type] || null;
}

/**
 * Export preset configurations as JSON for sharing
 * @returns {string} JSON string containing all presets
 */
export function exportPresetsAsJSON() {
    return JSON.stringify(getPresetConfigurations(), null, 2);
}

/**
 * Get commonly used formula templates
 * @returns {Object} Object with formula suggestions for different scenarios
 */
export function getFormulaTemplates() {
    return {
        flat: {
            name: "Flat Bonus",
            template: "2",
            description: "Simple static value"
        },
        ability_based: {
            name: "Ability-Based",
            template: "@str",
            description: "Use ability modifier (str, dex, con, int, wis, cha)"
        },
        ability_scaled: {
            name: "Scaled Ability",
            template: "@str / 2",
            description: "Ability modifier scaled down"
        },
        level_based: {
            name: "Level-Based",
            template: "@level / 3",
            description: "Scales with character level"
        },
        hybrid: {
            name: "Hybrid",
            template: "@str + @level / 4",
            description: "Combines ability and level scaling"
        },
        affinity_based: {
            name: "Affinity-Based",
            template: "@fire",
            description: "Scales with affinity level (use affinity name)"
        }
    };
}
