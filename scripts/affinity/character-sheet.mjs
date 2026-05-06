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
import { prepareQuadralitheDisplayData, bindQuadralitheEvents } from "../quadralithe/ui-integration.mjs";
import { getEquippedQuadralithe, calculateMorphosEffects } from "../quadralithe/quadralithe-core.mjs";

/**
 * Initialize character sheet integration
 */
export function initCharacterSheetIntegration() {
	// Hook into character sheet rendering - same as mana system
	Hooks.on("renderCharacterActorSheet", onRenderCharacterSheet);

	// On equip/unequip, directly update the open affinity tab rather than
	// triggering a full sheet re-render (which would fight with the bail-out guard).
	const _updateActorSheet = (actor) => {
		if (!actor?.sheet?.element) return;
		const tabContent = actor.sheet.element.querySelector('section[data-tab="adrasamen"]');
		if (!tabContent) return;
		updateAffinityDisplay(tabContent, actor);
	};
	Hooks.on("adrasamen.quadralitheEquipped", _updateActorSheet);
	Hooks.on("adrasamen.quadralitheUnequipped", _updateActorSheet);
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

	// Prepare affinity data for template
	const affinityData = getAffinityData(actor);
	const characteristicLinking = getCharacteristicLinking(actor);
	const quadralitheData = await prepareQuadralitheDisplayData(actor);

	const templateData = {
		affinities: {},
		characteristicLinking: characteristicLinking,
		quadralitheData: quadralitheData,
		config: AFFINITY_CONFIG,
	};

	// Pre-compute morphos bonuses (one call, all affinities)
	let morphosBonuses = {};
	try {
		const morphosItem = getEquippedQuadralithe(actor, "morphos");
		if (morphosItem) {
			const morphosEffects = calculateMorphosEffects(actor, morphosItem);
			morphosBonuses = morphosEffects.affinityBonuses || {};
		}
	} catch (e) {
		console.warn("Adrasamen | Error pre-computing morphos bonuses for sheet:", e);
	}

	// Build affinity data with calculated levels and config
	Object.entries(affinityData).forEach(([affinityName, affinity]) => {
		const morphosBonus = morphosBonuses[affinityName] || 0;
		templateData.affinities[affinityName] = {
			...affinity,
			finalLevel: getAffinityLevel(actor, affinityName),
			morphosBonus,
			config: AFFINITY_CONFIG[affinityName],
		};
	});

	// Render the template
	const tabContent = await renderTemplate(
		"modules/adrasamen/templates/affinity-tab.hbs",
		templateData,
	);

	// Always ensure the nav button exists — the d&d5e "tabs" PART re-renders on
	// every actor update and replaces the nav element, wiping our button.
	_ensureAdrasamenNavButton(html);

	// Refresh existing section OR create it from scratch
	const existingTabContent = html.querySelector('section[data-tab="adrasamen"]');
	if (existingTabContent) {
		existingTabContent.innerHTML = tabContent;
		bindAffinityEvents(sheet, existingTabContent);
		return;
	}

	// Section doesn't exist yet — find insertion point and create it
	const tabBody =
		html.querySelector('.tab[data-group="primary"]:last-of-type') ||
		html.querySelector(".tab-body .tab:last-of-type") ||
		html.querySelector(".sheet-body .tab:last-of-type") ||
		html.querySelector(".tab:last-of-type");

	if (!tabBody) return;

	const tabContentElement = document.createElement("section");
	tabContentElement.classList.add("tab");
	tabContentElement.setAttribute("data-group", "primary");
	tabContentElement.setAttribute("data-tab", "adrasamen");
	tabContentElement.innerHTML = tabContent;

	tabBody.parentElement.appendChild(tabContentElement);
	bindAffinityEvents(sheet, tabContentElement);
}

/**
 * Ensure the Adrasamen nav button exists in the sheet nav.
 * Safe to call on every render — no-ops if the button is already there.
 * @param {HTMLElement} html - The full sheet element
 */
function _ensureAdrasamenNavButton(html) {
	if (html.querySelector('a[data-tab="adrasamen"]')) return;

	const tabNav =
		html.querySelector('nav.tabs[data-group="primary"]') ||
		html.querySelector("nav.tabs") ||
		html.querySelector(".tabs");
	if (!tabNav) return;

	const tabElement = document.createElement("a");
	tabElement.classList.add("item", "control");
	tabElement.setAttribute("data-action", "tab");
	tabElement.setAttribute("data-group", "primary");
	tabElement.setAttribute("data-tab", "adrasamen");
	tabElement.setAttribute("data-tooltip", game.i18n.localize("ADRASAMEN.AdrasamenTab"));
	tabElement.setAttribute("aria-label", game.i18n.localize("ADRASAMEN.AdrasamenTab"));
	tabElement.innerHTML = `<i class="fas fa-magic" inert></i>`;
	tabNav.appendChild(tabElement);
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

	// Handle quadralithe interactions
	bindQuadralitheEvents(sheet, html);
}

/**
 * Update affinity display elements without full re-render
 * @param {HTMLElement} html - The sheet HTML
 * @param {Actor} actor - The actor
 */
function updateAffinityDisplay(html, actor) {
	const affinityData = getAffinityData(actor);

	// Pre-compute morphos bonuses for badge updates
	let morphosBonuses = {};
	try {
		const morphosItem = getEquippedQuadralithe(actor, "morphos");
		if (morphosItem) {
			const morphosEffects = calculateMorphosEffects(actor, morphosItem);
			morphosBonuses = morphosEffects.affinityBonuses || {};
		}
	} catch (e) {
		console.warn("Adrasamen | Error computing morphos bonuses for display:", e);
	}

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

		// Update morphos bonus badge
		const morphosBonus = morphosBonuses[affinityName] || 0;
		const manualCell = html.querySelector(
			`tr[data-affinity="${affinityName}"] .affinity-manual`,
		);
		if (manualCell) {
			let badge = manualCell.querySelector(".morphos-bonus");
			if (morphosBonus > 0) {
				if (!badge) {
					badge = document.createElement("span");
					badge.classList.add("morphos-bonus");
					manualCell.appendChild(badge);
				}
				badge.textContent = `+${morphosBonus}`;
			} else if (badge) {
				badge.remove();
			}
		}
	});
}
