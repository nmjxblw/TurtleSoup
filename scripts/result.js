/* ================================================================
   result.js — 结算浮层
   ================================================================ */

/**
 * 显示结果浮层。
 * @returns {void} 无返回值。
 */
function showResultOverlay() {
  if (!GameState.scoreResult || !GameState.generated) return;
  const r = GameState.scoreResult;
  const g = GameState.generated;
  const cluesHtml = g.clues
    .map((c, i) => {
      const found = GameState.discoveredClues.has(i);
      return `<li class="${found ? "found" : ""}">${escapeHtml(c)} <small>(${found ? t("clueFound") : t("cluePending")})</small></li>`;
    })
    .join("");

  DOMRef["result-card-content"].innerHTML = `
    <h3>${t("resultTitle")}</h3>
    <div class="score-big">${r.score} / 100</div>
    <div><strong>${t("verdictLabel")}</strong>：${escapeHtml(r.verdict || "")}</div>
    <div><strong>${t("fitLabel")}</strong>：${escapeHtml(r.fit || "")}</div>
    <div><strong>${t("mistakesLabel")}</strong><ul>${(r.mistakes || []).map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul></div>
    <div><strong>${t("tipsLabel")}</strong><ul>${(r.tips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul></div>
    <div><strong>${t("summaryLabel")}</strong>：${escapeHtml(r.conciseSummary || "")}</div>
    <h3>${t("clueTitle")}</h3>
    <ol class="clue-reveal">${cluesHtml}</ol>
  `;
  DOMRef["result-overlay"].classList.remove("hidden");
}

/**
 * 隐藏结果浮层。
 * @returns {void} 无返回值。
 */
function hideResultOverlay() {
  DOMRef["result-overlay"].classList.add("hidden");
}
