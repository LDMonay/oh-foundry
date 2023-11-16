/**
 * Settings for which compendium to open when importing items of a specific type to an actor sheet.
 */
export class ItemCompendiumSettings extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        // Use game.data to enable verification of fields even when Foundry is not ready yet
        return game.system.template.Item.types.reduce((acc, type) => {
            acc[type] = new fields.StringField({
                initial: "",
                nullable: false,
                blank: true,
                choices: this.getChoices,
            });
            return acc;
        }, {});
    }

    /**
     * Get a list of currently available compendiums.
     *
     * @returns {string[]} The list of available compendiums.
     */
    static getChoices() {
        return Array.from(new Set([...game.packs, ...game.data.packs].map((pack) => pack.id ?? pack.metadata?.id)));
    }
}
