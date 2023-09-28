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
            properties: new fields.StringField({ initial: "", nullable: false }),
            range: new fields.NumberField({ label: "OH.Range" }),
            powerCost: new fields.NumberField({ initial: 0, nullable: false }),
        };
    }

    /** @override */
    prepareBaseData() {
        if (typeof this.capacity.max === "number") {
            this.capacity.value ??= 0;
        }
    }
}
