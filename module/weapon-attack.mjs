import { OUTERHEAVEN } from "./config.mjs";
import { DamageRoll } from "./dice/damage-roll.mjs";
import { OHActor } from "./documents/actor.mjs";
import { OHChatMessage } from "./documents/chat-message.mjs";
import { OHItem } from "./documents/item.mjs";

export class WeaponAttack {
    /**
     * The actor performing the attack.
     *
     * @type {OHActor}
     */
    actor;

    /**
     * The specific token of the actor performing the attack.
     *
     * @type {TokenDocument}
     */
    token;

    /**
     * The weapon being used to perform the attack.
     *
     * @type {OHItem}
     */
    item;

    /**
     * An array of targets of the attack.
     *
     * @type {TokenDocument[]}
     */
    targets;

    /**
     * The attack {@link Roll roll} for this weapon attack.
     *
     * @type {Roll}
     */
    attackRoll;

    /**
     * The damage {@link DamageRoll roll} for this weapon attack.
     *
     * @type {DamageRoll}
     */
    damageRoll;

    /**
     * The results of the attack, keyed by target UUID.
     *
     * @type {foundry.utils.Collection<AttackResult>}
     */
    results = new foundry.utils.Collection();

    /**
     * Data the actor needs to be updated with after the attack.
     *
     * @type {{ [path: string]: unknown }}
     */
    actorUpdate = {};

    /**
     * Data the item needs to be updated with after the attack.
     *
     * @type {{ [path: string]: unknown }[]}
     */
    itemUpdates = [];

    /**
     * A convenience accessor for the item update of the item used in the attack.
     *
     * @type {{ [path: string]: unknown }}
     */
    get itemUpdate() {
        let itemUpdate = this.itemUpdates.find((update) => update._id === this.item.id);
        if (!itemUpdate) {
            itemUpdate = { _id: this.item.id };
            this.itemUpdates.push(itemUpdate);
        }
        return itemUpdate;
    }

    /**
     * Flags that will be added to the chat message.
     * @type {object}
     */
    _messageFlags = { outerheaven: { type: "weaponAttack" } };

    /**
     * Additional data used to render the chat message.
     *
     * @type {{ [key: string]: unknown }}
     */
    _renderData = {};

    /**
     * @param {OHActor | TokenDocument} actor - The actor performing the attack.
     * @param {OHItem} item - The weapon being used to perform the attack.
     */
    constructor(actor, item) {
        if (actor instanceof TokenDocument) {
            this.token = actor;
            this.actor = actor.actor;
        } else if (actor instanceof Actor) {
            this.actor = actor;
            // Use either the token in case of unlinked actors, or fall back to first token for linked ones
            this.token = actor.token ?? actor.getActiveTokens()[0];
        } else {
            throw new Error("Invalid actor provided.");
        }

        this.item = item;

        // Store UUIDs of involved documents in the chat message flags to allow the attack to be reconstructed later.
        this._messageFlags.outerheaven.actorId = this.actor.uuid;
        this._messageFlags.outerheaven.itemId = this.item.uuid;
    }

    /**
     * Reconstruct a weapon attack from a chat message.
     *
     * @param {ChatMessage} message - The chat message to reconstruct the attack from.
     * @returns {WeaponAttack} The reconstructed weapon attack.
     */
    static fromMessage(message) {
        let actor, item;
        const { itemId, results } = message.flags.outerheaven ?? {};

        if (itemId) {
            item = fromUuidSync(itemId);
            actor = item.actor;
        }

        const weaponAttack = new this(actor, item);
        weaponAttack.attackRoll = message.rolls[0];
        weaponAttack.damageRoll = message.rolls[1];
        weaponAttack.results = new foundry.utils.Collection(results.map((result) => [result._id, result]));
        weaponAttack.targets = results.map((result) => fromUuidSync(result._id));
        weaponAttack._messageFlags = message.flags;

        return weaponAttack;
    }

    /**
     * Roll this weapon attack.
     *
     * @param {object} [options={}] - Options for how the attack is rolled.
     * @param {boolean} [options.chatMessage=true] - Whether to create a chat message for the attack.
     * @param {boolean} [options.updateDocuments=true] - Whether to update involved documents after the attack.
     * @returns {Promise<WeaponAttack>} The rolled weapon attack.
     */
    async use({ chatMessage = true, updateDocuments = true, chatMessageOptions = {} } = {}) {
        this.targets = await this._acquireTargets();

        this.attackRoll = await this._rollAttack();
        this.damageRoll = await this._rollDamage();

        for (const target of this.targets) {
            this.results.set(target.uuid, this._evaluateResult(target));
        }

        // Set flag when using weapon without remaining ammo.
        if (this.item.system.capacity.value === 0) this._renderData.noAmmo = true;

        // Update involved documents.
        if (updateDocuments) {
            await this._updateItems();
            await this._updateActor();
        }

        // Create chat message.
        if (chatMessage) this.chatMessage = await this.toMessage(chatMessageOptions);

        return this;
    }

