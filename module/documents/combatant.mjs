import { SYSTEM } from "../const.mjs";
import { CombatantData } from "../data/combatant.mjs";

export class OHCombatant extends Combatant {
    /** @override */
    async _preUpdate(data, options, user) {
        await super._preUpdate(data, options, user);

        if (foundry.utils.hasProperty(data, `flags.${SYSTEM.ID}`)) {
            foundry.utils.setProperty(
                data,
                `flags.${SYSTEM.ID}`,
                this.system.updateSource(data.flags[SYSTEM.ID], { dryRun: true }),
            );
        }
    }

    /** @override */
    _onUpdate(data, options, userId) {
        super._onUpdate(data, options, userId);

        // Also redraw effects when the combatant is marked as done
        if (foundry.utils.hasProperty(data, `flags.${SYSTEM.ID}.done`)) {
            this.token?.object?.drawEffects();
        }
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.system = new CombatantData(this.flags[SYSTEM.ID] ?? {}, { parent: this });
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();

        if (this.system.team) {
            // Set combatant's initiative to the team's sort value
            this.initiative = this.system.team.sort;
        } else {
            this.initiative = 0;
        }
    }

    /**
     * Toggle the `Done` state of the combatant.
     *
     * @param {boolean | null} [state=null] - The target state to set. If `null`, the state is toggled.
     * @returns {Promise<Combatant>}
     */
    async toggleDone(state = null) {
        if (!this.combat.team?.combatants.includes(this)) return this;
        const targetState = state !== null ? state : !this.system.done;
        return this.update({ [`flags.${SYSTEM.ID}.done`]: targetState });
    }
}
