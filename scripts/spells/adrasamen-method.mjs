/**
 * Adrasamen Spellcasting Method Configuration
 * Defines the Adrasamen spellcasting method for D&D5e integration
 */


/**
 * Register the Adrasamen spellcasting method with D&D5e
 * This must be called during the 'init' hook so D&D5e can process it into a SpellcastingModel
 * This adds "Adrasamen" as a new option in the spell preparation method dropdown
 */
export function registerAdrasamenMethod() {
    // Define Adrasamen spellcasting method configuration
    const adrasamenMethod = {
        label: "ADRASAMEN.SpellcastingMethod.Adrasamen",
        // No type specified - defaults to "base" SpellcastingModel
        // This creates a non-slot spellcasting method like atwill/innate/ritual
        order: 25,
        img: "modules/adrasamen/icons/adrasamen-spell.webp"
    };

    // Add to D&D5e spellcasting configuration
    CONFIG.DND5E.spellcasting.adrasamen = adrasamenMethod;

    console.log("Adrasamen | Registered Adrasamen spellcasting method and preparation mode");

    // dnd5e.dataModels.spellcasting.SpellcastingModel.fromConfig();
}