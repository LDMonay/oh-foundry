export class OHItemSheet extends ItemSheet {
    get template() {
        return `systems/outerheaven/templates/sheets/${this.item.type}-sheet.hbs`;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "outerheaven", "sheet", "item-sheet"],
            tabs: [{ navSelector: ".tabs", contentSelector: ".content" }],
            width: 520,
            height: 480,
        };
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

        html.find(".item-controls a").click(this._onControls.bind(this));
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

    async _onControls(event) {
        event.preventDefault();
        const a = event.currentTarget;
        // Document type
        const type = a.closest(".item-controls").dataset.type;
        // What action to perform
        const action = a.dataset.action;
        // ID of the targeted document
        const docId = a.closest(".item")?.dataset.id;
        // Document itself; only for edit and delete
        const effect = docId ? this.item.effects.get(docId) : null;

        if (action === "edit") {
            effect.sheet.render(true);
        } else if (action === "delete") {
            effect.delete();
        } else if (action === "create") {
            this.item.createEmbeddedDocuments(type, [{ name: ActiveEffect.defaultName(), icon: "icons/svg/aura.svg" }]);
        }
    }

    /** @override */
    async getData() {
        // Retrieve base data structure.
        const context = super.getData();
        const item = (context.item = this.item);
        const rollData = item.getRollData();

        context.config = CONFIG.OUTERHEAVEN;

        if (item.type === "armor") {
            context.armorTypes = { ...CONFIG.OUTERHEAVEN.damageTypes };
            context.armorTypes.true = "All";
        }

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = item.system;
        context.flags = item.flags;

        context.description = await TextEditor.enrichHTML(item.system.description, {
            rollData,
            secrets: item.isOwner,
            async: true,
            relativeTo: item,
        });

        context.activeEffects = item.effects.map((effect) => {
            const data = effect.toObject(false);
            data.document = effect;
            data.img = data.icon;
            return data;
        });

        return context;
    }
}
