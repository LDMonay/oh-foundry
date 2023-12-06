import { OUTERHEAVEN } from "../config.mjs";
import { DamageRoll } from "../dice/damage-roll.mjs";
import { OHActor } from "../documents/actor.mjs";
import { OuterHeavenAction } from "./action.mjs";

export class AttackAction extends OuterHeavenAction {
    static ACTION_TYPE = "attack";
    static TEMPLATE = "systems/outerheaven/templates/chat/weapon-attack.hbs";
    static LABEL = "OH.ActionTypes.Attack";

    /** @override */
    static fromData({ actor, item, token, rolls, ...flags } = {}) {
        const action = super.fromData({ actor, item, token, ...flags });

        action.attackRoll = rolls[0];
        action.damageRoll = rolls[1];
        action.results = new foundry.utils.Collection(flags.results.map((result) => [result._id, result]));
        action.targets = flags.results.map((result) => fromUuidSync(result._id));

        return action;
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

    /** @override */
    async _use(options) {
        /**
         * An array of targets of the attack.
         *
         * @type {TokenDocument[]}
         */
        this.targets = await this._acquireTargets();

        // Create and evaluate rolls
        this.attackRoll = await this._rollAttack();
        this.damageRoll = await this._rollDamage();

        for (const target of this.targets) {
            this.results.set(target.uuid, this._evaluateResult(target));
        }

        // Set flag when using weapon without remaining ammo.
        if (this.item.system.capacity.value === 0) this._renderData.noAmmo = true;

        // Add usage costs to update data
        if (this.item.system.powerCost > 0) {
            this.actorUpdate["system.power.value"] = this.actor.system.power.value - this.item.system.powerCost;
        }
        if (this.item.system.capacity.value > 0) {
            this.itemUpdate["system.capacity.value"] = this.item.system.capacity.value - 1;
        }

        if (this.item.effects) this._addOnUseEffects();
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
        const isMinDamage = Boolean(damageReduction && damageTotal === numberOfAttacks);
        let damageFormula = `${damageValue}[${game.i18n.localize("OH.Damage")}]`;
        if (damageReduction) {
            const attackLabel = game.i18n.localize(
                this.item.system.weaponType === "ranged" ? "OH.Shots" : "OH.Strikes",
            );
            const apPart = armorPenetration ? `${armorPenetration}[${game.i18n.localize("OH.ArmorPenetration")}]` : "";
            const damageReductionPart = `${armor}[${game.i18n.localize("TYPES.Item.armor")}]`;
            damageFormula += apPart
                ? ` - ${numberOfAttacks}[${attackLabel}] * (${damageReductionPart} - ${apPart})`
                : ` - ${numberOfAttacks}[${attackLabel}] * ${damageReductionPart}`;
        }
        result.damage = {
            total: damageTotal,
            formula: damageFormula,
            isMinimum: isMinDamage,
        };

        return result;
    }

    /** @override */
    async toMessage(options = {}) {
        const renderData = this._renderData;

        // Add rolls and their tooltips
        renderData.atkRoll = this.attackRoll;
        renderData.atkRoll.tooltip = await this.attackRoll.getTooltip();
        renderData.dmgRoll = this.damageRoll;
        renderData.dmgRoll.tooltip = await this.damageRoll.getTooltip();
        renderData.vsDefense = game.i18n.localize(this.item.system.weaponType === "ranged" ? "Profile" : "Defense");
        renderData.totalAp = this.item.system.numberOfAttacks * this.item.system.armorPenetration;

        // Enrich result data with data only needed for display.
        renderData.results = this.results.map((result) => {
            const target = this.targets.find((target) => target.uuid === result._id);

            return {
                ...result,
                img: target.texture.src,
                name: target.name,
            };
        });

        this.ohFlags.results = this.results;
        this.ohFlags.numberOfAttacks = this.item.system.numberOfAttacks;
        this.ohFlags.armorPenetration = this.item.system.armorPenetration;

        options.chatData ??= {};
        options.chatData.rolls = [this.attackRoll, this.damageRoll];
        options.chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL;

        return super.toMessage(options);
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
            return OHActor.applyDamage({
                total: this.damageRoll.total,
                type: this.damageRoll.damageType,
                numberOfAttacks:
                    this._messageFlags.outerheaven.numberOfAttacks ?? this.item?.system?.numberOfAttacks ?? 1,
                armorPenetration:
                    this._messageFlags.outerheaven.armorPenetration ?? this.item?.system?.armorPenetration ?? 0,
            });

        const target = await fromUuid(targetId);
        const actor = target.actor;
        const result = this.results.get(targetId);
        return actor.applyDamage({ total: result.damage.total, type: this.damageRoll.damageType, isFinal: true });
    }
}

OUTERHEAVEN.ACTIONS[AttackAction.ACTION_TYPE] = AttackAction;

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

/**
 * @typedef {object} DamageInstance
 * @property {number} total - The total damage dealt.
 * @property {DamageType} type - The type of damage dealt.
 * @property {number} [numberOfAttacks] - The number of attacks that were rolled; used for armor calculations.
 * @property {number} [armorPenetration] - The armor penetration of the attack; used for armor calculations.
 * @property {boolean} [isFinal] - Whether the damage is final, i.e. ignores armor.
 */
