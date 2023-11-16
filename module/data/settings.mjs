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
