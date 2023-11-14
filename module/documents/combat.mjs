import { hasProperty } from "../../common/utils/helpers.mjs";
import { TeamsConfig } from "../applications/teams-config.mjs";
import { SYSTEM_ID } from "../const.mjs";
import { CombatData, Team } from "../data/combat.mjs";
import { generateId } from "../utils.mjs";

/**
 * Extended version of the core {@link Combat} class, adding support for the system's team-based initiative.
 *
 * @augments {Combat}
 */
export class OHCombat extends Combat {
    /**
     * The currently active team, if any.
     *
     * @type {TeamModel | null}
     */
    get team() {
        return this.system.teams.find((t) => t.sort === this.turn);
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Add default teams if the combat is not created with any
        if (!hasProperty(data, `flags.${SYSTEM_ID}.teams`)) {
            /** @type {object[]} */
            const teamsData = game.settings.get(SYSTEM_ID, "defaultTeams").map((team) => team.toObject());
            const teams = teamsData.reduce((teams, team, index) => {
                teams.push({
                    ...team,
                    sort: index + 1,
                    _id: generateId(team.name, { siblings: teams }),
                });
                return teams;
            }, []);
            this.updateSource({ [`flags.${SYSTEM_ID}.teams`]: teams });
        }
    }

    /** @override */
    async _preUpdate(data, options, user) {
        await super._preUpdate(data, options, user);

        if (foundry.utils.hasProperty(data, `flags.${SYSTEM_ID}`)) {
            // Clean and validate `flags.outerheaven` before updating
            foundry.utils.setProperty(
                data,
                `flags.${SYSTEM_ID}`,
                this.system.updateSource(data.flags[SYSTEM_ID], { dryRun: true }),
            );
        }
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        // Initialize a pseudo-system space to enable DataModel validation
        this.system = new CombatData(this.flags[SYSTEM_ID] ?? {}, { parent: this });
    }

    /** @override */
    _onUpdate(data, options, userId) {
        // NOTE: This can lead to duplicate _manageTurnEvents calls; overriding the core implementation completely might be required
        super._onUpdate(data, options, userId);

        // Core only cares about combatants, but the system attaches the setup to teams instead
        if (foundry.utils.hasProperty(data, `flags.${SYSTEM_ID}.teams`)) {
            const team = this.teamTurns.find((t) => t.sort === this.turn)?.id;
            this.setupTurns();
            const adjustedTurn = team ? this.system.teams.get(team).sort : undefined;
            if (options.turnEvents !== false) this._manageTurnEvents(adjustedTurn);
        } else {
            this.current.team = this.team;
        }
    }

    /** @override */
    _onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId) {
        if (options.render === false) return;
        this.render(false, { renderContext: `update.${collection}` });

        // NOTE: This removes the core handling to keep the same combatant active, which is not needed for OH,
        //       where combatants do not matter for turn handling – teams do.
        //       This avoids forcibly setting `turn` to some combatant index (possibly resulting in an invalid team index).
        this.setupTurns();

        if (this.active && options.render !== false) this.collection.render();
    }

    /** @override */
    async nextTurn() {
        const turn = this.turn ?? -1;
        const skip = this.settings.skipDefeated;

        let next = null;
        if (skip) {
            for (const team of this.teamTurns) {
                if (team.sort <= turn) continue;
                if (team.isDefeated) continue;
                next = team.sort;
                break;
            }
        } else next = turn + 1;

        const round = this.round;
        if (this.round === 0 || next === null || next > this.teamTurns.length) {
            return this.nextRound();
        }

        const updateData = { round, turn: next };
        const updateOptions = { advanceTime: CONFIG.time.turnTime, direction: 1 };
        Hooks.callAll("combatTurn", this, updateData, updateOptions);
        await this.resetDone();
        return this.update(updateData, updateOptions);
    }

    /**
     * Advance the combat to the next round.
     * This overrides the core implementation to use teams instead of combatants.
     *
     * @override
     * @returns {Promise<OHCombat>} The updated Combat document.
     */
    async nextRound() {
        let turn = this.turn === null ? null : 0; // Preserve the fact that it's no-one's turn currently.
        if (turn === 0 && this.system.teams.size) turn = 1;

        if (this.settings.skipDefeated && turn !== null) {
            turn = this.teamTurns.find((team) => !team.isDefeated)?.sort ?? -1;
            if (turn === -1) {
                ui.notifications.warn("COMBAT.NoneRemaining", { localize: true });
                turn = 0;
            }
        }

        let advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
        advanceTime += CONFIG.time.roundTime;
        const nextRound = this.round + 1;

        // Update the document, passing data through a hook first
        const updateData = { round: nextRound, turn };
        const updateOptions = { advanceTime, direction: 1 };
        Hooks.callAll("combatRound", this, updateData, updateOptions);
        await this.resetDone();
        return this.update(updateData, updateOptions);
    }

    /**
     * Reset all combatants' done state, updating their flags.
     *
     * @param {string[]} [ids] The IDs of combatants to reset. If not given, all combatants are reset.
     * @returns {Promise<Combatant[]>} The updated Combatant documents.
     */
    async resetDone(ids = [], options = { render: false, turnEvents: false }) {
        const combatants = ids.length ? this.combatants.filter((c) => ids.includes(c.id)) : this.combatants;
        const updates = combatants.map((c) => ({ _id: c.id, [`flags.${SYSTEM_ID}.done`]: false }));
        return this.updateEmbeddedDocuments("Combatant", updates, options);
    }

    /** @override */
    setupTurns() {
        // Run default setup to keep core API TODO: Check whether actually useful
        const result = super.setupTurns();

        /** @type {Team[]} */
        const teamTurns = (this.teamTurns = this.system.teams.contents.sort((a, b) => a.sort - b.sort));
        if (this.turn !== null) this.turn = Math.clamped(this.turn, 1, teamTurns.length);

        const currentTeam = teamTurns[this.turn];
        this.current.team = currentTeam;

        return result;
    }

    /**
     * Open the teams configuration to enable editing this combat's teams.
     *
     * @protected
     * @returns {void}
     */
    configureTeams() {
        new TeamsConfig(this).render(true);
    }
}
