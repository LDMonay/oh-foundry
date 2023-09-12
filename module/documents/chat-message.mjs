import { WeaponAttack } from "../weapon-attack.mjs";

export class OHChatMessage extends ChatMessage {
    /** @type {WeaponAttack | undefined} */
    get weaponAttack() {
        if (this.flags.outerheaven?.type === "weaponAttack") {
            this._weaponAttack ??= WeaponAttack.fromMessage(this);
            return this._weaponAttack;
        } else {
            return undefined;
        }
    }
}
