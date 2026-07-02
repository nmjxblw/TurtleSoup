/* ================================================================
   game.js — 游戏流程：配置 → 生成 → 进入游戏
   ================================================================ */

/**
 * 中文说明：构建演示故事。
 * @returns {Object} 返回演示故事对象。
 */
function buildDemoStory() {
  const riddleHtml = t("demoStoryRiddleHtml");
  return {
    title: t("demoStoryTitle"),
    difficultyLabel: getDifficultyLabel(),
    styles: GameState.storyStyles,
    outline: t("demoStoryOutline"),
    riddle_html: riddleHtml,
    clues: t("demoStoryClues")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean),
    soup: t("demoStorySoup"),
    meta: {
      tone: GameState.storyStyles.join("、"),
      setting: t("demoStorySetting"),
      characters: t("demoStoryCharacters")
        .split(/[，,、]/)
        .map((s) => s.trim())
        .filter(Boolean),
    },
  };
}

/**
 * 中文说明：进入游戏并渲染状态。
 * @param {boolean} restoring 是否为恢复流程。
 * @returns {void} 无返回值。
 */
function enterGame(restoring) {
  goGame();
  if (!restoring) {
    DOMRef["chat-log"].innerHTML = "";
  }
  if (!restoring) {
    DOMRef["question-input"].value = "";
    DOMRef["question-input"].placeholder = t("askPlaceholder");
    DOMRef["question-input"].disabled = false;
    DOMRef["ask-btn"].disabled = false;
    DOMRef["result-overlay"].classList.add("hidden");
    DOMRef["soup-modal"].classList.add("hidden");
    DOMRef["submit-soup-btn"].disabled = true;
    DOMRef["submit-soup-btn"].classList.remove("hidden");
    DOMRef["view-result-btn"].classList.add("hidden");
    DOMRef["deduction-bar"].style.width = "0%";
    DOMRef["deduction-text"].textContent = "0 / 0";
    questionIndex = 0;
    GameState.isFinished = false;
    GameState.canSubmit = false;
    GameState.questionsWithClueDiscovery = new Set();
    startSpeedTimer();
  }

  if (!GameState.generated) return;

  const g = GameState.generated;
  DOMRef["game-difficulty-tag"].childNodes[0].textContent =
    getDifficultyLabel();
  DOMRef["death-mode-tag"].classList.toggle("hidden", !GameState.deathMode);
  DOMRef["game-title"].textContent = g.title;
  DOMRef["game-style-tag"].textContent = (g.styles || []).join(" / ");
  DOMRef["game-honkaku-tag"].textContent = GameState.isHonkaku
    ? t("honkakuOn")
    : t("honkakuOff");
  DOMRef["remaining-count"].textContent = String(GameState.remainingQuestions);
  DOMRef["riddle-output"].innerHTML = sanitizeHtml(g.riddle_html || "");

  syncI18n();
  if (restoring) {
    let qi = 0;
    GameState.questionLog.forEach((entry) => {
      if (entry.role === "user") {
        qi++;
        questionIndex = qi;
      }
      const role = entry.role === "user" ? "user" : "assistant";
      const metaKey = getChatMetaKeyFromLog(entry);
      addChatMsg(role, entry.content, metaKey, entry.i18nKey, entry.i18nVars);
    });
    questionIndex = qi;
    if (GameState.remainingQuestions <= 0) {
      DOMRef["question-input"].disabled = true;
      DOMRef["question-input"].placeholder = t("exhaustedPlaceholder");
      DOMRef["ask-btn"].disabled = true;
    }
    if (
      GameState.canSubmit ||
      GameState.isFinished ||
      GameState.deathModeExpired
    )
      DOMRef["submit-soup-btn"].disabled = false;
    if (GameState.isFinished && !GameState.deathModeExpired) {
      DOMRef["submit-soup-btn"].classList.add("hidden");
      DOMRef["view-result-btn"].classList.remove("hidden");
    }
  }
  updateGameStats();
  if (!restoring) {
    const readyMsg = GameState.deathMode ? t("gameReadyDeath") : t("gameReady");
    const readyKey = GameState.deathMode ? "gameReadyDeath" : "gameReady";
    addChatMsg("assistant", readyMsg, "chatRoleSystem", readyKey);
    GameState.questionLog.push({
      role: "assistant",
      content: readyMsg,
      i18nKey: readyKey,
      at: new Date().toISOString(),
    });
    saveGameProgress();
  }
  if (restoring) {
    if (GameState.deathMode) {
      const icon = document.querySelector(".speed-timer-icon");
      if (icon) icon.textContent = "💀";
      if (GameState.deathModeRemaining <= 60) {
        DOMRef["speed-timer-text"].style.color = "var(--danger)";
        DOMRef["speed-timer-text"].classList.add("breathing");
      } else {
        DOMRef["speed-timer-text"].classList.remove("breathing");
      }
      if (GameState.deathModeExpired) {
        DOMRef["speed-timer-text"].textContent = "00:00";
        DOMRef["speed-timer-text"].classList.add("breathing");
        DOMRef["question-input"].disabled = true;
        DOMRef["ask-btn"].disabled = true;
      }
    }
    if (GameState.isFinished || GameState.deathModeExpired) {
      updateSpeedTimer();
    } else {
      startSpeedTimer();
    }
  }
}

