import { SYSTEM } from "../const.mjs";
import { CollectionField } from "./fields/collection.mjs";

/**
 * System-specific data for a {@link Combat}; stored in the combat's `flags`, available as `combat.system`.
 *
 * @property {Collection<Team>} teams         - The teams participating in this combat.
 */
export class CombatData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            teams: new CollectionField(new fields.EmbeddedDataField(Team)),
        };
    }
}

/**
 * A team of combatants, grouping them together for initiative and display purposes.
 *
 * @augments {DataModel}
 * @property {string} id            - The team's unique ID.
 * @property {string} name          - The team's name, displayed in the combat tracker.
 * @property {string} color         - The team's color, used as border/background in the combat tracker.
 * @property {number} sort          - The team's sort order, simultaneously used as initiative value for the team/its combatants.
 */
export class Team extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            _id: new fields.StringField({ required: true, blank: false, readonly: true }),
            name: new fields.StringField({ required: true, blank: false, nullable: false }),
            color: new fields.ColorField({ required: true, initial: "#00000000" }),
            sort: new fields.IntegerSortField(),
        };
    }

    /** @type {string} */
    get id() {
        return this._id;
    }

    /**
     * The {@link Combat} this team belongs to.
     *
     * @type {Combat | null}
     */
    get combat() {
        return this.parent?.parent ?? null;
    }

    /**
     * The {@link Combatant}s belonging to this team.
     *
     * @type {Combatant[]}
     */
    get combatants() {
        return this.combat?.combatants.filter((c) => c.flags[SYSTEM.ID]?.team === this.id) ?? [];
    }

    /**
     * Whether all combatants in this team are defeated.
     *
     * @type {boolean}
     */
    get isDefeated() {
        return this.combatants?.every((c) => c.isDefeated);
    }
}
