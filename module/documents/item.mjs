import { OUTERHEAVEN } from "../config.mjs";
import { SYSTEM } from "../const.mjs";

export class OHItem extends Item {
    static displayTemplate = {
        equipment: "systems/outerheaven/templates/chat/item-display.hbs",
        ability: "systems/outerheaven/templates/chat/item-display.hbs",
        armor: "systems/outerheaven/templates/chat/defense-display.hbs",
        skill: "systems/outerheaven/templates/chat/defense-display.hbs",
        weapon: "systems/outerheaven/templates/chat/weapon-display.hbs",
    };

    /**
     * Create a macro from an Item drop, unless an identical macro already exists, and assign it to a hotbar slot.
     *
     * @param {Object} data     The dropped data
     * @param {number} slot     The hotbar slot to use
     * @returns {Promise<User | void>} The updated User after creating or moving the macro
     */
    static async createMacro(data, slot) {
        const item = await this.fromDropData(data);
        if (!item.isOwned) {
            ui.notifications.warn(game.i18n.localize("OH.Notifications.ItemMacroOnlyOwned"));
            return;
        }

        // Create the macro command using the uuid.
        const action = data.action ?? "";
        const actionCls = OUTERHEAVEN.ACTIONS[action];
        let name = `${item.name}`;
        if (actionCls) name += ` (${game.i18n.localize(actionCls.LABEL)})`;

        const command = `fromUuidSync("${item.uuid}").use({ action: "${action}" })`;
        let macro = game.macros.find((m) => m.name === name && m.command === command);
        if (!macro) {
            macro = await Macro.create({
                name: name,
                type: "script",
                img: item.img,
                command: command,
                flags: {
                    [`${SYSTEM.ID}`]: {
                        itemMacro: true,
                        action: action,
                    },
                },
            });
        }
        return game.user.assignHotbarMacro(macro, slot);
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Prevent the creation of `form` type items if the actor already has one.
        if (this.type === "form" && this.actor?.form) return false;
    }

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
        const { action, token, ...otherOptions } = options;

        // Determine action through options, or default to a sensible action for the item type.
        let actionClass;
        if (action) actionClass = OUTERHEAVEN.ACTIONS[action];
        else {
            switch (this.type) {
                case "weapon":
                    actionClass = OUTERHEAVEN.ACTIONS.attack;
                    break;

                case "ability":
                case "equipment":
                    actionClass = OUTERHEAVEN.ACTIONS.itemUse;
                    break;
            }
        }

        if (!actionClass) throw new Error(`Unknown action type: ${action}`);

        return actionClass.use({ actor: this.actor, token, ...otherOptions, item: this });
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
