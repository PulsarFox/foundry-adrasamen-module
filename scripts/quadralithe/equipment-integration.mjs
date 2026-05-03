/**
 * D&D5e Equipment Integration for Quadralithes
 * Extends D&D5e CONFIG and integrates with item sheets using PARTS system
 */

/**
 * Initialize quadralithe equipment integration
 * Called during module initialization
 */
export function initializeQuadralitheEquipment() {
    console.log("Adrasamen | Initializing quadralithe equipment integration");

    // Hook into item creation to ensure quadralithe data
    Hooks.on("createItem", ensureQuadralitheData);

    // Hook into item updates to sync D&D5e equipment changes with quadralithe system
    Hooks.on("updateItem", onUpdateItem);

    console.log("Adrasamen | Quadralithe equipment integration initialized");
}

/**
 * Register quadralithe equipment types early in setup phase
 * This should be called from setup hook, not init hook
 */
export async function registerQuadralitheEquipmentTypes() {
    console.log("Adrasamen | Registering quadralithe equipment types during setup");

    // Extend D&D5e equipment types
    extendDnd5eConfig();

    // Override EquipmentData.getSheetData to add quadralithe parts
    await overrideEquipmentSheetData();
}

/**
 * Override EquipmentData.getSheetData to add quadralithe configuration parts
 */
async function overrideEquipmentSheetData() {
    // First, ensure templates are loaded
    await loadTemplates([
        "modules/adrasamen/templates/parts/quadralithe-morphos.hbs",
        "modules/adrasamen/templates/parts/quadralithe-nexus.hbs",
        "modules/adrasamen/templates/parts/quadralithe-radiant.hbs",
        "modules/adrasamen/templates/parts/quadralithe-drain.hbs"
    ]);

    const EquipmentData = CONFIG.Item?.dataModels?.equipment;
    if (!EquipmentData) {
        console.warn("Adrasamen | Could not find EquipmentData model to override");
        return;
    }

    // Store the original getSheetData method
    const originalGetSheetData = EquipmentData.prototype.getSheetData;

    // Override getSheetData to add quadralithe parts
    EquipmentData.prototype.getSheetData = async function (context) {
        // Call the original method first
        await originalGetSheetData.call(this, context);

        // Add quadralithe-specific parts based on equipment type
        const equipmentType = this.type?.value;
        if (["morphos", "nexus", "radiant", "drain"].includes(equipmentType)) {
            console.log(`Adrasamen | Adding quadralithe-${equipmentType} template to context.parts`);

            // Add the appropriate quadralithe configuration template to parts
            context.parts = context.parts || [];
            context.parts.push(`modules/adrasamen/templates/parts/quadralithe-${equipmentType}.hbs`);

            if (!context.system.quadralithe) {
                context.system.quadralithe = {
                    type: equipmentType,
                    effects: getDefaultQuadralitheConfig(equipmentType)
                };
            }
        }
    };

    console.log("Adrasamen | EquipmentData.getSheetData override applied");
}

/**
 * Extend D&D5e CONFIG to add quadralithe equipment types
 */
