import { MODULE_ID, FLAGS } from "./constants.js";

export class SpiritConfigApp {
  constructor(visibilityService) {
    this.visibilityService = visibilityService;
  }

  openForActor(actor) {
    console.log("SpiritVision openForActor:", actor);

    if (!actor?.prototypeToken) {
      console.warn("SpiritVision openForActor: actor has no prototypeToken", actor);
      return;
    }

    return this.open(actor.prototypeToken, {
      title: `Spirit Vision: Prototype Token — ${actor.name}`,
      modeLabel: "Editing: Prototype Token",
      actor,
      tokenDocument: null
    });
  }

  openForToken(tokenDocument) {
    console.log("SpiritVision openForToken:", tokenDocument);

    if (!tokenDocument || tokenDocument.documentName !== "Token") {
      console.warn("SpiritVision openForToken received invalid tokenDocument", tokenDocument);
      return;
    }

    return this.open(tokenDocument, {
      title: `Spirit Vision: Scene Token — ${tokenDocument.name}`,
      modeLabel: "Editing: Scene Token",
      actor: null,
      tokenDocument
    });
  }

  async refreshRelatedTokens({ actor = null, tokenDocument = null } = {}) {
    console.log("SpiritVision refreshRelatedTokens:", { actor, tokenDocument });

    if (!canvas?.ready || !this.visibilityService) return;

    // Если редактировали конкретный токен на сцене — обновляем только его
    if (tokenDocument && tokenDocument.documentName === "Token") {
      const token = canvas.tokens.placeables.find(t => t.document.id === tokenDocument.id);
      if (token) {
        this.visibilityService.applyVisibilityToToken(token);
        token.refresh();
      }
      return;
    }

    // Если редактировали prototype token актёра —
    // ничего не копируем в scene tokens, только локально пересчитываем видимость.
    if (actor) {
      this.visibilityService.applyVisibilityToCanvas();
      return;
    }

    this.visibilityService.applyVisibilityToCanvas();
  }

  open(targetDocument, { title, modeLabel, actor = null, tokenDocument = null }) {
    const isSpirit = targetDocument.getFlag(MODULE_ID, FLAGS.IS_SPIRIT) === true;
    const spiritSight = targetDocument.getFlag(MODULE_ID, FLAGS.SPIRIT_SIGHT) === true;
    const spiritChannel = targetDocument.getFlag(MODULE_ID, FLAGS.SPIRIT_CHANNEL) ?? "";

    const content = `
      <form class="spirit-vision-form">
        <p class="notes" style="margin-bottom: 0.75rem;">${modeLabel}</p>

        <div class="form-group">
          <label>Is Spirit</label>
          <div class="form-fields">
            <input type="checkbox" name="isSpirit" ${isSpirit ? "checked" : ""}>
          </div>
          <p class="notes">Помечает цель как духа.</p>
        </div>

        <div class="form-group">
          <label>Spirit Sight</label>
          <div class="form-fields">
            <input type="checkbox" name="spiritSight" ${spiritSight ? "checked" : ""}>
          </div>
          <p class="notes">Позволяет видеть духов с совпадающими каналами.</p>
        </div>

        <div class="form-group">
          <label>Spirit Channels</label>
          <div class="form-fields">
            <input type="text" name="spiritChannel" value="${spiritChannel}">
          </div>
          <p class="notes">Через запятую: wolf, ancestor, dream</p>
        </div>
      </form>
    `;

    new Dialog({
      title,
      content,
      buttons: {
        save: {
          label: "Save",
          callback: async (html) => {
            const root = html?.[0] ?? html;
            const form = root.querySelector(".spirit-vision-form");
            if (!form) {
              console.warn("SpiritVision: form not found in dialog");
              return;
            }

            const isSpiritValue =
              form.querySelector('[name="isSpirit"]')?.checked === true;

            const spiritSightValue =
              form.querySelector('[name="spiritSight"]')?.checked === true;

            const spiritChannelValue =
              form.querySelector('[name="spiritChannel"]')?.value?.trim() ?? "";

            await targetDocument.setFlag(MODULE_ID, FLAGS.IS_SPIRIT, isSpiritValue);
            await targetDocument.setFlag(MODULE_ID, FLAGS.SPIRIT_SIGHT, spiritSightValue);
            await targetDocument.setFlag(MODULE_ID, FLAGS.SPIRIT_CHANNEL, spiritChannelValue);

            await this.refreshRelatedTokens({ actor, tokenDocument });

            globalThis.SpiritVision?.broadcastVisibilityRefresh?.();

            ui.notifications.info("Spirit Vision settings saved");
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "save"
    }).render(true);
  }
}