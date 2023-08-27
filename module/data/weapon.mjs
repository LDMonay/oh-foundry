import { OUTERHEAVEN } from "../config.mjs";
import { DescriptionTemplate, PointsTemplate, UsableTemplate } from "./templates.mjs";

const fields = foundry.data.fields;

export class OHWeapon extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            ...DescriptionTemplate(),
            ...PointsTemplate(),
            ...UsableTemplate(),
            weaponType: new fields.StringField({
                initial: "ranged",
                choices: OUTERHEAVEN.weaponTypes,
                required: true,
            }),
            damageType: new fields.StringField({
                initial: "untyped",
                choices: OUTERHEAVEN.damageTypes,
                required: true,
            }),
            damagePerAttack: new fields.StringField({ initial: "", nullable: false }),
            numberOfAttacks: new fields.NumberField({ initial: 1 }),
            attackBonus: new fields.NumberField({ initial: 0 }),
            armorPenetration: new fields.NumberField({ initial: 0 }),
            handedness: new fields.StringField({ initial: "", nullable: false }),
            prop: new fields.StringField({ initial: "", nullable: false }),
            range: new fields.NumberField(),
        };
    }
}
