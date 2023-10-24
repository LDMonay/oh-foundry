export const OUTERHEAVEN = {};

OUTERHEAVEN.weaponTypes = {
    ranged: "OH.WeaponTypes.Ranged",
    melee: "OH.WeaponTypes.Melee",
};

OUTERHEAVEN.defenseTypes = {
    profile: "OH.DefenseTypes.Profile",
    defense: "OH.DefenseTypes.Defense",
};

const baseDamageTypes = {
    untyped: "OH.DamageTypes.Untyped",
    energy: "OH.DamageTypes.Energy",
    explosive: "OH.DamageTypes.Explosive",
    ballistic: "OH.DamageTypes.Ballistic",
    piercing: "OH.DamageTypes.Piercing",
    slashing: "OH.DamageTypes.Slashing",
    crushing: "OH.DamageTypes.Crushing",
    fire: "OH.DamageTypes.Fire",
    gravity: "OH.DamageTypes.Gravity",
    bleeding: "OH.DamageTypes.Bleeding",
    toxic: "OH.DamageTypes.Toxic",
    radiation: "OH.DamageTypes.Radiation",
    magic: "OH.DamageTypes.Magic",
    psi: "OH.DamageTypes.Psi",
    holy: "OH.DamageTypes.Holy",
    unholy: "OH.DamageTypes.Unholy",
};

OUTERHEAVEN.damageTypes = {
    ...baseDamageTypes,
    true: "OH.DamageTypes.True",
};

OUTERHEAVEN.armorTypes = {
    ...baseDamageTypes,
    all: "OH.DamageTypes.All",
};

OUTERHEAVEN.effectTypes = {
    stance: "OH.EffectTypes.Stance",
    template: "OH.EffectTypes.Template",
};

OUTERHEAVEN.ACTIONS = {};
