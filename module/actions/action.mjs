/**
 * The base class for actions in the Outer Heaven system.
 *
 * @abstract
 */
export class OuterHeavenAction {
    /**
     * The action type, used to identify the action from a chat message.
     */
    static ACTION_TYPE = "";

    /**
     * The template used to render the chat message's content.
     */
    static TEMPLATE = "";

    /**
     * Results of this action affecting other documents.
     *
     * @type {foundry.utils.Collection<object>}
     */
    results = new foundry.utils.Collection();

    /**
     * The flags with which the chat message will be created.
     */
    _messageFlags = { outerheaven: {} };

    /**
     * Data used to render the content template for the chat message.
     */
    _renderData = {};

    /**
     * Data used to update the actor and its embedded documents after the action is used.
     * These updates are applied in {@link _applyUpdates}, and they are applied without further confirmation by the user.
     *
     * @type {{ actor: object, items: object[], effects: object[] }}
     */
    _updateData = { actor: {}, items: [], effects: [] };

    /**
     * @param {object} data - The data used to construct the action
     * @param {OHActor} data.actor - The actor using the action
     * @param {OHItem} data.item - The item being used
     * @param {TokenDocument} [data.token] - The specific token from which the action is triggered
     */
    constructor({ actor, item, token } = {}) {
        /**
         * The item being used
         *
         * @type {OHItem}
         */
        this.item = item;

        /**
         * The actor using the action
         *
         * @type {OHActor}
         */
        this.actor = actor ?? item.actor;

        /**
         * The specific token from which the action is triggered, if any
         *
         * @type {TokenDocument | undefined}
         */
        this.token =
            (token instanceof Token ? token.document : token) ?? this.actor.token ?? this.actor.getActiveTokens()[0];

        this._messageFlags.outerheaven.actionType = this.constructor.ACTION_TYPE;
        this._messageFlags.outerheaven.itemId = item.uuid;
        this._messageFlags.outerheaven.actorId = actor.uuid;
        this._messageFlags.outerheaven.tokenId = this.token.uuid;
    }

    /**
     * Reconstruct an Action instance from a chat message.
     * The method on this class only delegates the construction to the appropriate subclass,
     * which is expected to implement this method and enrich the action with the data from the message.
     *
     * @param {ChatMessage} message
     * @returns {OuterHeavenAction}
     */
    static fromMessage(message) {
        let actor, item, token;
        const { actorId, itemId, tokenId, actionType } = message.flags.outerheaven;
        const cls = outerheaven.config.ACTIONS[actionType];
        if (actorId) actor = fromUuidSync(actorId);
        if (itemId) item = fromUuidSync(itemId);
        if (tokenId) token = fromUuidSync(tokenId);

        if (!(actionType && actor && item && cls)) {
            throw new Error(`Could not reconstruct action from message ${message.id}`);
        }

        return cls.fromData({ actor, item, token });
    }

    /**
     * A convenience getter to retrieve the update data to be applied to this action's actor.
     *
     * @see {@link _updateData.actor}
     */
    get actorUpdate() {
        return this._updateData.actor;
    }

    /**
     * A convenience getter to retrieve the update data to be applied to this action's item.
     * If no such update exists yet, it will be created.
     *
     * @see {@link _updateData.items}
     * @returns {object}
     */
    get itemUpdate() {
        const itemUpdate = this._updateData.items.find((update) => update._id === this.item._id);
        if (itemUpdate) return itemUpdate;
        else {
            const itemUpdate = {
                _id: this.item._id,
            };
            this._updateData.items.push(itemUpdate);
            return itemUpdate;
        }
    }

    /**
     * A convenience getter to the `outerheaven` flags of the chat message.
     *
     * @see {@link _messageFlags.outerheaven}
     * @returns {object}
     */
    get ohFlags() {
        return this._messageFlags.outerheaven;
    }

    static async use({ actor, item, token, ...options } = {}) {
        return new this({ actor, item, token }).use(options);
    }

