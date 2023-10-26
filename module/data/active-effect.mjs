/**
 * The `DataModel` used for the system's ActiveEffect data.
 * In lieu of a dedicated `system` space, this is stored in `flags.outerheaven`, but made available as `system`.
 */
export class ActiveEffectModel extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            /** The effect type demanding special treatment by the system; can be blank to use the default behavior. */
            type: new fields.StringField({ nullable: true, blank: true, choices: outerheaven.config.effectTypes }),
        };
    }
}