/**
 * 中文说明：更新游戏统计信息。
 * @returns {void} 无返回值。
 */
function updateGameStats() {
  DOMRef["remaining-count"].textContent = GameState.generated
    ? String(GameState.remainingQuestions)
    : "--";
  DOMRef["submit-soup-btn"].disabled =
    !GameState.generated ||
    (GameState.isFinished && !GameState.deathModeExpired);

  const ring = DOMRef["question-ring"];
  if (!GameState.generated) {
    ring.style.borderColor = "rgba(255,255,255,0.1)";
    return;
  }
  const total =
    GameState.remainingQuestions +
    GameState.questionLog.filter((l) => l.role === "user").length;
  if (GameState.remainingQuestions <= 3)
    ring.style.borderColor = "var(--danger)";
  else if (GameState.remainingQuestions <= 8)
    ring.style.borderColor = "var(--accent-2)";
  else ring.style.borderColor = "var(--accent)";

  const totalClues = GameState.generated?.clues?.length || 0;
  const found = GameState.discoveredClues?.size || 0;
  DOMRef["deduction-text"].textContent = `${found} / ${totalClues}`;
  DOMRef["deduction-bar"].style.width =
    totalClues > 0 ? `${(found / totalClues) * 100}%` : "0%";
}

/**
 * 中文说明：从封面重新开始。
 * @returns {void} 无返回值。
 */
function startFromCover() {
  clearGameProgress();
  stopSpeedTimer();
  GameState.gameStartTime = null;
  GameState.deathMode = false;
  GameState.deathModeRemaining = 0;
  GameState.deathModeTotal = 0;
  GameState.deathModeFrozen = false;
  GameState.deathModeExpired = false;
  DOMRef["speed-timer-text"].textContent = "00:00";
  DOMRef["speed-timer-text"].style.color = "";
  DOMRef["speed-timer-text"].classList.remove("breathing");
  const icon = document.querySelector(".speed-timer-icon");
  if (icon) icon.textContent = "⏱";
  DOMRef["cover-review-btn"].classList.add("hidden");
  loadSettings();
  if (GameState.apiKey && GameState.apiKey.startsWith("sk-")) {
    populateConfigForm();
    goConfig();
  } else {
    goApikey();
  }
}

/**
 * 中文说明：填充配置表单。
 * @returns {void} 无返回值。
 */
function populateConfigForm() {
  DOMRef["config-difficulty"].value = GameState.difficulty || "custom_model";
  DOMRef["config-model"].value = GameState.model || "deepseek-chat";
  DOMRef["config-custom-difficulty"].value = GameState.customDifficulty;
  DOMRef["config-question-limit"].value = GameState.customQuestionLimit || 20;
  DOMRef["ql-val"].textContent = GameState.customQuestionLimit || 20;
  DOMRef["config-text-length"].value = GameState.customTextLength || 800;
  DOMRef["tl-val"].textContent = GameState.customTextLength || 800;
  DOMRef["config-honkaku"].checked = !!GameState.isHonkaku;
  DOMRef["config-death-mode"].checked = !!GameState.deathMode;
  DOMRef["config-custom-style"].value = GameState.customStyleText || "";
  const sel = new Set(GameState.storyStyles || ["悬疑推理"]);
  [
    ...DOMRef["config-style-picks"].querySelectorAll('input[type="checkbox"]'),
  ].forEach((cb) => {
    cb.checked = sel.has(cb.value);
  });
  syncCustomControls();
  fetchModels();
}

/**
 * 中文说明：拉取模型列表。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function fetchModels() {
  try {
    const headers = {};
    if (GameState.apiKey) headers.Authorization = `Bearer ${GameState.apiKey}`;
    const resp = await fetch(`${BASE_URL}/models`, { headers });
    if (!resp.ok) return;
    const data = await resp.json();
    const models = (data.data || [])
      .map((m) => m.id)
      .filter(
        (id) => id && !id.includes("embedding") && !id.includes("moderation"),
      );
    if (!models.length) return;
    const select = DOMRef["config-model"];
    const current = select.value;
    select.innerHTML = "";
    models.forEach((id) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = id;
      select.appendChild(opt);
    });
    if (models.includes(current)) select.value = current;
    else if (models.includes("deepseek-chat")) select.value = "deepseek-chat";
    else select.value = models[0];
  } catch (e) {
    handleApiError(e, "models");
  }
}

/**
 * 中文说明：同步自定义配置控件。
 * @returns {void} 无返回值。
 */
