import * as _outerheaven from "./outerheaven.mjs";

export {};

declare global {
    // Documents
    export import OHActor = _outerheaven.documents.OHActor;
    export import OHItem = _outerheaven.documents.OHItem;

    type DamageType = keyof typeof outerheaven.config.damageTypes;
    // Action types
    export import ItemReloadAction = _outerheaven.actions.ReloadAction;
    interface DamageInstance extends _outerheaven.actions.DamageInstance {}
}
