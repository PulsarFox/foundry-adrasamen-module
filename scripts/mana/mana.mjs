/**
 * @import {Application} from "@client/applications/api/_module.mjs".Application
 * @import {CharacterActorSheet} from "@dnd5e/module/applications/actor/_module.mjs".CharacterActorSheet
 */

import { getManaData, setMana, initManaHooks } from "./mana-core.mjs";

/**
 * Initialize the mana system by registering necessary hooks.
 * Sets up event listeners for character sheet rendering, actor creation, rest completion, and affinity integration.
 */
const initMana = () => {
	Hooks.on("renderCharacterActorSheet", onRenderCharacterActorSheet);
	Hooks.on("createActor", onCreateActor);

	// Initialize affinity integration hooks
	initManaHooks();

	console.log("Adrasamen | Mana system initialized");
};

/**
 * Handle new actor creation to set default mana values
 * @param {Actor} actor - The newly created actor
 */
const onCreateActor = async (actor) => {
	// Only set defaults for character actors that don't already have mana data
	if (actor.type === "character" && !actor.getFlag("adrasamen", "mana")) {
		console.log("Adrasamen | Setting default mana for new character");

		await actor.setFlag("adrasamen", "mana", {
			current: 10,
			max: 10,
			config: {
				manaFormulaPerLevelUp: "1d4 + @abilities.int.mod",
				manaShortRestFormula: "floor(@maxMana / 2)",
			},
		});
	}
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
			editable: sheet.isEditMode,
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
	// Listen for mana configuration button clicks
	html.querySelector(
		".config-button[data-config='manaPoints']",
	)?.addEventListener("click", async (event) => {
		event.preventDefault();
		await showManaConfiguration(sheet.actor);
	});

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

	// Listen for mana bar clicks to show/hide input (like health bar)
	html.querySelector(".mana-points .progress")?.addEventListener(
		"click",
		(event) => {
			const progress = event.currentTarget;
			const label = progress.querySelector(".label");
			const input = progress.querySelector(".mana-value-input");

			if (input && label) {
				if (input.hidden) {
					// Show input, hide label
					label.style.display = "none";
					input.hidden = false;
					input.focus();
					input.select();
				} else {
					// Hide input, show label
					label.style.display = "";
					input.hidden = true;
				}
			}
		},
	);

	// Listen for input blur to hide it
	html.querySelector(".mana-value-input")?.addEventListener(
		"blur",
		(event) => {
			const input = event.target;
			const progress = input.closest(".progress");
			const label = progress?.querySelector(".label");

			if (label) {
				label.style.display = "";
				input.hidden = true;
			}
		},
	);
}

/**
 * Show mana configuration dialog using D&D5e's dialog system
 * @param {Actor} actor - The actor to configure mana for
 */
async function showManaConfiguration(actor) {
	const { default: ManaConfigDialog } =
		await import("./mana-config-dialog.mjs");
	new ManaConfigDialog(actor).render({ force: true });
}

export { initMana };
