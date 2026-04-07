const { MODULE_ID, MANA_FLAG, EMPTY_MANA_STATE, EMPTY_MANA_CONFIG } =
	await import("./constants.mjs");

/**
 * @import { Actor5e } from "./types.mjs"
 * @import { ManaState, ManaConfig } from "./types.mjs"
 */

/**
 * Initialize the mana system by registering necessary hooks.
 * Sets up event listeners for character sheet rendering, actor creation, and rest completion.
 */
const initMana = () => {
	Hooks.on("renderCharacterActorSheet", onRenderCharacterActorSheet);
	Hooks.on("createActor", onCreateActor);
	Hooks.on("dnd5e.restCompleted", onRestCompleted);
};

/**
 * Initialize mana for newly created character actors.
 * Sets default mana values and configuration for new character actors.
 *
 * @param {Actor5e} actor - The newly created actor.
 */
const onCreateActor = async (actor) => {
	if (actor.type !== "character") return;

	// Check if mana flag already exists
	const existingFlag = actor.getFlag(MODULE_ID, MANA_FLAG);
	if (existingFlag) return;

	// Initialize with default mana values
	const manaData = {
		...EMPTY_MANA_STATE,
		...{ config: EMPTY_MANA_CONFIG },
	};

	await actor.setFlag(MODULE_ID, MANA_FLAG, manaData);
};

/**
 * Handle rest completion to restore mana.
 * Restores mana based on rest type (short rest uses formula, long rest fully restores).
 *
 * @param {Actor5e} actor - The actor who completed a rest.
 * @param {object} result - The rest completion result containing rest type information.
 * @param {boolean} result.longRest - Whether this was a long rest.
 * @param {boolean} result.shortRest - Whether this was a short rest.
 */
const onRestCompleted = async (actor, result) => {
	if (actor.type !== "character") return;

	const { currentMana, maxMana } = getManaState(actor);
	const config = getManaConfig(actor);

	let restoredMana = currentMana;

	if (result.longRest) {
		// Full restore on long rest
		restoredMana = maxMana;
	} else if (result.shortRest) {
		// Use short rest formula
		try {
			const roll = new Roll(config.manaShortRestFormula, {
				maxMana: maxMana,
				currentMana: currentMana,
			});
			await roll.evaluate();
			restoredMana = Math.min(maxMana, currentMana + roll.total);
		} catch (error) {
			console.warn(
				"Adrasamen: Invalid short rest formula, using default",
				error,
			);
			restoredMana = Math.min(
				maxMana,
				currentMana + Math.floor(maxMana / 2),
			);
		}
	}

	if (restoredMana !== currentMana) {
		await updateManaValue(actor, restoredMana);
	}
};

/**
 * Handle character sheet rendering to inject the mana bar.
 * Renders and inserts the mana bar into character sheets using the Handlebars template.
 *
 * @param {Application} app - The character sheet application being rendered.
 * @param {jQuery} html - The HTML content of the character sheet.
 */
const onRenderCharacterActorSheet = async (app, html) => {
	console.log("rendering character sheet hook");
	const actor = app.actor;

	if (actor.type !== "character") return;
	if (html.querySelector(".mana-container")) return;

	const anchor = html.querySelector(".stats .meter-group:last-of-type");
	if (!anchor) return;

	const isEditable = app.isEditable;
	const manaData = prepareManaData(actor);

	// Render the Handlebars template
	const template = await getTemplate(
		"modules/adrasamen/templates/mana-bar.hbs",
	);
	const manaHtml = template({
		manaData: manaData,
		editable: isEditable,
	});

	// Create a container and insert the mana bar
	const manaContainer = document.createElement("div");
	manaContainer.className = "mana-container";
	manaContainer.innerHTML = manaHtml;

	// Insert after the last meter group
	anchor.parentNode.insertBefore(manaContainer, anchor.nextSibling);

	// Add event listeners
	addManaEventListeners(manaContainer, actor, app);
};

/**
 * Prepare mana data for template rendering.
 * Calculates the percentage and formats data for use in the Handlebars template.
 *
 * @param {Actor5e} actor - The actor to prepare mana data for.
 * @returns {object} The prepared mana data with currentMana, maxMana, and percentage.
 */
const prepareManaData = (actor) => {
	const { currentMana, maxMana } = getManaState(actor);

	// Calculate percentage for the progress bar
	const percentage =
		maxMana > 0 ? Math.round((currentMana / maxMana) * 100) : 0;

	return {
		currentMana,
		maxMana,
		percentage,
	};
};

/**
 * Add event listeners to the mana bar elements.
 * Handles value changes, configuration button clicks, and progress bar interactions.
 *
 * @param {HTMLElement} container - The mana bar container element.
 * @param {Actor5e} actor - The actor associated with the mana bar.
 * @param {Application} app - The character sheet application.
 */
const addManaEventListeners = (container, actor, app) => {
	// Handle direct value changes
	const valueInput = container.querySelector(".mana-value-input");
	if (valueInput) {
		valueInput.addEventListener("change", async (event) => {
			const newValue = Math.max(0, parseInt(event.target.value) || 0);
			await updateManaValue(actor, newValue);
			app.render(false);
		});
	}

	// Handle configuration button
	const configButton = container.querySelector(
		'[data-action="showConfiguration"]',
	);
	if (configButton) {
		configButton.addEventListener("click", async (event) => {
			event.preventDefault();
			await showManaConfiguration(actor);
		});
	}

	// Handle progress bar clicks for quick editing
	const progressBar = container.querySelector(".progress.mana-points");
	if (progressBar && app.isEditable) {
		progressBar.addEventListener("click", async (event) => {
			const rect = progressBar.getBoundingClientRect();
			const percent = (event.clientX - rect.left) / rect.width;
			const { maxMana } = getManaState(actor);
			const newValue = Math.round(maxMana * percent);
			await updateManaValue(actor, newValue);
			app.render(false);
		});
	}
};

