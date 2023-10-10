import { OuterHeavenAction } from "../actions/action.mjs";

export class OHChatMessage extends ChatMessage {
    /** @type {OuterHeavenAction | undefined} */
    get action() {
        const actionType = this.flags.outerheaven?.actionType;
        if (actionType && actionType in outerheaven.config.ACTIONS) {
            this._action ??= outerheaven.config.ACTIONS[actionType].fromMessage(this);
            return this._action;
        } else {
            return undefined;
        }
    }
}
