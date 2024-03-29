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

    async toggleDone(state = null) {
        const targetState = state !== null ? state : !this.system.done;
        return this.update({ [`flags.${SYSTEM.ID}.done`]: targetState });
    }
}
