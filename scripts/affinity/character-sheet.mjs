/**
 * Character Sheet Integration for Affinity System
 * Adds the Adrasamen tab to character sheets
 */

import {
	getAffinityData,
	getCharacteristicLinking,
	getAffinityLevel,
} from "./affinity-core.mjs";
import { AFFINITIES, AFFINITY_CONFIG } from "./constants.mjs";

/**
 * Initialize character sheet integration
 */
export function initCharacterSheetIntegration() {
	// Hook into character sheet rendering - same as mana system
	Hooks.on("renderCharacterActorSheet", onRenderCharacterSheet);

	console.log("Adrasamen | Character sheet integration initialized");
}

/**
 * Handle character sheet rendering
 * @param {ActorSheet} sheet - The character sheet being rendered
 * @param {jQuery} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function onRenderCharacterSheet(sheet, html, data) {
	console.log("Adrasamen | Processing character sheet for", sheet.actor.name);

	await addAdrasamenTab(sheet, html, data);
}

/**
 * Add the Adrasamen tab to the character sheet
 * @param {ActorSheet} sheet - The character sheet
 * @param {jQuery} html - The sheet HTML
 * @param {Object} data - The sheet data
 */
async function addAdrasamenTab(sheet, html, data) {
	const actor = sheet.actor;

	// Check if Adrasamen tab is already fully injected
	const existingTab = html.querySelector('a[data-tab="adrasamen"]');
	const existingTabContent = html.querySelector('section[data-tab="adrasamen"]');

	if (existingTab && existingTabContent) {
		console.log("Adrasamen | Tab already fully injected, skipping");
		return;
	}

	// Prepare affinity data for template
	const affinityData = getAffinityData(actor);
	const characteristicLinking = getCharacteristicLinking(actor);

	const templateData = {
		affinities: {},
		characteristicLinking: characteristicLinking,
		config: AFFINITY_CONFIG,
	};

	// Build affinity data with calculated levels and config
	Object.entries(affinityData).forEach(([affinityName, affinity]) => {
		templateData.affinities[affinityName] = {
			...affinity,
			finalLevel: getAffinityLevel(actor, affinityName),
			config: AFFINITY_CONFIG[affinityName],
		};
	});

	console.log("Adrasamen | Template data prepared:", templateData);

	// Render the template
	const tabContent = await renderTemplate(
		"modules/adrasamen/templates/affinity-tab.hbs",
		templateData,
	);

	console.log("Adrasamen | Template rendered successfully");
	console.log("Adrasamen | Looking for tab navigation...");

	// Find the navigation container (not individual tab elements)
	let tabNav = html.querySelector('nav.tabs[data-group="primary"]');
	if (!tabNav) {
		tabNav = html.querySelector("nav.tabs");
	}
	if (!tabNav) {
		tabNav = html.querySelector(".tabs");
	}

	if (tabNav) {
		// Check if Adrasamen tab already exists to prevent duplicates
		const existingTab = html.querySelector('a[data-tab="adrasamen"]');
		if (existingTab) {
			console.log("Adrasamen | Tab already exists, skipping creation");
			return;
		}

		console.log(
			"Adrasamen | Found tab navigation container, adding Adrasamen tab",
		);

		// Create tab navigation element that matches D&D5e structure exactly
		const tabElement = document.createElement("a");
		tabElement.classList.add("item", "control");
		tabElement.setAttribute("data-action", "tab");
		tabElement.setAttribute("data-group", "primary");
		tabElement.setAttribute("data-tab", "adrasamen");
		tabElement.setAttribute(
			"data-tooltip",
			game.i18n.localize("ADRASAMEN.AdrasamenTab"),
		);
		tabElement.setAttribute(
			"aria-label",
			game.i18n.localize("ADRASAMEN.AdrasamenTab"),
		);
		tabElement.innerHTML = `<i class="fas fa-magic" inert></i>`;

		// Append to the navigation container
		tabNav.appendChild(tabElement);
	}

	console.log("Adrasamen | Looking for tab body...");

	// Try multiple selectors to find tab body - using native DOM methods
	let tabBody = html.querySelector('.tab[data-group="primary"]:last-of-type');
	if (!tabBody) {
		tabBody = html.querySelector(".tab-body .tab:last-of-type");
	}
	if (!tabBody) {
		tabBody = html.querySelector(".sheet-body .tab:last-of-type");
	}
	if (!tabBody) {
		tabBody = html.querySelector(".tab:last-of-type");
	}

	if (tabBody) {
		// Check if Adrasamen tab content already exists to prevent duplicates
		const existingTabContent = html.querySelector(
			'section[data-tab="adrasamen"]',
		);
		if (existingTabContent) {
			console.log(
				"Adrasamen | Tab content already exists, skipping creation",
			);
			return;
		}

		console.log("Adrasamen | Found tab body, adding Adrasamen content");

		// Create tab content element that matches D&D5e structure
		const tabContentElement = document.createElement("section");
		tabContentElement.classList.add("tab");
		tabContentElement.setAttribute("data-group", "primary");
		tabContentElement.setAttribute("data-tab", "adrasamen");
		tabContentElement.innerHTML = tabContent;

		// Insert into the tab container
		tabBody.parentElement.appendChild(tabContentElement);

		console.log("Adrasamen | Adrasamen tab successfully added");

		// Add event listeners to the new tab content
		bindAffinityEvents(sheet, tabContentElement);
	} else {
		console.warn("Adrasamen | Could not find tab body");
		console.log(
			"Adrasamen | Available tab elements:",
			html.querySelectorAll(".tab").length,
		);
		return;
	}
}

