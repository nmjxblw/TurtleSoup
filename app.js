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
const S = {
  apiKey: "",
  model: "deepseek-chat",
  language: "zh-CN",
  isWhodunit: true,
  difficulty: "custom_model",
  customDifficulty: "easy",
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
};

/* ---- DOM refs ---- */
const E = {};
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
    "question-ring",
    "theme-toggle",
    "lang-toggle",
    "nokey-modal",
    "nokey-go-btn",
    "nokey-cancel-btn",
    "dice-random-style",
  ];
  ids.forEach((id) => {
    E[id] = $(id);
  });
}

/* ---- helpers ---- */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function loc() {
  return S.language === "en-US" ? "en" : "zh";
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
  const raw = m ? m[1].trim() : s;
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  return JSON.parse(a >= 0 && b >= 0 ? raw.slice(a, b + 1) : raw);
}

function getActiveDifficulty() {
  return S.difficulty === "custom_model" ? S.customDifficulty : S.difficulty;
}
function getQuestionLimit() {
  if (S.difficulty === "custom_model")
    return clamp(S.customQuestionLimit, 5, 30);
  return DIFFICULTY_PRESETS[getActiveDifficulty()].questionLimit;
}
function getLengthRange() {
  if (S.difficulty === "custom_model") {
    const len = clamp(S.customTextLength, 200, 10000);
    return { min: Math.max(100, Math.round(len * 0.7)), max: len };
  }
  const p = DIFFICULTY_PRESETS[getActiveDifficulty()];
  return { min: p.minLen, max: p.maxLen };
}
function getSelectedStyles() {
  const picks = [
    ...E["config-style-picks"].querySelectorAll(
      'input[type="checkbox"]:checked',
    ),
  ].map((cb) => cb.value);
  const custom = E["config-custom-style"].value
    .split(/[，,|\\\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = [...new Set([...picks, ...custom])];
  return merged.length ? merged : ["悬疑推理"];
}

/* ---- VIEW ROUTING ---- */
function showView(viewId) {
  [
    "view-cover",
    "view-apikey",
    "view-config",
    "view-loading",
    "view-game",
  ].forEach((id) => {
    E[id].classList.toggle("hidden", id !== viewId);
  });
}

/* ---- PERSISTENCE ---- */
function saveSettings() {
  const data = {
    apiKey: S.apiKey,
    model: S.model,
    language: S.language,
    isWhodunit: S.isWhodunit,
    difficulty: S.difficulty,
    customDifficulty: S.customDifficulty,
    customQuestionLimit: S.customQuestionLimit,
    customTextLength: S.customTextLength,
    storyStyles: S.storyStyles,
    customStyleText: S.customStyleText,
  };
  localStorage.setItem("turtlesoup-settings", JSON.stringify(data));
  localStorage.setItem("turtlesoup-visited", "1");
}
function loadSettings() {
  try {
    const raw = localStorage.getItem("turtlesoup-settings");
    if (raw) {
      const d = JSON.parse(raw);
      Object.assign(S, d);
    }
  } catch (e) {
    /* ignore */
  }
}
function isFirstVisit() {
  return !localStorage.getItem("turtlesoup-visited");
}

function saveGameProgress() {
  if (!S.generated) return;
  const data = {
    generated: S.generated,
    remainingQuestions: S.remainingQuestions,
    discoveredClues: [...S.discoveredClues],
    questionsWithClueDiscovery: [...S.questionsWithClueDiscovery],
    questionLog: S.questionLog,
    canSubmit: S.canSubmit,
    isFinished: S.isFinished,
    scoreResult: S.scoreResult,
    isWhodunit: S.isWhodunit,
    demoMode: S.demoMode,
    questionIndex: questionIndex,
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
  if (!saved || !saved.generated) return false;
  S.generated = saved.generated;
  S.remainingQuestions = saved.remainingQuestions;
  S.discoveredClues = saved.discoveredClues;
  S.questionsWithClueDiscovery = saved.questionsWithClueDiscovery;
  S.questionLog = saved.questionLog || [];
  S.canSubmit = saved.canSubmit;
  S.isFinished = !!saved.isFinished;
  S.scoreResult = saved.scoreResult || null;
  S.isWhodunit = !!saved.isWhodunit;
  S.demoMode = !!saved.demoMode;
  questionIndex = saved.questionIndex || 0;
  return true;
}

/* ---- COVER → APIKEY / CONFIG ---- */
function goCover() {
  showView("view-cover");
  E["cover-review-btn"].classList.add("hidden");
  const progress = loadGameProgress();
  if (progress && progress.isFinished) {
    E["cover-review-btn"].classList.remove("hidden");
  }
}
function goApikey() {
  showView("view-apikey");
  if (S.apiKey) E["apikey-input"].value = S.apiKey;
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
  const container = E["loading-words"];
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
    _loadingWordsTimer = setTimeout(tick, 600);
  }
  tick();
}

function stopLoadingWords() {
  if (_loadingWordsTimer) {
    clearTimeout(_loadingWordsTimer);
    _loadingWordsTimer = null;
  }
  const container = E["loading-words"];
  if (container) container.innerHTML = "";
}

function startFromCover() {
  clearGameProgress();
  E["cover-review-btn"].classList.add("hidden");
  loadSettings();
  if (S.apiKey && S.apiKey.startsWith("sk-")) {
    populateConfigForm();
    goConfig();
  } else {
    goApikey();
  }
}

function populateConfigForm() {
  E["config-difficulty"].value = S.difficulty || "custom_model";
  E["config-model"].value = S.model || "deepseek-chat";
  E["config-custom-difficulty"].value = S.customDifficulty || "easy";
  E["config-question-limit"].value = S.customQuestionLimit || 20;
  E["ql-val"].textContent = S.customQuestionLimit || 20;
  E["config-text-length"].value = S.customTextLength || 800;
  E["tl-val"].textContent = S.customTextLength || 800;
  E["config-whodunit"].checked = !!S.isWhodunit;
  E["config-custom-style"].value = S.customStyleText || "";
  const sel = new Set(S.storyStyles || ["悬疑推理"]);
  [
    ...E["config-style-picks"].querySelectorAll('input[type="checkbox"]'),
  ].forEach((cb) => {
    cb.checked = sel.has(cb.value);
  });
  syncCustomControls();
}

function syncCustomControls() {
  const isCustom = E["config-difficulty"].value === "custom_model";
  E["custom-controls"].classList.toggle("hidden", !isCustom);
  E["dice-random-style"].classList.toggle("hidden", !isCustom);
}

/* ---- API KEY SUBMIT ---- */
function handleApikeySubmit(e) {
  e.preventDefault();
  S.apiKey = E["apikey-input"].value.trim();
  S.demoMode = !S.apiKey;
  saveSettings();
  populateConfigForm();
  goConfig();
}

/* ---- CONFIG SUBMIT → LOADING → GENERATE ---- */
async function handleConfigSubmit(e) {
  e.preventDefault();
  S.difficulty = E["config-difficulty"].value;
  S.model = E["config-model"].value;
  S.customDifficulty = E["config-custom-difficulty"].value;
  S.customQuestionLimit = Number(E["config-question-limit"].value);
  S.customTextLength = Number(E["config-text-length"].value);
  S.isWhodunit = E["config-whodunit"].checked;
  S.storyStyles = getSelectedStyles();
  S.customStyleText = E["config-custom-style"].value.trim();
  saveSettings();

  if (!S.apiKey) {
    E["nokey-modal"].classList.remove("hidden");
    return;
  }

  clearGameProgress();
  // reset game state
  S.generated = null;
  S.questionLog = [];
  S.scoreResult = null;
  S.remainingQuestions = 0;
  S.discoveredClues = new Set();
  S.questionsWithClueDiscovery = new Set();
  S.canSubmit = false;
  S.isFinished = false;
  S.demoMode = !S.apiKey;

  // go loading
  goLoading();
  S.loadingPhase = "story";
  S.loadingCount = 0;
  E["loading-title"].textContent = t("loadingTitle");
  startLoadingWords();

  // generate
  if (!S.apiKey) {
    S.generated = buildDemoStory();
    S.remainingQuestions = getQuestionLimit();
    S.loadingPhase = "storyDemo";
    E["loading-title"].textContent = t("demoWarning");
    await sleep(1200);
    S.loadingPhase = null;
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
            language: S.language,
            is_whodunit: S.isWhodunit,
            difficulty: getActiveDifficulty(),
            question_limit: getQuestionLimit(),
            style: S.storyStyles,
            length: getLengthRange(),
          }),
        },
      ],
      0.95,
      (full) => {
        S.loadingCount = full.length;
        E["loading-title"].textContent =
          t("loadingTitle") +
          ` (${full.length} ${loc() === "zh" ? "字" : "chars"})`;
      },
    );
    const story = normalizeJson(content);
    S.generated = {
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
      styles: S.storyStyles,
    };
    S.remainingQuestions = getQuestionLimit();
    S.discoveredClues = new Set();
  } catch (err) {
    console.error("generate failed", err);
    S.demoMode = true;
    S.generated = buildDemoStory();
    S.remainingQuestions = getQuestionLimit();
  }
  await sleep(800);
  S.loadingPhase = null;
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
    styles: S.storyStyles,
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
      tone: S.storyStyles.join("、"),
      setting: "城南小店",
      characters: ["店主", "邻居", "警察"],
    },
  };
}

