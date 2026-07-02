/* ================================================================
   soup.js — 提交汤底 / 评分 / 弹窗
   ================================================================ */

/**
 * 中文说明：提交汤底并进入评分。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function submitSoup() {
  if (!GameState.generated) return;
  const guess = DOMRef["modal-soup-input"].value.trim();
  if (!guess) {
    addChatMsg("assistant", t("needSoup"), "chatRoleSystem", "needSoup");
    GameState.questionLog.push({
      role: "assistant",
      content: t("needSoup"),
      i18nKey: "needSoup",
      at: new Date().toISOString(),
    });
    saveGameProgress();
    return;
  }
  DOMRef["soup-modal"].classList.add("hidden");
  GameState.isFinished = true;
  stopSpeedTimer();
  goLoading();
  stopLoadingTitleTimer();
  GameState.loadingPhase = "evaluate";
  GameState.loadingCount = 0;
  startLoadingWords();

  if (GameState.demoMode) {
    GameState.scoreResult = getLocalScore(guess);
    await sleep(800);
  } else {
    try {
      const raw = await apiRequestStream(
        [
          { role: "system", content: buildScoringPrompt(guess) },
          { role: "user", content: guess },
        ],
        0.2,
        (full) => {
          GameState.loadingCount = full.length;
          refreshLoadingTitle();
        },
      );
      const p = normalizeJson(raw);
      GameState.scoreResult = {
        score: clamp(Number(p.score || 0), 0, 100),
        verdict: p.verdict || "",
        fit: p.fit || "",
        mistakes: Array.isArray(p.mistakes)
          ? p.mistakes
          : [p.mistakes].filter(Boolean),
        tips: Array.isArray(p.tips) ? p.tips : [p.tips].filter(Boolean),
        conciseSummary: p.conciseSummary || "",
      };
    } catch (e) {
      console.warn("score fallback", e);
      GameState.scoreResult = getLocalScore(guess);
    }
  }
  saveGameProgress();
  GameState.loadingPhase = null;
  stopLoadingTitleTimer();
  goGame();
  DOMRef["submit-soup-btn"].classList.add("hidden");
  DOMRef["view-result-btn"].classList.remove("hidden");
  showResultOverlay();
  updateGameStats();
}

/**
 * 中文说明：生成本地演示评分。
 * @param {string} guess 汤底猜测内容。
 * @returns {Object} 返回本地演示评分结果对象。
 */
function getLocalScore(guess) {
  const soup = GameState.generated?.soup || "";
  let score = 30;
  const gt = guess.replace(/\s+/g, "");
  const st = soup.replace(/\s+/g, "");
  if (!gt) score = 0;
  else {
    const overlap = [...new Set(gt)].filter((c) => st.includes(c)).length;
    score = clamp(
      20 + overlap * 4 + Math.max(0, 20 - GameState.remainingQuestions),
      0,
      100,
    );
  }
  return {
    score,
    verdict: t("localScoreVerdict"),
    fit: t("localFit"),
    mistakes: [t("localMistake")],
    tips: [t("localTip")],
    conciseSummary: t("localSummary"),
  };
}

/**
 * 中文说明：打开汤底提交弹窗。
 * @returns {void} 无返回值。
 */
function openSoupModal() {
  if (!GameState.generated) return;
  DOMRef["modal-soup-input"].value = "";
  DOMRef["modal-soup-input"].placeholder = t("soupPlaceholder");
  DOMRef["soup-modal"].classList.remove("hidden");
  DOMRef["modal-soup-input"].focus();
}

/**
 * 中文说明：关闭汤底提交弹窗。
 * @returns {void} 无返回值。
 */
function closeSoupModal() {
  DOMRef["soup-modal"].classList.add("hidden");
}
