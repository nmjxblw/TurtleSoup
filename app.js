/* ================================================================
   TurtleSoup — 海龟汤 AI 推理游戏
   Views: cover → apikey (first-time) → config → loading → game
   ================================================================ */

const BASE_URL = "https://api.deepseek.com";

const DIFFICULTY_PRESETS = {
  "difficulty.newb": {
    questionLimit: 30,
    minLen: 120,
    maxLen: 500,
    tag: "入门",
    tagEn: "Newbie",
  },
  "difficulty.easy": {
    questionLimit: 25,
    minLen: 300,
    maxLen: 1000,
    tag: "简单",
    tagEn: "Easy",
  },
  "difficulty.hard": {
    questionLimit: 15,
    minLen: 300,
    maxLen: 2000,
    tag: "专家",
    tagEn: "Hard",
  },
  "difficulty.hardcore": {
    questionLimit: 12,
    minLen: 200,
    maxLen: 10000,
    tag: "硬核",
    tagEn: "Hardcore",
  },
};

const L = {
  zh: {
    // cover
    coverDesc:
      "一个故事，一碗汤。\n你只知道开头，却猜不到结局。\n向 AI 提问，拼凑真相，还原完整的故事。",
    startBtn: "开始推理",
    // apikey
    apikeyTitle: "API Key配置",
    apikeyDesc:
      "输入 DeepSeek API Key 驱动谜题生成与问答。Key 仅保存在你的浏览器本地。",
    apiKeyLabel: "DeepSeek API Key",
    modelLabel: "模型选择",
    apikeyNext: "下一步：配置游戏",
    apikeySkip: "跳过，使用演示模式",
    backCover: "← 返回封面",
    // config
    configTitle: "定制你的谜题",
    configDesc: "选择故事风格、推理类型与难度，AI 将据此生成专属海龟汤。",
    langLabel: "界面语言",
    diffLabel: "难度",
    diffCustom: "自定义模式",
    diffNewb: "入门",
    diffEasy: "简单",
    diffHard: "专家",
    diffHardcore: "硬核",
    customDiffLabel: "自定义难度",
    qlLabel: "提问次数",
    tlLabel: "文本长度",
    whodunitLabel: "本格推理",
    whodunitHint: "强调逻辑闭环与现实约束",
    styleLabel: "故事风格",
    styleSuspense: "悬疑推理",
    styleHorror: "惊悚",
    styleTerror: "恐怖",
    styleComedy: "喜剧",
    styleSupernatural: "鬼怪玄幻",
    styleCrime: "刑侦悬疑",
    styleXianxia: "仙侠爽文",
    customStylePH: "补充自定义风格，用逗号分隔",
    generateBtn: "生成谜题",
    backPrev: "← 返回上一步",
    // game
    remainingLabel: "剩余提问",
    riddleLabel: "📜 谜面",
    riddleWaiting: "等待生成...",
    progressLabel: "推理进度",
    askPlaceholder: "输入你的问题，一次只问一个...",
    askBtn: "提问",
    submitSoupBtn: "提交汤底",
    viewResultBtn: "查看结果",
    closeBtn: "关闭",
    exportBtn: "导出 JSON",
    modalTitle: "提交汤底",
    modalDesc: "请输入你推理出的故事真相。",
    soupPlaceholder: "输入你认为的汤底（故事真相）...",
    modalSubmit: "确认提交",
    modalCancel: "取消",
    nokeyTitle: "未配置 API Key",
    nokeyDesc: "未配置 API Key 无法生成谜题。请先配置 API Key 后再试。",
    nokeyGo: "去配置 API Key",
    nokeyCancel: "取消",
    // runtime
    loadingTitle: "正在熬汤...",
    loadingDesc: "正在构思故事、谜面与盘问点，请稍候。",
    loadingProgress: "已生成 {0} 字...",
    evaluatingTitle: "正在评分...",
    evaluatingDesc: "AI 正在评估你的汤底，请稍候。",
    evaluatingProgress: "已分析 {0} 字...",
    gameReady: "谜面已生成，开始提问吧。",
    demoWarning: "未配置 API Key，已切换到本地演示模式。",
    noQuestion: "请输入一个问题后再发送。",
    tooMany: "你不能连续提问多个问题。但我可以先回答第一个问题：",
    waitGenerate: "请先生成谜面。",
    limitHint: "提问机会已用尽，请提交汤底。",
    exhaustedPlaceholder: "提问次数用尽，请提交汤底。",
    unlockHint: "所有盘问点已发现，提交已解锁。",
    needSoup: "请先输入汤底。",
    resultTitle: "🎉 游戏结束",
    clueTitle: "盘问点回顾",
    clueFound: "已发现",
    cluePending: "未发现",
    scoreLabel: "得分",
    verdictLabel: "定性",
    fitLabel: "吻合度",
    mistakesLabel: "失误点",
    tipsLabel: "提升建议",
    summaryLabel: "总结",
    exportName: "turtlesoup-export.json",
    whodunitOn: "本格推理",
    whodunitOff: "非本格推理",
    localScoreVerdict: "本地评估结果。",
    localFit: "与官方汤底存在部分吻合。",
    localMistake: "本地模式下未调用 LLM 复核。",
    localTip: "建议围绕关键盘问点整理时间线。",
    localSummary: "本地演示分数。",
  },
  en: {
    // cover
    coverDesc:
      "A story, a bowl of soup.\nYou know the beginning, but never the ending.\nAsk AI, piece together the truth, and restore the full story.",
    startBtn: "Start",
    // apikey
    apikeyTitle: "Connect AI Engine",
    apikeyDesc:
      "Enter your DeepSeek API Key to power puzzle generation and Q&A. The key is stored only in your browser.",
    apiKeyLabel: "DeepSeek API Key",
    modelLabel: "Model",
    apikeyNext: "Next: Configure Game",
    apikeySkip: "Skip, use Demo Mode",
    backCover: "← Back to Cover",
    // config
    configTitle: "Customize Your Puzzle",
    configDesc:
      "Choose story style, reasoning type, and difficulty. AI will generate a unique mystery.",
    langLabel: "Language",
    diffLabel: "Difficulty",
    diffCustom: "Custom",
    diffNewb: "Newbie",
    diffEasy: "Easy",
    diffHard: "Hard",
    diffHardcore: "Hardcore",
    customDiffLabel: "Custom Difficulty",
    qlLabel: "Questions",
    tlLabel: "Text Length",
    whodunitLabel: "whodunit",
    whodunitHint: "Emphasizes logical closure and real-world constraints",
    styleLabel: "Story Style",
    styleSuspense: "Suspense",
    styleHorror: "Horror",
    styleTerror: "Terror",
    styleComedy: "Comedy",
    styleSupernatural: "Supernatural",
    styleCrime: "Crime",
    styleXianxia: "Xianxia",
    customStylePH: "Add custom styles, separated by commas",
    generateBtn: "Generate Mystery",
    backPrev: "← Back",
    // game
    remainingLabel: "Remaining",
    riddleLabel: "📜 Riddle",
    riddleWaiting: "Waiting for generation...",
    progressLabel: "Progress",
    askPlaceholder: "Ask one question at a time...",
    askBtn: "Ask",
    submitSoupBtn: "Submit Soup",
    viewResultBtn: "View Result",
    closeBtn: "Close",
    exportBtn: "Export JSON",
    modalTitle: "Submit Soup",
    modalDesc: "Enter the story truth you have deduced.",
    soupPlaceholder: "Enter your soup guess (the real story)...",
    modalSubmit: "Confirm",
    modalCancel: "Cancel",
    nokeyTitle: "No API Key",
    nokeyDesc:
      "Cannot generate a mystery without an API Key. Please configure your API Key first.",
    nokeyGo: "Configure API Key",
    nokeyCancel: "Cancel",
    // runtime
    loadingTitle: "Brewing the soup...",
    loadingDesc: "AI is crafting the story, riddle, and clues. Please wait.",
    loadingProgress: "{0} characters generated...",
    evaluatingTitle: "Evaluating...",
    evaluatingDesc: "AI is evaluating your soup guess. Please wait.",
    evaluatingProgress: "{0} characters analyzed...",
    gameReady: "The mystery is ready. Start asking questions.",
    demoWarning: "No API key configured. Switched to local demo mode.",
    noQuestion: "Please enter a question first.",
    tooMany:
      "You cannot ask multiple questions at once. I can answer the first one: ",
    waitGenerate: "Generate a mystery first.",
    limitHint: "No attempts left. Please submit your soup.",
    exhaustedPlaceholder: "No questions left. Please submit your soup.",
    unlockHint: "All clues discovered. Submission unlocked.",
    needSoup: "Please enter your soup guess first.",
    resultTitle: "🎉 Game Over",
    clueTitle: "Clue Review",
    clueFound: "Discovered",
    cluePending: "Pending",
    scoreLabel: "Score",
    verdictLabel: "Verdict",
    fitLabel: "Fit",
    mistakesLabel: "Mistakes",
    tipsLabel: "Tips",
    summaryLabel: "Summary",
    exportName: "turtlesoup-export.json",
    whodunitOn: "whodunit",
    whodunitOff: "Non-whodunit",
    localScoreVerdict: "Local evaluation result.",
    localFit: "Partially matched the official soup.",
    localMistake: "No LLM validation in local mode.",
    localTip: "Try to align the timeline around the key clues.",
    localSummary: "Local demo score.",
  },
};

