import { MODULE_ID } from "./constants.js";
import { SpiritVisibilityService } from "./spirit-visibility-service.js";
import { SpiritConfigApp } from "./spirit-config-app.js";
import { SpiritTokenConfig } from "./spirit-token-config.js";

class SpiritVisionModule {
  constructor() {
    this.moduleId = MODULE_ID;
    this.visibilityService = new SpiritVisibilityService();
    this.configApp = new SpiritConfigApp(this.visibilityService);
    this.tokenConfig = new SpiritTokenConfig(this.configApp);
  }

  init() {
    console.log(`${this.moduleId} | init`);
  }

  ready() {
    console.log(`${this.moduleId} | ready`);
    this.registerSocket();
    this.visibilityService.applyVisibilityToCanvas();
  }

  registerSocket() {
    game.socket.on(`module.${this.moduleId}`, (data) => {
      if (!data) return;

      if (data.type === "refreshVisibility") {
        console.log(`${this.moduleId} | received refreshVisibility`);
        this.visibilityService.applyVisibilityToCanvas();
      }
    });
  }

  broadcastVisibilityRefresh() {
    game.socket.emit(`module.${this.moduleId}`, {
      type: "refreshVisibility"
    });
  }

  isActorLikeApp(app) {
    return app?.document?.documentName === "Actor" || app?.actor;
  }

  getContextTokenDocument(app) {
    const actor = app.actor ?? app.document;

    if (actor?.isToken && actor?.token?.object?.document) {
      return actor.token.object.document;
    }

    if (actor?.token?.document) {
      return actor.token.document;
    }

    if (app?.token?.document) {
      return app.token.document;
    }

    if (app?.object?.document?.documentName === "Token") {
      return app.object.document;
    }

    return null;
  }

  injectActorButtonV2(app, html) {
    if (!game.user.isGM) return;
    if (!this.isActorLikeApp(app)) return;
    if (!(html instanceof HTMLElement)) return;

    if (html.querySelector(".spirit-vision-open-config")) return;

    const actor = app.actor ?? app.document;
    if (!actor) return;

    const target =
      html.querySelector(".window-header") ||
      html.querySelector("header") ||
      html.querySelector("form") ||
      html;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "spirit-vision-open-config";
    button.innerHTML = `<i class="fas fa-ghost"></i> Spirit Vision`;
    button.style.marginLeft = "8px";
    button.style.padding = "4px 8px";
    button.style.cursor = "pointer";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const tokenDocument = this.getContextTokenDocument(app);

      console.log("SpiritVision context", {
        actor,
        tokenDocument,
        isTokenActor: actor?.isToken,
        app
      });

      if (tokenDocument?.documentName === "Token") {
        this.configApp.openForToken(tokenDocument);
      } else {
        this.configApp.openForActor(actor);
      }
    });

    target.appendChild(button);
  }
}

const spiritVision = new SpiritVisionModule();
globalThis.SpiritVision = spiritVision;

Hooks.once("init", () => {
  spiritVision.init();
});

Hooks.once("ready", () => {
  spiritVision.ready();
});

Hooks.on("renderApplicationV2", (app, html) => {
  spiritVision.injectActorButtonV2(app, html);
});

Hooks.on("renderTokenConfig", (app, html) => {
  spiritVision.tokenConfig.inject(app, html);
});

Hooks.on("canvasReady", () => {
  spiritVision.visibilityService.applyVisibilityToCanvas();
});

Hooks.on("drawToken", (token) => {
  spiritVision.visibilityService.applyVisibilityToToken(token);
});

Hooks.on("refreshToken", (token) => {
  spiritVision.visibilityService.applyVisibilityToToken(token);
});

Hooks.on("updateToken", () => {
  spiritVision.visibilityService.applyVisibilityToCanvas();
});

Hooks.on("updateActor", () => {
  spiritVision.visibilityService.applyVisibilityToCanvas();
});