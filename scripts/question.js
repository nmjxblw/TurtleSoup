/* ================================================================
   question.js — 提问处理 / 线索匹配 / 回复解析
   ================================================================ */

/**
 * 中文说明：判断问题是否包含多个问号。
 * @param {string} text 文本字符串。
 * @returns {boolean} 返回布尔结果。
 */
function hasMultipleQuestions(text) {
  return (String(text).match(/[？?]/g) || []).length > 1;
}

/**
 * 中文说明：处理提问提交。
 * @param {Event} e 事件对象。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function handleQuestion(e) {
  e.preventDefault();
  if (!GameState.generated) {
    addChatMsg(
      "assistant",
      t("waitGenerate"),
      "chatRoleSystem",
      "waitGenerate",
    );
    GameState.questionLog.push({
      role: "assistant",
      content: t("waitGenerate"),
      i18nKey: "waitGenerate",
      at: new Date().toISOString(),
    });
    return;
  }
  const q = DOMRef["question-input"].value.trim();
  if (!q) {
    addChatMsg("assistant", t("noQuestion"), "chatRoleSystem", "noQuestion");
    GameState.questionLog.push({
      role: "assistant",
      content: t("noQuestion"),
      i18nKey: "noQuestion",
      at: new Date().toISOString(),
    });
    return;
  }
  if (GameState.remainingQuestions <= 0) {
    GameState.canSubmit = true;
    DOMRef["question-input"].disabled = true;
    DOMRef["question-input"].value = "";
    DOMRef["question-input"].placeholder = t("exhaustedPlaceholder");
    DOMRef["ask-btn"].disabled = true;
    updateGameStats();
    addChatMsg("assistant", t("limitHint"), "chatRoleSystem", "limitHint");
    GameState.questionLog.push({
      role: "assistant",
      content: t("limitHint"),
      i18nKey: "limitHint",
      at: new Date().toISOString(),
    });
    return;
  }

  questionIndex++;
  addChatMsg("user", q, "chatRolePlayer");
  DOMRef["question-input"].value = "";
  GameState.questionLog.push({
    role: "user",
    content: q,
    at: new Date().toISOString(),
  });
  GameState.remainingQuestions = Math.max(0, GameState.remainingQuestions - 1);

  if (GameState.remainingQuestions <= 0) {
    DOMRef["question-input"].disabled = true;
    DOMRef["question-input"].placeholder = t("exhaustedPlaceholder");
    DOMRef["ask-btn"].disabled = true;
  }

  if (hasMultipleQuestions(q)) {
    const reply = t("tooMany", { followUp: t("tooManyFollowUp") });
    addChatMsg("assistant", reply, "chatRoleRule", "tooMany", {
      followUpKey: "tooManyFollowUp",
    });
    GameState.questionLog.push({
      role: "assistant",
      content: reply,
      i18nKey: "tooMany",
      i18nVars: { followUpKey: "tooManyFollowUp" },
      at: new Date().toISOString(),
    });
  } else {
    const dmStart = GameState.deathMode ? Date.now() : null;
    const clueCountBefore = GameState.deathMode
      ? GameState.discoveredClues.size
      : 0;

    if (GameState.demoMode) {
      const reply = getLocalReply(q);
      addChatMsg("assistant", reply.reply, "chatRoleHost");
      GameState.questionLog.push({
        role: "assistant",
        content: reply.reply,
        i18nKey: reply.i18nKey || "",
        clueReason: reply.clueReason || "",
        at: new Date().toISOString(),
      });
      applyClueHits(reply.matchedClues || []);
      if (dmStart) {
        const elapsed = Math.max(1, Math.floor((Date.now() - dmStart) / 1000));
        const newClues = GameState.discoveredClues.size - clueCountBefore;
        if (newClues > 0) addDeathTime(newClues * elapsed);
      }
    } else {
      const placeholder = addChatPlaceholder();
      let raw = "";
      try {
        raw = await apiRequestStream(
          [
            { role: "system", content: buildQuestionPrompt(q) },
            { role: "user", content: q },
          ],
          0.25,
          (full) => {
            placeholder.update(`... ${full.length} 字`);
          },
        );
      } catch (e) {
        console.warn("question stream failed", e);
      }
      const reply = parseReply(raw);
      placeholder.finalize(reply.reply, "chatRoleHost", reply.i18nKey || "");
      GameState.questionLog.push({
        role: "assistant",
        content: reply.reply,
        i18nKey: reply.i18nKey || "",
        clueReason: reply.clueReason || "",
        at: new Date().toISOString(),
      });
      applyClueHits(reply.matchedClues || []);
      if (dmStart) {
        const elapsed = Math.max(1, Math.floor((Date.now() - dmStart) / 1000));
        const newClues = GameState.discoveredClues.size - clueCountBefore;
        if (newClues > 0) addDeathTime(newClues * elapsed);
      }
    }
  }
  finalizeTurn();
  saveGameProgress();
}

/**
 * 中文说明：收尾一轮问答。
 * @returns {void} 无返回值。
 */
