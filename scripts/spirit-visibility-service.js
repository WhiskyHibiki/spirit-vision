import { MODULE_ID, FLAGS } from "./constants.js";

export class SpiritVisibilityService {
  isSpiritToken(tokenDocument) {
    return tokenDocument?.getFlag(MODULE_ID, FLAGS.IS_SPIRIT) === true;
  }

  actorHasSpiritSight(actor) {
    if (!actor?.prototypeToken) return false;
    return actor.prototypeToken.getFlag(MODULE_ID, FLAGS.SPIRIT_SIGHT) === true;
  }

  parseChannels(value) {
    if (typeof value !== "string") return [];

    return value
      .split(",")
      .map(channel => channel.trim())
      .filter(channel => channel.length > 0);
  }

  getActorSpiritChannels(actor) {
    if (!actor?.prototypeToken) return [];

    const raw = actor.prototypeToken.getFlag(MODULE_ID, FLAGS.SPIRIT_CHANNEL);
    return this.parseChannels(raw);
  }

  getTokenSpiritChannels(tokenDocument) {
    if (!tokenDocument) return [];

    const raw = tokenDocument.getFlag(MODULE_ID, FLAGS.SPIRIT_CHANNEL);
    return this.parseChannels(raw);
  }

  channelsMatch(actor, tokenDocument) {
    const actorChannels = this.getActorSpiritChannels(actor);
    const tokenChannels = this.getTokenSpiritChannels(tokenDocument);

    if (!actorChannels.length || !tokenChannels.length) return false;

    return actorChannels.some(channel => tokenChannels.includes(channel));
  }

  canUserSeeToken(user, tokenDocument) {
    if (!tokenDocument) return false;

    if (!this.isSpiritToken(tokenDocument)) return true;
    if (user?.isGM) return true;

    const actor = user?.character;
    if (!actor) return false;
    if (!this.actorHasSpiritSight(actor)) return false;

    return this.channelsMatch(actor, tokenDocument);
  }

  applySpiritStyle(token, isSpirit) {
    if (!token) return;

    if (isSpirit) {
      if (token.mesh) {
        token.mesh.tint = 0xAEE6FF;
        token.mesh.alpha = 0.55;
      }

      if (token.bars) token.bars.alpha = 0.55;
      if (token.effects) token.effects.alpha = 0.55;
      if (token.tooltip) token.tooltip.alpha = 0.8;
      if (token.nameplate) token.nameplate.alpha = 1.0;

      this.startSpiritAnimation(token);
    } else {
      this.stopSpiritAnimation(token);

      if (token.mesh) {
        token.mesh.tint = 0xFFFFFF;
        token.mesh.alpha = 1.0;
      }

      if (token.bars) token.bars.alpha = 1.0;
      if (token.effects) token.effects.alpha = 1.0;
      if (token.tooltip) token.tooltip.alpha = 1.0;
      if (token.nameplate) token.nameplate.alpha = 1.0;
    }
  }

  startSpiritAnimation(token) {
    if (!token?.mesh) return;

    if (token._spiritTickerFn) return;

    const baseAlpha = 0.55;
    const amplitude = 0.08;
    const speed = 0.003;

    const fn = (ticker) => {
      if (!token?.mesh || token.destroyed) return;

      const t = performance.now() * speed;
      token.mesh.alpha = baseAlpha + Math.sin(t) * amplitude;
    };

    token._spiritTickerFn = fn;
    PIXI.Ticker.shared.add(fn);
  }

  stopSpiritAnimation(token) {
    if (token?._spiritTickerFn) {
      PIXI.Ticker.shared.remove(token._spiritTickerFn);
      token._spiritTickerFn = null;
    }
  }

  applyVisibilityToToken(token) {
    if (!token?.document) return;

    const isSpirit = this.isSpiritToken(token.document);
    const spiritVisible = this.canUserSeeToken(game.user, token.document);

    // Preserve Foundry's native LOS / lighting visibility checks.
    // Spirit Vision may only further restrict visibility, never expand it.
    const nativeVisible = token.isVisible ?? token.visible;
    const hiddenByDocument = token.document.hidden === true && !game.user?.isGM;
    const isVisible = spiritVisible && nativeVisible && !hiddenByDocument;

    if (token.mesh) token.mesh.visible = isVisible;
    if (token.border) token.border.visible = isVisible;
    if (token.tooltip) token.tooltip.visible = isVisible;
    if (token.nameplate) token.nameplate.visible = isVisible;
    if (token.bars) token.bars.visible = isVisible;
    if (token.effects) token.effects.visible = isVisible;

    if (!isVisible) {
      this.stopSpiritAnimation(token);
      return;
    }

    this.applySpiritStyle(token, isSpirit);
  }

  applyVisibilityToCanvas() {
    if (!canvas?.ready) return;

    for (const token of canvas.tokens.placeables) {
      this.applyVisibilityToToken(token);
    }
  }
}