    /**
     * Acquire the targets of the attack.
     * This is currently limited to using the user's current targets.
     * TODO: Expand for template usage.
     *
     * @returns {Promise<void>}
     * @private
     */
    async _acquireTargets() {
        return Array.from(game.user.targets).map((token) => token.document);
    }

    /**
     * Roll the attack {@link Roll roll} for this weapon attack.
     *
     * @returns {Promise<void>}
     * @private
     * @see {@link attackRoll}
     */
    async _rollAttack() {
        const attackParts = ["1d20", `${this.item.system.attackBonus}[Attack Bonus]`];
        if (this.item.system.weaponType == "ranged") {
            attackParts.push(`${this.actor.system.aim}[Aim]`);
        } else if (this.item.system.weaponType == "melee") {
            attackParts.push(`${this.actor.system.melee}[Melee]`);
        }

        const attackRoll = new Roll(attackParts.join(" + "), {});
        return attackRoll.evaluate({ async: true });
    }

    /**
     * Roll the damage {@link DamageRoll roll} for this weapon attack.
     *
     * @returns {Promise<void>}
     * @private
     * @see {@link damageRoll}
     */
    async _rollDamage() {
        const damageFormula = this.item.system.damagePerAttack;
        const attackCount = this.item.system.numberOfAttacks;
        const damageType = this.item.system.damageType;

        const damageRoll = new DamageRoll(damageFormula, {}, { damageType });

        // TODO: Alter single roll, join formula, or create roll pool?
        if (attackCount > 1) {
            damageRoll.alter(attackCount, undefined, { multiplyNumeric: true });
        }
        return damageRoll.evaluate({ async: true });
    }

    /**
     * Evaluate this weapon attack's results.
     * This includes determining whether the attack hits, and how much damage it deals to each target.
     *
     * @see {results}
     * @private
     * @returns {Collection<AttackResult>}
     */
    _evaluateResult(target) {
        /** @type {AttackResult} */
        const result = {
            _id: target.uuid,
        };

        // Basic defense data
        const actor = target.actor;
        const defenseType = this.item.system.weaponType === "ranged" ? "profile" : "defense";
        const defenseValue = actor.system[defenseType].total;
        const defenseLabel = actor.system.schema.fields[defenseType].label;
        result.defense = {
            total: defenseValue,
            formula: `${defenseValue}[${game.i18n.localize(defenseLabel)}]`,
        };

        // Determine effective attack value and hit state
        if (this.item.system.weaponType === "ranged" && this.item.system.range > 0) {
            const attackRange = this.item.system.range ?? 1;
            if (this.token) {
                result.distance = canvas.grid.measureDistance(this.token, target, { gridSpaces: true });
            } else {
                result.distance = 0;
            }
            const distanceOverRange = Math.max(result.distance - attackRange, 0);
            const additionalRangeIncrements = Math.ceil(distanceOverRange / attackRange);
            const rangeModifier = additionalRangeIncrements * 2;
            if (rangeModifier) {
                result.defense.total += rangeModifier;
                result.defense.formula += ` + ${rangeModifier}[${game.i18n.localize("OH.RangeModifier")}]`;
            }
        }
        result.isHit = this.attackRoll.total >= result.defense.total;

        // Determine effective damage
        const { damageType, total: damageValue } = this.damageRoll;
        const armor = actor.system.armor[damageType] ?? 0;
        const { armorPenetration, numberOfAttacks } = this.item.system;
        const damageReduction = Math.max(armor - armorPenetration, 0) * numberOfAttacks;
        const damageTotal = Math.max(damageValue - damageReduction, numberOfAttacks);
        const isMinDamage = damageReduction && damageTotal === numberOfAttacks;
        let damageFormula = `${damageValue}[${game.i18n.localize("OH.Damage")}]`;
        if (damageReduction) {
            const attackLabel = this.item.system.weaponType === "ranged" ? "OH.Shots" : "OH.Strikes";
            damageFormula += ` - (${numberOfAttacks}[${game.i18n.localize(
                attackLabel,
            )}] * ${armor}[${game.i18n.localize("TYPES.Item.armor")}])`;
        }
        result.damage = {
            total: damageTotal,
            formula: damageFormula,
            isMinimum: isMinDamage,
        };

        return result;
    }

