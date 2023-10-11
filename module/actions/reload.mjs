import { OUTERHEAVEN } from "../config.mjs";
import { OuterHeavenAction } from "./action.mjs";

export class ReloadAction extends OuterHeavenAction {
    static ACTION_TYPE = "reload";
    static TEMPLATE = "systems/outerheaven/templates/chat/reload.hbs";

    async _use(options) {
        this.itemUpdate["system.capacity.value"] = this.item.system.capacity.max;
    }
}

OUTERHEAVEN.ACTIONS[ReloadAction.ACTION_TYPE] = ReloadAction;
