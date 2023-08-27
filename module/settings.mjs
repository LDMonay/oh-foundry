export function registerSettings() {
    // TODO: Localisation
    game.settings.register("outerheaven", "criticals", {
        name: "OH.Settings.CriticalsName",
        hint: "OH.Settings.CriticalsHint",
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