/* ---- ENTER GAME ---- */
function enterGame(restoring) {
  goGame();
  if (!restoring) {
    E["chat-log"].innerHTML = "";
  }
  if (!restoring) {
    E["question-input"].value = "";
    E["question-input"].placeholder = t("askPlaceholder");
    E["question-input"].disabled = false;
    E["ask-btn"].disabled = false;
    E["result-overlay"].classList.add("hidden");
    E["soup-modal"].classList.add("hidden");
    E["submit-soup-btn"].disabled = true;
    E["submit-soup-btn"].classList.remove("hidden");
    E["view-result-btn"].classList.add("hidden");
    E["deduction-bar"].style.width = "0%";
    E["deduction-text"].textContent = "0 / 0";
    questionIndex = 0;
    S.isFinished = false;
    S.canSubmit = false;
    S.questionsWithClueDiscovery = new Set();
  }

  if (!S.generated) return;

  const g = S.generated;
  E["game-difficulty-tag"].textContent = g.difficultyLabel;
  E["game-title"].textContent = g.title;
  E["game-style-tag"].textContent = (g.styles || []).join(" / ");
  E["game-whodunit-tag"].textContent = S.isWhodunit
    ? t("whodunitOn")
    : t("whodunitOff");
  E["remaining-count"].textContent = String(S.remainingQuestions);
  E["riddle-output"].innerHTML = sanitizeHtml(g.riddle_html || "");

  syncI18n();
  if (restoring) {
    // replay question log into chat
    let qi = 0;
    S.questionLog.forEach((entry) => {
      if (entry.role === "user") {
        qi++;
        questionIndex = qi;
      }
      const role = entry.role === "user" ? "user" : "assistant";
      addChatMsg(role, entry.content, role === "user" ? "玩家" : "LLM");
    });
    questionIndex = qi;
    if (S.remainingQuestions <= 0) {
      E["question-input"].disabled = true;
      E["question-input"].placeholder = t("exhaustedPlaceholder");
      E["ask-btn"].disabled = true;
    }
    if (S.canSubmit || S.isFinished) E["submit-soup-btn"].disabled = false;
    if (S.isFinished) {
      E["submit-soup-btn"].classList.add("hidden");
      E["view-result-btn"].classList.remove("hidden");
    }
  }
  updateGameStats();
  if (!restoring) addChatMsg("assistant", t("gameReady"), "System");
}

