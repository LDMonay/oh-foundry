import * as _outerheaven from "./outerheaven.mjs";

export {};

declare global {
    type DamageType = keyof typeof outerheaven.config.damageTypes;
    // Action types
    export import ItemReloadAction = _outerheaven.actions.ReloadAction;
    interface DamageInstance extends _outerheaven.actions.DamageInstance {}
}
