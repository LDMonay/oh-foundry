import { SYSTEM } from "../const.mjs";
import { createActor, createEffects, createItems, updateSource } from "./utils.mjs";

/**
 * @param {import("@ethaks/fvtt-quench/lib").Quench} quench
 */
export function registerActiveEffectTests(quench) {
    quench.registerBatch(
        `${SYSTEM.ID}.active-effects.basic`,
        (context) => {
            const { describe, it, assert, expect, should, before, after } = context;

            describe("ActiveEffect types", function () {
                it("should accept blank type", function () {
                    const ae = new ActiveEffect.implementation({ name: "Test Effect" });
                    expect(ae).to.be.an.instanceof(ActiveEffect);
                });

                it("should accept stance type", function () {
                    const ae = new ActiveEffect.implementation({
                        name: "Test Effect",
                        flags: { outerheaven: { type: "stance" } },
                    });
                    expect(ae).to.be.an.instanceof(ActiveEffect);
                    expect(ae.system.type).to.equal("stance");
                });

                it("should accept onUse type", function () {
                    const ae = new ActiveEffect.implementation({
                        name: "Test Effect",
                        flags: { outerheaven: { type: "onUse" } },
                    });
                    expect(ae).to.be.an.instanceof(ActiveEffect);
                    expect(ae.system.type).to.equal("onUse");
                });

                it("should not transfer onUse type effects", function () {
                    const actor = createActor();
                    const [item] = createItems([{ name: "AE Test Armor" }], { parent: actor });
                    const [effect] = createEffects([{ name: "AE Test Effect", system: { type: "onUse" } }], {
                        parent: item,
                    });

                    expect(effect).to.be.an.instanceof(ActiveEffect);
                    expect([...actor.allApplicableEffects()]).to.have.lengthOf(0);
                    expect(actor.items.contents[0].effects).to.have.lengthOf(1);
                });
            });

            describe("ActiveEffect suppression", function () {
                it("should only allow one active stance", async function () {
                    const actor = createActor({ name: "Stance Test" });
                    const [item] = createItems([{ name: "Stance Armor" }], { parent: actor });
                    const [stance1, stance2] = createEffects(
                        [
                            { name: "Stance 1", system: { type: "stance" } },
                            { name: "Stance 2", system: { type: "stance" } },
                        ],
                        { parent: item },
                    );

                    // Both stances should transfer to the actor, but remain suppressed
                    const actorEffects = [...actor.allApplicableEffects()];
                    expect(actorEffects).to.have.lengthOf(2);
                    expect(actorEffects.every((effect) => effect.system.type === "stance")).to.be.true;
                    expect(actorEffects.every((effect) => effect.isSuppressed)).to.be.true;
                    expect(actor.system.stance).to.be.null;

                    updateSource(actor, { "system.stance": stance1.getRelativeUUID(null, { toActor: true }) });

                    expect([...actor.allApplicableEffects()]).to.have.lengthOf(2);
                    expect(actor.system.stance).to.equal(stance1);
                    expect(stance1.isSuppressed).to.be.false;
                    expect(stance2.isSuppressed).to.be.true;
                });
            });
        },
        {
            displayName: "OUTERHEAVEN: Active Effects",
        },
    );
}
