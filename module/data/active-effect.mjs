export class ActiveEffectModel extends foundry.abstract.DataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            type: new fields.StringField({ nullable: true, blank: true, choices: outerheaven.config.effectTypes }),
        };
    }
}
