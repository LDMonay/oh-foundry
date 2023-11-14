import { Team } from "../combat.mjs";
import { LocalDocumentField } from "./local-document.mjs";

/**
 * A field that stores a {@link Team}'s id and initializes to the {@link Team} itself.
 */
export class TeamIdField extends LocalDocumentField {
    constructor(options = {}) {
        super(Team, options);
    }

    /** @override */
    initialize(value, model, options = {}) {
        if (this.idOnly) return value;
        // Get the team from the combat's `system.teams` collection.
        const teams = model.parent?.combat?.system.teams;
        return () => teams?.get(value) ?? null;
    }
}
