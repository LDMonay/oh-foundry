import { TeamsConfig } from "../applications/teams-config.mjs";
import { SYSTEM_ID } from "../const.mjs";

export class OHCombatTracker extends CombatTracker {
    /** @override */
    static get defaultOptions() {
        const result = super.defaultOptions;
        result.dragDrop.push({ dragSelector: ".directory-item", dropSelector: ".directory-list" });
        return result;
    }

    /** @override */
    get template() {
        return `systems/${SYSTEM_ID}/templates/sheets/combat-tracker.hbs`;
    }

    /** @override */
    async getData(options) {
        const context = await super.getData(options);

        if (this.viewed) {
            const { teams, teamless } = this.#prepareTeams(context);
            context.teams = teams;
            context.teamless = teamless;
        }

        return context;
    }

    /**
     * Prepares turns (combatants prepared for display) into teams and teamless.
     *
     * @param {object} context - The context object; see {@link getData}.
     * @returns {TeamTurnData} - An object with two properties: teams and teamless.
     */
    #prepareTeams(context) {
        const combat = this.viewed;
        const teams = Object.fromEntries(
            combat?.system.teams.map((team) => [
                team.id,
                {
                    ...team,
                    id: team.id,
                    turns: [],
                },
            ]),
        );
        const teamless = [];

        // Make use of turn data already prepared by core, adjusting and adding where necessary
        for (const turn of context.turns) {
            const combatant = (turn.combatant = combat?.combatants.get(turn.id));
            turn.system = turn.combatant?.system;
            const css = new Set(turn.css.split(" "));
            // Remove active class to ensure it's only set by the system
            css.delete("active");

            turn.done = combatant.system.done ?? false;
            turn.active = combat.started && combat?.turn === combatant.initiative;
            if (turn.active && !turn.done) {
                css.add("active");
                // Add special highlighting for players' combatants requiring attention
                if (!game.user.isGM && turn.owner) css.add("owner");
            }

            // Hide unowned teamless combatants unless the user is a GM
            if (!combatant.system.team && !game.user.isGM && !turn.owner) {
                turn.hidden = true;
                css.add("hidden");
            }

            // Rejoin CSS classes after array modifications
            turn.css = Array.from(css).join(" ");

            const team = combatant?.system.team?.id;
            if (team && teams[team]) {
                teams[team].turns.push(turn);
            } else {
                teamless.push(turn);
            }
        }

        return { teams: Object.values(teams).sort((a, b) => a.sort ?? 0 - b.sort ?? 0), teamless };
    }

    /** @override */
    _onDragStart(event) {
        const li = event.currentTarget.closest("li");
        const { combatantId, teamId } = li.dataset;

        let dragData;

        if (combatantId) {
            const combatant = this.viewed.combatants.get(combatantId);
            dragData = combatant.toDragData();
        } else if (teamId) {
            dragData = { type: "Team", teamId };
        }

        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /** @override */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const combat = this.viewed;
        if (!combat) return;

        switch (data.type) {
            case "Combatant": {
                const combatant = await fromUuid(data.uuid);
                if (combatant.combat !== combat) return;
                const teamLi = event.target.closest(".team");
                const teamId = teamLi?.dataset.teamId;
                const team = combat.system.teams.get(teamId);
                if (team) {
                    combatant.update({ [`flags.${SYSTEM_ID}.team`]: teamId });
                } else {
                    combatant.update({ [`flags.${SYSTEM_ID}.team`]: "" });
                }
                break;
            }
            case "Team": {
                const team = combat.system.teams.get(data.teamId);
                if (!team) return;
                await this._onSortTeams(event, team);

                break;
            }
        }
    }

    _onSortTeams(event, teamData) {
        const teams = this.viewed.system.teams;
        // The team being dragged
        const source = teams.get(teamData._id);
        const dropTarget = event.target.closest(".team");
        if (!dropTarget) return;
        // The team before which the source team should be placed
        const target = teams.get(dropTarget.dataset.teamId);

        // Get array of all teams sorted by sort value; move source to before target
        const sorted = teams.contents.sort((a, b) => a.sort - b.sort);
        const targetIndex = sorted.indexOf(target);
        sorted.splice(sorted.indexOf(source), 1);
        sorted.splice(targetIndex, 0, source);

        const sortedTeamData = sorted.map((team, index) => ({ ...team.toObject(), sort: index + 1 }));
        return this.viewed.update({ [`flags.${SYSTEM_ID}.teams`]: sortedTeamData });
    }

    /** @override */
    async _onCombatantControl(event) {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        const li = button.closest(".combatant");
        const combat = this.viewed;
        const combatant = combat.combatants.get(li.dataset.combatantId);

        if (button.dataset.control === "toggleDone") {
            return combatant.toggleDone();
        } else {
            return super._onCombatantControl(event);
        }
    }
}

/**
 * @typedef {object} TeamTurnData
 * @property {object[]} teamless - Turn data for combatants without a team.
 * @property {object[]} teams - An array of teams, each containing the team's data as well a `turns` array of turn data.
 */
