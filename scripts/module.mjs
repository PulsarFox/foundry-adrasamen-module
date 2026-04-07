Hooks.once("init", async () => {
	const { initMana } = await import("./mana.mjs");

	initMana();
});
