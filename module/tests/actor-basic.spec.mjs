import { SYSTEM_ID } from "../const.mjs";
import { createActor, createItems } from "./utils.mjs";

/**
 * @param {import("@ethaks/fvtt-quench/lib").Quench} quench
 */
export function registerBasicActorTests(quench) {
    quench.registerBatch(
        `${SYSTEM_ID}.actor.basic`,
        (context) => {
            const { describe, it, assert, expect, should, before, after } = context;

            describe("Unit point handling", function () {
                it("should have 100 max unit points", function () {
                    const actor = new Actor.implementation({
                        name: "Test Actor",
                        type: "unit",
                        system: { maxPoints: 100 },
                    });
                    expect(actor.system.maxPoints).to.equal(100);
                });

                it("should total item points", function () {
                    const testItem = new Item.implementation({
                        name: "Test Item",
                        type: "weapon",
                        system: { pointCost: 10 },
                    });
                    const actor = new Actor.implementation({
                        name: "Test Actor",
                        type: "unit",
                        system: { maxPoints: 100 },
                        items: [testItem.toObject()],
                    });
                    expect(actor.system.totalPoints).to.equal(10);
                });
            });

            describe("Profile/Defense", function () {
                it("should initialize with default values", function () {
                    const actor = createActor();
                    expect(actor.system.profile.total).to.equal(6);
                    expect(actor.system.defense.total).to.equal(11);
                });

                it("should add misc bonuses", function () {
                    const actor = createActor({ defense: { miscBonus: 5 }, profile: { miscBonus: 5 } });
                    expect(actor.system.profile.total).to.equal(11);
                    expect(actor.system.defense.total).to.equal(16);
                });
            });

            describe("Armor", function () {
                it("should initialize with default values", function () {
                    const actor = createActor();
                    expect(Object.values(actor.system.armor).every((armor) => armor === 0)).to.be.true;
                });

                it("should add a single armor bonus", function () {
                    const actor = createActor();
                    createItems([{ type: "armor", system: { armorBonuses: [{ armorType: "piercing", value: 10 }] } }], {
                        parent: actor,
                    });
                    expect(actor.system.armor.piercing).to.equal(10);
                    expect(
                        Object.entries(actor.system.armor)
                            .filter(([armor]) => armor !== "piercing")
                            .every(([, value]) => value === 0),
                    ).to.be.true;
                });

                it("should add an 'all' armor bonus", function () {
                    const actor = createActor();
                    createItems([{ type: "armor", system: { armorBonuses: [{ armorType: "all", value: 10 }] } }], {
                        parent: actor,
                    });
                    expect(Object.values(actor.system.armor).every((armor) => armor === 10)).to.be.true;
                });

                it("should add specific an 'all' armor bonuses", function () {
                    const actor = createActor();
                    createItems(
                        [
                            { type: "armor", system: { armorBonuses: [{ armorType: "piercing", value: 10 }] } },
                            {
                                type: "armor",
                                system: { armorBonuses: [{ armorType: "all", value: 10 }] },
                            },
                        ],
                        {
                            parent: actor,
                        },
                    );
                    expect(actor.system.armor.piercing).to.equal(20);
                    expect(actor.system.armor.slashing).to.equal(10);
                });
            });
        },
        {
            displayName: "OUTERHEAVEN: Actor Basic",
        },
    );
}
