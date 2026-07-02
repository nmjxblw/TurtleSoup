/* ================================================================
   export.js — 导出 / 分享 / 导入
   ================================================================ */

/**
 * 导出 JSON 结果。
 * @returns {void} 无返回值。
 */
function exportJson() {
  if (!GameState.generated) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: {
      language: GameState.language,
      model: GameState.model,
      isHonkaku: GameState.isHonkaku,
      difficulty: GameState.difficulty,
      customDifficulty: GameState.customDifficulty,
      questionLimit: getQuestionLimit(),
      lengthRange: getLengthRange(),
      storyStyles: GameState.storyStyles,
    },
    story: {
      title: GameState.generated.title,
      outline: GameState.generated.outline,
      riddle_html: GameState.generated.riddle_html,
      clues: GameState.generated.clues,
      soup: GameState.generated.soup,
      meta: GameState.generated.meta,
    },
    player: {
      remainingQuestions: GameState.remainingQuestions,
      questionsAsked: GameState.questionLog,
      discoveredClues: [...GameState.discoveredClues],
      soupGuess: DOMRef["modal-soup-input"].value.trim(),
      scoreResult: GameState.scoreResult,
      demoMode: GameState.demoMode,
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = t("exportName");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 导出汤底文件。
 * @returns {void} 无返回值。
 */
function exportSoup() {
  if (!GameState.generated) return;
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    story: {
      title: GameState.generated.title,
      outline: GameState.generated.outline,
      riddle_html: GameState.generated.riddle_html,
      clues: GameState.generated.clues,
      soup: GameState.generated.soup,
      meta: GameState.generated.meta,
      difficultyLabel: GameState.generated.difficultyLabel,
      styles: GameState.generated.styles,
    },
    config: {
      isHonkaku: GameState.isHonkaku,
      difficulty: GameState.difficulty,
      customDifficulty: GameState.customDifficulty,
      questionLimit: getQuestionLimit(),
      textLength: GameState.customTextLength,
    },
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeTitle = (GameState.generated.title || "turtlesoup")
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 40);
  a.download = `${safeTitle}.turtlesoup`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 导入汤底文件。
 * @param {File} file 文件对象。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function importSoup(file) {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json);

    if (!data.version || !data.story || !data.story.clues) {
      alert(t("importInvalid"));
      return;
    }

    clearGameProgress();
    GameState.generated = {
      title: data.story.title || t("untitledStoryTitle"),
      outline: data.story.outline || "",
      riddle_html: data.story.riddle_html || "",
      clues: data.story.clues || [],
      soup: data.story.soup || "",
      meta: data.story.meta || {},
      difficultyLabel: t("importLabel"),
      styles: data.story.styles || [],
    };
    GameState.isHonkaku = !!(data.config && data.config.isHonkaku);
    GameState.difficulty =
      (data.config && data.config.difficulty) || "custom_model";
    GameState.customDifficulty =
      (data.config && data.config.customDifficulty) || "easy";
    GameState.customQuestionLimit =
      (data.config && data.config.questionLimit) || 20;
    GameState.customTextLength = (data.config && data.config.textLength) || 800;
    GameState.generated.difficultyLabel = getDifficultyLabel();

    GameState.questionLog = [];
    GameState.remainingQuestions = getQuestionLimit();
    GameState.discoveredClues = new Set();
    GameState.questionsWithClueDiscovery = new Set();
    GameState.canSubmit = false;
    GameState.isFinished = false;
    GameState.scoreResult = null;

    enterGame();
  } catch (e) {
    console.error("import failed", e);
    alert(t("importFailed"));
  }
}
