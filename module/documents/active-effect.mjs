import { ActiveEffectModel } from "../data/active-effect.mjs";

export class OHActiveEffect extends ActiveEffect {
    /**
     * The actor this ActiveEffect is eventually embedded in.
     *
     * @type {Actor}
     */
    get actor() {
        return this.parent?.actor;
    }

    /**
     * Whether this ActiveEffect is suppressed due to system-specific logic, or should affect the actor.
     *
     * @type {boolean}
     */
    get isSuppressed() {
        // Only the currently chosen stance is active and applied
        if (this.system.type === "stance") {
            return this.actor?.system.stance !== this;
        }
        return false;
    }

    /** @override */
    async _preUpdate(data, options, userId) {
        // Clean and validate `flags.outerheaven` before updating
        // HACK: This sneaks DataModel validation into the update process, outside of the normal DataModel handling,
        //       which is necessary because ActiveEffects do not allow for a `system` space, so we have to use `flags`.
        if (hasProperty(data, "flags.outerheaven")) {
            setProperty(data, "flags.outerheaven", this.system.updateSource(data.flags.outerheaven, { dryRun: true }));
        }
        return super._preUpdate(data, options, userId);
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        // HACK: This sneaks DataModel initialization into the document lifecyle, although _not_ at the usual time;
        //       this is necessary as ActiveEffects do not allow for a `system` space, so we have to use `flags`.
        this.system = new ActiveEffectModel(this.flags.outerheaven ?? {}, { parent: this, strict: false });
    }

    /** @override */
    prepareDerivedData() {
        // Never transfer "template" type effects that are meant to be applied to _other_ actors
        if (this.system.type === "template") this.transfer = false;
    }

    /**
     * Enhance the default implementation with the option to get a relative UUID
     * for an ActiveEffect embedded in an Item embedded in an Actor.
     *
     * @override
     * @returns {string} The relative UUID for this ActiveEffect
     */
    getRelativeUUID(doc, { toActor = false } = {}) {
        if (toActor) {
            if (this.actor)
                return `.${this.parent.constructor.documentName}.${this.parent.id}.${this.constructor.documentName}.${this.id}`;
        }
        return super.getRelativeUUID(doc);
    }
}
