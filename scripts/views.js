/* ================================================================
   views.js — 视图切换
   ================================================================ */

/**
 * 切换页面视图。
 * @param {string} viewId 视图 ID。
 * @returns {void} 无返回值。
 */
function showView(viewId) {
  const wasGame = !DOMRef["view-game"].classList.contains("hidden");
  if (GameState.deathMode && wasGame && viewId !== "view-game") {
    freezeDeathTimer();
  }
  [
    "view-cover",
    "view-apikey",
    "view-config",
    "view-loading",
    "view-game",
  ].forEach((id) => {
    DOMRef[id].classList.toggle("hidden", id !== viewId);
  });
  if (GameState.deathMode && viewId === "view-game") {
    resumeDeathTimer();
  }
}

/**
 * 返回封面页。
 * @returns {void} 无返回值。
 */
function goCover() {
  showView("view-cover");
  DOMRef["cover-review-btn"].classList.add("hidden");
  const progress = loadGameProgress();
  if (progress && progress.isFinished) {
    DOMRef["cover-review-btn"].classList.remove("hidden");
  }
}

/**
 * 进入 API Key 页面。
 * @returns {void} 无返回值。
 */
function goApikey() {
  showView("view-apikey");
  if (GameState.apiKey) DOMRef["apikey-input"].value = GameState.apiKey;
}

/**
 * 进入配置页面。
 * @returns {void} 无返回值。
 */
function goConfig() {
  stopLoadingTitleTimer();
  showView("view-config");
}

/**
 * 进入加载页面。
 * @returns {void} 无返回值。
 */
function goLoading() {
  showView("view-loading");
  startLoadingWords();
}

/**
 * 进入游戏页面。
 * @returns {void} 无返回值。
 */
function goGame() {
  stopLoadingTitleTimer();
  showView("view-game");
  stopLoadingWords();
}