    /**
     * The entry point for using this action.
     * Each action must implement this method.
     *
     * @param {object} [options]
     * @param {boolean} [options.chatMessage=true] - Whether to create a chat message for the action
     * @param {boolean} [options.updateDocuments=true] - Whether to update the actor and item documents
     * @param {object} [options.chatMessageOptions] - Options to pass to the chat message creation method
     * @returns {Promise<ChatMessage | undefined>} The created chat message, if any
     */
    async use({ chatMessage = true, updateDocuments = true, chatMessageOptions, ...options } = {}) {
        // Run the action's own inner logic.
        await this._use(options);

        // Run common CRUD logic.
        if (updateDocuments) await this._applyUpdates();
        if (chatMessage) return this.toMessage(chatMessageOptions);
    }

    /**
     * This action's own inner logic, handling the specifics of the action.
     *
     * @abstract
     * @protected
     * @param {object} [options] - Options specific to this action, passed from {@link use}
     * @returns {Promise<void>}
     */
    async _use(options) {}

    /**
     * Apply updates to this action's actor and item documents.
     *
     * @protected
     * @returns {Promise<void>}
     */
    async _applyUpdates() {
        if (!foundry.utils.isEmpty(this.actorUpdate)) await this.actor.update(this.actorUpdate);

        if (this._updateData.items.length > 0) {
            await this.actor.updateEmbeddedDocuments("Item", this._updateData.items);
        }

        if (this._updateData.effects.length > 0) {
            const { toCreate, toDelete, toUpdate } = this._updateData.effects.reduce((acc, effect) => {
                if (effect._id?.startsWith("-=")) acc.toDelete.push(effect);
                else if (this.actor.effect.has(effect._id)) acc.toUpdate.push(effect);
                else acc.toCreate.push(effect);

                return acc;
            }, {});
            if (toCreate.length > 0) await this.actor.createEmbeddedDocuments("ActiveEffect", toCreate);
            if (toDelete.length > 0)
                await this.actor.deleteEmbeddedDocuments(
                    "ActiveEffect",
                    toDelete.map((e) => e._id.slice(2)),
                );
            if (toUpdate.length > 0) await this.actor.updateEmbeddedDocuments("ActiveEffect", toUpdate);
        }
    }

    /**
     * Create a chat message for this action.
     *
     * @param {object} [options] - Options affecting the chat message, passed to {@link ChatMessage.create}
     * @param {string} [options.rollMode] - The roll mode to use for the message
     * @param {boolean} [options.temporary=false] - Whether to create a temporary message
     * @param {object} [options.renderData] - Extra data to pass to the chat message's content template
     * @param {object} [options.chatData] - Extra data to pass to the chat message's creation method
     * @returns {Promise<ChatMessage | undefined>} The created chat message, if any
     */
    async toMessage({ rollMode, temporary = false, renderData = {}, chatData = {}, ...options } = {}) {
        rollMode ??= game.settings.get("core", "rollMode");

        const content = await renderTemplate(this.constructor.TEMPLATE, {
            actor: this.actor,
            item: this.item,
            config: outerheaven.config,
            ...this._renderData,
            ...renderData,
        });
        const speaker = ChatMessage.getSpeaker({ actor: this.actor, token: this.token });
        const fullChatData = { rollMode, speaker, content, flags: this._messageFlags, ...chatData };
        ChatMessage.implementation.applyRollMode(fullChatData, rollMode);

        return temporary
            ? new ChatMessage.implementation(fullChatData)
            : ChatMessage.create(fullChatData, { ...options, rollMode });
    }
}

/**
 * @typedef {object} ActionUseOptions
 * @property {boolean} [chatMessage=true] - Whether to create a chat message for the action
 * @property {boolean} [updateDocuments=true] - Whether to update the actor and item documents
 * @property {object} [chatMessageOptions] - Options to pass to the chat message creation method
 * @property {string} [rollMode] - The roll mode to use for the message
 */

/**
 * @typedef {ActionUseOptions} StaticActionUseOptions
 * @property {OHItem} item - The item being used
 * @property {OHActor} [actor] - The actor using the action
 * @property {TokenDocument} [token] - The specific token from which the action is triggered
 */
