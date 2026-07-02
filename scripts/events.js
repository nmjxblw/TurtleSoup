/* ================================================================
   events.js — 事件绑定
   ================================================================ */

/**
 * 绑定页面事件。
 * @returns {void} 无返回值。
 */
function wireEvents() {
  DOMRef["cover-start-btn"].addEventListener("click", startFromCover);
  DOMRef["cover-review-btn"].addEventListener("click", () => {
    if (restoreGame()) {
      enterGame(true);
      showResultOverlay();
    }
  });
  DOMRef["apikey-form"].addEventListener("submit", handleApikeySubmit);
  DOMRef["apikey-skip"].addEventListener("click", () => {
    GameState.apiKey = "";
    GameState.demoMode = true;
    saveSettings();
    populateConfigForm();
    goConfig();
  });
  DOMRef["apikey-back"].addEventListener("click", goCover);
  DOMRef["apikey-toggle"].addEventListener("click", () => {
    const inp = DOMRef["apikey-input"];
    inp.type = inp.type === "password" ? "text" : "password";
    DOMRef["apikey-toggle"].textContent = inp.type === "password" ? "👁" : "🙈";
  });
  DOMRef["config-form"].addEventListener("submit", handleConfigSubmit);
  DOMRef["config-back"].addEventListener("click", () => {
    goApikey();
  });
  DOMRef["config-difficulty"].addEventListener("change", syncCustomControls);
  DOMRef["config-custom-difficulty"].addEventListener(
    "change",
    syncDeathModeToggle,
  );
  DOMRef["dice-random-style"].addEventListener("click", () => {
    const diffs = ["newb", "easy", "hard", "hardcore"];
    DOMRef["config-custom-difficulty"].value =
      diffs[Math.floor(Math.random() * diffs.length)];
    const randQL = Math.floor(Math.random() * 26) + 5;
    DOMRef["config-question-limit"].value = randQL;
    DOMRef["ql-val"].textContent = randQL;
    const randTL = Math.floor(Math.random() * 99) * 100 + 200;
    DOMRef["config-text-length"].value = randTL;
    DOMRef["tl-val"].textContent = randTL;
    DOMRef["config-honkaku"].checked = Math.random() > 0.5;
    [
      ...DOMRef["config-style-picks"].querySelectorAll(
        'input[type="checkbox"]',
      ),
    ].forEach((cb) => (cb.checked = false));
    DOMRef["config-custom-style"].value = t("randomStyle");
  });
  DOMRef["config-question-limit"].addEventListener("input", () => {
    DOMRef["ql-val"].textContent = DOMRef["config-question-limit"].value;
  });
  DOMRef["config-text-length"].addEventListener("input", () => {
    DOMRef["tl-val"].textContent = DOMRef["config-text-length"].value;
  });
  DOMRef["question-form"].addEventListener("submit", handleQuestion);
  DOMRef["submit-soup-btn"].addEventListener("click", openSoupModal);
  DOMRef["view-result-btn"].addEventListener("click", () => {
    if (GameState.scoreResult) showResultOverlay();
  });
  DOMRef["modal-submit-btn"].addEventListener("click", submitSoup);
  DOMRef["modal-cancel-btn"].addEventListener("click", closeSoupModal);
  DOMRef["modal-giveup-btn"].addEventListener("click", () => {
    DOMRef["soup-modal"].classList.add("hidden");
    clearGameProgress();
    startFromCover();
  });
  DOMRef["result-export-btn"].addEventListener("click", exportJson);
  DOMRef["result-share-btn"].addEventListener("click", exportSoup);
  DOMRef["game-share-btn"].addEventListener("click", exportSoup);
  DOMRef["result-close-btn"].addEventListener("click", hideResultOverlay);
  DOMRef["result-replay-btn"].addEventListener("click", () => {
    hideResultOverlay();
    clearGameProgress();
    startFromCover();
  });
  DOMRef["theme-toggle"].addEventListener("click", () => {
    toggleTheme();
    closeSideMenu();
  });
  DOMRef["lang-toggle"].addEventListener("click", () => {
    toggleLanguage();
    closeSideMenu();
  });
  DOMRef["menu-close-btn"].addEventListener("click", closeSideMenu);
  DOMRef["menu-overlay"].addEventListener("click", closeSideMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && DOMRef["side-menu"].classList.contains("open")) {
      closeSideMenu();
    }
  });
  DOMRef["nokey-go-btn"].addEventListener("click", () => {
    DOMRef["nokey-modal"].classList.add("hidden");
    goApikey();
  });
  DOMRef["nokey-cancel-btn"].addEventListener("click", () => {
    DOMRef["nokey-modal"].classList.add("hidden");
  });
  DOMRef["error-retry-btn"].addEventListener("click", () => {
    DOMRef["error-modal"].classList.add("hidden");
    DOMRef["config-form"].dispatchEvent(
      new Event("submit", { cancelable: true }),
    );
  });
  DOMRef["error-demo-btn"].addEventListener("click", () => {
    DOMRef["error-modal"].classList.add("hidden");
    GameState.demoMode = true;
    GameState.generated = buildDemoStory();
    GameState.remainingQuestions = getQuestionLimit();
    saveGameProgress();
    enterGame();
  });
  DOMRef["error-cancel-btn"].addEventListener("click", () => {
    DOMRef["error-modal"].classList.add("hidden");
  });
  DOMRef["import-soup-btn"].addEventListener("click", () => {
    DOMRef["import-soup-input"].click();
  });
  DOMRef["import-soup-input"].addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importSoup(file);
    DOMRef["import-soup-input"].value = "";
  });
}