function extendDnd5eConfig() {
    // Verify D&D5e system is available
    if (!game.system || game.system.id !== "dnd5e") {
        console.warn("Adrasamen | D&D5e system not detected, skipping equipment type registration");
        return
    }

    // Ensure CONFIG.DND5E exists
    if (!CONFIG.DND5E) {
        console.warn("Adrasamen | CONFIG.DND5E not available, skipping equipment type registration");
        return;
    }

    // Debug: Log current equipment types
    console.log("Adrasamen | Current D&D5e equipment types:", Object.keys(CONFIG.DND5E.equipmentTypes || {}));

    // Add quadralithe types to the main equipment types config
    CONFIG.DND5E.quadralitheTypes = {
        morphos: "ADRASAMEN.QuadralitheType.Morphos",
        nexus: "ADRASAMEN.QuadralitheType.Nexus",
        radiant: "ADRASAMEN.QuadralitheType.Radiant",
        drain: "ADRASAMEN.QuadralitheType.Drain"
    }

    // Add quadralithe types directly to miscEquipmentTypes so they appear in the dropdown
    CONFIG.DND5E.miscEquipmentTypes = {
        ...CONFIG.DND5E.miscEquipmentTypes,
        ...CONFIG.DND5E.quadralitheTypes
    }

    // Also add to equipmentTypes for backward compatibility
    CONFIG.DND5E.equipmentTypes = {
        ...CONFIG.DND5E.equipmentTypes,
        ...CONFIG.DND5E.quadralitheTypes
    }

    // CRITICAL: Extend the EquipmentData schema to include quadralithe field
    const EquipmentData = CONFIG.Item?.dataModels?.equipment;
    if (EquipmentData) {
        console.log("Adrasamen | Extending EquipmentData schema with quadralithe field");

        // Store the original defineSchema method
        const originalDefineSchema = EquipmentData.defineSchema;

        // Override defineSchema to add our custom field
        EquipmentData.defineSchema = function () {
            const schema = originalDefineSchema.call(this);

            // Add quadralithe field to the schema
            const { SchemaField, StringField, ObjectField } = foundry.data.fields;

            schema.quadralithe = new SchemaField({
                type: new StringField({ required: false, blank: false, label: "Quadralithe Type" }),
                effects: new ObjectField({ required: false, label: "Quadralithe Effects" })
            }, { required: false, label: "Quadralithe Configuration" });

            return schema;
        };

        console.log("Adrasamen | EquipmentData schema extended successfully");
    } else {
        console.warn("Adrasamen | Could not find EquipmentData model to extend");
    }

    // Optional: Override getSheetData to add group labels to quadralithe types
    if (EquipmentData && EquipmentData.prototype.getSheetData) {
        // Store the original getSheetData method
        const originalGetSheetData = EquipmentData.prototype.getSheetData;

        // Override getSheetData to add group labels
        EquipmentData.prototype.getSheetData = async function (context) {
            // Call the original method first to build the base context
            await originalGetSheetData.call(this, context);

            // Then modify the equipmentTypeOptions to add group labels to our quadralithe types
            if (context.equipmentTypeOptions) {
                context.equipmentTypeOptions = context.equipmentTypeOptions.map(option => {
                    if (Object.keys(CONFIG.DND5E.quadralitheTypes).includes(option.value)) {
                        return { ...option, group: "Quadralithes" };
                    }
                    return option;
                });
            }
        }
    }

    console.log("Adrasamen | Quadralithe equipment types registered successfully:", Object.keys(CONFIG.DND5E.quadralitheTypes));
}

/**
 * Handle item updates to sync D&D5e equipment changes with quadralithe system
 * @param {Item} item - The updated item
 * @param {Object} changes - The update data
 * @param {Object} options - Update options
 * @param {string} userId - ID of the user who made the update
 */
