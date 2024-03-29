import { SYSTEM } from "../const.mjs";
import { Team } from "../data/combat.mjs";
import { generateId } from "../utils.mjs";

/**
 * An application responsible for configuring teams, either for a specific combat or for the default teams setting.
 */
export class TeamsConfig extends FormApplication {
    /**
     * @param {Combat | Teams[] | undefined} object - The combat to configure teams for, or undefined to configure the default teams.
     * @param {object} options - The application options.
     */
    constructor(object, options) {
        const combat = object instanceof Combat ? object : null;
        /** @type {object[]} */
        const rawTeams = combat
            ? combat.system.toObject().teams
            : game.settings.get(SYSTEM.ID, "defaultTeams").map((team) => team.toObject());
        const teams = rawTeams.map((team) => new Team(team, { parent: combat }));
        super(teams, options);
        this.combat = combat;
    }

    /** @override */
    static get defaultOptions() {
        const options = super.defaultOptions;
        return {
            ...options,
            id: `${SYSTEM.ID}-teams-config`,
            classes: [...options.classes, SYSTEM.ID, "teams-config"],
            template: `systems/${SYSTEM.ID}/templates/applications/teams-config.hbs`,
            tabs: [{ navSelector: ".tabs", contentSelector: ".content" }],
            dragDrop: [{ dragSelector: ".team", dropSelector: ".tabs" }],
            width: 600,
            height: "auto",
            submitOnChange: true,
            closeOnSubmit: false,
        };
    }

    /** @override */
    get id() {
        const parts = [super.id];
        if (this.combat) parts.push(this.combat.uuid.replace(/\./g, "-"));
        return parts.join("-");
    }

    /** @override */
    get title() {
        if (this.combat) return game.i18n.localize("OH.Settings.TeamsConfig.TitleCombat");
        else return game.i18n.localize("OH.Settings.TeamsConfig.TitleSettings");
    }

    /** @override */
    async getData(options = {}) {
        const context = await super.getData(options);
        context.teams = Object.fromEntries(this.object.map((team) => [team.id, team]));
        return context;
    }

    /** @override */
    async _updateObject(_event, formData) {
        const formTeams = foundry.utils.expandObject(formData);
        for (const [id, teamData] of Object.entries(formTeams)) {
            const team = this.object.find((t) => t.id === id);
            if (team) team.updateSource(teamData);
        }
        this.#sortTeams();
        this.render();
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find("[data-action=add]").on("click", this._onAddTeam.bind(this));
        html.find("[data-action=remove]").on("click", this._onRemoveTeam.bind(this));
        html.find("[data-action=save]").on("click", this._onSaveTeams.bind(this));
    }

    /**
     * Add a new team to the in-memory array without saving it to the database.
     *
     * @param {Event} event
     * @returns {void}
     */
    _onAddTeam(event) {
        event.preventDefault();
        const name = game.i18n.localize("OH.Settings.TeamsConfig.NewTeam");
        this.object.push(
            new Team({
                _id: generateId(name, { siblings: this.object }),
                sort: this.object.length + 2,
                name,
            }),
        );
        this.#sortTeams();
        this.render();
    }

    /**
     * Remove a team from the in-memory array without saving it to the database.
     *
     * @param {Event} event
     * @returns {void}
     */
    _onRemoveTeam(event) {
        event.preventDefault();
        event.stopPropagation();
        const id = event.currentTarget.closest(".team").dataset.tab;
        this.object.findSplice((team) => team.id === id);
        this.#sortTeams();
        this.render();
    }

    /**
     * Sort teams by their `sort` and update that value to match their resulting position.
     * @private
     */
    #sortTeams() {
        this.object.sort((a, b) => a.sort - b.sort);
        this.object.forEach((team, index) => team.updateSource({ sort: index + 1 }));
    }

    /**
     * Submit the current form and save the teams to the database, updating either a combat or the default teams.
     *
     * @param {Event} event
     * @returns {Promise<void>}
     */
    async _onSaveTeams(event) {
        event.preventDefault();
        await this.submit();
        const teams = this.object.map((team) => team.toObject());

        if (this.combat) {
            await this.combat.update({ [`flags.${SYSTEM.ID}.teams`]: teams });
            this.combat.render();
        } else {
            await game.settings.set(SYSTEM.ID, "defaultTeams", teams);
        }

        this.close();
    }

    /** @override */
    _onDragStart(event) {
        const li = event.currentTarget.closest(".team");
        const team = this.object.find((t) => t.id === li.dataset.tab);
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Team", teamId: team.id }));
        event.dataTransfer.dropEffect = "move";
    }

    /**
     * Handle dropping a team in the nav menu to change its sort order.
     *
     * @override
     */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        if (data.type !== "Team") return;

        const source = this.object.find((t) => t.id === data.teamId);
        const dropTarget = event.target.closest(".team");
        if (!dropTarget) return;
        const target = this.object.find((t) => t.id === dropTarget.dataset.tab);

        const sorted = this.object.sort((a, b) => a.sort - b.sort);
        const targetIndex = sorted.indexOf(target);
        sorted.splice(sorted.indexOf(source), 1);
        sorted.splice(targetIndex, 0, source);
        this.object.forEach((team, index) => team.updateSource({ sort: index + 1 }));

        this.render();
    }
}
