import { LocalEffectField } from "./fields/local-effect.mjs";
import { ValueIsUsedTemplate } from "./templates.mjs";

const fields = foundry.data.fields;

export class OHUnit extends foundry.abstract.TypeDataModel {
    /** @override */
    static defineSchema() {
        return {
            actions: new fields.NumberField({ initial: 2, nullable: false }),
            aim: new fields.NumberField({ initial: 0, nullable: false }),
            baseUnitPoints: new fields.NumberField({ initial: 0, nullable: false }),
            baseUnitPointsIgnore: new fields.BooleanField(),
            defense: new fields.SchemaField(
                {
                    base: new fields.NumberField({ initial: 11, nullable: false }),
                    miscBonus: new fields.NumberField({ initial: 0, nullable: false }),
                },
                { label: "OH.DefenseTypes.Defense" },
            ),
            description: new fields.StringField({ blank: true, required: true }),
            health: new fields.SchemaField({
                ...ValueIsUsedTemplate(),
            }),
            heat: new fields.SchemaField({
                ...ValueIsUsedTemplate(),
            }),
            maxPoints: new fields.NumberField({ initial: 0, nullable: false }),
            melee: new fields.NumberField({ initial: 0, nullable: false }),
            notes: new fields.StringField({ blank: true, required: true }),
            profile: new fields.SchemaField(
                {
                    base: new fields.NumberField({ initial: 6, nullable: false }),
                    miscBonus: new fields.NumberField({ initial: 0, nullable: false }),
                },
                { label: "OH.DefenseTypes.Profile" },
            ),
            saves: new fields.SchemaField({
                grit: new fields.StringField(),
                awareness: new fields.StringField(),
                morale: new fields.StringField(),
            }),
            shield: new fields.SchemaField({
                ...ValueIsUsedTemplate(),
            }),
            power: new fields.SchemaField({
                ...ValueIsUsedTemplate(),
            }),
            speed: new fields.NumberField({ initial: 0, nullable: false }),
            stance: new LocalEffectField({ type: "stance" }),
        };
    }

    /** @override */
    prepareBaseData() {
        // Initialize `stanceBonus` fields which are derived from active effects.
        this.profile.stanceBonus = 0;
        this.defense.stanceBonus = 0;
    }

    /** @override */
    prepareDerivedData() {
        const actor = this.parent;

        // Profile/Defense totals
        this.profile.total = this.profile.base + this.profile.stanceBonus + this.profile.miscBonus;
        this.defense.total = this.defense.base + this.defense.stanceBonus + this.melee + this.defense.miscBonus;

        // Armor Total
        this.armor = actor.itemTypes.armor.reduce(
            (acc, item) => {
                for (const armorBonus of item.system.armorBonuses) {
                    if (armorBonus.armorType === "all") {
                        for (const armorType of Object.keys(outerheaven.config.armorTypes)) {
                            acc[armorType] += armorBonus.value;
                        }
                    } else acc[armorBonus.armorType] += armorBonus.value;
                }
                return acc;
            },
            Object.fromEntries(Object.keys(outerheaven.config.armorTypes).map((key) => [key, 0])),
        );

        // Points
        const baseUnitPoints = this.baseUnitPointsIgnore ? 0 : this.baseUnitPoints;
        const pointsTotal = actor.items.reduce((acc, item) => {
            if (!item.system.ignoreCost) {
                acc += item.system.pointCost ?? 0;
            }
            return acc;
        }, baseUnitPoints);
        this.totalPoints = pointsTotal;
    }
}
