# oh-foundry
FoundryVTT system for the Outer Heaven ttrpg system

# Currently implemented
A single actor type which is able to :
- Allow for the edition of base actor data. (Such as health, power, speed, saves and number of actions...)
- Contain items types (which they can add, edit and remove from the sheet)
- Show an item summary in chat
- Show a summary of the unit's defenses in chat
- Use weapon items and have their attack roll and damage roll displayed in chat.
- Tally up a total point cost from all the items of the actor
- Use effects for buffs and such. (Pretty barebones)

A number of item types :
- Equipment, Ability and Skill types, which are quite simple.
- Weapons, which have the ability to be used to shoot from the actor sheet.
- Armors, which may provide a number of defenses then displayed on the actor sheet.

# What is currently broken
- Armors are broken. I was trying to implement damage type constants but was unable to properly handle them.
- Negative point values for items are not tallied up properly, don't think that always was the case, might have broken with v11.
- On the actor sheet, textboxes that edit values in items.

# Features I WANT to implement (high priority)
- Finish damage types handling
- Add a global setting which should allow choosing one of the three ways to handle crits in the system. (Unlimited, Limited, NoCrit)
- Implement the Limited and NoCrit options to the damage calculation.
- When shooting a weapon, if a token is targeted, the token's current 'AC' should be displayed in the chat template
- When shooting a weapon, if a token is targeted, a second damage value taking into account the actor's armor against that weapon should be calculated and displayed.
- When shooting a weapon, if a token is targeted, the number of range increments over the regular range should be taken into account for the attack calculation.
- Weapons should have an option to be reloaded to full, which would display a chat template.
- Actor power should be reduced when using a weapon with power usage.
- If a token is selected, we should be able to apply damage from an attack to that token (using a button in the chat template ?)
- Effects should be made into an item type, in order to allow them to be stored in a compendium.
- A button to open a set of compendiums from the actor sheet.

# Features I would like to implement (lower priority)
- Items other than weapons can be 'used' (charges and power consumption)
- An actor or item type used to handle the newly made campaign system (Mostly a simple record sheet, with a few functionalities allowing for passing a week and calculating expenses.)
- All items types can have embeded effects that apply to the actor.
- A few measurement Templates
- Side/Team initative instead of individual token initiative
- Add a heat generation stat to items which, when used, would increase the actor's Heat value.
- Add an actor heat dissipation stat which would reduce the actor's current heat value on the start of his turn.
- Damage over Time effects that trigger on turn start.
- Vehicle actors that can contain other actors...
