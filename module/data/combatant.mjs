import { TeamIdField } from "./fields/teamid.mjs";

/**
 * System-specific data for a {@link Combatant}; stored in the combatant's `flags`, available as `combatant.system`.
 */
export class CombatantData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            team: new TeamIdField({ required: true }),
            done: new fields.BooleanField({ required: true, default: false }),
        };
    }
}