/**
 * Bind event handlers for affinity interactions
 * @param {ActorSheet} sheet - The character sheet
 * @param {HTMLElement} html - The sheet HTML
 */
function bindAffinityEvents(sheet, html) {
	const actor = sheet.actor;

	// Handle characteristic linking changes
	html.querySelectorAll('[name$="Characteristic"]').forEach((select) => {
		select.addEventListener("change", async (event) => {
			const type = event.currentTarget.dataset.type;
			const characteristic = event.currentTarget.value;

			await game.adrasamen.linkAffinityToCharacteristic(
				actor,
				type,
				characteristic,
			);
			// Update final levels without full re-render
			updateAffinityDisplay(html, actor);
		});
	});

	// Handle primary affinity selection
	html.querySelectorAll('input[name="primaryAffinity"]').forEach((input) => {
		input.addEventListener("change", async (event) => {
			const affinityName = event.currentTarget.value;
			await game.adrasamen.setPrimaryAffinity(actor, affinityName);
			// Update radio states and display without full re-render
			updateAffinityDisplay(html, actor);
		});
	});

	// Handle secondary affinity selection
	html.querySelectorAll('input[name="secondaryAffinity"]').forEach(
		(input) => {
			input.addEventListener("change", async (event) => {
				const affinityName = event.currentTarget.value;
				await game.adrasamen.setSecondaryAffinity(actor, affinityName);
				// Update radio states and display without full re-render
				updateAffinityDisplay(html, actor);
			});
		},
	);

	// Handle manual level changes
	html.querySelectorAll('input[name="manualLevel"]').forEach((input) => {
		input.addEventListener("change", async (event) => {
			const affinityName = event.currentTarget.dataset.affinity;
			const level = parseInt(event.currentTarget.value) || 0;

			await game.adrasamen.setAffinityLevel(actor, affinityName, level);
			// Update final levels without full re-render
			updateAffinityDisplay(html, actor);
		});
	});
}

/**
 * Update affinity display elements without full re-render
 * @param {HTMLElement} html - The sheet HTML
 * @param {Actor} actor - The actor
 */
function updateAffinityDisplay(html, actor) {
	const affinityData = getAffinityData(actor);

	// Update all radio button states and displays
	Object.entries(affinityData).forEach(([affinityName, affinity]) => {
		const primaryRadio = html.querySelector(
			`input[name="primaryAffinity"][value="${affinityName}"]`,
		);
		const secondaryRadio = html.querySelector(
			`input[name="secondaryAffinity"][value="${affinityName}"]`,
		);

		if (primaryRadio) {
			primaryRadio.checked = affinity.isPrimary;
		}
		if (secondaryRadio) {
			secondaryRadio.checked = affinity.isSecondary;
		}

		// Update characteristic display
		const characteristicCell = html.querySelector(
			`tr[data-affinity="${affinityName}"] .affinity-characteristic`,
		);
		if (characteristicCell) {
			let text = game.i18n.localize("ADRASAMEN.Others");
			if (affinity.isPrimary) {
				text = game.i18n.localize("ADRASAMEN.Primary");
			} else if (affinity.isSecondary) {
				text = game.i18n.localize("ADRASAMEN.Secondary");
			}
			characteristicCell.textContent = text;
		}

		// Update final level display
		const finalLevel = getAffinityLevel(actor, affinityName);
		const finalLevelCell = html.querySelector(
			`tr[data-affinity="${affinityName}"] .final-level`,
		);
		if (finalLevelCell) {
			finalLevelCell.textContent = finalLevel;
		}
	});
}
