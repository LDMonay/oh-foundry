import { SYSTEM_ID } from "../const.mjs";
import { OHArmor } from "../data/armor.mjs";
import { OHItem } from "../documents/item.mjs";
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
    async getData(options) {
        // Retrieve base data structure.
        const context = await DocumentSheet.prototype.getData.call(this, options);
        const actor = (context.actor = context.document);
        const source = actor.toObject();

        context.config = CONFIG.OUTERHEAVEN;

        // Add the actor's system data to enable matching `name` and `value` props
        context.system = actor.system;

        const stanceEntries = [...actor.allApplicableEffects()]
            .filter((effect) => effect.system.type === "stance")
            .map((effect) => [effect.getRelativeUUID(null, { toActor: true }), effect.name]);
        context.stances = Object.fromEntries(stanceEntries);
        context.stance = source.system.stance ?? "";

        // Prepare embedded documents
        context.items = this._prepareItems(actor.items.contents);
        context.effects = prepareActiveEffectCategories(actor.effects);
        context.form = actor.items.find((item) => item.type === "form");

        return context;
    }

    /**
     * Organize items into sections.
     *
     * @protected
     * @param {OHItem[]} items - The items to prepare.
     * @returns {Record<string, { label: string, items: object[], type: string }>} An object containing item secions.
     */
    _prepareItems(items) {
        // Initialize containers.
        const result = {
            abilities: { label: "OH.Abilities", items: [], type: "ability" },
            defenses: { label: "OH.Defenses", items: [], type: "armor" },
            equipment: { label: "OH.Equipment", items: [], type: "equipment" },
            skills: { label: "OH.Skills", items: [], type: "skill" },
            weapons: { label: "OH.Weapons", items: [], type: "weapon" },
        };

        // Sort items by their stored sort order
        items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        for (const item of items) {
            const i = { id: item.id, name: item.name, img: item.img, system: item.system, document: item };
            switch (item.type) {
                case "ability": {
                    result.abilities.items.push(i);
                    break;
                }
                case "armor": {
                    i.armorBonusString = OHArmor.getArmorString(i.system.armorBonuses);
                    result.defenses.items.push(i);
                    break;
                }
                case "equipment": {
                    result.equipment.items.push(i);
                    break;
                }
                case "skill": {
                    result.skills.items.push(i);
                    break;
                }
                case "weapon": {
                    i.attackBonus = item.system.attackBonus;
                    if (item.system.weaponType === "ranged") i.attackBonus += this.actor.system.aim;
                    else if (item.system.weaponType === "melee") i.attackBonus += this.actor.system.melee;
                    result.weapons.items.push(i);
                    break;
                }
            }
        }

        return result;
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
        html.find(".item-delete").click(this._onItemDelete.bind(this));

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
        // Grab any data associated with this control.
        const { type, ...data } = foundry.utils.deepClone(header.dataset);
        // Initialize a default name.
        const name = game.i18n.format("DOCUMENT.New", { type: game.i18n.localize(`TYPES.Item.${type}`) });
        const sort = Math.max(...this.actor.itemTypes[type].map((i) => i.sort ?? 0), 0) + CONST.SORT_INTEGER_DENSITY;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            system: data,
            sort: sort ?? CONST.SORT_INTEGER_DENSITY,
        };

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

    /**
     * Delete an item from the actor, prompting for confirmation unless shift is held.
     *
     * @private
     * @param {Event} event - The originating click event.
     * @returns {Promise<void>}
     */
    async _onItemDelete(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        const item = this.actor.items.get(li.dataset.itemId);
        if (event.shiftKey) {
            return item.delete();
        } else {
            const bounds = li.getBoundingClientRect();
            return item.deleteDialog({
                top: Math.min(bounds.top, window.innerHeight - 140),
                left: Math.min(bounds.right + 8, window.innerWidth - 410),
            });
        }
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
