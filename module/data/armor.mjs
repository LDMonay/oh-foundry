import { OUTERHEAVEN } from "../config.mjs";
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
                    armorType: new fields.StringField({
                        initial: "untyped",
                        choices: Object.keys(OUTERHEAVEN.armorTypes),
                        required: true,
                    }),
                    value: new fields.NumberField({ initial: 0, nullable: false }),
                }),
            ),
        };
    }
}
