/**
 * Test script to verify affinity localization strings
 * Run this in the browser console within Foundry to test localization
 */

// Test the localization strings work as specified in Task 3, Step 2
console.log("Testing affinity localization strings...");

// Test primary affinity string (as specified in the plan)
try {
	const fireResult = game.i18n.localize("ADRASAMEN.Affinity.fire");
	console.log("✓ ADRASAMEN.Affinity.fire:", fireResult);
	console.log(
		'Expected: "Fire", Got:',
		fireResult,
		fireResult === "Fire" ? "✅ PASS" : "❌ FAIL",
	);
} catch (error) {
	console.error("❌ Error testing fire affinity:", error);
}

// Test all affinity names
const affinityNames = [
	"water",
	"air",
	"earth",
	"fire",
	"ice",
	"light",
	"shadow",
	"mind",
	"arcane",
];
console.log("\nTesting all 9 affinity names:");

affinityNames.forEach((affinity) => {
	try {
		const result = game.i18n.localize(`ADRASAMEN.Affinity.${affinity}`);
		const expected = affinity.charAt(0).toUpperCase() + affinity.slice(1);
		console.log(
			`✓ ADRASAMEN.Affinity.${affinity}:`,
			result,
			result === expected ? "✅" : "❌",
		);
	} catch (error) {
		console.error(`❌ Error testing ${affinity}:`, error);
	}
});

// Test management strings
const managementStrings = [
	"AdrasamenTab",
	"AffinityManagement",
	"Primary",
	"Secondary",
	"Others",
];

console.log("\nTesting management strings:");
managementStrings.forEach((key) => {
	try {
		const result = game.i18n.localize(`ADRASAMEN.${key}`);
		console.log(`✓ ADRASAMEN.${key}:`, result);
	} catch (error) {
		console.error(`❌ Error testing ${key}:`, error);
	}
});

console.log("\n🎯 Localization test complete!");
console.log("💡 All strings should resolve to their English equivalents");