function syncCustomControls() {
  const isCustom = DOMRef["config-difficulty"].value === "custom_model";
  DOMRef["custom-controls"].classList.toggle("hidden", !isCustom);
  syncDeathModeToggle();
}

/**
 * 中文说明：同步死亡模式开关。
 * @returns {void} 无返回值。
 */
function syncDeathModeToggle() {
  const diff =
    DOMRef["config-difficulty"].value === "custom_model"
      ? DOMRef["config-custom-difficulty"].value
      : DOMRef["config-difficulty"].value;
  DOMRef["death-mode-field"].classList.toggle("hidden", diff !== "hardcore");
}

/**
 * 中文说明：处理 API Key 提交。
 * @param {Event} e 事件对象。
 * @returns {void} 无返回值。
 */
function handleApikeySubmit(e) {
  e.preventDefault();
  GameState.apiKey = DOMRef["apikey-input"].value.trim();
  GameState.demoMode = !GameState.apiKey;
  saveSettings();
  populateConfigForm();
  goConfig();
}

/**
 * 中文说明：处理配置提交。
 * @param {Event} e 事件对象。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function handleConfigSubmit(e) {
  e.preventDefault();
  GameState.difficulty = DOMRef["config-difficulty"].value;
  GameState.model = DOMRef["config-model"].value;
  GameState.customDifficulty = DOMRef["config-custom-difficulty"].value;
  GameState.customQuestionLimit = Number(DOMRef["config-question-limit"].value);
  GameState.customTextLength = Number(DOMRef["config-text-length"].value);
  GameState.isHonkaku = DOMRef["config-honkaku"].checked;
  GameState.deathMode =
    DOMRef["config-death-mode"].checked && getActiveDifficulty() === "hardcore";
  GameState.storyStyles = getSelectedStyles();
  GameState.customStyleText = DOMRef["config-custom-style"].value.trim();
  saveSettings();

  if (!GameState.apiKey) {
    DOMRef["nokey-modal"].classList.remove("hidden");
    return;
  }

  clearGameProgress();
  GameState.generated = null;
  GameState.questionLog = [];
  GameState.scoreResult = null;
  GameState.remainingQuestions = 0;
  GameState.discoveredClues = new Set();
  GameState.questionsWithClueDiscovery = new Set();
  GameState.canSubmit = false;
  GameState.isFinished = false;
  GameState.demoMode = !GameState.apiKey;

  goLoading();
  GameState.loadingPhase = "story";
  GameState.loadingCount = 0;
  startLoadingWords();

  if (!GameState.apiKey) {
    GameState.generated = buildDemoStory();
    GameState.remainingQuestions = getQuestionLimit();
    GameState.loadingPhase = "storyDemo";
    refreshLoadingTitle();
    await sleep(1200);
    GameState.loadingPhase = null;
    stopLoadingTitleTimer();
    enterGame();
    return;
  }

  try {
    const prompt = buildStoryPrompt();
    startLoadingTitleTimer();
    const content = await apiRequestStream(
      [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({
            language: GameState.language,
            is_honkaku: GameState.isHonkaku,
            difficulty: getActiveDifficulty(),
            question_limit: getQuestionLimit(),
            style: GameState.storyStyles,
            length: getLengthRange(),
          }),
        },
      ],
      0.95,
      (full) => {
        GameState.loadingCount = full.length;
        refreshLoadingTitle();
      },
    );
    const story = normalizeJson(content);
    GameState.generated = {
      title: story.title || t("untitledStoryTitle"),
      outline: story.outline || "",
      riddle_html: story.riddle_html || "",
      clues: Array.isArray(story.clues) ? story.clues : [],
      soup: story.soup || "",
      meta: story.meta || {},
      difficultyLabel: getDifficultyLabel(),
      styles: GameState.storyStyles,
    };
    GameState.remainingQuestions = getQuestionLimit();
    GameState.discoveredClues = new Set();
    saveGameProgress();
  } catch (err) {
    console.error("generate failed", err);
    GameState.loadingPhase = null;
    stopLoadingTitleTimer();
    stopLoadingWords();
    goConfig();
    if (!handleApiError(err, "generate")) {
      DOMRef["error-msg"].textContent =
        t("errorDesc") + "\n" + String(err.message || err).slice(0, 200);
      DOMRef["error-modal"].classList.remove("hidden");
    }
    return;
  }
  await sleep(800);
  GameState.loadingPhase = null;
  stopLoadingTitleTimer();
  enterGame();
}
