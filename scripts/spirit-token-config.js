import { MODULE_ID } from "./constants.js";

export class SpiritTokenConfig {
  constructor(configApp) {
    this.configApp = configApp;
  }

  inject(app, html) {
    if (!game.user.isGM) return;

    const tokenDocument = app.document;
    if (!tokenDocument) return;

    const rootEl = html?.[0] ?? html;
    if (!(rootEl instanceof HTMLElement)) {
      console.warn(`${MODULE_ID} | TokenConfig html is not HTMLElement`, html);
      return;
    }

    if (rootEl.querySelector(".spirit-vision-token-open")) return;

    const form = rootEl.querySelector("form") || rootEl;

    const wrap = document.createElement("fieldset");
    wrap.className = "spirit-vision-token-open";
    wrap.innerHTML = `
      <legend>Spirit Vision</legend>
      <div class="form-group">
        <button type="button" class="spirit-vision-token-open-btn">
          <i class="fas fa-ghost"></i> Open Spirit Vision Settings
        </button>
      </div>
      <p class="notes">Редактирует только этот токен на сцене.</p>
    `;

    wrap.querySelector(".spirit-vision-token-open-btn")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.configApp.openForToken(tokenDocument);
    });

    form.appendChild(wrap);
    console.log(`${MODULE_ID} | Token Config button injected`);
  }
}