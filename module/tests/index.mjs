import { registerActiveEffectTests } from "./active-effects.spec.mjs";
import { registerBasicActorTests } from "./actor-basic.spec.mjs";
import { registerWeaponAttackTest } from "./weapon-attack.spec.mjs";

Hooks.on("quenchReady", (quench) => {
    registerBasicActorTests(quench);
    registerWeaponAttackTest(quench);
    registerActiveEffectTests(quench);
});
