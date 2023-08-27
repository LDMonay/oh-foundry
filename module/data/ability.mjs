import { DescriptionTemplate, PointsTemplate, UsableTemplate } from "./templates.mjs";

export class OHAbility extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            ...DescriptionTemplate(),
            ...PointsTemplate(),
            ...UsableTemplate(),
        };
    }
}
