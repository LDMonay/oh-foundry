const fields = foundry.data.fields;

/**
 * Basic description data common to items
 */
export const DescriptionTemplate = () => ({
    description: new fields.HTMLField({ textSearch: true, blank: true, initial: "" }),
    tags: new fields.StringField({ textSearch: true, blank: true, initial: "" }),
});

/**
 * Basic data for point costs
 */
export const PointsTemplate = () => ({
    ignoreCost: new fields.BooleanField(),
    pointCost: new fields.NumberField({ initial: 0, nullable: false, integer: true }),
});

export const UsableTemplate = () => ({
    actionsToUse: new fields.NumberField(),
    powerCost: new fields.NumberField(),
    capacity: new fields.SchemaField({
        value: new fields.NumberField(),
        max: new fields.NumberField(),
    }),
});

export const ValueIsUsedTemplate = () => ({
    value: new fields.NumberField({ initial: 0, nullable: false }),
    max: new fields.NumberField({ initial: 0, nullable: false }),
    isUsed: new fields.BooleanField(),
});
