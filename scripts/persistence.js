/* ================================================================
   persistence.js — 设置 & 游戏进度持久化
   ================================================================ */

/**
 * 中文说明：保存设置。
 * @returns {void} 无返回值。
 */
function saveSettings() {
  const data = {
    apiKey: GameState.apiKey,
    model: GameState.model,
    language: GameState.language,
    isHonkaku: GameState.isHonkaku,
    difficulty: GameState.difficulty,
    customDifficulty: GameState.customDifficulty,
    customQuestionLimit: GameState.customQuestionLimit,
    customTextLength: GameState.customTextLength,
    storyStyles: GameState.storyStyles,
    customStyleText: GameState.customStyleText,
    deathMode: GameState.deathMode,
  };
  localStorage.setItem("turtlesoup-settings", JSON.stringify(data));
  localStorage.setItem("turtlesoup-visited", "1");
}

/**
 * 中文说明：加载设置。
 * @returns {any} 返回结果对象。
 */
function loadSettings() {
  try {
    const raw = localStorage.getItem("turtlesoup-settings");
    if (raw) {
      const d = JSON.parse(raw);
      Object.assign(GameState, d);
    }
  } catch (e) {
    /* ignore */
  }
}

/**
 * 中文说明：判断是否首次访问。
 * @returns {boolean} 返回布尔结果。
 */
function isFirstVisit() {
  return !localStorage.getItem("turtlesoup-visited");
}

/**
 * 中文说明：保存游戏进度。
 * @returns {void} 无返回值。
 */
function saveGameProgress() {
  if (!GameState.generated) return;
  const elapsed = GameState.gameStartTime
    ? Math.max(0, Math.floor((Date.now() - GameState.gameStartTime) / 1000))
    : 0;
  const data = {
    generated: GameState.generated,
    remainingQuestions: GameState.remainingQuestions,
    discoveredClues: [...GameState.discoveredClues],
    questionsWithClueDiscovery: [...GameState.questionsWithClueDiscovery],
    questionLog: GameState.questionLog,
    canSubmit: GameState.canSubmit,
    isFinished: GameState.isFinished,
    scoreResult: GameState.scoreResult,
    isHonkaku: GameState.isHonkaku,
    demoMode: GameState.demoMode,
    questionIndex: questionIndex,
    gameStartTime: GameState.gameStartTime,
    gameElapsed: elapsed,
    deathMode: GameState.deathMode,
    deathModeRemaining: GameState.deathModeRemaining,
    deathModeTotal: GameState.deathModeTotal,
    deathModeExpired: GameState.deathModeExpired,
  };
  localStorage.setItem("turtlesoup-progress", JSON.stringify(data));
}

/**
 * 中文说明：加载游戏进度。
 * @returns {Object | null} 返回保存的进度对象，失败时返回 null。
 */
function loadGameProgress() {
  try {
    const raw = localStorage.getItem("turtlesoup-progress");
    if (!raw) return null;
    const data = JSON.parse(raw);
    data.discoveredClues = new Set(data.discoveredClues || []);
    data.questionsWithClueDiscovery = new Set(
      data.questionsWithClueDiscovery || [],
    );
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * 中文说明：清空游戏进度。
 * @returns {void} 无返回值。
 */
function clearGameProgress() {
  localStorage.removeItem("turtlesoup-progress");
}

/**
 * 中文说明：恢复已保存的游戏进度。
 * @returns {boolean} 返回是否成功恢复。
 */
function restoreGame() {
  const saved = loadGameProgress();
  if (!saved?.generated) return false;

  const mapKeys = [
    "generated",
    "remainingQuestions",
    "questionLog",
    "canSubmit",
    "isFinished",
    "scoreResult",
    "isHonkaku",
    "demoMode",
  ];
  mapKeys.forEach((k) => {
    if (k in saved) GameState[k] = saved[k];
  });

  GameState.discoveredClues = new Set(saved.discoveredClues || []);
  GameState.questionsWithClueDiscovery = new Set(
    saved.questionsWithClueDiscovery || [],
  );

  questionIndex = saved.questionIndex || 0;

  GameState.gameStartTime =
    saved.gameElapsed != null
      ? Date.now() - saved.gameElapsed * 1000
      : saved.gameStartTime || null;

  GameState.deathMode = saved.deathMode || false;
  GameState.deathModeRemaining = saved.deathModeRemaining || 0;
  GameState.deathModeTotal = saved.deathModeTotal || 0;
  GameState.deathModeExpired = saved.deathModeExpired || false;

  return true;
}
