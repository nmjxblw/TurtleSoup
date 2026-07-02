/* ================================================================
   loading.js — 加载页动画（词条轮播 & 标题计时器）
   ================================================================ */

let _loadingWordsTimer = null;

/**
 * 开始加载页词条轮播。
 * @returns {void} 无返回值。
 */
function startLoadingWords() {
  stopLoadingWords();
  const words = [
    t("loadingWord1"),
    t("loadingWord2"),
    t("loadingWord3"),
    t("loadingWord4"),
  ];
  const container = DOMRef["loading-words"];
  if (!container) return;
  container.innerHTML = "";
  let idx = 0;
  const span = document.createElement("span");
  span.className = "loading-word";
  container.appendChild(span);

  /**
   * 推进词条轮播一次。
   * @returns {void} 无返回值。
   */
  function tick() {
    span.textContent = words[idx % words.length];
    span.style.animation = "none";
    void span.offsetHeight;
    span.style.animation = "";
    span.addEventListener(
      "animationend",
      () => {
        idx++;
        _loadingWordsTimer = setTimeout(tick, 200);
      },
      { once: true },
    );
  }
  tick();
}

/**
 * 停止加载页词条轮播。
 * @returns {void} 无返回值。
 */
function stopLoadingWords() {
  if (_loadingWordsTimer) {
    clearTimeout(_loadingWordsTimer);
    _loadingWordsTimer = null;
  }
  const container = DOMRef["loading-words"];
  if (container) container.innerHTML = "";
}

/**
 * 启动加载标题计时器。
 * @returns {void} 无返回值。
 */
function startLoadingTitleTimer() {
  stopLoadingTitleTimer();
  GameState.loadingElapsedSeconds = 0;
  refreshLoadingTitle();
  loadingTitleTimer = setInterval(() => {
    if (GameState.loadingPhase !== "story") return;
    GameState.loadingElapsedSeconds += 1;
    refreshLoadingTitle();
  }, 1000);
}

/**
 * 停止加载标题计时器。
 * @returns {void} 无返回值。
 */
function stopLoadingTitleTimer() {
  if (loadingTitleTimer) {
    clearInterval(loadingTitleTimer);
    loadingTitleTimer = null;
  }
}
