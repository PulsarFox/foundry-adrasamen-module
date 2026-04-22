/**
 * Test script for mana overrideMax functionality
 * To be run in the browser console after loading a character
 */

// Test function to verify mana override behavior
function testManaOverride() {
    console.log("=== Testing Mana Override Functionality ===");

    // Get first character actor
    const actor = game.actors.find(a => a.type === "character");
    if (!actor) {
        console.error("No character found for testing");
        return;
    }

    console.log("Testing with actor:", actor.name);

    // Test 1: Check initial state
    console.log("1. Initial mana state:");
    console.log("  - max:", actor.system.attributes.mana.max);
    console.log("  - overrideMax:", actor.system.attributes.mana.overrideMax);
    console.log("  - value:", actor.system.attributes.mana.value);
    console.log("  - effectiveMax:", actor.system.attributes.mana.effectiveMax);

    // Test 2: Set override and check calculation
    console.log("\n2. Setting overrideMax to 15...");
    actor.update({ "system.attributes.mana.overrideMax": 15 }).then(() => {
        console.log("After override set:");
        console.log("  - max:", actor.system.attributes.mana.max);
        console.log("  - overrideMax:", actor.system.attributes.mana.overrideMax);
        console.log("  - effectiveMax:", actor.system.attributes.mana.effectiveMax);
        console.log("  Expected: max should be 15, effectiveMax should be 15");

        // Test 3: Clear override
        console.log("\n3. Clearing override...");
        return actor.update({ "system.attributes.mana.overrideMax": null });
    }).then(() => {
        console.log("After override cleared:");
        console.log("  - max:", actor.system.attributes.mana.max);
        console.log("  - overrideMax:", actor.system.attributes.mana.overrideMax);
        console.log("  - effectiveMax:", actor.system.attributes.mana.effectiveMax);
        console.log("  Expected: max should be calculated from advancement");

        console.log("=== Test Complete ===");
    });
}

// Test advancement system
function testManaAdvancement() {
    console.log("=== Testing Mana Advancement System ===");

    const actor = game.actors.find(a => a.type === "character");
    if (!actor) {
        console.error("No character found for testing");
        return;
    }

    console.log("Testing advancement with actor:", actor.name);

    // Check for mana advancement
    const classes = Object.values(actor.classes);
    console.log("Classes found:", classes.length);

    classes.forEach(cls => {
        const manaAdvancement = cls.advancement.byType.ManaPoints?.[0];
        if (manaAdvancement) {
            console.log(`Class ${cls.name} has mana advancement:`, {
                total: manaAdvancement.total(),
                adjustedTotal: manaAdvancement.getAdjustedTotal(manaAdvancement._getMaxAffinityLevel()),
                levels: Object.keys(manaAdvancement.value),
                values: manaAdvancement.value,
                maxAffinityLevel: manaAdvancement._getMaxAffinityLevel()
            });
        } else {
            console.log(`Class ${cls.name} has no mana advancement`);
        }
    });

    // Check current mana state
    console.log("Current mana state:");
    console.log("  - max:", actor.system.attributes.mana.max);
    console.log("  - overrideMax:", actor.system.attributes.mana.overrideMax);
    console.log("  - value:", actor.system.attributes.mana.value);
    console.log("  - effectiveMax:", actor.system.attributes.mana.effectiveMax);

    // Force data preparation
    console.log("Forcing data preparation...");
    actor.prepareData();

    console.log("After data preparation:");
    console.log("  - max:", actor.system.attributes.mana.max);
    console.log("  - value:", actor.system.attributes.mana.value);
    console.log("  - effectiveMax:", actor.system.attributes.mana.effectiveMax);
}

// Test mana calculation directly
function testManaCalculation() {
    console.log("=== Testing Mana Calculation ===");

    const actor = game.actors.find(a => a.type === "character");
    if (!actor) {
        console.error("No character found for testing");
        return;
    }

    // Get advancement data
    const classes = Object.values(actor.classes);
    const manaAdvancements = classes.map(c => c.advancement.byType.ManaPoints?.[0]).filter(a => a);

    console.log("Mana advancements found:", manaAdvancements.length);

    if (manaAdvancements.length > 0) {
        const advancement = manaAdvancements[0];
        const maxAffinityLevel = advancement._getMaxAffinityLevel();

        console.log("Advancement data:");
        console.log("  - Total base:", advancement.total());
        console.log("  - Max affinity level:", maxAffinityLevel);
        console.log("  - Adjusted total:", advancement.getAdjustedTotal(maxAffinityLevel));

        // Test calculation manually
        let calculatedMax = 0;
        Object.keys(advancement.value).forEach(level => {
            const value = advancement.valueForLevel(parseInt(level));
            const adjusted = Math.max(value + maxAffinityLevel, 1);
            console.log(`  - Level ${level}: ${value} + ${maxAffinityLevel} = ${adjusted}`);
            calculatedMax += adjusted;
        });

        console.log("Manual calculation result:", calculatedMax);
        console.log("Actor current max:", actor.system.attributes.mana.max);

        if (calculatedMax !== actor.system.attributes.mana.max) {
            console.warn("⚠️ Calculation mismatch! Expected:", calculatedMax, "Actual:", actor.system.attributes.mana.max);
        } else {
            console.log("✅ Calculation matches!");
        }
    }
}

// Export for console use
window.testManaOverride = testManaOverride;
window.testManaAdvancement = testManaAdvancement;
window.testManaCalculation = testManaCalculation;

console.log("Mana tests loaded. Available functions:");
console.log("- testManaOverride() - Test override functionality");
console.log("- testManaAdvancement() - Test advancement system");
console.log("- testManaCalculation() - Test manual calculation vs actual");