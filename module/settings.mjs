/**
 * Register the system's settings.
 *
 * @returns {void}
 */
export function registerSettings() {
    // Damage dice explosion
    game.settings.register("outerheaven", "criticals", {
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
}
