import { OUTERHEAVEN } from "../config.mjs";
import { WeaponAttack } from "../weapon-attack.mjs";

export class OHItem extends Item {
    displayTemplate = {
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
        const rollContent = await renderTemplate(this.displayTemplate[this.type], rollData);

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
        if (this.type === "weapon") return new WeaponAttack(token ?? this.actor, this).use(otherOptions);
    }
}