/**
 * Get the stored mana flag for an actor.
 *
 * @param {Actor5e} actor The actor to inspect.
 * @returns {ManaState & { config: ManaConfig }} The stored mana flag.
 */
const getManaFlag = (actor) => {
	const flag = actor.getFlag(MODULE_ID, MANA_FLAG);

	// If no flag exists, return empty state with config
	if (!flag) {
		return {
			...EMPTY_MANA_STATE,
			config: EMPTY_MANA_CONFIG,
		};
	}

	const { config, ...state } = flag;
	return {
		...foundry.utils.mergeObject(EMPTY_MANA_STATE, state, {
			inplace: false,
		}),
		config: foundry.utils.mergeObject(EMPTY_MANA_CONFIG, config ?? {}, {
			inplace: false,
		}),
	};
};

/**
 * Get the mana state (without configuration) for an actor.
 *
 * @param {Actor5e} actor - The actor to get mana state for.
 * @returns {ManaState} The mana state containing currentMana, maxMana, and isExhausted.
 */
const getManaState = (actor) => {
	const { config, ...state } = getManaFlag(actor);
	return state;
};

/**
 * Get the mana configuration for an actor.
 *
 * @param {Actor5e} actor - The actor to get mana configuration for.
 * @returns {ManaConfig} The mana configuration containing formulas and settings.
 */
const getManaConfig = (actor) => getManaFlag(actor).config;

/**
 * Update the current mana value for an actor.
 *
 * @param {Actor5e} actor The actor to update.
 * @param {number} newValue The new current mana value.
 */
const updateManaValue = async (actor, newValue) => {
	const { maxMana } = getManaState(actor);
	const clampedValue = Math.max(0, Math.min(newValue, maxMana));

	const flagData = getManaFlag(actor);
	flagData.currentMana = clampedValue;

	await actor.setFlag(MODULE_ID, MANA_FLAG, flagData);
};

/**
 * Update the maximum mana value for an actor.
 *
 * @param {Actor5e} actor The actor to update.
 * @param {number} newMaxValue The new maximum mana value.
 */
const updateMaxManaValue = async (actor, newMaxValue) => {
	const clampedValue = Math.max(0, newMaxValue);

	const flagData = getManaFlag(actor);
	flagData.maxMana = clampedValue;

	// Clamp current mana to new max
	flagData.currentMana = Math.min(flagData.currentMana, clampedValue);

	await actor.setFlag(MODULE_ID, MANA_FLAG, flagData);
};

/**
 * Show the mana configuration dialog.
 *
 * @param {Actor5e} actor The actor to configure.
 */
const showManaConfiguration = async (actor) => {
	const { currentMana, maxMana } = getManaState(actor);
	const config = getManaConfig(actor);

	new Dialog({
		title: game.i18n.localize("ADRASAMEN.ManaPointsConfig"),
		content: `
			<form>
				<div class="form-group">
					<label>${game.i18n.localize("ADRASAMEN.CurrentMana")}</label>
					<input type="number" name="currentMana" value="${currentMana}" min="0">
				</div>
				<div class="form-group">
					<label>${game.i18n.localize("ADRASAMEN.MaxMana")}</label>
					<input type="number" name="maxMana" value="${maxMana}" min="0">
				</div>
				<div class="form-group">
					<label>${game.i18n.localize("ADRASAMEN.ManaFormulaPerLevelUp")}</label>
					<input type="text" name="manaFormulaPerLevelUp" value="${config.manaFormulaPerLevelUp}">
				</div>
				<div class="form-group">
					<label>${game.i18n.localize("ADRASAMEN.ManaShortRestFormula")}</label>
					<input type="text" name="manaShortRestFormula" value="${config.manaShortRestFormula}">
				</div>
			</form>
		`,
		buttons: {
			save: {
				label: game.i18n.localize("Save"),
				callback: async (html) => {
					const formData = new FormData(html.querySelector("form"));
					const currentMana =
						parseInt(formData.get("currentMana")) || 0;
					const maxMana = parseInt(formData.get("maxMana")) || 0;
					const manaFormulaPerLevelUp =
						formData.get("manaFormulaPerLevelUp") ||
						config.manaFormulaPerLevelUp;
					const manaShortRestFormula =
						formData.get("manaShortRestFormula") ||
						config.manaShortRestFormula;

					const flagData = {
						currentMana: Math.max(
							0,
							Math.min(currentMana, maxMana),
						),
						maxMana: Math.max(0, maxMana),
						isExhausted: false,
						config: {
							manaFormulaPerLevelUp,
							manaShortRestFormula,
						},
					};

					await actor.setFlag(MODULE_ID, MANA_FLAG, flagData);
				},
			},
			cancel: {
				label: game.i18n.localize("Cancel"),
			},
		},
	}).render(true);
};

export {
	initMana,
	getManaFlag,
	getManaState,
	getManaConfig,
	prepareManaData,
	updateManaValue,
	updateMaxManaValue,
	showManaConfiguration,
};
