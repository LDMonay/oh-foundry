/**
 * A field which stores a reference to an embedded document, similar to {@link foundry.data.fields.ForeignDocumentField}.
 */
export class LocalDocumentField extends foundry.data.fields.DocumentIdField {
    constructor(model, options = {}) {
        if (!foundry.utils.isSubclass(model, foundry.abstract.DataModel)) {
            throw new Error("A LocalDocumentField must specify a DataModel subclass as its type");
        }
        super(options);
        /**
         * A reference to the model class which is stored in this field.
         * @type {typeof Document}
         */
        this.model = model;
    }

    /** @override */
    static get _defaults() {
        return foundry.utils.mergeObject(super._defaults, {
            nullable: true,
            readonly: false,
            idOnly: false,
        });
    }

    /** @override */
    _cast(value) {
        if (typeof value === "string") return value;
        // Return the document's `id` for storage in the database.
        if (value instanceof this.model) return value._id;
        throw new Error(`The value provided to a LocalDocumentField must be a ${this.model.name} instance.`);
    }

    /** @override */
    initialize(value, model, options = {}) {
        if (this.idOnly) return value;
        const collection = model.parent?.[this.model.metadata.collection];
        return () => collection?.get(value) ?? null;
    }

    /** @override */
    toObject(value) {
        return value?._id ?? value;
    }
}
