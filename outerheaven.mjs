// Imports for side-effects
import "./less/outerheaven.less";
import "./module/hmr.mjs";

// Import ES module files
import { OUTERHEAVEN } from "./module/config.mjs";
import * as documents from "./module/documents/_module.mjs";
import * as dataModels from "./module/data/_module.mjs";
import * as sheets from "./module/sheets/_module.mjs";
import * as utils from "./module/utils.mjs";
import * as dice from "./module/dice/_module.mjs";
import * as actions from "./module/actions/_module.mjs";
import { registerSettings } from "./module/settings.mjs";
import { SYSTEM_ID } from "./module/const.mjs";

// API
export { actions, OUTERHEAVEN as config, dataModels, dice, documents, sheets };
globalThis.outerheaven = {
    actions,
    config: OUTERHEAVEN,
    dataModels,
    dice,
    documents,
    sheets,
};

if (import.meta.env.DEV) {
    await import("./module/tests/index.mjs");
}

Hooks.once("init", function () {
    console.log("Outer Heaven | Initializing the battlefield...");

    CONFIG.OUTERHEAVEN = OUTERHEAVEN;

    // Actor configuration
    CONFIG.Actor.documentClass = documents.OHActor;
    CONFIG.Actor.dataModels = {
        unit: dataModels.OHUnit,
    };
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("outerheaven", sheets.OHUnitSheet, { makeDefault: true });

    // Item configuration
    CONFIG.Item.documentClass = documents.OHItem;
    CONFIG.Item.dataModels = {
        ability: dataModels.OHAbility,
        armor: dataModels.OHArmor,
        equipment: dataModels.OHEquipment,
        form: dataModels.OHForm,
        skill: dataModels.OHSkill,
        weapon: dataModels.OHWeapon,
    };
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("outerheaven", sheets.OHItemSheet, { makeDefault: true });

    // Active Effects
    CONFIG.ActiveEffect.legacyTransferral = false;
    CONFIG.ActiveEffect.documentClass = documents.OHActiveEffect;
    DocumentSheetConfig.registerSheet(ActiveEffect, SYSTEM_ID, sheets.OHActiveEffectConfig, { makeDefault: true });

    // Dice
    CONFIG.Dice.rolls.push(dice.DamageRoll);

    // Chat
    CONFIG.ChatMessage.documentClass = documents.OHChatMessage;

    registerSettings();
    utils.preloadHandlebarsTemplates();

    Handlebars.registerHelper("sum", function (a, b) {
        return a + b;
    });
});

Hooks.once("i18nInit", function () {
    console.log("Outer Heaven | Initializing translations...");
    const toTranslate = ["damageTypes", "armorTypes", "weaponTypes"];
    for (const configMember of toTranslate) {
        for (const [key, value] of Object.entries(OUTERHEAVEN[configMember])) {
            OUTERHEAVEN[configMember][key] = game.i18n.localize(value);
        }
    }
});

Hooks.once("ready", function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
    console.log("Outer Heaven | Activated Macro Drag&Drop");
});

Hooks.on("renderChatLog", (app, html, data) => {
    html.on("click", "button.apply-damage", (event) => {
        const message = game.messages.get(event.currentTarget.closest(".message").dataset.messageId);
        const targetId = event.currentTarget.dataset.targetId;
        message.action.applyTargetDamage(targetId);
    });
});

async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== "Item") return;
    if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
        return ui.notifications.warn("You can only create macro buttons for owned Items");
    }

    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.outerheaven.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find((m) => m.name === item.name && m.command === command);
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: { "outerheaven.itemMacro": true },
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

function rollItemMacro(itemUuid) {
    // Reconstruct the drop data so that we can load the item.
    const dropData = {
        type: "Item",
        uuid: itemUuid,
    };
    // Load the item from the uuid.
    Item.fromDropData(dropData).then((item) => {
        // Determine if the item loaded and if it's an owned item.
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(
                `Could not find item ${itemName}. You may need to delete and recreate this macro.`,
            );
        }

        if (item.type === "weapon") {
            // TODO: Replace with direct use of UUID
        } else {
            item.displayInChat();
        }
    });
}
