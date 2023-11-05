export class OHActiveEffectConfig extends ActiveEffectConfig {
    /** @override */
    get template() {
        return "systems/outerheaven/templates/sheets/active-effect-config.hbs";
    }

    /** @override */
    async getData(options = {}) {
        const context = await super.getData(options);
        context.config = outerheaven.config;
        context.system = this.object.system;
        return context;
    }
}
