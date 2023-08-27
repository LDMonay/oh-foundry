export async function UseWeapon({ actorData = null, weaponData = null } = {}) {
    let weaponDice = null;
    let atkCount = null;
    if (weaponData != null) {
        weaponDice = weaponData.system.damagePerAttack;
        atkCount = weaponData.system.numberOfAttacks;
    }

    const damageFormula = getDamageFormula(weaponDice, atkCount);
    let attackFormula = "1d20 + " + weaponData.system.attackBonus + " + ";

    if (weaponData.system.weaponType == "ranged") {
        attackFormula += actorData.system.aim;
    }
    if (weaponData.system.weaponType == "melee") {
        attackFormula += actorData.system.melee;
    }

    const damageRoll = new Roll(damageFormula, {});
    const attackRoll = new Roll(attackFormula, {});

    // Reduce ammo / power
    if (weaponData.system.capacity.value != null && parseInt(weaponData.system.capacity.value) > 0) {
        await weaponData.update({ "system.capacity.value": parseInt(weaponData.system.capacity.value) - 1 });
    }
    // TODO ADD POWER

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: actorData });
    const rollMode = game.settings.get("core", "rollMode");

    // Retrieve roll data.
    const rollData = { actor: actorData };
    rollData.item = foundry.utils.deepClone(weaponData);
    rollData.atkRoll = attackRoll;
    rollData.dmgRoll = damageRoll;
    const rollContent = await renderTemplate("systems/outerheaven/templates/chat/weapon-use.hbs", rollData);

    ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        content: rollContent,
    });
}

function getDamageFormula(baseDamage = "", numberOfShots = 1) {
    // Change crit status to a global parameter
    const critStatus = "x";

    const damage = { baseStr: "", dices: [], mods: [] };
    damage.baseStr = baseDamage.toLowerCase();

    const matches = damage.baseStr.matchAll("\\d*(?:d)\\d*");

    for (const match of matches) {
        const diceSplit = match[0].split("d");
        if (diceSplit[0] == "") {
            diceSplit[0] = "1";
        }
        damage.dices.push({
            diceNbr: parseInt(diceSplit[0]),
            diceSize: parseInt(diceSplit[1]),
            baseIndex: match.index,
            baseLength: match[0].length,
        });
    }

    for (let i = 0; i < damage.dices.length; i++) {
        const modDiceNbr = damage.dices[i].diceNbr * numberOfShots;
        damage.dices[i].diceExpression = modDiceNbr.toString() + "d" + damage.dices[i].diceSize.toString() + critStatus;
    }

    damage.dices.sort(function compareFn(a, b) {
        if (a.baseIndex > b.baseIndex) {
            return -1;
        }
        if (a.baseIndex < b.baseIndex) {
            return 1;
        }
        return 0;
    });

    let modStr = damage.baseStr;
    for (let i = 0; i < damage.dices.length; i++) {
        modStr =
            modStr.substring(0, damage.dices[i].baseIndex) +
            damage.dices[i].diceExpression +
            modStr.substring(damage.dices[i].baseIndex + damage.dices[i].baseLength);
    }

    const modifiers = modStr.matchAll("\\b(?!\\d*d\\d*)\\d+");

    for (const modifier of modifiers) {
        damage.mods.push({
            value: parseInt(modifier[0]),
            baseIndex: modifier.index,
            baseLength: modifier[0].length,
            modValue: [parseInt(modifier[0]) * numberOfShots].toString(),
        });
    }

    damage.mods.sort(function compareFn(a, b) {
        if (a.baseIndex > b.baseIndex) {
            return -1;
        }
        if (a.baseIndex < b.baseIndex) {
            return 1;
        }
        return 0;
    });

    for (let i = 0; i < damage.mods.length; i++) {
        modStr =
            modStr.substring(0, damage.mods[i].baseIndex) +
            damage.mods[i].modValue +
            modStr.substring(damage.mods[i].baseIndex + damage.mods[i].baseLength);
    }

    return modStr;
}
