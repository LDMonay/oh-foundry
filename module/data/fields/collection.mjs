/**
 * A subclass of {@link foundry.data.fields.ArrayField} that initializes a source array into a {@link foundry.utils.Collection}.
 */
export class CollectionField extends foundry.data.fields.ArrayField {
    /** @override */
    initialize(value, model, options = {}) {
        const arr = super.initialize(value, model, options);
        // This expects each element to have an `id` to be used for the index.
        return new foundry.utils.Collection(arr.map((element) => [element.id, element]));
    }
}
