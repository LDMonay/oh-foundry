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

    /**
     * Get a display suitable string for the armor bonuses of this armor.
     *
     * @returns {string} - The display string.
     */
    getArmorBonusString() {
        const armorParts = [];
        const armorObject = this.armorBonuses.reduce((acc, bonus) => {
            if (bonus.armorType === "all") {
                for (const armorType of Object.keys(OUTERHEAVEN.armorTypes)) {
                    acc[armorType] ??= 0;
                    acc[armorType] += bonus.value;
                }
            } else {
                acc[bonus.armorType] ??= 0;
                acc[bonus.armorType] += bonus.value;
            }
            return acc;
        }, {});
        armorParts.push(
            ...Object.entries(armorObject)
                .map(([type, value]) => ({
                    type: game.i18n.localize(OUTERHEAVEN.armorTypes[type]),
                    value,
                }))
                .filter((armor) => armor.value > 0 && armor.value > (armorObject.all ?? 0))
                .map((armor) => `${armor.type} ${armor.value}`),
        );
        return armorParts.join(", ");
    }

    /**
     * Get a display suitable string from armor data.
     *
     * @param {Record<string, number> | Array<{ armorType: string, value: number }>} armor - The armor data, either in actor or item format.
     * @returns {string} - The display string.
     */
    static getArmorString(armor) {
        // The array containing individual armor strings to be joined
        const armorParts = [];

        // Transform `armorBonuses` array into a Record<string, number> using the armor type as key
        if (Array.isArray(armor)) {
            armor = armor.reduce((acc, bonus) => {
                if (bonus.armorType === "all") {
                    for (const armorType of Object.keys(OUTERHEAVEN.armorTypes)) {
                        acc[armorType] ??= 0;
                        acc[armorType] += bonus.value;
                    }
                } else {
                    acc[bonus.armorType] ??= 0;
                    acc[bonus.armorType] += bonus.value;
                }
                return acc;
            }, {});
        }

        // Extract the `all` armor type and position it at the beginning of the array
        const armorAll = armor.all ?? 0;
        if (armorAll > 0) armorParts.push(`${OUTERHEAVEN.armorTypes.all} ${armorAll}`);

        // Add armor types that are not just derived from `all`
        armorParts.push(
            ...Object.entries(armor)
                .map(([type, value]) => ({
                    type: game.i18n.localize(OUTERHEAVEN.armorTypes[type]),
                    value,
                }))
                .filter((armor) => armor.value > 0 && armor.value > armorAll)
                .map((armor) => `${armor.type} ${armor.value}`),
        );
        return armorParts.join(", ");
    }
}
