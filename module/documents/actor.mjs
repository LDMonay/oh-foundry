import { OUTERHEAVEN } from "../config.mjs";
import { OHArmor } from "../data/armor.mjs";

export class OHActor extends Actor {
    /** @override */
    prepareDerivedData() {
        const actorData = this;
        const systemData = actorData.system;

        // Armor Total
        systemData.armor = this.itemTypes.armor.reduce(
            (acc, item) => {
                for (const armorBonus of item.system.armorBonuses) {
                    if (armorBonus.armorType === "all") {
                        for (const armorType of Object.keys(OUTERHEAVEN.armorTypes)) {
                            acc[armorType] += armorBonus.value;
                        }
                    } else acc[armorBonus.armorType] += armorBonus.value;
                }
                return acc;
            },
            Object.fromEntries(Object.keys(OUTERHEAVEN.armorTypes).map((key) => [key, 0])),
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

    /**
     * Display a chat card detailing this actor's defenses.
     *
     * @returns {Promise<ChatMessage>} - The created chat message.
     */
    async displayDefenseCard() {
        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker({ actor: this });
        const rollMode = game.settings.get("core", "rollMode");

        // Retrieve roll data.
        const rollData = { ...this.getRollData(), name: this.name };

        // Collect all armor values, discarding any that are 0 or only exist due to the "all" type.
        rollData.armor = OHArmor.getArmorString(this.system.armor);

        const rollContent = await renderTemplate(
            "systems/outerheaven/templates/chat/defense-stats-display.hbs",
            rollData,
        );

        const chatData = {
            speaker: speaker,
            content: rollContent,
        };
        ChatMessage.implementation.applyRollMode(chatData, rollMode);
        return ChatMessage.create(chatData);
    }

    /**
     * Apply damage to specific actors, or all selected token actors.
     *
     * @param {number | { value: number, type: string }} damageValue - The amount of damage to apply.
     *                                                                 If only a number is given, damage type is assumed to be "true".
     * @param {OHActor | OHActor[] | null} target - The actor(s) to apply damage to. If null, all selected token actors are used.
     * @returns {Promise<OHActor[]>} - The updated actors.
     */
    static async applyDamage(damageValue, target = null) {
        const rawTargets =
            target === null ? canvas.tokens.controlled.map((t) => t.actor) : Array.isArray(target) ? target : [target];
        const targets = [...new Set(rawTargets.filter((t) => Boolean(t)))];
        const damage = typeof damageValue === "number" ? { value: damageValue, type: "true" } : damageValue;
        const updatePromises = targets.map((target) => {
            const armor = target.system.armor;
            const { type, value } = damage;
            const damageReduction = armor[type] ?? 0;
            const damageTaken = Math.max(value - damageReduction, 0);
            const currentHealth = target.system.health.value;
            const newHealth = Math.max(currentHealth - damageTaken, 0);
            return target.update({ "system.health.value": newHealth });
        });
        return Promise.all(updatePromises);
    }

    /**
     * Apply damage to this actor.
     *
     * @see {@link OHActor.applyDamage}
     * @param {number | { value: number, type: string }} damageValue - The amount of damage to apply.
     * @returns {Promise<OHActor>} - The updated actor.
     */
    async applyDamage(damage) {
        const result = await this.constructor.applyDamage(damage, this);
        return result[0];
    }
}
