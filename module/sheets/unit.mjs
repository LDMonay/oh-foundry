import { onManageActiveEffect, prepareActiveEffectCategories } from "../effects.mjs";

export class OHUnitSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "characterSheet"],
            template: `systems/outerheaven/templates/sheets/unit-sheet.hbs`,
            width: 720,
            height: 680,
        });
    }

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        context.config = CONFIG.OUTERHEAVEN;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = context.actor.system;

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // Prepare items
        this._prepareItems(context);

        return context;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        // Initialize containers.
        const abilities = [];
        const defenses = [];
        const equipments = [];
        const skills = [];
        const weapons = [];

        // Iterate through items, allocating to containers
        for (const i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            // Append to abilities.
            if (i.type === "ability") {
                abilities.push(i);
            }
            // Append to defenses.
            else if (i.type === "armor") {
                defenses.push(i);
            }
            // Append to equipment.
            else if (i.type === "equipment") {
                equipments.push(i);
            }
            // Append to skills.
            else if (i.type === "skill") {
                skills.push(i);
            }
            // Append to weapons.
            else if (i.type === "weapon") {
                weapons.push(i);
            }
        }

        // Assign and return
        context.abilities = abilities;
        context.defenses = defenses;
        context.equipments = equipments;
        context.skills = skills;
        context.weapons = weapons;
        // Prepare active effects
        context.effects = prepareActiveEffectCategories(this.actor.effects);
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Render the item sheet for viewing/editing prior to the editable check.
        html.find(".item-edit").click((ev) => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find(".item-create").click(this._onItemCreate.bind(this));

        // Delete Inventory Item
        html.find(".item-delete").click((ev) => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });

        // Inline Edit Item
        html.find(".inline-edit").change(this._onInlineEdit.bind(this));
        html.find(".item-display").click(this._onDisplayItem.bind(this));

        // Display defenses
        html.find(".displayDefenses").click(this._onDisplayDefenses.bind(this));

        // Use weapon
        html.find(".useWeapon").click(this._onUseWeapon.bind(this));

        // Active Effect management
        html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.actor));
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            system: data,
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.system["type"];

        // Finally, create the item!
        return await Item.create(itemData, { parent: this.actor });
    }

    async _onInlineEdit(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        const field = element.dataset.field;

        return await item.update({ [field]: element.value });
    }

    _onDisplayItem(event) {
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item.displayInChat();
    }

    _onDisplayDefenses(event) {
        const actorData = this.actor;
        actorData._onDisplayDefenses();
    }

    _onUseWeapon(event) {
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item.useWeapon(this.actor);
    }
}