function updateGameStats() {
  E["remaining-count"].textContent = S.generated
    ? String(S.remainingQuestions)
    : "--";
  E["submit-soup-btn"].disabled = !S.generated || S.isFinished;

  const ring = E["question-ring"];
  if (!S.generated) {
    ring.style.borderColor = "rgba(255,255,255,0.1)";
    return;
  }
  const total =
    S.remainingQuestions +
    S.questionLog.filter((l) => l.role === "user").length;
  const pct = total > 0 ? S.remainingQuestions / total : 1;
  if (S.remainingQuestions <= 3) ring.style.borderColor = "var(--danger)";
  else if (S.remainingQuestions <= 8)
    ring.style.borderColor = "var(--accent-2)";
  else ring.style.borderColor = "var(--accent)";

  const totalClues = S.generated?.clues?.length || 0;
  const found = S.discoveredClues?.size || 0;
  E["deduction-text"].textContent = `${found} / ${totalClues}`;
  E["deduction-bar"].style.width =
    totalClues > 0 ? `${(found / totalClues) * 100}%` : "0%";
}

/* ---- CHAT ---- */
let questionIndex = 0;
function addChatMsg(role, content, meta) {
  const tpl = $("chat-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  const label = meta || (role === "user" ? "玩家" : "LLM");
  const prefix =
    role === "user" && questionIndex > 0 ? `Q${questionIndex} · ` : "";
  node.querySelector(".chat-meta").textContent = prefix + label;
  node.querySelector(".chat-content").textContent = content;
  // 标记玩家提问索引，并根据盘问点发现状态添加叶绿色高亮
  if (role === "user" && questionIndex > 0) {
    node.setAttribute("data-qindex", String(questionIndex));
    if (S.questionsWithClueDiscovery.has(questionIndex)) {
      node.classList.add("clue-discovery");
    }
  }
  E["chat-log"].appendChild(node);
  E["chat-log"].scrollTop = E["chat-log"].scrollHeight;
}

/* ---- QUESTION HANDLING ---- */
function hasMultipleQuestions(text) {
  return (String(text).match(/[？?]/g) || []).length > 1;
}

async function handleQuestion(e) {
  e.preventDefault();
  if (!S.generated) {
    addChatMsg("assistant", t("waitGenerate"), "System");
    return;
  }
  const q = E["question-input"].value.trim();
  if (!q) {
    addChatMsg("assistant", t("noQuestion"), "System");
    return;
  }
  if (S.remainingQuestions <= 0) {
    S.canSubmit = true;
    E["question-input"].disabled = true;
    E["question-input"].value = "";
    E["question-input"].placeholder = t("exhaustedPlaceholder");
    E["ask-btn"].disabled = true;
    updateGameStats();
    addChatMsg("assistant", t("limitHint"), "System");
    return;
  }

  questionIndex++;
  addChatMsg("user", q, "玩家");
  E["question-input"].value = "";
  S.questionLog.push({
    role: "user",
    content: q,
    at: new Date().toISOString(),
  });
  S.remainingQuestions = Math.max(0, S.remainingQuestions - 1);

  if (S.remainingQuestions <= 0) {
    E["question-input"].disabled = true;
    E["question-input"].placeholder = t("exhaustedPlaceholder");
    E["ask-btn"].disabled = true;
  }

  if (hasMultipleQuestions(q)) {
    const reply =
      t("tooMany") +
      (loc() === "zh"
        ? "你先聚焦第一个问题。"
        : "please focus on the first one.");
    addChatMsg("assistant", reply, "Rule");
    S.questionLog.push({
      role: "assistant",
      content: reply,
      at: new Date().toISOString(),
    });
  } else {
    if (S.demoMode) {
      const reply = getLocalReply(q);
      addChatMsg("assistant", reply.reply, "LLM");
      S.questionLog.push({
        role: "assistant",
        content: reply.reply,
        clueReason: reply.clueReason || "",
        at: new Date().toISOString(),
      });
      applyClueHits(reply.matchedClues || []);
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
      placeholder.finalize(reply.reply, "LLM");
      S.questionLog.push({
        role: "assistant",
        content: reply.reply,
        clueReason: reply.clueReason || "",
        at: new Date().toISOString(),
      });
      applyClueHits(reply.matchedClues || []);
    }
  }
  finalizeTurn();
  saveGameProgress();
}

function finalizeTurn() {
  if (S.generated && S.discoveredClues.size === S.generated.clues.length) {
    S.canSubmit = true;
  }
  if (S.remainingQuestions <= 0) {
    S.canSubmit = true;
  }
  updateGameStats();
}

function applyClueHits(indices) {
  if (!Array.isArray(indices)) return;
  let newDiscovery = false;
  indices.forEach((i) => {
    if (Number.isInteger(i) && S.generated?.clues?.[i] != null) {
      if (!S.discoveredClues.has(i)) newDiscovery = true;
      S.discoveredClues.add(i);
    }
  });
  // 如果有新盘问点被发现，标记当前提问并更新聊天 DOM
  if (newDiscovery && questionIndex > 0) {
    S.questionsWithClueDiscovery.add(questionIndex);
    const node = E["chat-log"].querySelector(
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
  node.querySelector(".chat-meta").textContent = "LLM";
  const content = node.querySelector(".chat-content");
  content.textContent = "...";
  E["chat-log"].appendChild(node);
  E["chat-log"].scrollTop = E["chat-log"].scrollHeight;
  return {
    update: (text) => {
      content.textContent = text;
      E["chat-log"].scrollTop = E["chat-log"].scrollHeight;
    },
    finalize: (text, meta) => {
      content.textContent = text;
      node.querySelector(".chat-meta").textContent = meta || "LLM";
      E["chat-log"].scrollTop = E["chat-log"].scrollHeight;
    },
  };
}

function getLocalReply(question) {
  const n = question.toLowerCase();
  const clues = S.generated?.clues || [];
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
  if (!S.generated) return;
  const guess = E["modal-soup-input"].value.trim();
  if (!guess) {
    addChatMsg("assistant", t("needSoup"), "System");
    return;
  }
  E["soup-modal"].classList.add("hidden");
  S.isFinished = true;
  goLoading();
  S.loadingPhase = "evaluate";
  S.loadingCount = 0;
  E["loading-title"].textContent = t("evaluatingTitle");
  startLoadingWords();

  if (S.demoMode) {
    S.scoreResult = getLocalScore(guess);
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
          S.loadingCount = full.length;
          E["loading-title"].textContent =
            t("evaluatingTitle") +
            ` (${full.length} ${loc() === "zh" ? "字" : "chars"})`;
        },
      );
      const p = normalizeJson(raw);
      S.scoreResult = {
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
      S.scoreResult = getLocalScore(guess);
    }
  }
  saveGameProgress();
  S.loadingPhase = null;
  goGame();
  E["submit-soup-btn"].classList.add("hidden");
  E["view-result-btn"].classList.remove("hidden");
  showResultOverlay();
  updateGameStats();
}

function getLocalScore(guess) {
  const soup = S.generated?.soup || "";
  let score = 30;
  const gt = guess.replace(/\s+/g, "");
  const st = soup.replace(/\s+/g, "");
  if (!gt) score = 0;
  else {
    const overlap = [...new Set(gt)].filter((c) => st.includes(c)).length;
    score = clamp(
      20 + overlap * 4 + Math.max(0, 20 - S.remainingQuestions),
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
  if (!S.scoreResult || !S.generated) return;
  const lc = loc();
  const r = S.scoreResult;
  const g = S.generated;
  const cluesHtml = g.clues
    .map((c, i) => {
      const found = S.discoveredClues.has(i);
      return `<li class="${found ? "found" : ""}">${escapeHtml(c)} <small>(${found ? t("clueFound") : t("cluePending")})</small></li>`;
    })
    .join("");

  E["result-card-content"].innerHTML = `
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
  E["result-overlay"].classList.remove("hidden");
}

function hideResultOverlay() {
  E["result-overlay"].classList.add("hidden");
}

/* ---- EXPORT ---- */
function exportJson() {
  if (!S.generated) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: {
      language: S.language,
      model: S.model,
      isWhodunit: S.isWhodunit,
      difficulty: S.difficulty,
      customDifficulty: S.customDifficulty,
      questionLimit: getQuestionLimit(),
      lengthRange: getLengthRange(),
      storyStyles: S.storyStyles,
    },
    story: {
      title: S.generated.title,
      outline: S.generated.outline,
      riddle_html: S.generated.riddle_html,
      clues: S.generated.clues,
      soup: S.generated.soup,
      meta: S.generated.meta,
    },
    player: {
      remainingQuestions: S.remainingQuestions,
      questionsAsked: S.questionLog,
      discoveredClues: [...S.discoveredClues],
      soupGuess: E["modal-soup-input"].value.trim(),
      scoreResult: S.scoreResult,
      demoMode: S.demoMode,
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

/* ---- PROMPTS ---- */
function buildStoryPrompt() {
  const ad = getActiveDifficulty();
  const lr = getLengthRange();
  const lc = loc();
  const clueCount =
    ad === "newb"
      ? Math.floor(Math.random() * 3) + 2
      : ad === "easy"
        ? Math.floor(Math.random() * 3) + 3
        : ad === "hard"
          ? Math.floor(Math.random() * 3) + 3
          : Math.floor(Math.random() * 3) + 4;

  return renderTemplate(PROMPTS.story, {
    language: lc === "en" ? "English" : "Chinese",
    storyStyles: S.storyStyles.join(", "),
    isWhodunit: String(S.isWhodunit),
    difficulty: ad,
    questionLimit: String(getQuestionLimit()),
    textLengthMin: String(lr.min),
    textLengthMax: String(lr.max),
    clueCount: String(clueCount),
  });
}

function buildQuestionPrompt(question) {
  const undiscovered = (S.generated?.clues || []).filter(
    (_, i) => !S.discoveredClues.has(i),
  );
  const lang = loc() === "en" ? "en-US" : "zh-CN";
  const shortReplies =
    loc() === "en"
      ? "yes/no/important/unimportant/neither/cannot determine/not relevant"
      : "是/不是/重要/不重要/是也不是/皆有可能/无法确定/不需要关心";

  return renderTemplate(PROMPTS.question, {
    language: lang,
    difficulty: getActiveDifficulty(),
    isWhodunit: String(S.isWhodunit),
    shortReplies,
    storyTitle: S.generated?.title || "",
    storyOutline: S.generated?.outline || "",
    riddleText: stripHtml(S.generated?.riddle_html || ""),
    allClues: JSON.stringify(
      (S.generated?.clues || []).map((c, i) => ({ i, text: c })),
    ),
    undiscoveredClues: undiscovered.length
      ? `Still undiscovered clues: ${JSON.stringify(undiscovered)}.\n`
      : "",
    discoveredClueIndices: JSON.stringify([...S.discoveredClues]),
    recentDialogue: JSON.stringify(S.questionLog.slice(-6)),
    playerQuestion: question,
  });
}

function buildScoringPrompt(guess) {
  return renderTemplate(PROMPTS.score, {
    language: loc() === "en" ? "English" : "Chinese",
    storyOutline: S.generated?.outline || "",
    storySoup: S.generated?.soup || "",
    playerGuess: guess,
    questionCount: String(S.questionLog.length),
    remainingQuestions: String(S.remainingQuestions),
    discoveredClues: String(S.discoveredClues.size),
    totalClues: String(S.generated?.clues?.length || 0),
  });
}

/* ---- API ---- */
async function apiRequest(messages, temperature = 0.8) {
  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${S.apiKey}`,
    },
    body: JSON.stringify({
      model: S.model,
      messages,
      temperature,
      stream: false,
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
      Authorization: `Bearer ${S.apiKey}`,
    },
    body: JSON.stringify({
      model: S.model,
      messages,
      temperature,
      stream: true,
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
  E["cover-start-btn"].addEventListener("click", startFromCover);
  E["cover-review-btn"].addEventListener("click", () => {
    if (restoreGame()) {
      enterGame(true);
      showResultOverlay();
    }
  });
  E["apikey-form"].addEventListener("submit", handleApikeySubmit);
  E["apikey-skip"].addEventListener("click", () => {
    S.apiKey = "";
    S.demoMode = true;
    saveSettings();
    populateConfigForm();
    goConfig();
  });
  E["apikey-back"].addEventListener("click", goCover);
  E["apikey-toggle"].addEventListener("click", () => {
    const inp = E["apikey-input"];
    inp.type = inp.type === "password" ? "text" : "password";
    E["apikey-toggle"].textContent = inp.type === "password" ? "👁" : "🙈";
  });
  E["config-form"].addEventListener("submit", handleConfigSubmit);
  E["config-back"].addEventListener("click", () => {
    goApikey();
  });
  E["config-difficulty"].addEventListener("change", syncCustomControls);
  E["dice-random-style"].addEventListener("click", () => {
    // 取消所有风格勾选
    [
      ...E["config-style-picks"].querySelectorAll('input[type="checkbox"]'),
    ].forEach((cb) => (cb.checked = false));
    // 填入"随机风格"
    E["config-custom-style"].value = "随机风格";
  });
  E["config-question-limit"].addEventListener("input", () => {
    E["ql-val"].textContent = E["config-question-limit"].value;
  });
  E["config-text-length"].addEventListener("input", () => {
    E["tl-val"].textContent = E["config-text-length"].value;
  });
  E["question-form"].addEventListener("submit", handleQuestion);
  E["submit-soup-btn"].addEventListener("click", openSoupModal);
  E["view-result-btn"].addEventListener("click", () => {
    if (S.scoreResult) showResultOverlay();
  });
  E["modal-submit-btn"].addEventListener("click", submitSoup);
  E["modal-cancel-btn"].addEventListener("click", closeSoupModal);
  E["result-export-btn"].addEventListener("click", exportJson);
  E["result-close-btn"].addEventListener("click", hideResultOverlay);
  E["result-replay-btn"].addEventListener("click", () => {
    hideResultOverlay();
    clearGameProgress();
    startFromCover();
  });
  E["theme-toggle"].addEventListener("click", toggleTheme);
  E["lang-toggle"].addEventListener("click", toggleLanguage);
  E["nokey-go-btn"].addEventListener("click", () => {
    E["nokey-modal"].classList.add("hidden");
    goApikey();
  });
  E["nokey-cancel-btn"].addEventListener("click", () => {
    E["nokey-modal"].classList.add("hidden");
  });
}

function toggleLanguage() {
  S.language = S.language === "zh-CN" ? "en-US" : "zh-CN";
  E["lang-toggle"].textContent = S.language === "zh-CN" ? "🇨🇳" : "🇺🇸";
  document.documentElement.lang = S.language;
  syncI18n();
  saveSettings();
}

function syncI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (L[loc()] && L[loc()][key]) {
      if (el.id === "riddle-output" && S.generated) return;
      if (key === "qlLabel")
        el.innerHTML = `${t(key)} <em id="ql-val">${E["ql-val"]?.textContent || "20"}</em>`;
      else if (key === "tlLabel")
        el.innerHTML = `${t(key)} <em id="tl-val">${E["tl-val"]?.textContent || "800"}</em>`;
      else if (key === "coverDesc")
        el.innerHTML = t(key).replace(/\n/g, "<br>");
      else el.textContent = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.getAttribute("data-i18n-ph");
    if (L[loc()] && L[loc()][key]) el.placeholder = t(key);
  });
  if (S.generated) {
    E["game-whodunit-tag"].textContent = S.isWhodunit
      ? t("whodunitOn")
      : t("whodunitOff");
    E["remaining-label"].textContent = t("remainingLabel");
    E["question-input"].placeholder = t("askPlaceholder");
  }
  // 加载页面动态文本同步
  if (S.loadingPhase) {
    switch (S.loadingPhase) {
      case "story":
        E["loading-title"].textContent =
          S.loadingCount > 0
            ? t("loadingTitle") +
              ` (${S.loadingCount} ${loc() === "zh" ? "字" : "chars"})`
            : t("loadingTitle");
        break;
      case "storyDemo":
        E["loading-title"].textContent = t("demoWarning");
        break;
      case "evaluate":
        E["loading-title"].textContent =
          S.loadingCount > 0
            ? t("evaluatingTitle") +
              ` (${S.loadingCount} ${loc() === "zh" ? "字" : "chars"})`
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
  E["theme-toggle"].textContent = theme === "dark" ? "🌙" : "☀️";
}

function initLangIcon() {
  E["lang-toggle"].textContent = S.language === "zh-CN" ? "🇨🇳" : "🇺🇸";
}

function openSoupModal() {
  if (!S.generated) return;
  E["modal-soup-input"].value = "";
  E["modal-soup-input"].placeholder = t("soupPlaceholder");
  E["soup-modal"].classList.remove("hidden");
  E["modal-soup-input"].focus();
}
function closeSoupModal() {
  E["soup-modal"].classList.add("hidden");
}

/* ---- BOOT ---- */
async function boot() {
  await Promise.all([loadI18n(), loadPrompts()]);
  initDom();
  loadSettings();
  initTheme();
  initLangIcon();
  wireEvents();
  syncI18n();
  if (restoreGame()) {
    enterGame(true);
    if (S.isFinished) showResultOverlay();
  } else {
    goCover();
    const progress = loadGameProgress();
    if (progress && progress.isFinished) {
      E["cover-review-btn"].classList.remove("hidden");
    }
  }
  window.addEventListener("beforeunload", saveGameProgress);
}

document.addEventListener("DOMContentLoaded", () => boot());
