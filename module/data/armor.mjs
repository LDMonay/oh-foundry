import { DescriptionTemplate, PointsTemplate } from "./templates.mjs";

const fields = foundry.data.fields;

export class OHArmor extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            ...DescriptionTemplate(),
            ...PointsTemplate(),
            benefitsDescription: new fields.StringField(),
            armorBonuses: new fields.ArrayField(
                new fields.SchemaField({
                    armorType: new fields.StringField(),
                    value: new fields.NumberField(),
                }),
            ),
        };
    }
}
