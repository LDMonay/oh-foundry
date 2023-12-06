import { OUTERHEAVEN } from "../config.mjs";
import { SYSTEM } from "../const.mjs";
import { OuterHeavenAction } from "./action.mjs";

export class ItemUseAction extends OuterHeavenAction {
    static ACTION_TYPE = "itemUse";
    static TEMPLATE = `${SYSTEM.TEMPLATE_PATH}/chat/item-use.hbs`;
    static LABEL = "OH.ActionTypes.Use";

    /** @override */
    async _use(options) {
        // Capacity
        const { value: capacityValue, max: capacityMax } = this.item.system.capacity;
        if (capacityValue <= 0) {
            this._renderData.noCapacity = true;
        }
        this.itemUpdate["system.capacity.value"] = Math.clamped(capacityValue - 1, 0, capacityMax);

        // Actor power
        const powerCost = this.item.system.powerCost;
        if (this.actor.system.power.isUsed && powerCost !== 0) {
            const { value: powerValue, max: powerMax } = this.actor.system.power;
            const power = (this._renderData.power = {
                cost: powerCost,
                value: powerValue,
                max: powerMax,
            });
            if (powerCost > powerValue) {
                power.warning = true;
            }
            this.actorUpdate["system.power.value"] = Math.clamped(powerValue - powerCost, 0, powerMax);
        }

        if (this.item.effects) this._addOnUseEffects();
    }
}

OUTERHEAVEN.ACTIONS[ItemUseAction.ACTION_TYPE] = ItemUseAction;