async function onUpdateItem(item, changes, options, userId) {
    // Skip if this update came from the Adrasamen system to prevent infinite loops
    if (options.skipAdrasamenHooks) return;

    // Only process equipment items
    if (item.type !== "equipment") return;

    const equipmentType = item.system?.type?.value;
    const oldEquipmentType = foundry.utils.getProperty(changes, "system.type.value");

    // Handle equipment type changes to quadralithe types
    if (oldEquipmentType && ["morphos", "nexus", "radiant", "drain"].includes(equipmentType)) {
        console.log(`Adrasamen | Equipment type changed to ${equipmentType} for:`, item.name);
        await ensureQuadralitheData(item);
        return;
    }

    // Handle equipped status changes for quadralithe types
    if (!["morphos", "nexus", "radiant", "drain"].includes(equipmentType)) return;

    // Check if the equipped status changed
    if (!foundry.utils.hasProperty(changes, "system.equipped")) return;

    const newEquippedState = changes.system.equipped;
    const actor = item.actor;

    if (!actor) return;

    console.log(`Adrasamen | D&D5e equipment change detected for ${item.name}: equipped = ${newEquippedState}`);

    // Import the quadralithe core functions
    const { equipQuadralithe, unequipQuadralithe, getEquippedQuadralithes } = await import("./quadralithe-core.mjs");

    try {
        if (newEquippedState) {
            // Item was equipped - add to quadralithe system
            const currentEquipped = getEquippedQuadralithes(actor);

            // Check if slot is already occupied
            if (currentEquipped[equipmentType]) {
                console.warn(`Adrasamen | Cannot equip ${item.name}: ${equipmentType} slot already occupied`);
                ui.notifications.warn(`A ${equipmentType} quadralithe is already equipped. Unequip it first.`);

                // Revert the equipped state
                await item.update({ "system.equipped": false }, { skipAdrasamenHooks: true });
                return;
            }

            // Equip the quadralithe
            const success = await equipQuadralithe(actor, item, equipmentType);
            if (success) {
                console.log(`Adrasamen | Successfully equipped ${item.name} to ${equipmentType} slot`);
                ui.notifications.info(`Equipped ${item.name} to ${equipmentType} slot`);
            } else {
                console.warn(`Adrasamen | Failed to equip ${item.name}`);
                // Revert the equipped state
                await item.update({ "system.equipped": false }, { skipAdrasamenHooks: true });
            }
        } else {
            // Item was unequipped - remove from quadralithe system
            const success = await unequipQuadralithe(actor, equipmentType);
            if (success) {
                console.log(`Adrasamen | Successfully unequipped ${equipmentType} quadralithe`);
                ui.notifications.info(`Unequipped ${equipmentType} quadralithe`);
            } else {
                console.warn(`Adrasamen | Failed to unequip ${equipmentType} quadralithe`);
            }
        }
    } catch (error) {
        console.error("Adrasamen | Error synchronizing quadralithe equipment:", error);
        ui.notifications.error(`Error updating quadralithe equipment: ${error.message}`);
    }
}

/**
 * Get default quadralithe configuration for a type
 * @param {string} type - Quadralithe type (morphos, nexus, radiant, drain)
 * @returns {Object} Default configuration object
 */
export function getDefaultQuadralitheConfig(type) {
    const AFFINITIES = {
        fire: 0,
        earth: 0,
        air: 0,
        water: 0,
        ice: 0,
        light: 0,
        shadow: 0,
        mind: 0,
        arcane: 0
    };

    switch (type) {
        case "morphos":
            return {
                affinityBonus: {
                    fire: "0",
                    earth: "0",
                    air: "0",
                    water: "0",
                    ice: "0",
                    light: "0",
                    shadow: "0",
                    mind: "0",
                    arcane: "0"
                }
            };

        case "nexus":
            return {
                maxManaBonus: "0",
                costReduction: "0"
            };

        case "radiant":
            return {
                formulaBonus: "0"
            };

        case "drain":
            return {
                manaGeneration: "0",
                range: {
                    value: "0",
                    units: "m",
                    special: ""
                },
                target: {
                    affects: {
                        type: "ally",
                        count: "1",
                        choice: false
                    },
                    template: {
                        contiguous: false,
                        type: "",
                        size: "",
                        width: "",
                        height: "",
                        units: "ft"
                    }
                }
            };

        default:
            return {};
    }
}

/**
 * Ensure item has quadralithe system data when created
 * @param {Item} item - Item that was created
 */
export async function ensureQuadralitheData(item) {
    // Only process equipment items
    if (item.type !== "equipment") return;

    // Check if this is a quadralithe equipment type
    const equipmentType = item.system?.type?.value;
    if (!["morphos", "nexus", "radiant", "drain"].includes(equipmentType)) return;

    // Initialize quadralithe data if missing
    if (!item.system.quadralithe) {
        const defaultConfig = getDefaultQuadralitheConfig(equipmentType);
        await item.update({
            "system.quadralithe": {
                type: equipmentType,
                effects: defaultConfig
            }
        });

        console.log("Adrasamen | Initialized quadralithe data for:", item.name, "type:", equipmentType);
    }
}
