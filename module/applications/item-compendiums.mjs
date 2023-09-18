import { SYSTEM_ID } from "../const.mjs";

/**
 * A form application for configuring which compendiums to open when importing items of a specific type to an actor sheet.
 */
export class ItemCompendiumConfig extends FormApplication {
    constructor(object, options) {
        super(object || game.settings.get(SYSTEM_ID, "itemCompendiums"), options);
    }

    /** @override */
    static get defaultOptions() {
        const options = super.defaultOptions;
        return {
            ...options,
            id: `${SYSTEM_ID}-item-compendiums`,
            title: game.i18n.localize("OH.Settings.ItemCompendiums.Name"),
            classes: [...options.classes, SYSTEM_ID, "item-compendiums"],
            template: `systems/${SYSTEM_ID}/templates/applications/item-compendiums.hbs`,
            width: 600,
            height: "auto",
            closeOnSubmit: true,
        };
    }

    /** @override */
    async getData() {
        const context = await super.getData();

        const itemTypes = game.system.template.Item.types;
        const packs = Object.fromEntries(game.packs.map((pack) => [pack.metadata.id, pack.metadata.label]));

        context.compendiums = {};
        for (const type of itemTypes) {
            context.compendiums[type] = {
                label: game.i18n.format("OH.Settings.ItemCompendiums.TypeLabel", {
                    type: game.i18n.localize(CONFIG.Item.typeLabels[type]),
                }),
                type: type,
                current: this.object[type],
                choices: foundry.utils.deepClone(packs),
            };
        }

        return context;
    }

    /** @override */
    _updateObject(_event, formData) {
        return game.settings.set(SYSTEM_ID, "itemCompendiums", formData);
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find("[data-action='reset']").on("click", async (event) => {
            event.preventDefault();
            // Only reset object of the current config app, require saving to persist
            this.object = new ItemCompendiumSettings();
            this.render();
        });
    }
}

/**
 * Settings for which compendium to open when importing items of a specific type to an actor sheet.
 */
export class ItemCompendiumSettings extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        // Use game.data to enable verification of fields even when Foundry is not ready yet
        const choices = Array.from(
            new Set([...game.packs, ...game.data.packs].map((pack) => pack.id ?? pack.metadata.id)),
        );
        return game.system.template.Item.types.reduce((acc, type) => {
            acc[type] = new fields.StringField({
                initial: "",
                nullable: false,
                blank: true,
                choices,
            });
            return acc;
        }, {});
    }
}
