/* ================================================================
   prompts.js — Prompt 模板加载 & 构建
   ================================================================ */

/**
 * 中文说明：加载单个提示词模板。
 * @param {string} name 名称。
 * @returns {Promise<string>} 返回提示词模板文本。
 */
async function loadPrompt(name) {
  try {
    const resp = await fetch(`default.${name}.md`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  } catch (e) {
    console.warn(`Prompt 模板 default.${name}.md 加载失败`, e);
    return "";
  }
}

/**
 * 中文说明：加载全部提示词模板。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function loadPrompts() {
  const [story, question, score] = await Promise.all([
    loadPrompt("story"),
    loadPrompt("question"),
    loadPrompt("score"),
  ]);
  if (story) PROMPTS.story = story;
  if (question) PROMPTS.question = question;
  if (score) PROMPTS.score = score;
}

/* ---- Difficulty helpers ---- */
/**
 * 中文说明：获取当前生效的难度。
 * @returns {string} 返回字符串。
 */
function getActiveDifficulty() {
  return GameState.difficulty === "custom_model"
    ? GameState.customDifficulty
    : GameState.difficulty;
}

/**
 * 中文说明：获取难度显示文案（getDifficultyLabel）。
 */
function getDifficultyLabel(difficulty = getActiveDifficulty()) {
  const preset = DIFFICULTY_PRESETS[difficulty];
  return preset ? t(preset.labelKey) : difficulty;
}

/**
 * 中文说明：获取提问次数上限。
 * @returns {number} 返回数值。
 */
function getQuestionLimit() {
  if (GameState.difficulty === "custom_model")
    return clamp(GameState.customQuestionLimit, 5, 30);
  return DIFFICULTY_PRESETS[getActiveDifficulty()].questionLimit;
}

/**
 * 中文说明：获取文本长度范围。
 * @returns {Object} 返回结果对象。
 */
function getLengthRange() {
  if (GameState.difficulty === "custom_model") {
    const len = clamp(GameState.customTextLength, 200, 10000);
    return { min: Math.max(100, Math.round(len * 0.7)), max: len };
  }
  const p = DIFFICULTY_PRESETS[getActiveDifficulty()];
  return { min: p.minLen, max: p.maxLen };
}

/**
 * 中文说明：获取已选择的故事风格。
 * @returns {Array<string>} 返回数组。
 */
function getSelectedStyles() {
  const picks = [
    ...DOMRef["config-style-picks"].querySelectorAll(
      'input[type="checkbox"]:checked',
    ),
  ].map((cb) => cb.value);
  const custom = DOMRef["config-custom-style"].value
    .split(/[，,、|\\\"\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = [...new Set([...picks, ...custom])];
  return merged.length ? merged : ["悬疑推理"];
}

/* ---- Prompt builders ---- */
/**
 * 中文说明：构建故事生成提示词。
 * @returns {string} 返回字符串。
 */
function buildStoryPrompt() {
  const difficulty = getActiveDifficulty();
  const text_length_range = getLengthRange();
  const lc = loc();
  const clueCount =
    difficulty === "newb"
      ? Math.floor(Math.random() * 3) + 2
      : difficulty === "easy"
        ? Math.floor(Math.random() * 3) + 3
        : difficulty === "hard"
          ? Math.floor(Math.random() * 3) + 3
          : /* hardcore */ Math.floor(Math.random() * 3) + 4;

  return renderTemplate(PROMPTS.story, {
    language:
      lc === "en" ? t("promptLanguageEnglish") : t("promptLanguageChinese"),
    storyStyles: GameState.storyStyles.join(", "),
    isHonkaku: String(GameState.isHonkaku),
    difficulty: difficulty,
    questionLimit: String(getQuestionLimit()),
    textLengthMin: String(text_length_range.min),
    textLengthMax: String(text_length_range.max),
    clueCount: String(clueCount),
  });
}

/**
 * 中文说明：构建提问提示词。
 * @param {string} question 提问内容。
 * @returns {string} 返回字符串。
 */
function buildQuestionPrompt(question) {
  const undiscovered = (GameState.generated?.clues || []).filter(
    (_, i) => !GameState.discoveredClues.has(i),
  );
  const lang = loc() === "en" ? "en-US" : "zh-CN";

  return renderTemplate(PROMPTS.question, {
    language: lang,
    difficulty: getActiveDifficulty(),
    isHonkaku: String(GameState.isHonkaku),
    shortReplies: t("shortRepliesList"),
    storyTitle: GameState.generated?.title || "",
    storyOutline: GameState.generated?.outline || "",
    riddleText: stripHtml(GameState.generated?.riddle_html || ""),
    allClues: JSON.stringify(
      (GameState.generated?.clues || []).map((c, i) => ({ i, text: c })),
    ),
    undiscoveredClues: undiscovered.length
      ? `Still undiscovered clues: ${JSON.stringify(undiscovered)}.\n`
      : "",
    discoveredClueIndices: JSON.stringify([...GameState.discoveredClues]),
    recentDialogue: JSON.stringify(GameState.questionLog.slice(-6)),
    playerQuestion: question,
  });
}

/**
 * 中文说明：构建评分提示词。
 * @param {string} guess 汤底猜测内容。
 * @returns {string} 返回字符串。
 */
function buildScoringPrompt(guess) {
  return renderTemplate(PROMPTS.score, {
    language:
      loc() === "en" ? t("promptLanguageEnglish") : t("promptLanguageChinese"),
    storyOutline: GameState.generated?.outline || "",
    storySoup: GameState.generated?.soup || "",
    playerGuess: guess,
    questionCount: String(GameState.questionLog.length),
    remainingQuestions: String(GameState.remainingQuestions),
    discoveredClues: String(GameState.discoveredClues.size),
    totalClues: String(GameState.generated?.clues?.length || 0),
  });
}
