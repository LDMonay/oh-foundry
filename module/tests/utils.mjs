/**
 * Create a new Actor instance using the provided data and options.
 *
 * @param {object} data - Initial data provided to construct the Actor
 * @param {string} [data.name] - The name of the Actor
 * @param {string} [data.type] - The type of the Actor
 * @param {(object | OHItem)[]} [data.items] - An array of Item data objects with which to create embedded Item instances
 * @param {(object | OHActiveEffect)[]} [data.effects] - An array of ActiveEffect data objects with which to create embedded ActiveEffect instances
 * @param {object} options - Actor creation options
 * @returns {OHActor} The constructed Actor instance
 */
export function createActor(data = {}, options = {}) {
    let { name = "Test Actor", type = "unit", items = [], effects = [], ...system } = data;

    items = items.map((item) =>
        item instanceof foundry.abstract.DataModel ? item.toObject() : new Item.implementation(item).toObject(),
    );
    effects = effects.map((effect) =>
        effect instanceof foundry.abstract.DataModel
            ? effect.toObject()
            : new ActiveEffect.implementation(effect).toObject(),
    );

    return new Actor.implementation({ name, type, items, effects, system }, { ...options, temporary: true });
}

/**
 * Create new Item instances using the provided data and options.
 *
 * @param {(object | OHItem)[]} data - Initial data provided to construct the Item
 * @param {object} [options] - Item creation options
 * @param {Actor} [options.parent=null] - The Actor to which the Item should be embedded
 * @returns {OHItem[]} The constructed Item instances
 */
export function createItems(data = [], options = {}) {
    const { parent = null, ...rest } = options;

    data = data instanceof Array ? data : [data];
    data = data.map((item) => {
        let { name = "Test Item", type = "weapon", effects = [], system = {}, ...itemData } = item;
        effects = effects.map((effect) =>
            effect instanceof foundry.abstract.DataModel
                ? effect.toObject()
                : new ActiveEffect.implementation(effect).toObject(),
        );
        return { name, type, system, effects };
    });

    const items = data.map((item) => new Item.implementation(item, rest));

    if (parent && parent instanceof foundry.abstract.DataModel) {
        parent.updateSource({ items: [...parent._source.items, ...items.map((item) => item.toObject())] });
        parent.reset();
        return parent.items.contents.slice(-items.length);
    }
    return items;
}

/**
 * Create new ActiveEffect instances using the provided data and options.
 *
 * @param {(object | OHActiveEffect)[]} data - Initial data provided to construct the ActiveEffect
 * @param {object} [options] - ActiveEffect creation options
 * @param {Actor | Item} [options.parent=null] - The Actor or Item to which the ActiveEffect should be embedded
 * @returns {OHActiveEffect[]} The constructed ActiveEffect instances
 */
export function createEffects(data = [], options = {}) {
    const { parent = null, ...rest } = options;

    data = data instanceof Array ? data : [data];
    data = data.map((effect) => {
        const { name = "Test Effect", system = {}, ...effectData } = effect;
        return { name, flags: { outerheaven: system }, ...effectData };
    });

    const effects = data.map((effect) => new ActiveEffect.implementation(effect), rest);

    if (parent && parent instanceof foundry.abstract.DataModel) {
        parent.updateSource({
            effects: [...parent._source.effects, ...effects.map((effect) => effect.toObject())],
        });
        parent.parent ? parent.parent.reset() : parent.reset();
        return parent.effects.contents.slice(-effects.length);
    }

    return effects;
}

/**
 * Update the source data of a {@link foundry.abstract.DataModel} instance and reset it.
 */
export function updateSource(doc, data = {}) {
    const result = doc.updateSource(data);
    doc.reset();
    return result;
}
