/* ================================================================
   main.js — 入口 & 启动流程
   ================================================================ */

/**
 * 启动应用。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function boot() {
  await Promise.all([loadI18n(), loadPrompts()]);
  initDom();
  loadSettings();
  initTheme();
  initLangIcon();
  wireEvents();
  initToggleDrag();
  initMenuDrag();
  initGameSplitHandle();
  syncI18n();
  if (restoreGame()) {
    enterGame(true);
    if (GameState.isFinished) showResultOverlay();
  } else {
    goCover();
    const progress = loadGameProgress();
    if (progress && progress.isFinished) {
      DOMRef["cover-review-btn"].classList.remove("hidden");
    }
  }
  window.addEventListener("beforeunload", saveGameProgress);
}

document.addEventListener("DOMContentLoaded", () => boot());
