import { SYSTEM_ID } from "../const.mjs";
import { DamageRoll } from "../dice/damage-roll.mjs";

/** @param {import("@ethaks/fvtt-quench/lib").Quench} quench */
export function registerWeaponAttackTest(quench) {
    quench.registerBatch(
        `${SYSTEM_ID}.weapon-attack`,
        (context) => {
            const { describe, it, assert, expect, should, before, after } = context;

            describe("Basic Attack", function () {
                let actor, item, message;
                const messages = [];
                before(async function () {
                    actor = await Actor.create({ name: "Test Actor", type: "unit" });
                    item = await Item.create(
                        {
                            type: "weapon",
                            name: "Test Weapon",
                            system: {
                                damagePerAttack: "1d6 + 1",
                            },
                        },
                        { parent: actor },
                    );
                });
                after(async function () {
                    await actor.delete();
                    await ChatMessage.deleteDocuments(messages.map((m) => m.id));
                });

                it("should create a message", async function () {
                    message = await item.use();
                    messages.push(message);
                    expect(message).to.be.an.instanceof(ChatMessage);
                    // Check Rolls
                    expect(message.rolls).to.have.lengthOf(2);
                });

                it("should create rolls", function () {
                    expect(message.rolls).to.have.lengthOf(2);
                    expect(message.rolls[0]).to.be.an.instanceof(Roll);
                    expect(message.rolls[1]).to.be.an.instanceof(DamageRoll);
                });

                it("should roll damage", async () => {
                    expect(message.action.damageRoll).to.be.an.instanceof(DamageRoll);
                    // Check Damage formula; expects normal crit rules
                    expect(message.action.damageRoll.formula).to.equal("1d6x + 1");
                });
            });
        },
        {
            displayName: "OUTERHEAVEN: Weapon Attack",
        },
    );
}
