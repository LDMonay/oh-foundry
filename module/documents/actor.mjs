import { OUTERHEAVEN } from "../config.mjs";

export class OHActor extends Actor {
    /** @override */
    prepareDerivedData() {
        const actorData = this;
        const systemData = actorData.system;

        // Armor Total
        systemData.armor = this.itemTypes.armor.reduce(
            (acc, item) => {
                for (const armorBonus of item.system.armorBonuses) {
                    acc[armorBonus.armorType] += armorBonus.value;
                }
                return acc;
            },
            Object.fromEntries(Object.keys(OUTERHEAVEN.damageTypes).map((key) => [key, 0])),
        );

        // Points
        const baseUnitPoints = systemData.baseUnitPointsIgnore ? 0 : systemData.baseUnitPoints;
        const pointsTotal = this.items.reduce((acc, item) => {
            if (!item.system.ignoreCost) {
                acc += item.system.pointCost;
            }
            return acc;
        }, baseUnitPoints);
        systemData.totalPoints = pointsTotal;
    }

    async _onDisplayDefenses() {
        const actor = this;

        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker({ actor: actor });
        const rollMode = game.settings.get("core", "rollMode");

        // Retrieve roll data.
        const rollData = this; // TODO: Use rollData/model
        const rollContent = await renderTemplate(
            "systems/outerheaven/templates/chat/defense-stats-display.hbs",
            rollData,
        );

        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            content: rollContent,
        });
    }
}
