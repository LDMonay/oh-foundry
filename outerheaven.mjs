// Imports for side-effects
import "./less/outerheaven.less";
import "./module/hmr.mjs";

// Import ES module files
import { OUTERHEAVEN } from "./module/config.mjs";
import * as actions from "./module/actions/_module.mjs";
import * as applications from "./module/applications/_module.mjs";
import * as dataModels from "./module/data/_module.mjs";
import * as dice from "./module/dice/_module.mjs";
import * as documents from "./module/documents/_module.mjs";
import * as sheets from "./module/sheets/_module.mjs";
import * as utils from "./module/utils.mjs";
import { registerSettings } from "./module/settings.mjs";
import { SYSTEM_ID } from "./module/const.mjs";

// API
export { actions, OUTERHEAVEN as config, dataModels, dice, documents, sheets };
globalThis.outerheaven = {
    actions,
    applications,
    config: OUTERHEAVEN,
    dataModels,
    dice,
    documents,
    sheets,
    utils,
};

// Load tests in dev environment
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

    // Combat
    CONFIG.Combat.documentClass = documents.OHCombat;
    CONFIG.Combatant.documentClass = documents.OHCombatant;
    CONFIG.ui.combat = sheets.OHCombatTracker;

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
    Hooks.on("hotbarDrop", (bar, data, slot) => {
        if (data.type === "Item") documents.OHItem.createMacro(data, slot);
        return false;
    });
    console.log("Outer Heaven | Activated Macro Drag&Drop");
});

Hooks.on("renderChatLog", (app, html, data) => {
    html.on("click", "button.apply-damage", (event) => {
        const message = game.messages.get(event.currentTarget.closest(".message").dataset.messageId);
        const targetId = event.currentTarget.dataset.targetId;
        message.action.applyTargetDamage(targetId);
    });
});
