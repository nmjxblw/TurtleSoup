/* ================================================================
   config.js — 全局常量 / 状态 / DOM 引用
   ================================================================ */

const BASE_URL = "https://api.deepseek.com";

const LANGUAGE_TYPES = Object.freeze({
  ZH_CN: "zh-CN",
  HU_TW: "hu-TW",
  EN_US: "en-US",
  JA_JP: "ja-JP",
  KO_KR: "ko-KR",
});

const LANGUAGE_LIST = Object.freeze([
  {
    code: LANGUAGE_TYPES.ZH_CN,
    file: "i18n/zh_cn.csv",
    flagEmoji: "🇨🇳",
    promptLocale: "zh-CN",
    promptLabelKey: "promptLanguageChinese",
  },
  {
    code: LANGUAGE_TYPES.HU_TW,
    file: "i18n/hu_tw.csv",
    flagEmoji: "🇭🇹",
    promptLocale: "hu-TW",
    promptLabelKey: "promptLanguageTraditionalChinese",
  },
  {
    code: LANGUAGE_TYPES.EN_US,
    file: "i18n/en_us.csv",
    flagEmoji: "🇺🇸",
    promptLocale: "en-US",
    promptLabelKey: "promptLanguageEnglish",
  },
  {
    code: LANGUAGE_TYPES.JA_JP,
    file: "i18n/ja_jp.csv",
    flagEmoji: "🇯🇵",
    promptLocale: "ja-JP",
    promptLabelKey: "promptLanguageJapanese",
  },
  {
    code: LANGUAGE_TYPES.KO_KR,
    file: "i18n/ko_kr.csv",
    flagEmoji: "🇰🇷",
    promptLocale: "ko-KR",
    promptLabelKey: "promptLanguageKorean",
  },
]);

const DIFFICULTY_PRESETS = {
  newb: {
    questionLimit: 30,
    minLen: 120,
    maxLen: 500,
    labelKey: "diffNewb",
  },
  easy: {
    questionLimit: 25,
    minLen: 300,
    maxLen: 1000,
    labelKey: "diffEasy",
  },
  hard: {
    questionLimit: 15,
    minLen: 300,
    maxLen: 2000,
    labelKey: "diffHard",
  },
  hardcore: {
    questionLimit: 12,
    minLen: 200,
    maxLen: 10000,
    labelKey: "diffHardcore",
  },
};

let L = Object.fromEntries(LANGUAGE_LIST.map((item) => [item.code, {}]));
let PROMPTS = { story: "", question: "", score: "" };

/* ---- GameState ---- */
const GameState = {
  apiKey: "",
  model: "deepseek-chat",
  language: LANGUAGE_TYPES.ZH_CN,
  isHonkaku: true,
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
  loadingPhase: null,
  loadingCount: 0,
  loadingElapsedSeconds: 0,
  gameStartTime: null,
  deathMode: false,
  deathModeRemaining: 0,
  deathModeTotal: 0,
  deathModeFrozen: false,
  deathModeExpired: false,
};

let gameTimerInterval = null;
let loadingTitleTimer = null;

/* ---- DOM refs ---- */
const DOMRef = {};
/**
 * 获取 DOM 元素。
 * @param {string} id 元素 ID。
 * @returns {Element | null} 返回匹配的 DOM 元素，若不存在则返回 null。
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * 初始化 DOM 引用。
 * @returns {void} 无返回值。
 */
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
    "config-honkaku",
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
    "game-honkaku-tag",
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
