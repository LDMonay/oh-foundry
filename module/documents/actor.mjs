import { OHArmor } from "../data/armor.mjs";

export class OHActor extends Actor {
    /**
     * The actor's `form` type item, if any.
     *
     * @type {OHItem | null}
     */
    get form() {
        return this.items.find((item) => item.type === "form") ?? null;
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
     * @param {number | DamageInstance} damageValue - The amount of damage to apply.
     *   If only a number is given, damage type is assumed to be `untyped`, and `isFinal` is assumed to be true.
     * @param {OHActor | OHActor[] | null} target - The actor(s) to apply damage to. If null, all selected token actors are used.
     * @returns {Promise<OHActor[]>} - The updated actors.
     */
    static async applyDamage(damageValue, target = null) {
        const rawTargets =
            target === null ? canvas.tokens.controlled.map((t) => t.actor) : Array.isArray(target) ? target : [target];
        const targets = [...new Set(rawTargets.filter((t) => Boolean(t)))];
        const damageDefaults = { total: 0, type: "untyped", numberOfAttacks: 1, armorPenetration: 0, isFinal: false };
        /** @type {DamageInstance} */
        const damage =
            typeof damageValue === "number"
                ? { ...damageDefaults, total: damageValue, isFinal: true }
                : { ...damageDefaults, ...damageValue };
        const updatePromises = targets.map((target) => {
            const { total, type, numberOfAttacks, armorPenetration, isFinal } = damage;

            // If the damage is final, skip armor handling and apply damage as-is
            if (isFinal) {
                return target.update({ "system.health.value": Math.max(target.system.health.value - total, 0) });
            }

            const armor = target.system.armor[type] ?? 0;
            const damageReduction = Math.max((armor - armorPenetration) * numberOfAttacks, 0);
            const damageTaken = Math.max(total - damageReduction, numberOfAttacks);
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
     * @param {number | DamageInstance} damageValue - The amount of damage to apply.
     * @returns {Promise<OHActor>} - The updated actor.
     */
    async applyDamage(damage) {
        const result = await this.constructor.applyDamage(damage, this);
        return result[0];
    }
}
