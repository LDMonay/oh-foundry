import { SYSTEM } from "../const.mjs";

export class OHToken extends Token {
    /**
     * Draw effects, adding specific ones not part of the core implementation (e.g. the non-temporary stance).
     * Synced with Foundry 11.315
     *
     * @override
     */
    async drawEffects() {
        const wasVisible = this.effects.visible;
        this.effects.visible = false;
        this.effects.removeChildren().forEach((c) => c.destroy());
        this.effects.bg = this.effects.addChild(new PIXI.Graphics());
        this.effects.bg.visible = false;
        this.effects.overlay = null;

        // Categorize new effects
        const tokenEffects = this.document.effects;
        const actorEffects = [...(this.actor?.temporaryEffects || [])];
        // Include stance effect and done overlay
        if (this.actor?.system?.stance) actorEffects.unshift(this.actor.system.stance);
        let overlay = this.combatant?.system?.done
            ? { src: `systems/${SYSTEM.ID}/icons/check-mark.svg`, tint: "7ED321" }
            : { src: this.document.overlayEffect, tint: null };

        // Draw status effects
        if (tokenEffects.length || actorEffects.length) {
            const promises = [];

            // Draw actor effects first
            for (const f of actorEffects) {
                if (!f.icon) continue;
                const tint = Color.from(f.tint ?? null);
                if (f.getFlag("core", "overlay")) {
                    if (overlay) promises.push(this._drawEffect(overlay.src, overlay.tint));
                    overlay = { src: f.icon, tint };
                    continue;
                }
                promises.push(this._drawEffect(f.icon, tint));
            }

            // Next draw token effects
            for (const f of tokenEffects) promises.push(this._drawEffect(f, null));
            await Promise.all(promises);
        }

        // Draw overlay effect
        this.effects.overlay = await this._drawOverlay(overlay.src, overlay.tint);
        this.effects.bg.visible = true;
        this.effects.visible = wasVisible;
        this._refreshEffects();
    }
}
