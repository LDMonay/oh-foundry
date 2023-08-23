export class OHUnit extends Actor {
    prepareData() {
        super.prepareData();
      }

    prepareDerivedData() {
        let actorData = this;
        let systemData = actorData.system;
        let flags = actorData.flags;

        // Profile/Defense
        systemData.profile.total = systemData.profile.base + systemData.profile.stanceBonus + systemData.profile.miscBonus;
        systemData.defense.total = systemData.defense.base + systemData.defense.stanceBonus + systemData.melee + systemData.defense.miscBonus;

        // Armor Total
        let armorTotal = 0;
        actorData.items.forEach(item => {
            if (item.type === 'armor')
            {
                armorTotal += item.system.armor;
            }
        });

        systemData.armor = armorTotal;

        // Points
        let pointTotal = 0;
        actorData.items.forEach(item => {
            if (!item.system.ignoreCost && item.system.pointCost > 0)
            {
                pointTotal += item.system.pointCost;
            }
        });

        if (!systemData.baseUnitPointsIgnore && systemData.baseUnitPoints > 0)
        {
            pointTotal += systemData.baseUnitPoints
        }

        systemData.totalPoints = pointTotal;
    }

    async _onDisplayDefenses() {
        const actor = this;

        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker({ actor: actor });
        const rollMode = game.settings.get('core', 'rollMode');

        // Retrieve roll data.
        const rollData = this;
        const rollContent = await renderTemplate("systems/outerheaven/templates/chat/defense-stats-display.hbs", rollData);

        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            content: rollContent
        });
    }
}