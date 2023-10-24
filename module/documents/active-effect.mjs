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
    _initialize(options) {
        // TODO: Properly sort order in data preparation
        this.system.updateSource(this._source?.flags?.outerheaven ?? {});
        super._initialize(options);
    }

    /** @override */
    _configure(options) {
        super._configure(options);
        this.system = new ActiveEffectModel(this._source.flags?.outerheaven ?? {}, { parent: this });
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

/**
 * @param {Application} app
 * @param {JQuery} html
 * @param {object} data
 */
export function onRenderActiveEffectConfig(app, html, data) {
    const renderData = { ...data, system: app.object.system, config: outerheaven.config };
    const newHtml = Handlebars.partials["oh.ae-config"](renderData);
    html.find(".tab[data-tab='details']").append(newHtml);
}
