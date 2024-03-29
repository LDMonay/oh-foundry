import { ItemCompendiumConfig } from "./applications/item-compendiums.mjs";
import { TeamsConfig } from "./applications/teams-config.mjs";
import { SYSTEM } from "./const.mjs";
import { Team } from "./data/combat.mjs";
import { ItemCompendiumSettings } from "./data/settings.mjs";

/**
 * Register the system's settings.
 *
 * @returns {void}
 */
export function registerSettings() {
    // Damage dice explosion
    game.settings.register(SYSTEM.ID, "criticals", {
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
    game.settings.register(SYSTEM.ID, "itemCompendiums", {
        type: ItemCompendiumSettings,
        scope: "world",
        config: false,
        default: new ItemCompendiumSettings().toObject(),
    });
    game.settings.registerMenu(SYSTEM.ID, "itemCompendiums", {
        name: "OH.Settings.ItemCompendiums.Name",
        label: "OH.Settings.ItemCompendiums.Label",
        hint: "OH.Settings.ItemCompendiums.Hint",
        icon: "fas fa-book",
        type: ItemCompendiumConfig,
        restricted: true,
    });

    // Default teams
    game.settings.register(SYSTEM.ID, "defaultTeams", {
        scope: "world",
        config: false,
        type: (value) => value.map((team) => new Team(team)),
        default: [],
    });
    game.settings.registerMenu(SYSTEM.ID, "teamsConfig", {
        name: "OH.Settings.TeamsConfig.Name",
        label: "OH.Settings.TeamsConfig.Label",
        hint: "OH.Settings.TeamsConfig.Hint",
        icon: "fas fa-flag",
        type: TeamsConfig,
        restricted: true,
    });

    // Item descriptions in chat
    game.settings.register(SYSTEM.ID, "expandDescriptions", {
        name: "OH.Settings.ExpandDescriptions.Name",
        hint: "OH.Settings.ExpandDescriptions.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });
}
