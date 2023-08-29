import * as Dice from "../dice.js";

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

    async useWeapon(ActorData) {
        await Dice.UseWeapon({ actorData: ActorData, weaponData: this });
    }
}
