import { ItemCompendiumConfig, ItemCompendiumSettings } from "./applications/item-compendiums.mjs";
import { SYSTEM_ID } from "./const.mjs";

/**
 * Register the system's settings.
 *
 * @returns {void}
 */
export function registerSettings() {
    // Damage dice explosion
    game.settings.register(SYSTEM_ID, "criticals", {
        name: "OH.Settings.Criticals.Name",
        hint: "OH.Settings.Criticals.Hint",
        scope: "world",
        config: true,
        type: String,
        default: "unlimited",
        choices: {
            unlimited: "OH.Settings.Criticals.Unlimited",
            limited: "OH.Settings.Criticals.Limited",
            none: "OH.Settings.Criticals.None",
        },
    });

    // Compendium buttons
    game.settings.register(SYSTEM_ID, "itemCompendiums", {
        type: ItemCompendiumSettings,
        scope: "world",
        config: false,
        default: new ItemCompendiumSettings().toObject(),
    });
    game.settings.registerMenu(SYSTEM_ID, "itemCompendiums", {
        name: "OH.Settings.ItemCompendiums.Name",
        label: "OH.Settings.ItemCompendiums.Label",
        hint: "OH.Settings.ItemCompendiums.Hint",
        icon: "fas fa-book",
        type: ItemCompendiumConfig,
        restricted: true,
    });
}
