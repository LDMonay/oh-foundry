import { DescriptionTemplate, PointsTemplate } from "./templates.mjs";

const fields = foundry.data.fields;

export class OHSkill extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            ...DescriptionTemplate(),
            ...PointsTemplate(),
            benefitsDescription: new fields.StringField({ initial: "", nullable: false }),
        };
    }
}
