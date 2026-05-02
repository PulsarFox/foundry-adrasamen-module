/**
 * D&D5e Equipment Integration for Quadralithes
 * Extends D&D5e CONFIG and integrates with item sheets
 */

/**
 * Initialize quadralithe equipment integration
 * Called during module initialization
 */
export function initializeQuadralitheEquipment() {
    console.log("Adrasamen | Initializing quadralithe equipment integration");

    // Hook into item creation to ensure quadralithe data
    Hooks.on("createItem", ensureQuadralitheData);

    // Hook into item sheet rendering for configuration UI
    Hooks.on("renderItemSheet5e", onRenderItemSheet);

    console.log("Adrasamen | Quadralithe equipment integration initialized");
}

/**
 * Register quadralithe equipment types early in setup phase
 * This should be called from setup hook, not init hook
 */
export function registerQuadralitheEquipmentTypes() {
    console.log("Adrasamen | Registering quadralithe equipment types during setup");

    // Extend D&D5e equipment types
    extendDnd5eConfig();

    // Also hook into item sheet rendering to debug what data is available
    Hooks.on("renderItemSheet5e", debugItemSheetContext);
}

/**
 * Debug function to see what equipment type data is available in item sheets
 * @param {ItemSheet} sheet - The item sheet being rendered
 * @param {jQuery} html - The sheet HTML
 * @param {Object} data - The sheet data context
 */
function debugItemSheetContext(sheet, html, data) {
    if (sheet.item.type === "equipment") {
        console.log("Adrasamen | DEBUG - Item sheet context data:", data);
        console.log("Adrasamen | DEBUG - Available equipment types in context:", data.system?.type?.choices || data.choices?.type || "NOT FOUND");
        console.log("Adrasamen | DEBUG - CONFIG.DND5E.equipmentTypes:", CONFIG.DND5E.equipmentTypes);
        console.log("Adrasamen | DEBUG - Item system data:", sheet.item.system);
    }
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

    // Ensure equipmentTypes exists
    if (!CONFIG.DND5E.miscEquipmentTypes) {
        CONFIG.DND5E.miscEquipmentTypes = {};
    }

    // Add quadralithe as a main equipment type - use simple string value
    CONFIG.DND5E.miscEquipmentTypes.quadralithe = "ADRASAMEN.Equipment.Quadralithe";

    // Also add individual quadralithe types as separate equipment types for easier access
    CONFIG.DND5E.miscEquipmentTypes.morphos = "ADRASAMEN.QuadralitheType.Morphos";
    CONFIG.DND5E.miscEquipmentTypes.nexus = "ADRASAMEN.QuadralitheType.Nexus";
    CONFIG.DND5E.miscEquipmentTypes.radiant = "ADRASAMEN.QuadralitheType.Radiant";
    CONFIG.DND5E.miscEquipmentTypes.drain = "ADRASAMEN.QuadralitheType.Drain";

    // Also try to extend the equipment DataModel choices if it exists
    try {
        const EquipmentData = CONFIG.Item?.dataModels?.equipment;
        if (EquipmentData?.schema?.fields?.type?.choices) {
            console.log("Adrasamen | Found equipment DataModel, extending type choices");
            Object.assign(EquipmentData.schema.fields.type.choices, {
                quadralithe: "ADRASAMEN.Equipment.Quadralithe",
                morphos: "ADRASAMEN.QuadralitheType.Morphos",
                nexus: "ADRASAMEN.QuadralitheType.Nexus",
                radiant: "ADRASAMEN.QuadralitheType.Radiant",
                drain: "ADRASAMEN.QuadralitheType.Drain"
            });
        }
    } catch (error) {
        console.log("Adrasamen | Could not extend DataModel choices:", error.message);
    }

    console.log("Adrasamen | Quadralithe equipment types registered:", Object.keys(CONFIG.DND5E.miscEquipmentTypes));
    console.log("Adrasamen | Full CONFIG.DND5E.miscEquipmentTypes:", CONFIG.DND5E.miscEquipmentTypes);
}

/**
 * Handle item sheet rendering to add quadralithe configuration UI
 * @param {ItemSheet} sheet - The item sheet being rendered
 * @param {jQuery} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function onRenderItemSheet(sheet, html, data) {
    const item = sheet.item;

    // Only process equipment items with quadralithe types
    if (item.type !== "equipment") return;

    const equipmentType = item.system?.type?.value;
    if (!["morphos", "nexus", "radiant", "drain"].includes(equipmentType)) return;

    console.log("Adrasamen | Adding quadralithe configuration to item sheet:", item.name);

    await injectQuadralitheConfigUI(sheet, html, item);
}

/**
 * Inject quadralithe configuration UI into item sheet
 * @param {ItemSheet} sheet - The item sheet being rendered
 * @param {jQuery} html - The sheet HTML
 * @param {Item} item - The item being rendered
 */
async function injectQuadralitheConfigUI(sheet, html, item) {
    const $fullSheet = $(sheet.element);

    // Check if already injected
    if ($fullSheet.find(".quadralithe-config").length) {
        return;
    }

    // Get or initialize quadralithe configuration
    let quadraConfig = item.system.quadralithe || {
        type: item.system?.type?.value,
        effects: getDefaultQuadralitheConfig(item.system?.type?.value)
    };

    // Prepare template data
    const templateData = {
        system: {
            quadralithe: quadraConfig
        }
    };

    // Render the quadralithe configuration template
    const template = await renderTemplate(
        "modules/adrasamen/templates/quadralithe-config.hbs",
        templateData
    );

    // Find insertion point - inside details section content
    let insertPoint = $fullSheet.find('.sheet-body .tab[data-tab="details"] .sheet-body').first();
    if (!insertPoint.length) {
        insertPoint = $fullSheet.find('[data-tab="details"] .sheet-body').first();
    }
    if (!insertPoint.length) {
        insertPoint = $fullSheet.find('.tab[data-tab="details"]').first();
    }

    if (insertPoint.length) {
        $(template).appendTo(insertPoint);

        // Attach form change handler
        $fullSheet.on("change", ".quadralithe-config select, .quadralithe-config input", async (event) => {
            await handleQuadralitheFormChange(sheet, event);
        });
    }
}

/**
 * Handle quadralithe configuration form changes
 * @param {ItemSheet} sheet - Item sheet being updated
 * @param {Event} event - Change event from form
 */
async function handleQuadralitheFormChange(sheet, event) {
    const item = sheet.item;
    const target = event.target;
    const name = target.name;
    const value = target.value;

    if (!name || !name.startsWith("quadralithe.")) return;

    // Build update object
    const updateKey = `system.${name}`;
    const updates = { [updateKey]: value };

    try {
        await item.update(updates);
        console.log("Adrasamen | Quadralithe configuration updated for:", item.name);
    } catch (error) {
        console.error("Adrasamen | Failed to update quadralithe configuration:", error);
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
