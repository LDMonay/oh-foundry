// Imports for side-effects
import "./less/outerheaven.less";
import "./module/hmr.mjs";

// Import ES module files
import { OUTERHEAVEN } from "./module/config.mjs";
import * as actions from "./module/actions/_module.mjs";
import * as applications from "./module/applications/_module.mjs";
import * as canvas from "./module/canvas/_module.mjs";
import * as dataModels from "./module/data/_module.mjs";
import * as dice from "./module/dice/_module.mjs";
import * as documents from "./module/documents/_module.mjs";
import * as sheets from "./module/sheets/_module.mjs";
import * as utils from "./module/utils.mjs";
import { registerSettings } from "./module/settings.mjs";
import { SYSTEM } from "./module/const.mjs";

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
    DocumentSheetConfig.registerSheet(ActiveEffect, SYSTEM.ID, sheets.OHActiveEffectConfig, { makeDefault: true });

    // Combat
    CONFIG.Combat.documentClass = documents.OHCombat;
    CONFIG.Combatant.documentClass = documents.OHCombatant;
    CONFIG.ui.combat = sheets.OHCombatTracker;

    // Dice
    CONFIG.Dice.rolls.push(dice.DamageRoll);

    // Chat
    CONFIG.ChatMessage.documentClass = documents.OHChatMessage;

    // Token
    CONFIG.Token.objectClass = canvas.OHToken;

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

Hooks.on("renderChatLog", (_app, html, _data) => {
    html.on("click", ".outerheaven button.apply", (event) => {
        const message = game.messages.get(event.currentTarget.closest(".message").dataset.messageId);
        /** @type {actions.OuterHeavenAction} */
        const messageAction = message.action;
        const applyAction = event.currentTarget.dataset.action;

        switch (applyAction) {
            case "damage": {
                const targetId = event.currentTarget.dataset.targetId;
                return messageAction.applyTargetDamage(targetId);
            }
            case "effect": {
                const effectId = event.currentTarget.dataset.effectId;
                return messageAction.applyEffect(effectId);
            }
        }
    });

    html.on("click", ".outerheaven .description", (event) => {
        // Toggle expanded state
        event.currentTarget.closest(".description").querySelector(".description-content").classList.toggle("expanded");
    });
});

// Conditionally expand item descriptions in chat messages according to user setting
Hooks.on("renderChatMessage", (_message, html, _data) => {
    const description = html[0].querySelector(".outerheaven .description");
    if (description) {
        const expandDescriptions = game.settings.get(SYSTEM.ID, "expandDescriptions");
        if (expandDescriptions) {
            description.querySelector(".description-content").classList.add("expanded");
        }
    }
});

// Add a toggle done button to the token HUD
Hooks.on("renderTokenHUD", (hud, html, _data) => {
    html = html[0];
    const combatant = hud.object.combatant;
    if (!combatant) return;
    if (!combatant.combat.team?.combatants.includes(combatant)) return;

    const isDone = hud.object.combatant.system?.done ?? false;
    const toggleDoneButton = document.createElement("div");
    toggleDoneButton.classList.add("control-icon", "toggle-done", SYSTEM.ID);
    if (isDone) toggleDoneButton.classList.add("active");
    toggleDoneButton.dataset.tooltip = "OH.Combat.Done";
    toggleDoneButton.innerHTML = `<i class="fas fa-check"></i>`;
    toggleDoneButton.addEventListener("click", async () => {
        await combatant.toggleDone();
        hud.render();
    });
    html.querySelector(".col.right").insertAdjacentElement("beforeend", toggleDoneButton);
});
