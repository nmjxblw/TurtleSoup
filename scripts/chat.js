/* ================================================================
   chat.js — 聊天渲染 / 日志重绘 / 占位器
   ================================================================ */

let questionIndex = 0;

/**
 * 添加聊天消息。
 * @param {string} role 角色标识。
 * @param {string} content 内容。
 * @param {string} metaKey 参数。
 * @param {string} i18nKey 参数。
 * @param {any} i18nVars 参数。
 * @returns {void} 无返回值。
 */
function addChatMsg(role, content, metaKey, i18nKey, i18nVars) {
  const tpl = $("chat-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(role);
  const resolvedMetaKey =
    metaKey || (role === "user" ? "chatRolePlayer" : "chatRoleHost");
  node.setAttribute("data-chat-role", role);
  node.setAttribute("data-chat-meta-key", resolvedMetaKey);
  node.querySelector(".chat-meta").textContent = renderChatMetaLabel(
    role,
    questionIndex,
    resolvedMetaKey,
  );
  const contentEl = node.querySelector(".chat-content");
  contentEl.textContent = content;
  if (i18nKey) contentEl.setAttribute("data-i18n", i18nKey);
  if (i18nVars)
    contentEl.setAttribute("data-i18n-vars", JSON.stringify(i18nVars));
  if (role === "user" && questionIndex > 0) {
    node.setAttribute("data-qindex", String(questionIndex));
    if (GameState.questionsWithClueDiscovery.has(questionIndex)) {
      node.classList.add("clue-discovery");
    }
  }
  DOMRef["chat-log"].appendChild(node);
  DOMRef["chat-log"].scrollTop = DOMRef["chat-log"].scrollHeight;
}

/**
 * 渲染聊天元信息标签。
 * @param {string} role 角色标识。
 * @param {any} qindex 参数。
 * @param {string} metaKey 参数。
 * @returns {string} 返回字符串。
 */
function renderChatMetaLabel(role, qindex, metaKey) {
  const label = t(
    metaKey || (role === "user" ? "chatRolePlayer" : "chatRoleHost"),
  );
  if (role === "user" && qindex > 0) {
    return t("chatMetaQuestion", { index: qindex, label });
  }
  return label;
}

/**
 * 从日志中获取聊天元信息键。
 * @param {any} entry 参数。
 * @returns {string} 返回字符串。
 */
function getChatMetaKeyFromLog(entry) {
  if (entry?.metaKey) return entry.metaKey;
  if (entry?.role === "user") return "chatRolePlayer";
  if (entry?.i18nKey === "tooMany") return "chatRoleRule";
  const fixedSystemKeys = new Set([
    "gameReady",
    "gameReadyDeath",
    "waitGenerate",
    "noQuestion",
    "limitHint",
    "needSoup",
    "deathExpired",
  ]);
  if (fixedSystemKeys.has(entry?.i18nKey)) return "chatRoleSystem";
  return "chatRoleHost";
}

/**
 * 同步聊天日志的国际化内容。
 * @returns {any} 返回结果对象。
 */
function syncChatLogI18n() {
  const items = DOMRef["chat-log"]?.querySelectorAll(".chat-item") || [];
  const systemContentKeys = new Set([
    "gameReady",
    "gameReadyDeath",
    "waitGenerate",
    "noQuestion",
    "limitHint",
    "needSoup",
    "deathExpired",
  ]);
  items.forEach((node) => {
    const metaEl = node.querySelector(".chat-meta");
    if (!metaEl) return;
    const role =
      node.getAttribute("data-chat-role") ||
      (node.classList.contains("user") ? "user" : "assistant");
    const metaKey =
      node.getAttribute("data-chat-meta-key") ||
      (role === "user" ? "chatRolePlayer" : "chatRoleHost");
    const qindex = Number(node.getAttribute("data-qindex") || 0);
    const contentKey =
      node.querySelector(".chat-content")?.getAttribute("data-i18n") || "";
    const contentEl = node.querySelector(".chat-content");
    const varsRaw = contentEl?.getAttribute("data-i18n-vars") || "";
    let contentVars = null;
    if (varsRaw) {
      try {
        contentVars = JSON.parse(varsRaw);
      } catch (_e) {
        contentVars = null;
      }
    }
    const inferredMetaKey =
      metaKey ||
      (contentKey && systemContentKeys.has(contentKey)
        ? "chatRoleSystem"
        : role === "user"
          ? "chatRolePlayer"
          : "chatRoleHost");
    metaEl.textContent = renderChatMetaLabel(role, qindex, inferredMetaKey);
    if (!contentEl || !contentKey) return;
    if (contentKey === "tooMany") {
      const followUpKey = contentVars?.followUpKey || "tooManyFollowUp";
      contentEl.textContent = t("tooMany", { followUp: t(followUpKey) });
    } else {
      contentEl.textContent = t(contentKey, contentVars || {});
    }
  });
}

/**
 * 添加聊天占位消息。
 * @returns {Object} 返回占位消息控制对象。
 */
function addChatPlaceholder() {
  const tpl = $("chat-template");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add("assistant");
  node.setAttribute("data-chat-role", "assistant");
  node.setAttribute("data-chat-meta-key", "chatRoleHost");
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
    finalize: (text, meta, i18nKey, i18nVars) => {
      content.textContent = text;
      const metaKey = meta || "chatRoleHost";
      node.setAttribute("data-chat-meta-key", metaKey);
      node.querySelector(".chat-meta").textContent = t(metaKey);
      if (i18nKey) content.setAttribute("data-i18n", i18nKey);
      if (i18nVars)
        content.setAttribute("data-i18n-vars", JSON.stringify(i18nVars));
      DOMRef["chat-log"].scrollTop = DOMRef["chat-log"].scrollHeight;
    },
  };
}
