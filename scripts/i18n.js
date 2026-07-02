/* ================================================================
   i18n.js — 国际化 & 模板渲染
   ================================================================ */

/* ---- i18n CSV 解析 ---- */
/**
 * 中文说明：解析 CSV 文本。
 * @param {string} text 文本字符串。
 * @returns {Array<Array<string>>} 返回数组。
 */
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
        /* skip */
      } else {
        field += ch;
      }
    }
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

/**
 * 中文说明：加载国际化词条。
 * @returns {Promise<void>} 返回异步执行结果。
 */
async function loadI18n() {
  try {
    const parseLocale = (text) => {
      const rows = parseCSV(text);
      const data = {};
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length >= 2 && cols[0]) {
          data[cols[0]] = cols[1] || "";
        }
      }
      return data;
    };
    const entries = await Promise.all(
      LANGUAGE_LIST.map(async (language) => {
        const response = await fetch(language.file);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return [language.code, parseLocale(await response.text())];
      }),
    );
    L = Object.fromEntries(entries);
  } catch (e) {
    console.warn("i18n 文件加载失败，使用内置回退文本", e);
  }
}

/* ---- 模板渲染 ---- */
/**
 * 中文说明：按变量渲染模板字符串。
 * @param {string} tmpl 模板字符串。
 * @param {Object} vars 变量对象。
 * @returns {any} 返回结果对象。
 */
function renderTemplate(tmpl, vars) {
  return String(tmpl || "").replace(
    /\{\{(\w+)\}\}|\$\{(\w+)\}/g,
    (_, legacyKey, modernKey) => {
      const key = legacyKey || modernKey;
      if (vars[key] !== undefined) return String(vars[key]);
      return legacyKey ? `{{${key}}}` : "${" + key + "}";
    },
  );
}

/**
 * 中文说明：获取当前语言代码。
 * @returns {string} 返回字符串。
 */
function loc() {
  return GameState.language;
}

/**
 * 中文说明：获取指定语言的配置。
 * @param {string} language 语言类型。
 * @returns {Object} 返回语言配置对象。
 */
function getLanguageSpec(language = GameState.language) {
  return (
    LANGUAGE_LIST.find((item) => item.code === language) || LANGUAGE_LIST[0]
  );
}

/**
 * 中文说明：获取指定语言的图标。
 * @param {string} language 语言类型。
 * @returns {string} 返回语言图标。
 */
function getLanguageIcon(language = GameState.language) {
  return getLanguageSpec(language).flagEmoji;
}

/**
 * 中文说明：获取下一个可用语言。
 * @param {string} language 当前语言类型。
 * @returns {string} 返回下一个语言类型。
 */
function getNextLanguage(language = GameState.language) {
  const index = LANGUAGE_LIST.findIndex((item) => item.code === language);
  if (index < 0) return LANGUAGE_LIST[0].code;
  return LANGUAGE_LIST[(index + 1) % LANGUAGE_LIST.length].code;
}

/**
 * 中文说明：获取当前语言下的词条文本。
 * @param {string} key 键名。
 * @param {Object} vars 变量对象。
 * @returns {string} 返回字符串。
 */
function t(key, vars = {}) {
  const tmpl = L[loc()]?.[key] || L[LANGUAGE_TYPES.ZH_CN]?.[key] || key;
  return renderTemplate(tmpl, vars);
}

/* ---- Loading 标题 ---- */
/**
 * 中文说明：生成加载页标题文案。
 * @returns {string} 返回字符串。
 */
function getLoadingTitleText() {
  if (GameState.loadingPhase === "story") {
    return GameState.loadingCount > 0
      ? t("loadingProgress", { count: GameState.loadingCount })
      : t("loadingTitle", { seconds: GameState.loadingElapsedSeconds || 0 });
  }
  if (GameState.loadingPhase === "storyDemo") {
    return t("demoWarning");
  }
  if (GameState.loadingPhase === "evaluate") {
    return GameState.loadingCount > 0
      ? t("evaluatingProgress", { count: GameState.loadingCount })
      : t("evaluatingTitle");
  }
  return t("loadingTitle", { seconds: 0 });
}

/**
 * 中文说明：刷新加载页标题。
 * @returns {any} 返回结果对象。
 */
function refreshLoadingTitle() {
  if (DOMRef["loading-title"]) {
    DOMRef["loading-title"].textContent = getLoadingTitleText();
  }
}

/* ---- 语言切换 ---- */
/**
 * 中文说明：切换界面语言。
 * @returns {void} 无返回值。
 */
function toggleLanguage() {
  GameState.language = getNextLanguage();
  const langIcon = DOMRef["lang-toggle"].querySelector(".menu-item-icon");
  if (langIcon) langIcon.textContent = getLanguageIcon();
  document.documentElement.lang = GameState.language;
  syncI18n();
  saveSettings();
}

/**
 * 中文说明：同步国际化文案。
 * @returns {void} 无返回值。
 */
function syncI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (L[loc()] && L[loc()][key]) {
      if (el.id === "riddle-output" && GameState.generated) return;
      if (key === "qlLabel" || key === "tlLabel") {
        const textNode = el.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE)
          textNode.textContent = t(key);
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
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (L[loc()] && L[loc()][key]) el.setAttribute("aria-label", t(key));
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (L[loc()] && L[loc()][key]) el.setAttribute("alt", t(key));
  });
  document.querySelectorAll("[data-i18n-content]").forEach((el) => {
    const key = el.getAttribute("data-i18n-content");
    if (!L[loc()] || !L[loc()][key]) return;
    if (el.tagName === "META") el.setAttribute("content", t(key));
    else el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (L[loc()] && L[loc()][key]) el.title = t(key);
  });
  document.querySelectorAll("[data-tooltip-key]").forEach((el) => {
    const key = el.getAttribute("data-tooltip-key");
    if (L[loc()] && L[loc()][key])
      el.setAttribute("data-tooltip", L[loc()][key]);
  });
  if (GameState.generated) {
    DOMRef["game-difficulty-tag"].childNodes[0].textContent =
      getDifficultyLabel();
    DOMRef["game-honkaku-tag"].textContent = GameState.isHonkaku
      ? t("honkakuOn")
      : t("honkakuOff");
    DOMRef["remaining-label"].textContent = t("remainingLabel");
    DOMRef["question-input"].placeholder = t("askPlaceholder");
    syncChatLogI18n();
  }
  if (GameState.loadingPhase) {
    refreshLoadingTitle();
  }
}