function finalizeTurn() {
  if (
    GameState.generated &&
    GameState.discoveredClues.size === GameState.generated.clues.length
  ) {
    GameState.canSubmit = true;
  }
  if (GameState.remainingQuestions <= 0) {
    GameState.canSubmit = true;
  }
  updateGameStats();
}

/**
 * 中文说明：应用线索命中结果。
 * @param {Array<any>} indices 索引数组。
 * @returns {void} 无返回值。
 */
function applyClueHits(indices) {
  if (!Array.isArray(indices)) return;
  let newDiscovery = false;
  indices.forEach((i) => {
    if (Number.isInteger(i) && GameState.generated?.clues?.[i] != null) {
      if (!GameState.discoveredClues.has(i)) newDiscovery = true;
      GameState.discoveredClues.add(i);
    }
  });
  if (newDiscovery && questionIndex > 0) {
    GameState.questionsWithClueDiscovery.add(questionIndex);
    const node = DOMRef["chat-log"].querySelector(
      `[data-qindex="${questionIndex}"]`,
    );
    if (node) node.classList.add("clue-discovery");
  }
}

/**
 * 中文说明：解析回复内容。
 * @param {any} raw 参数。
 * @returns {Object} 返回解析后的回复对象。
 */
function parseReply(raw) {
  if (!raw)
    return {
      reply: t("replyYes"),
      i18nKey: "replyYes",
      matchedClues: [],
      clueReason: "",
    };
  try {
    const parsed = normalizeJson(raw);
    return {
      reply: parsed.reply || t("replyYes"),
      i18nKey: parsed.reply ? "" : "replyYes",
      matchedClues: parsed.matchedClues || [],
      clueReason: parsed.clueReason || "",
    };
  } catch (e) {
    return {
      reply: raw.trim() || t("replyYes"),
      i18nKey: raw.trim() ? "" : "replyYes",
      matchedClues: [],
      clueReason: "",
    };
  }
}

/**
 * 中文说明：生成本地演示回复。
 * @param {string} question 提问内容。
 * @returns {Object} 返回本地演示回复对象。
 */
function getLocalReply(question) {
  const n = question.toLowerCase();
  const clues = GameState.generated?.clues || [];
  const matched = [];
  clues.forEach((c, i) => {
    const kw = c
      .replace(/[，。；：、“”‘’！!?？]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1)
      .slice(0, 4);
    if (kw.some((w) => n.includes(w.toLowerCase()))) matched.push(i);
  });
  return {
    reply: matched.length
      ? loc() === "zh"
        ? t("replyImportant")
        : t("replyImportant")
      : loc() === "zh"
        ? t("replyNo")
        : t("replyNo"),
    i18nKey: matched.length ? "replyImportant" : "replyNo",
    matchedClues: matched,
    clueReason: "local",
  };
}
