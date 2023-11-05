/**
 * Request all template partials from the server and cache them for later use.
 * Partials are available by their paths as well as through `oh.${partialName}`.
 *
 * @returns {Promise<void>}
 */
export async function preloadHandlebarsTemplates() {
    const partials = [
        "systems/outerheaven/templates/sheets/parts/melee-block.hbs",
        "systems/outerheaven/templates/sheets/parts/ranged-block.hbs",
        "systems/outerheaven/templates/sheets/parts/unit-abilities.hbs",
        "systems/outerheaven/templates/sheets/parts/unit-defenses.hbs",
        "systems/outerheaven/templates/sheets/parts/unit-items.hbs",
        "systems/outerheaven/templates/sheets/parts/unit-skills.hbs",
        "systems/outerheaven/templates/sheets/parts/unit-stats-sidebar.hbs",
        "systems/outerheaven/templates/sheets/parts/unit-stats-defense.hbs",
        "systems/outerheaven/templates/sheets/parts/unit-weapons.hbs",
        "systems/outerheaven/templates/sheets/parts/item-effects.hbs",
        "systems/outerheaven/templates/chat/item-display.hbs",
        "systems/outerheaven/templates/chat/defense-display.hbs",
        "systems/outerheaven/templates/chat/defense-stats-display.hbs",
        "systems/outerheaven/templates/chat/weapon-display.hbs",
        "systems/outerheaven/templates/chat/weapon-attack.hbs",
    ];

    const paths = {};
    for (const path of partials) {
        paths[path.replace(".hbs", ".html")] = path;
        paths[`oh.${path.split("/").pop().replace(".hbs", "")}`] = path;
    }

    return loadTemplates(paths);
}
