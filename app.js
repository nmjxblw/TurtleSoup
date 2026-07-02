/* ================================================================
   TurtleSoup — 海龟汤 AI 推理游戏
   Views: cover → apikey (first-time) → config → loading → game
   ================================================================ */

const BASE_URL = "https://api.deepseek.com";

const DIFFICULTY_PRESETS = {
  newb: {
    questionLimit: 30,
    minLen: 120,
    maxLen: 500,
    tag: "入门",
    tagEn: "Newbie",
  },
  easy: {
    questionLimit: 25,
    minLen: 300,
    maxLen: 1000,
    tag: "简单",
    tagEn: "Easy",
  },
  hard: {
    questionLimit: 15,
    minLen: 300,
    maxLen: 2000,
    tag: "专家",
    tagEn: "Hard",
  },
  hardcore: {
    questionLimit: 12,
    minLen: 200,
    maxLen: 10000,
    tag: "硬核",
    tagEn: "Hardcore",
  },
};

let L = { zh: {}, en: {} };

/* ---- i18n CSV 异步加载 ---- */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        if (row.length > 0) {
          rows.push(row);
          row = [];
        }
      } else if (ch === "\r") {
        // skip carriage return
      } else {
        field += ch;
      }
    }
  }
  // last field + last row
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

async function loadI18n() {
  try {
    const resp = await fetch("i18n.csv");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    const rows = parseCSV(text);
    const data = { zh: {}, en: {} };
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length >= 3 && cols[0]) {
        data.zh[cols[0]] = cols[1] || "";
        data.en[cols[0]] = cols[2] || "";
      }
    }
    L = data;
  } catch (e) {
    console.warn("i18n CSV 加载失败，使用内置回退文本", e);
  }
}

/* ---- Prompt 模板异步加载 ---- */
let PROMPTS = { story: "", question: "", score: "" };

function renderTemplate(tmpl, vars) {
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  );
}

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

/* ---- state ---- */
const GameState = {
  apiKey: "",
  model: "deepseek-chat",
  language: "zh-CN",
  isWhodunit: true,
  difficulty: "custom_model",
  customDifficulty: null,
  customQuestionLimit: 20,
  customTextLength: 800,
  storyStyles: ["悬疑推理"],
  customStyleText: "",
  demoMode: false,
  generated: null,
  questionLog: [],
  remainingQuestions: 0,
  discoveredClues: new Set(),
  questionsWithClueDiscovery: new Set(),
  canSubmit: false,
  isFinished: false,
  scoreResult: null,
  loadingPhase: null, // "story" | "storyDemo" | "evaluate" | null
  loadingCount: 0,
  gameStartTime: null, // timestamp when game page first appeared
  deathMode: false,
  deathModeRemaining: 0, // 剩余倒计时秒数
  deathModeTotal: 0, // 总倒计时秒数
  deathModeFrozen: false, // 是否已冻结
  deathModeExpired: false, // 是否已超时
};

let gameTimerInterval = null;

/* ---- DOM refs ---- */
const DOMRef = {};
function $(id) {
  return document.getElementById(id);
}

function initDom() {
  const ids = [
    "view-cover",
    "view-apikey",
    "view-config",
    "view-loading",
    "view-game",
    "cover-start-btn",
    "cover-review-btn",
    "apikey-input",
    "apikey-toggle",
    "apikey-skip",
    "apikey-back",
    "apikey-form",
    "config-difficulty",
    "config-model",
    "config-custom-difficulty",
    "config-question-limit",
    "config-text-length",
    "ql-val",
    "tl-val",
    "config-whodunit",
    "config-style-picks",
    "config-custom-style",
    "config-back",
    "config-form",
    "custom-controls",
    "loading-title",
    "loading-words",
    "game-difficulty-tag",
    "game-title",
    "game-style-tag",
    "game-whodunit-tag",
    "remaining-count",
    "remaining-label",
    "riddle-output",
    "deduction-bar",
    "deduction-text",
    "chat-log",
    "question-form",
    "question-input",
    "ask-btn",
    "submit-soup-btn",
    "view-result-btn",
    "result-overlay",
    "result-card-content",
    "result-close-btn",
    "result-export-btn",
    "result-replay-btn",
    "soup-modal",
    "modal-soup-input",
    "modal-submit-btn",
    "modal-cancel-btn",
    "modal-giveup-btn",
    "question-ring",
    "theme-toggle",
    "lang-toggle",
    "side-menu",
    "menu-toggle",
    "menu-overlay",
    "menu-drawer",
    "menu-close-btn",
    "nokey-modal",
    "nokey-go-btn",
    "nokey-cancel-btn",
    "error-modal",
    "error-msg",
    "error-retry-btn",
    "error-demo-btn",
    "error-cancel-btn",
    "dice-random-style",
    "game-share-btn",
    "result-share-btn",
    "import-soup-btn",
    "import-soup-input",
    "speed-timer",
    "speed-timer-text",
    "config-death-mode",
    "death-mode-field",
    "death-mode-tag",
  ];
  ids.forEach((id) => {
    DOMRef[id] = $(id);
  });
}

/* ---- helpers ---- */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function loc() {
  return GameState.language === "en-US" ? "en" : "zh";
}
function t(key) {
  return L[loc()][key] || L.zh[key] || key;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function stripHtml(h) {
  const d = document.createElement("div");
  d.innerHTML = h || "";
  return d.textContent || d.innerText || "";
}
function sanitizeHtml(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = String(html || "");
  const allowed = new Set([
    "B",
    "I",
    "EM",
    "STRONG",
    "MARK",
    "BR",
    "P",
    "UL",
    "OL",
    "LI",
    "SPAN",
    "DIV",
    "SMALL",
  ]);
  const walker = document.createTreeWalker(
    tpl.content,
    NodeFilter.SHOW_ELEMENT,
  );
  const rm = [];
  while (walker.nextNode()) {
    if (!allowed.has(walker.currentNode.tagName)) {
      rm.push(walker.currentNode);
      continue;
    }
    [...walker.currentNode.attributes].forEach((a) => {
      if (!["class", "style", "title"].includes(a.name))
        walker.currentNode.removeAttribute(a.name);
    });
  }
  rm.forEach((n) =>
    n.replaceWith(document.createTextNode(n.textContent || "")),
  );
  return tpl.innerHTML;
}
function normalizeJson(text) {
  const s = String(text || "").trim();
  const m =
    s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/);
  let raw = m ? m[1].trim() : s;
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a >= 0 && b >= 0) raw = raw.slice(a, b + 1);
  // Escape literal control chars within double-quoted JSON strings first.
  // Use [\s\S] in \\[\s\S] so backslash+newline is also captured.
  raw = raw.replace(
    /"((?:[^"\\]|\\[\s\S])*)"/g,
    (_m, inner) =>
      '"' +
      inner.replace(/[\n\r\t]/g, (c) =>
        c === "\n" ? "\\n" : c === "\r" ? "\\r" : "\\t",
      ) +
      '"',
  );
  // Remove trailing commas before } or ]
  raw = raw.replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(raw);
  } catch (_e1) {
    // Model may have used curly quotes as JSON delimiters — fix those
    let repaired = raw
      .replace(/[\u201C\u201D\u201E\u201F\uFF02]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'");
    repaired = repaired
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/=\s*"([^"<>]*?)"/g, "='$1'");
    try {
      return JSON.parse(repaired);
    } catch (_e2) {
      console.warn(
        "normalizeJson: repair failed, raw (~300):",
        raw.slice(0, 300),
      );
      throw _e1;
    }
  }
}

