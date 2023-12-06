import { SYSTEM } from "./const.mjs";

/**
 * Request all template partials from the server and cache them for later use.
 * Partials are available by their paths as well as through `oh.${partialName}`.
 *
 * @returns {Promise<void>}
 */
export async function preloadHandlebarsTemplates() {
    const partials = [
        "sheets/parts/melee-block.hbs",
        "sheets/parts/ranged-block.hbs",
        "sheets/parts/unit-abilities.hbs",
        "sheets/parts/unit-defenses.hbs",
        "sheets/parts/unit-items.hbs",
        "sheets/parts/unit-skills.hbs",
        "sheets/parts/unit-stats-sidebar.hbs",
        "sheets/parts/unit-stats-defense.hbs",
        "sheets/parts/unit-weapons.hbs",
        "sheets/parts/item-effects.hbs",
        "chat/item-display.hbs",
        "chat/defense-display.hbs",
        "chat/defense-stats-display.hbs",
        "chat/weapon-display.hbs",
        "chat/weapon-attack.hbs",
        "chat/parts/on-use-effects.hbs",
    ].map((path) => `${SYSTEM.TEMPLATE_PATH}/${path}`);

    const paths = {};
    for (const path of partials) {
        paths[path.replace(".hbs", ".html")] = path;
        paths[`oh.${path.split("/").pop().replace(".hbs", "")}`] = path;
    }

    return loadTemplates(paths);
}

/**
 * Generate an ID-suitable string from a name.
 * The length of the string can be limited, and siblings can be provided to ensure uniqueness of the new ID string.
 *
 * @param {string} name - The name to generate an ID from.
 * @param {object} [options] - Options for ID generation.
 * @param {number} [options.length=16] - The length of the ID string to generate.
 * @param {Array<{id: string} | {_id: string}>} [options.siblings] - An array of objects to check for ID uniqueness.
 * @returns {string} The generated ID string.
 */
export function generateId(name, { length = 16, siblings = [] } = {}) {
    if (!Number.isNumeric(length)) throw new Error("ID length must be defined");
    if (length <= 3) throw new Error("ID length must be greater than 3");

    let id = name
        .split(" ")
        .map((word, index) => {
            const part = word.slugify({ replacement: "", strict: true });
            return index ? part.titleCase() : part;
        })
        .join("");
    id = id.slice(0, length - 3).padEnd(length, "0");

    if (siblings) {
        const existingIds = new Set(siblings.filter((s) => s.id || s._id).map((s) => s.id || s._id));
        while (existingIds.has(id)) {
            const counter = Number(id.slice(-3));
            id = id.slice(0, -3) + String(counter + 1).padStart(3, "0");
        }
    }

    return id;
}
