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
            defense: new fields.SchemaField({
                base: new fields.NumberField({ initial: 11, nullable: false }),
                miscBonus: new fields.NumberField({ initial: 0, nullable: false }),
                stanceBonus: new fields.NumberField({ initial: 0, nullable: false }),
            }),
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
            profile: new fields.SchemaField({
                base: new fields.NumberField({ initial: 6, nullable: false }),
                miscBonus: new fields.NumberField({ initial: 0, nullable: false }),
                stanceBonus: new fields.NumberField({ initial: 0, nullable: false }),
            }),
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
        };
    }

    /** @override */
    prepareDerivedData() {
        this.profile.total = this.profile.base + this.profile.stanceBonus + this.profile.miscBonus;
        this.defense.total = this.defense.base + this.defense.stanceBonus + this.melee + this.defense.miscBonus;
    }
}
