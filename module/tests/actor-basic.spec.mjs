import { SYSTEM_ID } from "../const.mjs";

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
        },
        {
            displayName: "OUTERHEAVEN: Actor Basic",
        },
    );
}
