// import { Application } from "@client/applications/api/_module.mjs";

declare global {
	/**
	 * A simple event framework used throughout Foundry Virtual Tabletop.
	 * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
	 * This class manages the registration and execution of hooked callback functions.
	 */
	const Hooks: typeof import("./foundry/client/helpers/hooks.mjs").default;
	const fromUuid: typeof import("./foundry/client/utils/helpers.mjs").fromUuid;
	const fromUuidSync: typeof import("./foundry/client/utils/helpers.mjs").fromUuidSync;
	const Application: typeof import("./foundry/client/applications/api/_module.mjs").Application;
}

export {};
