import { LocalDocumentField } from "./local-document.mjs";

/**
 * A field which stores a reference to an ActiveEffect document embedded in an Item embedded in an Actor.
 * The value of this field is a relative UUID string in the form of ".Item.abc123.ActiveEffect.def456".
 */
export class LocalEffectField extends LocalDocumentField {
    constructor(options = {}) {
        // Replace `model` parameter with a hardcoded reference to the ActiveEffect model.
        super(foundry.documents.BaseActiveEffect, options);
    }

    /** @override */
    initialize(value, model, options = {}) {
        if (this.idOnly) return value;
        // Retrieve the effect using its relative UUID, and check if it is of the correct type.
        return () => {
            const effect = fromUuidSync(value, { relative: model.parent }) ?? null;
            if (options.type && effect?.system?.type !== options.type) return null;
            return effect;
        };
    }

    /** @override */
    _cast(value) {
        if (typeof value === "string") return value;
        // Do not use the normal `id` field, but generate an actor-relative UUID instead.
        if (value instanceof this.model) return value.getRelativeUUID(null, { toActor: true });
        throw new Error(`The value provided to a LocalEffectField must be a ${this.model.name} instance.`);
    }

    /** @override */
    _validateType(value) {
        // The value must adhere to a schema of ".Item.abc123.ActiveEffect.def456".
        const result = /.Item.[a-zA-Z0-9]{16}.ActiveEffect.[a-zA-Z0-9]{16}/.test(value);
        if (!result) throw new Error(`The value provided to a LocalEffectField must be a UUID string.`);
    }
}
