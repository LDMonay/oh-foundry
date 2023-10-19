export class OHItem extends Item {
    static displayTemplate = {
        equipment: "systems/outerheaven/templates/chat/item-display.hbs",
        ability: "systems/outerheaven/templates/chat/item-display.hbs",
        armor: "systems/outerheaven/templates/chat/defense-display.hbs",
        skill: "systems/outerheaven/templates/chat/defense-display.hbs",
        weapon: "systems/outerheaven/templates/chat/weapon-display.hbs",
    };

    /**
     * Prepare a data object which is passed to any Roll formulas which are created related to this Item
     */
    getRollData() {
        // If present, return the actor's roll data.
        if (!this.actor) return null;
        const rollData = this.actor.getRollData();
        // Grab the item's data as well.
        rollData.item = foundry.utils.deepClone(this);

        return rollData;
    }

    async displayInChat() {
        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get("core", "rollMode");

        // Retrieve roll data.
        const rollData = this.getRollData();
        rollData.description = await TextEditor.enrichHTML(this.system.description, {
            rollData,
            relativeTo: this.actor,
            async: true,
        });
        const rollContent = await renderTemplate(this.constructor.displayTemplate[this.type], rollData);

        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            content: rollContent,
        });
    }

    /**
     * Use this item.
     *
     * @param {object} options - Options which configure how the item is used.
     * @param {TokenDocument} [options.token] - The specific token that is using this item.
     * @param {boolean} [options.createMessage=true] - Whether to create a chat message for this item.
     * @returns {Promise<ChatMessage>} - The created chat message, if any.
     */
    async use(options = {}) {
        const { token, ...otherOptions } = options;
        if (this.type === "weapon")
            return outerheaven.config.ACTIONS.attack.use({ actor: this.actor, ...otherOptions, item: this });
    }

    /**
     * Whether this item can currently be reloaded.
     *
     * @type {boolean}
     */
    get canReload() {
        if (this.type !== "weapon") return false;
        if (this.system.capacity.max > 0 && this.system.capacity.value < this.system.capacity.max) return true;
        return false;
    }

    /**
     * Reload this item (if it is a weapon).
     *
     * @param {object} options - Options which configure how the item is reloaded. See {@link ItemReloadAction.use}.
     * @returns {Promise<ChatMessage>} - The created chat message, if any.
     */
    async reload(options) {
        return outerheaven.config.ACTIONS.reload.use({ actor: this.actor, ...options, item: this });
    }
}
