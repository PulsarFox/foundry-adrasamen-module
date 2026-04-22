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

		// Set flags to match the attributes schema defaults
		await actor.setFlag("adrasamen", "mana", {
			current: 0,
			max: null, // Use null to match attributes schema for dynamic calculation
			config: {
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

	// Get mana data - prefer attributes, fall back to flags
	let manaData;
	if (sheet.actor.system.attributes?.mana) {
		manaData = {
			current: sheet.actor.system.attributes.mana.value || 0,
			max: sheet.actor.system.attributes.mana.max || 0,
		};
	} else {
		manaData = getManaData(sheet.actor);
	}

	// Calculate percentage
	manaData.percentage =
		manaData.max > 0
			? Math.floor((manaData.current / manaData.max) * 100)
			: 0;

	// Render the mana bar template
	const manaBarHtml = await renderTemplate(
		"modules/adrasamen/templates/mana-bar.hbs",
		{
			manaData: manaData,
			editable: sheet.isEditMode,
		},
	);

	// Insert after the last meter group
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

	// Listen for direct mana value changes (attributes-based)
	const currentInput = html.querySelector(".mana-current-input");
	const maxInput = html.querySelector(".mana-max-input");

	if (currentInput) {
		currentInput.addEventListener("change", async (event) => {
			const newValue = parseInt(event.target.value) || 0;
			await sheet.actor.update({
				"system.attributes.mana.value": newValue,
			});
			sheet.render(false);
		});
	}

	if (maxInput) {
		maxInput.addEventListener("change", async (event) => {
			const newMax = parseInt(event.target.value) || 0;
			await sheet.actor.update({
				"system.attributes.mana.max": newMax,
			});
			sheet.render(false);
		});
	}

	// Listen for mana bar clicks to show/hide inputs
	const manaBar = html.querySelector(".mana-points .progress");
	if (manaBar) {
		manaBar.addEventListener("click", (event) => {
			const currentInput = html.querySelector(".mana-current-input");
			if (currentInput) {
				currentInput.hidden = !currentInput.hidden;
				if (!currentInput.hidden) {
					currentInput.focus();
					currentInput.select();
				}
			}
		});
	}
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
