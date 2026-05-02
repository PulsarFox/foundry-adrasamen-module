/**
 * Spell Sheet Extensions
 * Handles injection of Adrasamen-specific UI into spell item sheets
 */

import { getSpellAffinityCosts, getSpellHealthCost, calculateSpellCosts } from "./cost-calculation.mjs";

/**
 * Initialize sheet extensions
 * Sets up hooks to modify spell sheets when Adrasamen method is selected
 */
export function initSheetExtensions() {
    // Hook into spell sheet rendering
    Hooks.on("renderItemSheet5e", async (sheet, html) => {
        const item = sheet.item;

        // Only process spells
        if (item.type !== "spell") return;

        // Check if this spell uses the Adrasamen method
        const spellcastingMethod = item.system?.method;
        if (spellcastingMethod === "adrasamen") {
            await injectAffinityUI(sheet, html);
        }
    });

    console.log("Adrasamen | Sheet extensions initialized");
}

/**
 * Inject affinity UI into a spell sheet
 * @param {ItemSheet} sheet - The spell item sheet
 * @param {jQuery} html - The sheet HTML
 */
async function injectAffinityUI(sheet, html) {
    console.log("Adrasamen | Injecting affinity UI for spell:", sheet.item.name);

    const item = sheet.item;

    // In ApplicationV2, html parameter is just a part, we need the full sheet element
    const $fullSheet = $(sheet.element);

    // Check if the ability form group is hidden, if so return early
    if (html.querySelector('.affinity-cost-grid')) {
        console.log("Adrasamen | Ability form group is hidden, skipping affinity UI injection");
        return;
    }

    // Hide school and level dropdowns for Adrasamen spells using full sheet
    $fullSheet.find('select[name="system.school"]').closest('.form-group').hide();
    $fullSheet.find('select[name="system.level"]').closest('.form-group').hide();
    $fullSheet.find('select[name="system.sourceItem"]').closest('.form-group').hide();
    $fullSheet.find('select[name="system.ability"]').closest('.form-group').hide();

    // Get current affinity costs and health cost
    const affinityCosts = getSpellAffinityCosts(item);
    const healthCost = getSpellHealthCost(item);

    // Prepare template data
    const templateData = {
        affinityCosts: affinityCosts,
        healthCost: healthCost
    };

    // Render the affinity grid template
    const template = await foundry.applications.handlebars.renderTemplate(
        "modules/adrasamen/templates/spell-affinity-grid.hbs",
        templateData
    );

    // Find a good insertion point using full sheet
    let insertPoint = $fullSheet.find('select[name="system.method"]').closest('.form-group');
    if (!insertPoint.length) {
        insertPoint = $fullSheet.find('[name="system.source"]').closest('.form-group');
    }
    if (!insertPoint.length) {
        // Fallback - insert at the top of the details tab
        insertPoint = $fullSheet.find('[data-tab="details"]').first();
    }

    // Insert the affinity grid
    if (insertPoint.length) {
        insertPoint.after(template);

        // Add event listeners for the newly inserted elements using full sheet
        addAffinityGridListeners(sheet, $fullSheet);
    }
}

/**
 * Add event listeners to affinity grid inputs
 * @param {ItemSheet} sheet - The spell item sheet
 * @param {jQuery} html - The sheet HTML
 */
function addAffinityGridListeners(sheet, html) {
    const item = sheet.item;

    // html should already be the jQuery full sheet element
    const $html = html instanceof jQuery ? html : $(html);

    // Remove any existing event handlers to prevent multiple bindings
    $html.off('change', '.affinity-cost-input');
    $html.off('change', '.health-cost-input');

    // Listen for changes to affinity cost inputs
    $html.on('change', '.affinity-cost-input', async (event) => {
        const input = event.currentTarget;
        const affinity = input.dataset.affinity;
        const value = Math.max(0, parseInt(input.value) || 0);

        // Update the input value to ensure it's valid
        input.value = value;

        // Get current affinity costs
        const currentCosts = getSpellAffinityCosts(item);
        currentCosts[affinity] = value;

        // Save to item flags
        await item.setFlag("adrasamen", "affinityCosts", currentCosts);

        // Update calculated cost display
        updateCalculatedCostDisplay(sheet, $html);
    });

    // Listen for changes to health cost input
    $html.on('change', '.health-cost-input', async (event) => {
        const input = event.currentTarget;
        const value = Math.max(0, parseInt(input.value) || 0);

        // Update the input value to ensure it's valid
        input.value = value;

        // Save to item flags
        await item.setFlag("adrasamen", "healthCost", value);

        // Update calculated cost display
        updateCalculatedCostDisplay(sheet, $html);
    });

    // Initial update of calculated cost display
    updateCalculatedCostDisplay(sheet, $html);
}

/**
 * Update the calculated cost display
 * @param {ItemSheet} sheet - The spell item sheet  
 * @param {jQuery} html - The sheet HTML
 */
function updateCalculatedCostDisplay(sheet, html) {
    const item = sheet.item;

    // html should already be the jQuery full sheet element
    const $html = html instanceof jQuery ? html : $(html);

    // Get base costs
    const affinityCosts = getSpellAffinityCosts(item);
    const healthCost = getSpellHealthCost(item);

    // Calculate total base mana cost
    const baseTotalMana = Object.values(affinityCosts).reduce((sum, cost) => sum + cost, 0);

    // Try to get an actor for cost reduction calculation
    // This might be from a character sheet context or a selected token
    let actor = null;
    if (game.user.character) {
        actor = game.user.character;
    } else if (canvas?.tokens?.controlled?.length > 0) {
        actor = canvas.tokens.controlled[0].actor;
    }

    let displayText = "";

    if (actor) {
        // Calculate with reductions if we have an actor
        const costs = calculateSpellCosts(actor, item);

        if (costs.totalReductions > 0) {
            displayText = `${baseTotalMana} mana → ${costs.totalMana} mana`;
        } else {
            displayText = `${costs.totalMana} mana`;
        }

        if (costs.healthCost > 0) {
            displayText += ` • ${costs.healthCost} health`;
        }
    } else {
        // Show base costs without reductions
        displayText = `${baseTotalMana} mana (base cost)`;
        if (healthCost > 0) {
            displayText += ` • ${healthCost} health`;
        }
    }

    // Update the display
    const manaCostElement = $html.find('.mana-cost');
    const healthCostElement = $html.find('.health-cost-display');

    if (manaCostElement.length) {
        if (actor && baseTotalMana !== baseTotalMana) {
            manaCostElement.text(`${baseTotalMana} mana → ${baseTotalMana} mana`);
        } else {
            manaCostElement.text(`${baseTotalMana} mana`);
        }
    }

    if (healthCostElement.length) {
        if (healthCost > 0) {
            healthCostElement.text(` • ${healthCost} health`).show();
        } else {
            healthCostElement.hide();
        }
    }
}