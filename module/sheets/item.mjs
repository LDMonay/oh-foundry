export class OHItemSheet extends ItemSheet {
    get template() {
        return `systems/outerheaven/templates/sheets/${this.item.type}-sheet.hbs`;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "itemSheet"],
            width: 520,
            height: 480,
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Armor Bonus
        html.find(".armorBonus-create").click(this._onArmorBonusCreate.bind(this));

        // Remove Armor Bonus
        html.find(".armorBonus-delete").click(this._onArmorBonusDelete.bind(this));
    }

    async _onArmorBonusCreate(event) {
        if (this.item.type === "armor") {
            const armorBonuses = this.item.toObject().system.armorBonuses;
            armorBonuses.push({ armorType: "untyped", value: 0 });
            await this.item.update({ "system.armorBonuses": armorBonuses });
        }
    }

    async _onArmorBonusDelete(event) {
        event.preventDefault();
        const li = event.currentTarget.closest(".item");
        const armorBonuses = this.item.toObject().system.armorBonuses;
        const index = Number(li.dataset.index);
        armorBonuses.splice(index, 1);
        await this.item.update({ "system.armorBonuses": armorBonuses });
    }

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        context.config = CONFIG.OUTERHEAVEN;

        if (this.type === "armor") {
            context.armorTypes = { ...CONFIG.OUTERHEAVEN.damageTypes };
            context.armorTypes.true = "All";
        }

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = this.item.system;
        context.flags = this.item.flags;

        return context;
    }
}
