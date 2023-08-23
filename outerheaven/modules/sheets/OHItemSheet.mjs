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
      html.find('.armorBonus-create').click(this._onArmorBonusCreate.bind(this));

      // Remove Armor Bonus
      html.find('.armorBonus-delete').click(this._onArmorBonusDelete.bind(this));
    }

    async _onArmorBonusCreate(event) {
      console.log(this.item);
      if (this.item.type === "armor")
      {
          this.item.system.armorBonuses.push({armorType: CONFIG.OUTERHEAVEN.damageTypes.untyped, value: 1});
      }
    }

    async _onArmorBonusDelete(event) {
      let context = this.getData();
      if (context.item.type === "armor")
      {
        const dataset = event.currentTarget.dataset;
      }
      console.log(context.system.armorBonuses);
    }

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        context.config = CONFIG.OUTERHEAVEN;

        // Use a safe clone of the item data for further operations.
        const itemData = context.item;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
        context.rollData = actor.getRollData();
        }

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        return context;
    }
}