function getActiveDifficulty() {
  return GameState.difficulty === "custom_model"
    ? GameState.customDifficulty
    : GameState.difficulty;
}
function getQuestionLimit() {
  if (GameState.difficulty === "custom_model")
    return clamp(GameState.customQuestionLimit, 5, 30);
  return DIFFICULTY_PRESETS[getActiveDifficulty()].questionLimit;
}
function getLengthRange() {
  if (GameState.difficulty === "custom_model") {
    const len = clamp(GameState.customTextLength, 200, 10000);
    return { min: Math.max(100, Math.round(len * 0.7)), max: len };
  }
  const p = DIFFICULTY_PRESETS[getActiveDifficulty()];
  return { min: p.minLen, max: p.maxLen };
}
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

/* ---- VIEW ROUTING ---- */
function showView(viewId) {
  // 死亡模式：离开游戏界面时冻结计时器
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
  // 死亡模式：回到游戏界面时恢复计时器
  if (GameState.deathMode && viewId === "view-game") {
    resumeDeathTimer();
  }
}

/* ---- PERSISTENCE ---- */
function saveSettings() {
  const data = {
    apiKey: GameState.apiKey,
    model: GameState.model,
    language: GameState.language,
    isWhodunit: GameState.isWhodunit,
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
function isFirstVisit() {
  return !localStorage.getItem("turtlesoup-visited");
}

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
    isWhodunit: GameState.isWhodunit,
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

function clearGameProgress() {
  localStorage.removeItem("turtlesoup-progress");
}

function restoreGame() {
  const saved = loadGameProgress();
  if (!saved?.generated) return false;

  // 自动映射同名字段到 GameState
  const mapKeys = [
    "generated",
    "remainingQuestions",
    "questionLog",
    "canSubmit",
    "isFinished",
    "scoreResult",
    "isWhodunit",
    "demoMode",
  ];
  mapKeys.forEach((k) => {
    if (k in saved) GameState[k] = saved[k];
  });

  // Set 类型需从数组还原
  GameState.discoveredClues = new Set(saved.discoveredClues || []);
  GameState.questionsWithClueDiscovery = new Set(
    saved.questionsWithClueDiscovery || [],
  );

  // 全局变量
  questionIndex = saved.questionIndex || 0;

  // 游戏时间：以 gameElapsed 为准反算
  GameState.gameStartTime =
    saved.gameElapsed != null
      ? Date.now() - saved.gameElapsed * 1000
      : saved.gameStartTime || null;

  // 死亡模式
  GameState.deathMode = saved.deathMode || false;
  GameState.deathModeRemaining = saved.deathModeRemaining || 0;
  GameState.deathModeTotal = saved.deathModeTotal || 0;
  GameState.deathModeExpired = saved.deathModeExpired || false;

  return true;
}

/* ---- COVER → APIKEY / CONFIG ---- */
function goCover() {
  showView("view-cover");
  DOMRef["cover-review-btn"].classList.add("hidden");
  const progress = loadGameProgress();
  if (progress && progress.isFinished) {
    DOMRef["cover-review-btn"].classList.remove("hidden");
  }
}
function goApikey() {
  showView("view-apikey");
  if (GameState.apiKey) DOMRef["apikey-input"].value = GameState.apiKey;
}
function goConfig() {
  showView("view-config");
}
function goLoading() {
  showView("view-loading");
  startLoadingWords();
}
function goGame() {
  showView("view-game");
  stopLoadingWords();
}

/* ---- 加载页词条动画 ---- */
let _loadingWordsTimer = null;

function startLoadingWords() {
  stopLoadingWords();
  const words =
    loc() === "zh"
      ? ["加入灵感", "丰富细节", "打磨剧本", "构思谜题"]
      : [
          "Adding ideas",
          "Enriching details",
          "Polishing plot",
          "Crafting puzzle",
        ];
  const container = DOMRef["loading-words"];
  if (!container) return;
  container.innerHTML = "";
  let idx = 0;
  function tick() {
    const span = document.createElement("span");
    span.className = "loading-word";
    span.textContent = words[idx % words.length];
    container.appendChild(span);
    // 动画结束后移除
    span.addEventListener("animationend", () => span.remove());
    idx++;
    _loadingWordsTimer = setTimeout(tick, 900);
  }
  tick();
}

function stopLoadingWords() {
  if (_loadingWordsTimer) {
    clearTimeout(_loadingWordsTimer);
    _loadingWordsTimer = null;
  }
  const container = DOMRef["loading-words"];
  if (container) container.innerHTML = "";
}

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

function populateConfigForm() {
  DOMRef["config-difficulty"].value = GameState.difficulty || "custom_model";
  DOMRef["config-model"].value = GameState.model || "deepseek-chat";
  DOMRef["config-custom-difficulty"].value = GameState.customDifficulty;
  DOMRef["config-question-limit"].value = GameState.customQuestionLimit || 20;
  DOMRef["ql-val"].textContent = GameState.customQuestionLimit || 20;
  DOMRef["config-text-length"].value = GameState.customTextLength || 800;
  DOMRef["tl-val"].textContent = GameState.customTextLength || 800;
  DOMRef["config-whodunit"].checked = !!GameState.isWhodunit;
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
    /* keep hardcoded options */
  }
}

function syncCustomControls() {
  const isCustom = DOMRef["config-difficulty"].value === "custom_model";
  DOMRef["custom-controls"].classList.toggle("hidden", !isCustom);
  syncDeathModeToggle();
}

function syncDeathModeToggle() {
  const diff =
    DOMRef["config-difficulty"].value === "custom_model"
      ? DOMRef["config-custom-difficulty"].value
      : DOMRef["config-difficulty"].value;
  DOMRef["death-mode-field"].classList.toggle("hidden", diff !== "hardcore");
}

/* ---- API KEY SUBMIT ---- */
function handleApikeySubmit(e) {
  e.preventDefault();
  GameState.apiKey = DOMRef["apikey-input"].value.trim();
  GameState.demoMode = !GameState.apiKey;
  saveSettings();
  populateConfigForm();
  goConfig();
}

/* ---- CONFIG SUBMIT → LOADING → GENERATE ---- */
async function handleConfigSubmit(e) {
  e.preventDefault();
  GameState.difficulty = DOMRef["config-difficulty"].value;
  GameState.model = DOMRef["config-model"].value;
  GameState.customDifficulty = DOMRef["config-custom-difficulty"].value;
  GameState.customQuestionLimit = Number(DOMRef["config-question-limit"].value);
  GameState.customTextLength = Number(DOMRef["config-text-length"].value);
  GameState.isWhodunit = DOMRef["config-whodunit"].checked;
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
  // reset game state
  GameState.generated = null;
  GameState.questionLog = [];
  GameState.scoreResult = null;
  GameState.remainingQuestions = 0;
  GameState.discoveredClues = new Set();
  GameState.questionsWithClueDiscovery = new Set();
  GameState.canSubmit = false;
  GameState.isFinished = false;
  GameState.demoMode = !GameState.apiKey;

  // go loading
  goLoading();
  GameState.loadingPhase = "story";
  GameState.loadingCount = 0;
  DOMRef["loading-title"].textContent = t("loadingTitle");
  startLoadingWords();

  // generate
  if (!GameState.apiKey) {
    GameState.generated = buildDemoStory();
    GameState.remainingQuestions = getQuestionLimit();
    GameState.loadingPhase = "storyDemo";
    DOMRef["loading-title"].textContent = t("demoWarning");
    await sleep(1200);
    GameState.loadingPhase = null;
    enterGame();
    return;
  }

  try {
    const prompt = buildStoryPrompt();
    const content = await apiRequestStream(
      [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({
            language: GameState.language,
            is_whodunit: GameState.isWhodunit,
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
        DOMRef["loading-title"].textContent =
          t("loadingTitle") +
          ` (${full.length} ${loc() === "zh" ? "字" : "chars"})`;
      },
    );
    const story = normalizeJson(content);
    GameState.generated = {
      title:
        story.title || (loc() === "zh" ? "未命名海龟汤" : "Untitled Mystery"),
      outline: story.outline || "",
      riddle_html: story.riddle_html || "",
      clues: Array.isArray(story.clues) ? story.clues : [],
      soup: story.soup || "",
      meta: story.meta || {},
      difficultyLabel:
        (DIFFICULTY_PRESETS[getActiveDifficulty()] || {}).tag ||
        getActiveDifficulty(),
      styles: GameState.storyStyles,
    };
    GameState.remainingQuestions = getQuestionLimit();
    GameState.discoveredClues = new Set();
    saveGameProgress();
  } catch (err) {
    console.error("generate failed", err);
    GameState.loadingPhase = null;
    stopLoadingWords();
    goConfig();
    DOMRef["error-msg"].textContent =
      t("errorDesc") + "\n" + String(err.message || err).slice(0, 200);
    DOMRef["error-modal"].classList.remove("hidden");
    return;
  }
  await sleep(800);
  GameState.loadingPhase = null;
  enterGame();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ---- DEMO STORY ---- */
function buildDemoStory() {
  return {
    title: loc() === "zh" ? "失踪的汤锅" : "The Missing Pot",
    difficultyLabel:
      (DIFFICULTY_PRESETS[getActiveDifficulty()] || {}).tag || "Demo",
    styles: GameState.storyStyles,
    outline:
      "一名店主把汤锅借给邻居，邻居误以为锅里剩下的是普通残汤，实际上里面封存着一段带有身份误认线索的真相。",
    riddle_html:
      "<p>夜里，城南的小店忽然停了业。第二天一早，店主站在门口，脸色发白。</p><p>他对警察说：<em>锅还在，汤却不见了。</em> 旁人听完只觉得荒唐，可只有问到那口锅的人，才知道他为什么一直盯着厨房角落。</p>",
    clues: [
      "锅里的东西并不是普通食物，而是被用来保存信息的媒介。",
      "真正的关键是时间差，不是失窃本身。",
      "邻居和店主对同一件物品的理解并不一致。",
      "气味、温度或残留痕迹会决定真相。",
    ],
    soup: "店主用锅保存了与一宗旧案有关的证据，邻居借走后因为误判把证据处理掉，导致店主误以为被盗；真正的秘密藏在锅里残留的气味和时间线里。",
    meta: {
      tone: GameState.storyStyles.join("、"),
      setting: "城南小店",
      characters: ["店主", "邻居", "警察"],
    },
  };
}

/* ---- ENTER GAME ---- */
function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function startSpeedTimer() {
  if (GameState.deathMode) {
    // 死亡模式：初始化倒计时
    if (!GameState.deathModeTotal) {
      GameState.deathModeTotal = getQuestionLimit() * 60;
      GameState.deathModeRemaining = GameState.deathModeTotal;
    }
    GameState.deathModeFrozen = false;
    const icon = document.querySelector(".speed-timer-icon");
    if (icon) icon.textContent = "💀";
  } else {
    if (!GameState.gameStartTime) {
      GameState.gameStartTime = Date.now();
    }
  }
  stopSpeedTimer();
  updateSpeedTimer();
  gameTimerInterval = setInterval(updateSpeedTimer, 1000);
}

function stopSpeedTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

function freezeDeathTimer() {
  if (!GameState.deathMode || GameState.deathModeFrozen) return;
  GameState.deathModeFrozen = true;
  stopSpeedTimer();
}

function resumeDeathTimer() {
  if (!GameState.deathMode || !GameState.deathModeFrozen) return;
  if (GameState.deathModeExpired || GameState.isFinished) return;
  GameState.deathModeFrozen = false;
  updateSpeedTimer();
  gameTimerInterval = setInterval(updateSpeedTimer, 1000);
}

function updateSpeedTimer() {
  if (GameState.deathMode) {
    // ---- 死亡模式：倒计时 ----
    if (GameState.deathModeFrozen || GameState.deathModeExpired) return;
    GameState.deathModeRemaining = Math.max(
      0,
      GameState.deathModeRemaining - 1,
    );
    const remaining = GameState.deathModeRemaining;
    const total = GameState.deathModeTotal || 1;
    DOMRef["speed-timer-text"].textContent = formatTimer(remaining);

    // 颜色渐变：accent(绿) → danger(红)，越少越红
    const ratio = Math.max(0, Math.min(1, remaining / total));
    // 前半段时间保持 accent，后半段线性过渡到 danger
    const dangerStart = 0.5; // 剩余 50% 开始变色
    const t = ratio >= dangerStart ? 1 : ratio / dangerStart; // 1=全绿, 0=全红
    DOMRef["speed-timer-text"].style.color = "";

    // 最后 60 秒呼吸灯
    if (remaining <= 60) {
      DOMRef["speed-timer-text"].classList.add("breathing");
      DOMRef["speed-timer-text"].style.color = "var(--danger)";
    } else if (remaining <= total * dangerStart) {
      DOMRef["speed-timer-text"].classList.remove("breathing");
      DOMRef["speed-timer-text"].style.color =
        "color-mix(in srgb, var(--danger) " +
        Math.round((1 - t) * 100) +
        "%, var(--accent) " +
        Math.round(t * 100) +
        "%)";
    } else {
      DOMRef["speed-timer-text"].classList.remove("breathing");
      DOMRef["speed-timer-text"].style.color = "";
    }

    if (remaining <= 0) {
      handleDeathModeExpiration();
    }
  } else {
    // ---- 普通模式：正计时 ----
    if (!GameState.gameStartTime) return;
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - GameState.gameStartTime) / 1000),
    );
    DOMRef["speed-timer-text"].textContent = formatTimer(elapsed);
  }
}

function handleDeathModeExpiration() {
  stopSpeedTimer();
  GameState.deathModeExpired = true;
  GameState.remainingQuestions = 0;
  GameState.canSubmit = true;
  DOMRef["question-input"].disabled = true;
  DOMRef["question-input"].placeholder = t("deathExpiredPH") || "时间耗尽...";
  DOMRef["ask-btn"].disabled = true;
  DOMRef["speed-timer-text"].textContent = "00:00";
  DOMRef["speed-timer-text"].classList.add("breathing");
  DOMRef["speed-timer-text"].style.color = "var(--danger)";
  DOMRef["submit-soup-btn"].disabled = false;
  updateGameStats();
  addChatMsg(
    "assistant",
    t("deathExpired") || "💀 时间耗尽！你的所有提问次数已被清零，请提交汤底。",
    "System",
    "deathExpired",
  );
  saveGameProgress();
}

function addDeathTime(seconds) {
  if (!GameState.deathMode || GameState.deathModeExpired) return;
  GameState.deathModeRemaining += seconds;
  if (GameState.deathModeRemaining > GameState.deathModeTotal) {
    GameState.deathModeRemaining = GameState.deathModeTotal;
  }
  updateSpeedTimer();

  // 浮动补偿动画
  const timer = DOMRef["speed-timer"];
  if (!timer) return;
  const bonus = document.createElement("span");
  bonus.className = "speed-timer-bonus";
  bonus.textContent = "+" + seconds + "s";
  timer.appendChild(bonus);
  bonus.addEventListener("animationend", function () {
    bonus.remove();
  });
}

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
  DOMRef["game-difficulty-tag"].childNodes[0].textContent = g.difficultyLabel;
  // 死亡模式标记
  DOMRef["death-mode-tag"].classList.toggle("hidden", !GameState.deathMode);
  DOMRef["game-title"].textContent = g.title;
  DOMRef["game-style-tag"].textContent = (g.styles || []).join(" / ");
  DOMRef["game-whodunit-tag"].textContent = GameState.isWhodunit
    ? t("whodunitOn")
    : t("whodunitOff");
  DOMRef["remaining-count"].textContent = String(GameState.remainingQuestions);
  DOMRef["riddle-output"].innerHTML = sanitizeHtml(g.riddle_html || "");

  syncI18n();
  if (restoring) {
    // replay question log into chat
    let qi = 0;
    GameState.questionLog.forEach((entry) => {
      if (entry.role === "user") {
        qi++;
        questionIndex = qi;
      }
      const role = entry.role === "user" ? "user" : "assistant";
      addChatMsg(
        role,
        entry.content,
        role === "user" ? t("chatRolePlayer") : t("chatRoleHost"),
      );
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
    const readyMsg = GameState.deathMode
      ? t("gameReadyDeath") ||
        "时间正在流逝，若是不能尽快完成调味，美味将会转瞬即逝..."
      : t("gameReady");
    addChatMsg("assistant", readyMsg, "System", "gameReady");
    // 存入日志以便恢复时重放
    GameState.questionLog.push({
      role: "assistant",
      content: readyMsg,
      at: new Date().toISOString(),
    });
    saveGameProgress();
  }
  if (restoring) {
    // 死亡模式恢复：更新图标和过期状态
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
  const pct = total > 0 ? GameState.remainingQuestions / total : 1;
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

/* ---- CHAT ---- */
let questionIndex = 0;
function addChatMsg(role, content, meta, i18nKey) {
  const tpl = $("chat-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  const label =
    meta || (role === "user" ? t("chatRolePlayer") : t("chatRoleHost"));
  const prefix =
    role === "user" && questionIndex > 0 ? `Q${questionIndex} · ` : "";
  node.querySelector(".chat-meta").textContent = prefix + label;
  const contentEl = node.querySelector(".chat-content");
  contentEl.textContent = content;
  if (i18nKey) contentEl.setAttribute("data-i18n", i18nKey);
  // 标记玩家提问索引，并根据盘问点发现状态添加叶绿色高亮
  if (role === "user" && questionIndex > 0) {
    node.setAttribute("data-qindex", String(questionIndex));
    if (GameState.questionsWithClueDiscovery.has(questionIndex)) {
      node.classList.add("clue-discovery");
    }
  }
  DOMRef["chat-log"].appendChild(node);
  DOMRef["chat-log"].scrollTop = DOMRef["chat-log"].scrollHeight;
}

/* ---- QUESTION HANDLING ---- */
function hasMultipleQuestions(text) {
  return (String(text).match(/[？?]/g) || []).length > 1;
}

async function handleQuestion(e) {
  e.preventDefault();
  if (!GameState.generated) {
    addChatMsg("assistant", t("waitGenerate"), "System", "waitGenerate");
    return;
  }
  const q = DOMRef["question-input"].value.trim();
  if (!q) {
    addChatMsg("assistant", t("noQuestion"), "System", "noQuestion");
    return;
  }
  if (GameState.remainingQuestions <= 0) {
    GameState.canSubmit = true;
    DOMRef["question-input"].disabled = true;
    DOMRef["question-input"].value = "";
    DOMRef["question-input"].placeholder = t("exhaustedPlaceholder");
    DOMRef["ask-btn"].disabled = true;
    updateGameStats();
    addChatMsg("assistant", t("limitHint"), "System", "limitHint");
    return;
  }

  questionIndex++;
  addChatMsg("user", q, "玩家");
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
    const reply =
      t("tooMany") +
      (loc() === "zh"
        ? "你先聚焦第一个问题。"
        : "please focus on the first one.");
    addChatMsg("assistant", reply, "Rule");
    GameState.questionLog.push({
      role: "assistant",
      content: reply,
      at: new Date().toISOString(),
    });
  } else {
    // 死亡模式：记录 LLM 开始时间 & 当前已解锁线索数
    const dmStart = GameState.deathMode ? Date.now() : null;
    const clueCountBefore = GameState.deathMode
      ? GameState.discoveredClues.size
      : 0;

    if (GameState.demoMode) {
      const reply = getLocalReply(q);
      addChatMsg("assistant", reply.reply, t("chatRoleHost"));
      GameState.questionLog.push({
        role: "assistant",
        content: reply.reply,
        clueReason: reply.clueReason || "",
        at: new Date().toISOString(),
      });
      applyClueHits(reply.matchedClues || []);

      // 死亡模式：演示模式也计入补偿（用较短时间）
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
      placeholder.finalize(reply.reply, t("chatRoleHost"));
      GameState.questionLog.push({
        role: "assistant",
        content: reply.reply,
        clueReason: reply.clueReason || "",
        at: new Date().toISOString(),
      });
      applyClueHits(reply.matchedClues || []);

      // 死亡模式：按解锁线索数 × LLM 耗时返还时间
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

function applyClueHits(indices) {
  if (!Array.isArray(indices)) return;
  let newDiscovery = false;
  indices.forEach((i) => {
    if (Number.isInteger(i) && GameState.generated?.clues?.[i] != null) {
      if (!GameState.discoveredClues.has(i)) newDiscovery = true;
      GameState.discoveredClues.add(i);
    }
  });
  // 如果有新盘问点被发现，标记当前提问并更新聊天 DOM
  if (newDiscovery && questionIndex > 0) {
    GameState.questionsWithClueDiscovery.add(questionIndex);
    const node = DOMRef["chat-log"].querySelector(
      `[data-qindex="${questionIndex}"]`,
    );
    if (node) node.classList.add("clue-discovery");
  }
}

function parseReply(raw) {
  if (!raw) return { reply: "是。", matchedClues: [], clueReason: "" };
  try {
    const parsed = normalizeJson(raw);
    return {
      reply: parsed.reply || "是。",
      matchedClues: parsed.matchedClues || [],
      clueReason: parsed.clueReason || "",
    };
  } catch (e) {
    // fallback: treat raw text as reply
    return { reply: raw.trim() || "是。", matchedClues: [], clueReason: "" };
  }
}

function addChatPlaceholder() {
  const tpl = $("chat-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add("assistant");
  node.querySelector(".chat-meta").textContent = t("chatRoleHost");
  const content = node.querySelector(".chat-content");
  content.textContent = "...";
  DOMRef["chat-log"].appendChild(node);
  DOMRef["chat-log"].scrollTop = DOMRef["chat-log"].scrollHeight;
  return {
    update: (text) => {
      content.textContent = text;
      DOMRef["chat-log"].scrollTop = DOMRef["chat-log"].scrollHeight;
    },
    finalize: (text, meta) => {
      content.textContent = text;
      node.querySelector(".chat-meta").textContent = meta || t("chatRoleHost");
      DOMRef["chat-log"].scrollTop = DOMRef["chat-log"].scrollHeight;
    },
  };
}

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
        ? "重要。"
        : "Important."
      : loc() === "zh"
        ? "不是。"
        : "No.",
    matchedClues: matched,
    clueReason: "local",
  };
}

/* ---- SUBMIT SOUP ---- */
async function submitSoup() {
  if (!GameState.generated) return;
  const guess = DOMRef["modal-soup-input"].value.trim();
  if (!guess) {
    addChatMsg("assistant", t("needSoup"), "System", "needSoup");
    return;
  }
  DOMRef["soup-modal"].classList.add("hidden");
  GameState.isFinished = true;
  stopSpeedTimer();
  goLoading();
  GameState.loadingPhase = "evaluate";
  GameState.loadingCount = 0;
  DOMRef["loading-title"].textContent = t("evaluatingTitle");
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
          DOMRef["loading-title"].textContent =
            t("evaluatingTitle") +
            ` (${full.length} ${loc() === "zh" ? "字" : "chars"})`;
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
  goGame();
  DOMRef["submit-soup-btn"].classList.add("hidden");
  DOMRef["view-result-btn"].classList.remove("hidden");
  showResultOverlay();
  updateGameStats();
}

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

/* ---- RESULT OVERLAY ---- */
function showResultOverlay() {
  if (!GameState.scoreResult || !GameState.generated) return;
  const lc = loc();
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

function hideResultOverlay() {
  DOMRef["result-overlay"].classList.add("hidden");
}

/* ---- EXPORT ---- */
function exportJson() {
  if (!GameState.generated) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: {
      language: GameState.language,
      model: GameState.model,
      isWhodunit: GameState.isWhodunit,
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

/* ---- SHARE (二进制导出) ---- */
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
      isWhodunit: GameState.isWhodunit,
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

/* ---- IMPORT (二进制导入) ---- */
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

    // 恢复游戏状态
    clearGameProgress();
    GameState.generated = {
      title: data.story.title || "Untitled",
      outline: data.story.outline || "",
      riddle_html: data.story.riddle_html || "",
      clues: data.story.clues || [],
      soup: data.story.soup || "",
      meta: data.story.meta || {},
      difficultyLabel: data.story.difficultyLabel || "导入",
      styles: data.story.styles || [],
    };
    GameState.isWhodunit = !!(data.config && data.config.isWhodunit);
    GameState.difficulty =
      (data.config && data.config.difficulty) || "custom_model";
    GameState.customDifficulty =
      (data.config && data.config.customDifficulty) || "easy";
    GameState.customQuestionLimit =
      (data.config && data.config.questionLimit) || 20;
    GameState.customTextLength = (data.config && data.config.textLength) || 800;

    // 重置游戏进度
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

/* ---- PROMPTS ---- */
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
          : Math.floor(Math.random() * 3) + 4;

  return renderTemplate(PROMPTS.story, {
    language: lc === "en" ? "English" : "Chinese",
    storyStyles: GameState.storyStyles.join(", "),
    isWhodunit: String(GameState.isWhodunit),
    difficulty: difficulty,
    questionLimit: String(getQuestionLimit()),
    textLengthMin: String(text_length_range.min),
    textLengthMax: String(text_length_range.max),
    clueCount: String(clueCount),
  });
}

function buildQuestionPrompt(question) {
  const undiscovered = (GameState.generated?.clues || []).filter(
    (_, i) => !GameState.discoveredClues.has(i),
  );
  const lang = loc() === "en" ? "en-US" : "zh-CN";
  const shortReplies =
    loc() === "en"
      ? "yes/no/important/unimportant/neither/cannot determine/not relevant"
      : "是/不是/重要/不重要/是也不是/皆有可能/无法确定/不需要关心";

  return renderTemplate(PROMPTS.question, {
    language: lang,
    difficulty: getActiveDifficulty(),
    isWhodunit: String(GameState.isWhodunit),
    shortReplies,
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

function buildScoringPrompt(guess) {
  return renderTemplate(PROMPTS.score, {
    language: loc() === "en" ? "English" : "Chinese",
    storyOutline: GameState.generated?.outline || "",
    storySoup: GameState.generated?.soup || "",
    playerGuess: guess,
    questionCount: String(GameState.questionLog.length),
    remainingQuestions: String(GameState.remainingQuestions),
    discoveredClues: String(GameState.discoveredClues.size),
    totalClues: String(GameState.generated?.clues?.length || 0),
  });
}

/* ---- API ---- */
async function apiRequest(messages, temperature = 0.8) {
  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GameState.apiKey}`,
    },
    body: JSON.stringify({
      model: GameState.model,
      messages,
      temperature,
      stream: false,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`${resp.status}: ${t}`);
  }
  return resp.json();
}

async function apiRequestStream(messages, temperature, onChunk) {
  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GameState.apiKey}`,
    },
    body: JSON.stringify({
      model: GameState.model,
      messages,
      temperature,
      stream: true,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`${resp.status}: ${t}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";
  let lastUpdate = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // split by SSE double-newline, fallback to single newline
    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() || "";
    for (const block of parts) {
      for (const line of block.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            // throttle to max ~10 updates/sec
            const now = Date.now();
            if (onChunk && now - lastUpdate > 100) {
              lastUpdate = now;
              onChunk(full);
            }
          }
        } catch (e) {
          /* skip malformed */
        }
      }
    }
  }
  if (onChunk) onChunk(full);
  return full;
}

/* ---- EVENT BINDING ---- */
function wireEvents() {
  DOMRef["cover-start-btn"].addEventListener("click", startFromCover);
  DOMRef["cover-review-btn"].addEventListener("click", () => {
    if (restoreGame()) {
      enterGame(true);
      showResultOverlay();
    }
  });
  DOMRef["apikey-form"].addEventListener("submit", handleApikeySubmit);
  DOMRef["apikey-skip"].addEventListener("click", () => {
    GameState.apiKey = "";
    GameState.demoMode = true;
    saveSettings();
    populateConfigForm();
    goConfig();
  });
  DOMRef["apikey-back"].addEventListener("click", goCover);
  DOMRef["apikey-toggle"].addEventListener("click", () => {
    const inp = DOMRef["apikey-input"];
    inp.type = inp.type === "password" ? "text" : "password";
    DOMRef["apikey-toggle"].textContent = inp.type === "password" ? "👁" : "🙈";
  });
  DOMRef["config-form"].addEventListener("submit", handleConfigSubmit);
  DOMRef["config-back"].addEventListener("click", () => {
    goApikey();
  });
  DOMRef["config-difficulty"].addEventListener("change", syncCustomControls);
  DOMRef["config-custom-difficulty"].addEventListener(
    "change",
    syncDeathModeToggle,
  );
  DOMRef["dice-random-style"].addEventListener("click", () => {
    // 随机自定义难度
    const diffs = ["newb", "easy", "hard", "hardcore"];
    const randDiff = diffs[Math.floor(Math.random() * diffs.length)];
    DOMRef["config-custom-difficulty"].value = randDiff;
    // 随机提问次数 (5-30)
    const randQL = Math.floor(Math.random() * 26) + 5;
    DOMRef["config-question-limit"].value = randQL;
    DOMRef["ql-val"].textContent = randQL;
    // 随机文本长度 (200-10000, step 100)
    const randTL = Math.floor(Math.random() * 99) * 100 + 200;
    DOMRef["config-text-length"].value = randTL;
    DOMRef["tl-val"].textContent = randTL;
    // 随机本格推理
    DOMRef["config-whodunit"].checked = Math.random() > 0.5;
    // 随机故事风格 - 取消所有勾选，填入"随机风格"
    [
      ...DOMRef["config-style-picks"].querySelectorAll(
        'input[type="checkbox"]',
      ),
    ].forEach((cb) => (cb.checked = false));
    DOMRef["config-custom-style"].value = "随机风格";
  });
  DOMRef["config-question-limit"].addEventListener("input", () => {
    DOMRef["ql-val"].textContent = DOMRef["config-question-limit"].value;
  });
  DOMRef["config-text-length"].addEventListener("input", () => {
    DOMRef["tl-val"].textContent = DOMRef["config-text-length"].value;
  });
  DOMRef["question-form"].addEventListener("submit", handleQuestion);
  DOMRef["submit-soup-btn"].addEventListener("click", openSoupModal);
  DOMRef["view-result-btn"].addEventListener("click", () => {
    if (GameState.scoreResult) showResultOverlay();
  });
  DOMRef["modal-submit-btn"].addEventListener("click", submitSoup);
  DOMRef["modal-cancel-btn"].addEventListener("click", closeSoupModal);
  DOMRef["modal-giveup-btn"].addEventListener("click", () => {
    DOMRef["soup-modal"].classList.add("hidden");
    clearGameProgress();
    startFromCover();
  });
  DOMRef["result-export-btn"].addEventListener("click", exportJson);
  DOMRef["result-share-btn"].addEventListener("click", exportSoup);
  DOMRef["game-share-btn"].addEventListener("click", exportSoup);
  DOMRef["result-close-btn"].addEventListener("click", hideResultOverlay);
  DOMRef["result-replay-btn"].addEventListener("click", () => {
    hideResultOverlay();
    clearGameProgress();
    startFromCover();
  });
  DOMRef["theme-toggle"].addEventListener("click", () => {
    toggleTheme();
    closeSideMenu();
  });
  DOMRef["lang-toggle"].addEventListener("click", () => {
    toggleLanguage();
    closeSideMenu();
  });
  DOMRef["menu-close-btn"].addEventListener("click", closeSideMenu);
  DOMRef["menu-overlay"].addEventListener("click", closeSideMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && DOMRef["side-menu"].classList.contains("open")) {
      closeSideMenu();
    }
  });
  DOMRef["nokey-go-btn"].addEventListener("click", () => {
    DOMRef["nokey-modal"].classList.add("hidden");
    goApikey();
  });
  DOMRef["nokey-cancel-btn"].addEventListener("click", () => {
    DOMRef["nokey-modal"].classList.add("hidden");
  });
  DOMRef["error-retry-btn"].addEventListener("click", () => {
    DOMRef["error-modal"].classList.add("hidden");
    DOMRef["config-form"].dispatchEvent(
      new Event("submit", { cancelable: true }),
    );
  });
  DOMRef["error-demo-btn"].addEventListener("click", () => {
    DOMRef["error-modal"].classList.add("hidden");
    GameState.demoMode = true;
    GameState.generated = buildDemoStory();
    GameState.remainingQuestions = getQuestionLimit();
    saveGameProgress();
    enterGame();
  });
  DOMRef["error-cancel-btn"].addEventListener("click", () => {
    DOMRef["error-modal"].classList.add("hidden");
  });
  DOMRef["import-soup-btn"].addEventListener("click", () => {
    DOMRef["import-soup-input"].click();
  });
  DOMRef["import-soup-input"].addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importSoup(file);
    DOMRef["import-soup-input"].value = "";
  });
}

function toggleLanguage() {
  GameState.language = GameState.language === "zh-CN" ? "en-US" : "zh-CN";
  const langIcon = DOMRef["lang-toggle"].querySelector(".menu-item-icon");
  if (langIcon)
    langIcon.textContent = GameState.language === "zh-CN" ? "🇨🇳" : "🇺🇸";
  document.documentElement.lang = GameState.language;
  syncI18n();
  saveSettings();
}

function syncI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (L[loc()] && L[loc()][key]) {
      if (el.id === "riddle-output" && GameState.generated) return;
      if (key === "qlLabel" || key === "tlLabel") {
        // 只更新文本节点，保留 <em> 元素不被 innerHTML 销毁
        const textNode = el.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE)
          textNode.textContent = t(key) + " ";
        else el.textContent = t(key);
      } else if (key === "coverDesc")
        el.innerHTML = t(key).replace(/\n/g, "<br>");
      else el.textContent = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.getAttribute("data-i18n-ph");
    if (L[loc()] && L[loc()][key]) el.placeholder = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (L[loc()] && L[loc()][key]) el.title = t(key);
  });
  if (GameState.generated) {
    DOMRef["game-whodunit-tag"].textContent = GameState.isWhodunit
      ? t("whodunitOn")
      : t("whodunitOff");
    DOMRef["remaining-label"].textContent = t("remainingLabel");
    DOMRef["question-input"].placeholder = t("askPlaceholder");
  }
  // 加载页面动态文本同步
  if (GameState.loadingPhase) {
    switch (GameState.loadingPhase) {
      case "story":
        DOMRef["loading-title"].textContent =
          GameState.loadingCount > 0
            ? t("loadingTitle") +
              ` (${GameState.loadingCount} ${loc() === "zh" ? "字" : "chars"})`
            : t("loadingTitle");
        break;
      case "storyDemo":
        DOMRef["loading-title"].textContent = t("demoWarning");
        break;
      case "evaluate":
        DOMRef["loading-title"].textContent =
          GameState.loadingCount > 0
            ? t("evaluatingTitle") +
              ` (${GameState.loadingCount} ${loc() === "zh" ? "字" : "chars"})`
            : t("evaluatingTitle");
        break;
    }
  }
}

function initTheme() {
  const saved = localStorage.getItem("turtlesoup-theme") || "dark";
  applyTheme(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("turtlesoup-theme", next);
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeIcon = DOMRef["theme-toggle"].querySelector(".menu-item-icon");
  if (themeIcon) themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
}

function initLangIcon() {
  const langIcon = DOMRef["lang-toggle"].querySelector(".menu-item-icon");
  if (langIcon)
    langIcon.textContent = GameState.language === "zh-CN" ? "🇨🇳" : "🇺🇸";
}

/* ---- Toggle Button Drag (自由拖动 ☰) ---- */
const TOGGLE_DRAG = { on: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false };

function initToggleDrag() {
  const btn = DOMRef["menu-toggle"];
  const sideMenu = DOMRef["side-menu"];

  // 恢复保存的位置
  const saved = localStorage.getItem("turtlesoup-toggle-pos");
  if (saved) {
    try {
      const pos = JSON.parse(saved);
      btn.style.right = "auto";
      if (pos.side === "right") {
        btn.style.left = window.innerWidth - btn.offsetWidth + "px";
      } else {
        btn.style.left = "0px";
      }
      btn.style.top = pos.t + "px";
    } catch (_) {}
  }

  function getXY(e) {
    return e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    if (MENU_DRAG.on) return;
    if (!btn.contains(e.target)) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    const rect = btn.getBoundingClientRect();
    TOGGLE_DRAG.on = true;
    TOGGLE_DRAG.sx = x;
    TOGGLE_DRAG.sy = y;
    TOGGLE_DRAG.ox = rect.left;
    TOGGLE_DRAG.oy = rect.top;
    TOGGLE_DRAG.moved = false;
    btn.style.transition = "none";
    btn.style.right = "auto";
    btn.style.left = rect.left + "px";
    btn.style.top = rect.top + "px";
  }

  function onMove(e) {
    if (!TOGGLE_DRAG.on) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    const dx = x - TOGGLE_DRAG.sx;
    const dy = y - TOGGLE_DRAG.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) TOGGLE_DRAG.moved = true;
    const nx = TOGGLE_DRAG.ox + dx;
    const ny = TOGGLE_DRAG.oy + dy;
    btn.style.left =
      Math.max(0, Math.min(window.innerWidth - btn.offsetWidth, nx)) + "px";
    btn.style.top =
      Math.max(0, Math.min(window.innerHeight - btn.offsetHeight, ny)) + "px";
  }

  function onEnd() {
    if (!TOGGLE_DRAG.on) return;
    TOGGLE_DRAG.on = false;
    btn.style.transition = "left 0.25s ease, top 0.25s ease";

    const bw = btn.offsetWidth;
    const bh = btn.offsetHeight;
    const cx = parseFloat(btn.style.left) + bw / 2;
    const cy = parseFloat(btn.style.top) + bh / 2;

    // 吸附到最近的一侧：左 / 右
    const snapLeft = cx < window.innerWidth / 2;
    btn.style.left = (snapLeft ? 0 : window.innerWidth - bw) + "px";
    btn.style.right = "auto";
    // 垂直保持在边界内
    btn.style.top =
      Math.max(
        0,
        Math.min(window.innerHeight - bh, parseFloat(btn.style.top)),
      ) + "px";

    // 清除过渡以便下次拖拽即时响应
    setTimeout(function () {
      btn.style.transition = "";
    }, 260);

    // 持久化（记录吸附侧和 Y 位置）
    localStorage.setItem(
      "turtlesoup-toggle-pos",
      JSON.stringify({
        side: snapLeft ? "left" : "right",
        t: parseFloat(btn.style.top),
      }),
    );

    // 如果没有拖动，视为点击
    if (!TOGGLE_DRAG.moved) {
      if (sideMenu.classList.contains("open")) {
        closeSideMenu();
      } else {
        openSideMenu();
      }
    }
  }

  btn.addEventListener("touchstart", onStart, { passive: false });
  btn.addEventListener("mousedown", onStart);
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);
}

/* ---- Side Menu (drag-enabled) ---- */
const MENU_DRAG = { on: false, sx: 0, st: 0, last: 0 };

function initMenuDrag() {
  const drawer = DOMRef["menu-drawer"];
  const sideMenu = DOMRef["side-menu"];
  const overlay = DOMRef["menu-overlay"];

  function getX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onStart(e) {
    if (MENU_DRAG.on) return;
    const x = getX(e);
    const w = drawer.offsetWidth;
    const isOpen = sideMenu.classList.contains("open");
    const onDrawer = drawer.contains(e.target);
    const nearEdge =
      !isOpen &&
      x > window.innerWidth - 40 &&
      !e.target.closest("button, a, input, textarea, select, label");

    if (!onDrawer && !nearEdge) return;

    MENU_DRAG.on = true;
    MENU_DRAG.sx = x;
    MENU_DRAG.st = isOpen ? 0 : w;
    MENU_DRAG.last = MENU_DRAG.st;
    drawer.classList.add("dragging");

    if (!isOpen) {
      sideMenu.classList.add("open");
      overlay.style.transition = "none";
    }
  }

  function onMove(e) {
    if (!MENU_DRAG.on) return;
    e.preventDefault();
    const w = drawer.offsetWidth;
    const dx = getX(e) - MENU_DRAG.sx;
    let t = MENU_DRAG.st + dx;
    t = Math.max(0, Math.min(w, t));
    MENU_DRAG.last = t;
    drawer.style.transform = "translateX(" + t + "px)";
    const p = 1 - t / w;
    overlay.style.opacity = p;
    overlay.style.pointerEvents = p > 0.01 ? "auto" : "none";
  }

  function onEnd() {
    if (!MENU_DRAG.on) return;
    MENU_DRAG.on = false;
    drawer.classList.remove("dragging");
    drawer.style.transform = "";
    overlay.style.transition = "";
    overlay.style.opacity = "";
    overlay.style.pointerEvents = "";

    const threshold = drawer.offsetWidth * 0.4;
    if (MENU_DRAG.last < threshold) {
      openSideMenu();
    } else {
      closeSideMenu();
    }
  }

  document.addEventListener("touchstart", onStart, { passive: false });
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);
  document.addEventListener("mousedown", onStart);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);
}

function openSideMenu() {
  DOMRef["side-menu"].classList.add("open");
  DOMRef["menu-toggle"].classList.add("menu-open");
}
function closeSideMenu() {
  DOMRef["side-menu"].classList.remove("open");
  DOMRef["menu-toggle"].classList.remove("menu-open");
}

/* ---- Game Split Handle (移动端面板占比拖拽) ---- */
const SPLIT_DRAG = { on: false, sy: 0, sh: 0 };

function initGameSplitHandle() {
  const handle = document.getElementById("game-split-handle");
  const layout = document.querySelector(".game-layout");
  if (!handle || !layout) return;

  function getY(e) {
    return e.touches ? e.touches[0].clientY : e.clientY;
  }

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function onStart(e) {
    if (!handle.contains(e.target)) return;
    if (!isMobile()) return;
    SPLIT_DRAG.on = true;
    SPLIT_DRAG.sy = getY(e);
    const topPanel = layout.querySelector(".game-left");
    SPLIT_DRAG.sh = topPanel
      ? topPanel.getBoundingClientRect().height
      : layout.clientHeight / 2;
    handle.classList.add("dragging");
    e.preventDefault();
  }

  function onMove(e) {
    if (!SPLIT_DRAG.on) return;
    e.preventDefault();
    const dy = getY(e) - SPLIT_DRAG.sy;
    const layoutH = layout.clientHeight;
    const hh = handle.offsetHeight || 8;
    const minH = layoutH * 0.15;
    const maxH = layoutH * 0.85 - hh;
    let topH = Math.max(minH, Math.min(maxH, SPLIT_DRAG.sh + dy));
    const topPct = (topH / layoutH) * 100;
    const botPct = 100 - topPct - (hh / layoutH) * 100;
    layout.style.gridTemplateRows = topPct + "% " + hh + "px " + botPct + "%";
  }

  function onEnd() {
    if (!SPLIT_DRAG.on) return;
    SPLIT_DRAG.on = false;
    handle.classList.remove("dragging");
    const rows = layout.style.gridTemplateRows;
    const m = rows.match(/^([\d.]+)%/);
    if (m) localStorage.setItem("turtlesoup-split", parseFloat(m[1]));
  }

  // 恢复保存的比例
  function restoreRatio() {
    if (!isMobile()) return;
    const saved = parseFloat(localStorage.getItem("turtlesoup-split"));
    if (!saved) return;
    const hh = handle.offsetHeight || 8;
    const botPct = 100 - saved - (hh / layout.clientHeight) * 100;
    layout.style.gridTemplateRows = saved + "% " + hh + "px " + botPct + "%";
  }

  handle.addEventListener("touchstart", onStart, { passive: false });
  handle.addEventListener("mousedown", onStart);
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);
  window.addEventListener("resize", restoreRatio);

  restoreRatio();
}

function openSoupModal() {
  if (!GameState.generated) return;
  DOMRef["modal-soup-input"].value = "";
  DOMRef["modal-soup-input"].placeholder = t("soupPlaceholder");
  DOMRef["soup-modal"].classList.remove("hidden");
  DOMRef["modal-soup-input"].focus();
}
function closeSoupModal() {
  DOMRef["soup-modal"].classList.add("hidden");
}

/* ---- BOOT ---- */
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