/* ---- state ---- */
const S = {
  apiKey: "",
  model: "deepseek-chat",
  language: "zh-CN",
  isWhodunit: true,
  difficulty: "custom_model",
  customDifficulty: "difficulty.easy",
  customQuestionLimit: 20,
  customTextLength: 800,
  storyStyles: ["悬疑推理"],
  customStyleText: "",
  demoMode: false,
  generated: null,
  questionLog: [],
  remainingQuestions: 0,
  discoveredClues: new Set(),
  canSubmit: false,
  isFinished: false,
  scoreResult: null,
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
    "loading-desc",
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
    .split(/[，,\n]/)
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

/* ---- COVER → APIKEY / CONFIG ---- */
function goCover() {
  showView("view-cover");
}
function goApikey() {
  showView("view-apikey");
}
function goConfig() {
  showView("view-config");
}
function goLoading() {
  showView("view-loading");
}
function goGame() {
  showView("view-game");
}

function startFromCover() {
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
  E["config-custom-difficulty"].value = S.customDifficulty || "difficulty.easy";
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
  E["custom-controls"].classList.toggle(
    "hidden",
    E["config-difficulty"].value !== "custom_model",
  );
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

  // reset game state
  S.generated = null;
  S.questionLog = [];
  S.scoreResult = null;
  S.remainingQuestions = 0;
  S.discoveredClues = new Set();
  S.canSubmit = false;
  S.isFinished = false;
  S.demoMode = !S.apiKey;

  // go loading
  goLoading();
  E["loading-title"].textContent = t("loadingTitle");
  E["loading-desc"].textContent = t("loadingDesc");

  // generate
  if (!S.apiKey) {
    S.generated = buildDemoStory();
    S.remainingQuestions = getQuestionLimit();
    E["loading-title"].textContent = t("demoWarning");
    await sleep(1200);
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
        E["loading-desc"].textContent = t("loadingProgress").replace(
          "{0}",
          full.length,
        );
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
function enterGame() {
  goGame();
  // reset UI
  E["chat-log"].innerHTML = "";
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
  updateGameStats();
  //   addChatMsg("assistant", `${g.title}\n\n${g.outline}`, "Story");
  addChatMsg("assistant", t("gameReady"), "System");
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
  indices.forEach((i) => {
    if (Number.isInteger(i) && S.generated?.clues?.[i] != null)
      S.discoveredClues.add(i);
  });
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
  E["loading-title"].textContent = t("evaluatingTitle");
  E["loading-desc"].textContent = t("evaluatingDesc");

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
          E["loading-desc"].textContent = t("evaluatingProgress").replace(
            "{0}",
            full.length,
          );
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
  const p = DIFFICULTY_PRESETS[ad] || DIFFICULTY_PRESETS["difficulty.easy"];
  const lr = getLengthRange();
  const lc = loc();
  const clueCount =
    ad === "difficulty.newb"
      ? 3
      : ad === "difficulty.easy"
        ? 4
        : ad === "difficulty.hard"
          ? 5
          : 6;
  return [
    "You are a professional turtle-soup mystery designer.",
    `Language: ${lc === "en" ? "English" : "Chinese"}.`,
    `Story style(s): ${S.storyStyles.join(", ")}.`,
    `is_whodunit: ${S.isWhodunit}. difficulty: ${ad}.`,
    `question_limit: ${getQuestionLimit()}. text_length_range: ${lr.min}-${lr.max}.`,
    `clue_count_target: ${clueCount}.`,
    "Create a complete, internally consistent mystery.",
    "TITLE RULE: The title must NOT explicitly reveal the solution, culprit, or twist. Use metaphor, allusion, or atmosphere instead — hint at the theme without spoiling. Example: instead of 'The Wife Did It', use 'Bitter Tea'. The title should intrigue, not expose.",
    S.isWhodunit
      ? "PRIORITY: This is a HONKAKU (本格推理) mystery. The story MUST follow strict logical deduction, real-world physics, and fair-play rules. All clues must be logically solvable by the reader. The solution must have a clear cause-and-effect chain with no supernatural elements. Story style is secondary — use it only as flavor on top of the logical core."
      : "This is a non-traditional mystery. Feel free to use supernatural, absurd, or unconventional elements. Story style may freely influence the plot and solution.",
    "Return ONLY JSON: {title, outline, riddle_html, clues, soup, meta}.",
    "riddle_html: safe HTML with <em>,<strong>,<mark>,<br>,<p>. End the riddle with ONE clear question or goal in <strong> tags that the player needs to solve. Craft this goal specifically based on the story's core mystery — do NOT use generic phrases like '还原真相'. Examples: '凶手为什么要等到雨停才动手？', 'Who switched the medicine and why?'. The goal must be unique to this story.",
    "clues: array of concise clue statements, each discoverable via questions.",
    "outline: full story logic. soup: official solution. meta: {tone,setting,characters}.",
    ad === "difficulty.newb"
      ? "For newb, gently highlight hints with <em>, keep puzzle straightforward."
      : "Do not reveal answer in riddle.",
    ad === "difficulty.hardcore"
      ? "No markup to expose clues; riddle compact but dense."
      : "Use markup sparingly.",
  ].join("\n");
}

function buildQuestionPrompt(question) {
  const undiscovered = (S.generated?.clues || []).filter(
    (_, i) => !S.discoveredClues.has(i),
  );
  const lang = loc() === "en" ? "English" : "Chinese";
  const shortReplies =
    loc() === "en"
      ? "yes/no/important/unimportant/yes and no/cannot determine"
      : "是/不是/重要/不重要/是也不是/无法确定";
  return [
    `You are the answer engine for a turtle soup mystery. You MUST reply in ${lang}.`,
    `Language: ${lang}. Difficulty: ${getActiveDifficulty()}.`,
    `is_whodunit: ${S.isWhodunit}.`,
    `Reply with short, rule-bound answers in ${lang}: ${shortReplies}.`,
    "If multiple questions asked, refuse and answer only the first.",
    "If question is irrelevant or repeats a weak point, redirect gently (unless hardcore).",
    "Return ONLY JSON: {reply, matchedClues, clueReason}. The 'reply' field MUST be in " +
      lang +
      ".",
    "matchedClues: 0-based indices of ALL clue statements (including previously found ones) that the player has now confirmed or strongly touched upon. Review the player's question against each clue and include its index if the question reveals or confirms it.",
    `Story: ${S.generated?.title || ""}. Outline: ${S.generated?.outline || ""}.`,
    `Riddle: ${stripHtml(S.generated?.riddle_html || "")}.`,
    `All clues (indexed): ${JSON.stringify((S.generated?.clues || []).map((c, i) => ({ i, text: c })))}.`,
    undiscovered.length
      ? `Still undiscovered clues: ${JSON.stringify(undiscovered)}.`
      : "",
    `Already discovered clue indices: ${JSON.stringify([...S.discoveredClues])}.`,
    `Recent dialogue: ${JSON.stringify(S.questionLog.slice(-6))}.`,
    `Player question: ${question}`,
  ].join("\n");
}

function buildScoringPrompt(guess) {
  return [
    "You are a fair turtle soup evaluator.",
    `Language: ${loc() === "en" ? "English" : "Chinese"}.`,
    "Score 0-100 based on accuracy and efficiency. Return ONLY JSON: {score,verdict,fit,mistakes,tips,conciseSummary}.",
    `Outline: ${S.generated?.outline || ""}. Soup: ${S.generated?.soup || ""}.`,
    `Guess: ${guess}. Questions: ${S.questionLog.length}. Remaining: ${S.remainingQuestions}. ClueProgress: ${S.discoveredClues.size}/${S.generated?.clues?.length || 0}.`,
  ].join("\n");
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
    if (isFirstVisit()) goApikey();
    else goCover();
  });
  E["config-difficulty"].addEventListener("change", syncCustomControls);
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
function boot() {
  initDom();
  loadSettings();
  initTheme();
  initLangIcon();
  wireEvents();
  syncI18n();
  goCover();
}

document.addEventListener("DOMContentLoaded", boot);
