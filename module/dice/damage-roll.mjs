/**
 * Extend the basic Roll class to implement damage roll logic for the system.
 *
 * @augments {Roll}
 */
export class DamageRoll extends Roll {
    constructor(formula, data, options = {}) {
        super(formula, data, options);

        this.options.critical ??= this.constructor.CRIT_MODIFIERS[game.settings.get("outerheaven", "criticals")];

        // Enforce critical modifiers on all die terms according to the setting.
        this._applyCriticalRule();
    }

    /**
     * An enum of roll modifiers, mapping the critical setting to a modifier.
     */
    static CRIT_MODIFIERS = Object.freeze({
        unlimited: "x",
        limited: "xo",
        none: null,
    });

    /** @type {DamageType} */
    get damageType() {
        return this.options.damageType;
    }

    /**
     * Apply the critical setting to this roll's die terms when creating a new, un-evaluated roll.
     * TODO: Once Peggy grammar is implemented, it should be investigated for the possibility of affecting nested terms.
     *
     * @returns {void}
     * @private
     */
    _applyCriticalRule() {
        // Do not change the formula if it has already been evaluated.
        if (this._evaluated) return;
        // If no critical rule is set, do nothing.
        if (!this.options.critical) return;

        for (const term of this.terms) {
            if (term instanceof Die) term.modifiers = [this.options.critical];
        }

        // Reset the formula to reflect changes to modifiers.
        this.resetFormula();
    }
}
