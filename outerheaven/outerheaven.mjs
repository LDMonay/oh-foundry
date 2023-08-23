import {OHItemSheet} from "./modules/sheets/OHItemSheet.mjs";
import {OHUnitSheet} from "./modules/sheets/OHUnitSheet.mjs";
import {OHItem} from "./modules/OHItem.mjs"
import {OHUnit} from "./modules/OHUnit.mjs"
import {OUTERHEAVEN} from "./modules/config.mjs";

async function preloadHandlebarsTemplates() {
    const partials = [
      "systems/outerheaven/templates/sheets/parts/melee-block.hbs",
      "systems/outerheaven/templates/sheets/parts/ranged-block.hbs",
      "systems/outerheaven/templates/sheets/parts/unit-abilities.hbs",
      "systems/outerheaven/templates/sheets/parts/unit-defenses.hbs",
      "systems/outerheaven/templates/sheets/parts/unit-items.hbs",
      "systems/outerheaven/templates/sheets/parts/unit-skills.hbs",
      "systems/outerheaven/templates/sheets/parts/unit-stats-sidebar.hbs",
      "systems/outerheaven/templates/sheets/parts/unit-stats-defense.hbs",
      "systems/outerheaven/templates/sheets/parts/unit-weapons.hbs",
      "systems/outerheaven/templates/chat/item-display.hbs",
      "systems/outerheaven/templates/chat/defense-display.hbs",
      "systems/outerheaven/templates/chat/defense-stats-display.hbs",
      "systems/outerheaven/templates/chat/weapon-display.hbs",
      "systems/outerheaven/templates/chat/weapon-use.hbs"
    ];
  
    const paths = {};
    for ( const path of partials ) {
      paths[path.replace(".hbs", ".html")] = path;
      paths[`oh.${path.split("/").pop().replace(".hbs", "")}`] = path;
    }
  
    return loadTemplates(paths);
  }

Hooks.once("init", function(){
    console.log("Outer Heaven | Initializing the battlefield...")

    CONFIG.OUTERHEAVEN = OUTERHEAVEN;
    CONFIG.Item.documentClass = OHItem;
    CONFIG.Actor.documentClass = OHUnit;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("outerheaven", OHItemSheet, {makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("outerheaven", OHUnitSheet, {makeDefault: true});

    preloadHandlebarsTemplates();
    console.log("Outer Heaven | Finished Loading the templates")

    Handlebars.registerHelper("sum", function(a, b) {
      return a+b;
    })
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
  console.log("Outer Heaven | Activated Macro Drag&Drop");
});

async function createItemMacro(data, slot) {
  
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }

  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.outerheaven.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "outerheaven.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    if (item.type === 'weapon')
    {
      
    }
    else
    {
      item.displayInChat();
    }
  });
}