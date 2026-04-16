/**
 * @import {Application} from "@client/applications/api/_module.mjs".Application
 * @import {CharacterActorSheet} from "@dnd5e/module/applications/actor/_module.mjs".CharacterActorSheet
 */

import { getManaData, setMana } from "./mana-core.mjs";

/**
 * Initialize the mana system by registering necessary hooks.
 * Sets up event listeners for character sheet rendering, actor creation, and rest completion.
 */
const initMana = () => {
	Hooks.on("renderCharacterActorSheet", onRenderCharacterActorSheet);
	console.log("Adrasamen | Mana system initialized");
};

/**
 * Handle character sheet rendering to inject the mana bar.
 * Renders and inserts the mana bar into character sheets using the Handlebars template.
 *
 * @param {CharacterActorSheet} sheet - The character sheet application being rendered.
 * @param {HTMLFormElement} html - The HTML content of the character sheet.
 */
const onRenderCharacterActorSheet = async (sheet, html) => {
	console.log("Adrasamen | Rendering mana bar on character sheet");

	if (html.querySelector(".mana-container")) return;

	const anchor = html.querySelector(".stats .meter-group:last-of-type");
	if (!anchor) return;

	// Get mana data for template
	const manaData = getManaData(sheet.actor);

	// Render the mana bar template
	const manaBarHtml = await renderTemplate(
		"modules/adrasamen/templates/mana-bar.hbs",
		{
			manaData: manaData,
			editable: sheet.isEditable,
		},
	);

	// Insert after the last meter group (typically after health/death saves)
	anchor.insertAdjacentHTML("afterend", manaBarHtml);

	// Add event listeners
	addManaBarListeners(sheet, html);
};

/**
 * Add event listeners to the mana bar
 * @param {CharacterActorSheet} sheet - The character sheet
 * @param {HTMLElement} html - The sheet HTML
 */
function addManaBarListeners(sheet, html) {
	// Listen for mana value changes
	html.querySelector(".mana-value-input")?.addEventListener(
		"change",
		async (event) => {
			const newValue = parseInt(event.target.value) || 0;
			const manaData = getManaData(sheet.actor);
			await setMana(sheet.actor, newValue, manaData.max);
			sheet.render(false); // Re-render to update display
		},
	);

	// Listen for mana bar clicks to show/hide input
	html.querySelector(".mana-points .progress")?.addEventListener(
		"click",
		(event) => {
			const input =
				event.currentTarget.querySelector(".mana-value-input");
			if (input) {
				input.hidden = !input.hidden;
				if (!input.hidden) {
					input.focus();
					input.select();
				}
			}
		},
	);
}

export { initMana };
