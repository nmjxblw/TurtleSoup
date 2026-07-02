/* ================================================================
   utils.js — 通用工具函数（无外部依赖）
   ================================================================ */

/**
 * 限制数值范围。
 * @param {number} v 数值。
 * @param {number} lo 下界。
 * @param {number} hi 上界。
 * @returns {number} 返回数值。
 */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * 转义 HTML 字符。
 * @param {number} s 秒数或字符串。
 * @returns {string} 返回字符串。
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 去除 HTML 标签。
 * @param {number} h 高度。
 * @returns {string} 返回字符串。
 */
function stripHtml(h) {
  const d = document.createElement("div");
  d.innerHTML = h || "";
  return d.textContent || d.innerText || "";
}

/**
 * 清理富文本 HTML。
 * @param {string} html HTML 字符串。
 * @returns {string} 返回字符串。
 */
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

/**
 * 规范化并解析 JSON。
 * @param {string} text 文本字符串。
 * @returns {any} 返回结果对象。
 */
function normalizeJson(text) {
  const s = String(text || "").trim();
  const m =
    s.match(/```json\s*([\s\S]*?)```/i) || s.match(/```\s*([\s\S]*?)```/);
  let raw = m ? m[1].trim() : s;
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a >= 0 && b >= 0) raw = raw.slice(a, b + 1);
  raw = raw.replace(
    /"((?:[^"\\]|\\[\s\S])*)"/g,
    (_m, inner) =>
      '"' +
      inner.replace(/[\n\r\t]/g, (c) =>
        c === "\n" ? "\\n" : c === "\r" ? "\\r" : "\\t",
      ) +
      '"',
  );
  raw = raw.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(raw);
  } catch (_e1) {
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

/**
 * 等待指定毫秒数。
 * @param {number} ms 毫秒数。
 * @returns {any} 返回结果对象。
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ---- Toast 通用通知 ---- */
const TOAST_ICONS = { error: "❌", warn: "⚠️", info: "ℹ️" };

/**
 * 显示通知提示。
 * @param {string} title 标题。
 * @param {string} message 消息内容。
 * @param {string} type 类型标识。
 * @param {number} duration 持续时间（毫秒）。
 * @returns {void} 无返回值。
 */
function showToast(title, message, type, duration) {
  type = type || "info";
  duration = duration != null ? duration : 5000;
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast toast--" + type;

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = TOAST_ICONS[type] || TOAST_ICONS.info;

  const body = document.createElement("div");
  body.className = "toast-body";

  const titleEl = document.createElement("p");
  titleEl.className = "toast-title";
  titleEl.textContent = title || "";

  const msgEl = document.createElement("p");
  msgEl.className = "toast-msg";
  msgEl.textContent = message || "";

  body.appendChild(titleEl);
  body.appendChild(msgEl);

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", t("closeBtn"));

  toast.appendChild(icon);
  toast.appendChild(body);
  toast.appendChild(closeBtn);

  let timer = null;
  /**
   * 关闭并移除提示。
   * @returns {void} 无返回值。
   */
  function dismiss() {
    if (timer) clearTimeout(timer);
    toast.classList.add("toast--out");
    toast.addEventListener(
      "animationend",
      function () {
        toast.remove();
      },
      { once: true },
    );
  }

  closeBtn.addEventListener("click", dismiss);
  toast.addEventListener("click", function (e) {
    if (e.target === closeBtn) return;
    dismiss();
  });

  container.appendChild(toast);

  if (duration > 0) timer = setTimeout(dismiss, duration);
}

/**
 * 处理 API 错误。
 * @param {Error} err 错误对象。
 * @param {string} context 上下文信息。
 * @returns {boolean} 返回是否已处理该错误。
 */
function handleApiError(err, context) {
  const msg = String(err.message || err);
  if (msg.startsWith("401:")) {
    showToast(t("api401Title"), t("api401Desc"), "error", 0);
    return true;
  }
  if (msg.startsWith("429:")) {
    showToast(t("api429Title"), t("api429Desc"), "warn", 6000);
    return true;
  }
  if (context === "stream") {
    console.warn("stream error:", err);
    return true;
  }
  return false;
}