    /**
     * Update the actor belonging to this weapon attack with the changes required by the attack,
     * e.g. reducing power.
     *
     * @returns {Promise<OHActor>}
     * @private
     */
    async _updateActor() {
        if (this.item.system.powerCost > 0) {
            this.actorUpdate["system.power.value"] = this.actor.system.power.value - this.item.system.powerCost;
        }
        if (!foundry.utils.isEmpty(this.actorUpdate)) return this.actor.update(this.actorUpdate);
    }

    /**
     * Updates items whose properties were affected by the attack.
     *
     * @returns {Promise<OHItem[]>}
     * @private
     */
    async _updateItems() {
        if (this.item.system.capacity.value > 0) {
            this.itemUpdate["system.capacity.value"] = this.item.system.capacity.value - 1;
        }
        if (this.itemUpdates.length) return this.actor.updateEmbeddedDocuments("Item", this.itemUpdates);
    }

    /**
     * Render the weapon attack as a chat message.
     *
     * @param {object} [options={}] - Options for how the message is created.
     * @param {string} [options.rollMode] - The roll mode to use for the message.
     * @param {boolean} [options.temporary] - Whether to create a temporary message.
     * @returns {Promise<OHChatMessage>}
     */
    async toMessage({ temporary = false, rollMode, ...options } = {}) {
        const speaker = ChatMessage.getSpeaker({ actor: this.actor, token: this.token });
        rollMode ??= game.settings.get("core", "rollMode");
        temporary ??= false;

        const renderData = { actor: this.actor, item: this.item, config: OUTERHEAVEN, ...this._renderData };

        // Add rolls and their tooltips
        renderData.atkRoll = this.attackRoll;
        renderData.atkRoll.tooltip = await this.attackRoll.getTooltip();
        renderData.dmgRoll = this.damageRoll;
        renderData.dmgRoll.tooltip = await this.damageRoll.getTooltip();
        renderData.vsDefense = game.i18n.localize(this.item.system.weaponType === "ranged" ? "Profile" : "Defense");

        // Enrich result data with data only needed for display.
        renderData.results = this.results.map((result) => {
            const target = this.targets.find((target) => target.uuid === result._id);

            return {
                ...result,
                img: target.texture.src,
                name: target.name,
            };
        });

        const content = await renderTemplate("systems/outerheaven/templates/chat/weapon-attack.hbs", renderData);

        const chatData = {
            flags: this._messageFlags,
            speaker: speaker,
            content: content,
            rolls: [this.attackRoll, this.damageRoll],
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            rollMode: rollMode,
        };
        chatData.flags.outerheaven.results = this.results;
        return temporary
            ? new ChatMessage.implementation(chatData)
            : ChatMessage.create(chatData, { ...options, rollMode });
    }

    /**
     * Apply this weapon attack's result to one or more targets.
     *
     * @param {string[] | null} targetIds - The UUIDs of the targets to apply the damage to. If null, apply to all selected token actors.
     * @returns {Promise<void>}
     */
    async applyTargetDamage(targetId) {
        // Fall back to all selected tokens if no target is provided.
        if (targetId == null)
            return OHActor.applyDamage({ value: this.damageRoll.total, type: this.damageRoll.damageType });

        const target = await fromUuid(targetId);
        const actor = target.actor;
        // TODO: Alternatively, introduce damage flag so signal that the value is already final, and then use result's damage
        return actor.applyDamage({ value: this.damageRoll.total, type: this.damageRoll.damageType });
    }
}

/**
 * @typedef {object} AttackResult
 * @property {string} _id - The UUID of the target.
 * @property {boolean} isHit - Whether the attack hit the target.
 * @property {object} damage - Damage data for this particular target.
 * @property {number} damage.total - The total damage dealt to the target.
 * @property {string} damage.formula - The formula used to calculate the damage dealt to the target.
 * @property {boolean} damage.isMinimum - Whether the damage dealt to the target is the minimum possible due to armor.
 * @property {object} defense - Defense/Profile data for this particular target.
 * @property {number} defense.total - The total defense of the target.
 * @property {string} defense.formula - The formula used to calculate the defense of the target.
 * @property {number} distance - The total distance between attacker and target; 0 for melee.
 */
