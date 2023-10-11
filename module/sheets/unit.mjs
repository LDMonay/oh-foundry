import { SYSTEM_ID } from "../const.mjs";
import { OHArmor } from "../data/armor.mjs";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../effects.mjs";

export class OHUnitSheet extends ActorSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "sheet", "character-sheet", "outerheaven"],
            template: `systems/outerheaven/templates/sheets/unit-sheet.hbs`,
            width: 760,
            height: 680,
        };
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
     * @return {undefined}
     */
    _prepareItems(context) {
        // Initialize containers.
        const result = {
            weapons: { label: "OH.Weapons", items: [], type: "weapon" },
            defenses: { label: "OH.Defenses", items: [], type: "armor" },
            items: { label: "OH.Equipment", items: [], type: "equipment" },
            abilities: { label: "OH.Abilities", items: [], type: "ability" },
            skills: { label: "OH.Skills", items: [], type: "skill" },
        };

        // Iterate through items, allocating to containers
        for (const i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            i.document = context.actor.items.get(i._id);

            // Append to abilities.
            if (i.type === "ability") {
                result.abilities.items.push(i);
            }
            // Append to defenses.
            else if (i.type === "armor") {
                i.armorBonusString = OHArmor.getArmorString(i.system.armorBonuses);
                result.defenses.items.push(i);
            }
            // Append to equipment.
            else if (i.type === "equipment") {
                result.equipments.items.push(i);
            }
            // Append to skills.
            else if (i.type === "skill") {
                result.skills.items.push(i);
            }
            // Append to weapons.
            else if (i.type === "weapon") {
                result.weapons.items.push(i);
            }
        }

        // Prepare active effects
        context.effects = prepareActiveEffectCategories(this.actor.effects);

        context.inventory = result;
        for (const [k, v] of Object.entries(result)) {
            context[k] = v.items;
        }
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
        html.find(".item-import").click(this._onItemImport.bind(this));

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
        html.find(".use-weapon").click(this._onUseWeapon.bind(this));

        html.find(".ammo .reload").click(this._onReloadWeapon.bind(this));

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

    /**
     * Handle opening compendium applications for a certain item type.
     *
     * @param {Event} event - The originating click event.
     * @private
     */
    _onItemImport(event) {
        event.preventDefault();
        const createButton = event.currentTarget.previousElementSibling;
        const type = createButton.dataset.type;

        const itemCompendiums = game.settings.get(SYSTEM_ID, "itemCompendiums");
        if (!itemCompendiums[type]) return;
        game.packs.get(itemCompendiums[type]).render(true);
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
        actorData.displayDefenseCard();
    }

    _onUseWeapon(event) {
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item.use({ token: this.token });
    }

    _onReloadWeapon(event) {
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item.reload({ token: this.token });
    }
}
