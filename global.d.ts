import { OUTERHEAVEN } from "./module/config.mjs";
import * as weaponAttack from "./module/weapon-attack.mjs";

export {};

declare global {
    type DamageType = keyof typeof OUTERHEAVEN.damageTypes;
    interface DamageInstance extends weaponAttack.DamageInstance {}
}
