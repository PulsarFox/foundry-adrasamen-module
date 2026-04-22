/**
 * Class Sheet Integration for Adrasamen Module
 * Adds mana formula configuration to class item sheets
 */

/**
 * Initialize class sheet integration
 */
export function initClassSheetIntegration() {
	// Hook into class item sheet rendering
	Hooks.on("renderItemSheet", onRenderItemSheet);
	console.log("Adrasamen | Class sheet integration initialized");
}

/**
 * Handle item sheet rendering
 * @param {ItemSheet} sheet - The item sheet being rendered
 * @param {HTMLElement} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function onRenderItemSheet(sheet, html, data) {
	// Only process class items
	if (sheet.item?.type !== "class") return;

	await addManaFormulaField(sheet, html, data);
	bindClassFormEvents(sheet, html);
}

/**
 * Add mana formula field to class configuration
 * @param {ItemSheet} sheet - The class item sheet
 * @param {HTMLElement} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function addManaFormulaField(sheet, html, data) {
	const classItem = sheet.item;

	// Get current mana formula or use default
	const manaFormula = classItem.getFlag("adrasamen", "manaFormula") || "1d4 + @maxAffinityLevel";

	// Find the Hit Dice form group
	const hitDiceGroup = html.querySelector('.form-group.split-group');
	if (!hitDiceGroup || !hitDiceGroup.querySelector('label')?.textContent?.includes("Hit")) {
		console.warn("Adrasamen | Could not find Hit Dice form group in class sheet");
		return;
	}

	// Create mana formula form group HTML
	const manaFormGroupHtml = `
		<div class="form-group adrasamen-mana-formula">
			<label>${game.i18n.localize("ADRASAMEN.ManaPointFormula")}</label>
			<div class="form-fields">
				<input type="text" name="flags.adrasamen.manaFormula" value="${manaFormula}" 
					   placeholder="1d4 + @maxAffinityLevel" data-dtype="String">
				<button type="button" class="unbutton" data-action="rollManaFormula" 
						data-formula="${manaFormula}" data-tooltip
						aria-label="${game.i18n.localize('DND5E.Roll')}">
					<i class="fa-solid fa-dice-d20" inert></i>
				</button>
			</div>
			<p class="hint">${game.i18n.localize("ADRASAMEN.ADVANCEMENT.ManaPoints.FormulaHint")}</p>
		</div>
	`;

	// Insert after the Hit Dice form group
	hitDiceGroup.insertAdjacentHTML('afterend', manaFormGroupHtml);
}

/**
 * Bind event listeners for class form interactions
 * @param {ItemSheet} sheet - The class item sheet
 * @param {HTMLElement} html - The sheet HTML
 */
function bindClassFormEvents(sheet, html) {
	// Handle mana formula roll button
	const rollButton = html.querySelector('[data-action="rollManaFormula"]');
	if (rollButton) {
		rollButton.addEventListener('click', (event) => {
			const formula = event.target.closest('button').dataset.formula;
			rollManaFormula(sheet.item.actor, formula);
		});
	}

	// Handle form submission to save mana formula
	const form = html.querySelector('form');
	if (form) {
		form.addEventListener('change', (event) => {
			if (event.target.name === 'flags.adrasamen.manaFormula') {
				// Update the roll button's formula attribute
				const rollButton = html.querySelector('[data-action="rollManaFormula"]');
				if (rollButton) {
					rollButton.dataset.formula = event.target.value;
				}
			}
		});
	}
}

/**
 * Roll and display mana formula result
 * @param {Actor} actor - The actor to use for roll data (optional)
 * @param {string} formula - The mana formula to roll
 */
async function rollManaFormula(actor, formula) {
	if (!formula) return;

	try {
		// Get roll data context
		const rollData = actor?.getRollData() || {};
		
		// Add maxAffinityLevel for formula evaluation
		if (actor) {
			const { getMaxAffinityLevel } = await import("../affinity/affinity-core.mjs");
			rollData.maxAffinityLevel = getMaxAffinityLevel(actor);
		} else {
			// Default for testing without actor
			rollData.maxAffinityLevel = 1;
		}

		const roll = new Roll(formula, rollData);
		await roll.evaluate();

		const messageData = {
			user: game.user.id,
			speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
			flavor: `${game.i18n.localize("ADRASAMEN.ManaPointFormula")} ${game.i18n.localize("DND5E.Roll")}`,
			type: CONST.CHAT_MESSAGE_TYPES.ROLL,
			rolls: [roll],
		};

		await ChatMessage.create(messageData);
	} catch (error) {
		ui.notifications.error(`${game.i18n.localize("DND5E.FormulaInvalid")}: ${formula}`);
		console.error("Mana formula roll error:", error);
	}
}