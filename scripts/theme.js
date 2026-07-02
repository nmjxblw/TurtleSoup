/* ================================================================
   theme.js — 主题 / 语言图标 / 侧边菜单 / 拖动
   ================================================================ */

/**
 * 初始化主题。
 * @returns {void} 无返回值。
 */
function initTheme() {
  const saved = localStorage.getItem("turtlesoup-theme") || "dark";
  applyTheme(saved);
}

/**
 * 切换主题。
 * @returns {void} 无返回值。
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("turtlesoup-theme", next);
}

/**
 * 应用主题。
 * @param {string} theme 主题名称。
 * @returns {void} 无返回值。
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const themeIcon = DOMRef["theme-toggle"].querySelector(".menu-item-icon");
  if (themeIcon) themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
}

/**
 * 初始化语言图标。
 * @returns {void} 无返回值。
 */
function initLangIcon() {
  const langIcon = DOMRef["lang-toggle"].querySelector(".menu-item-icon");
  if (langIcon) langIcon.textContent = getLanguageIcon();
}

/* ---- Side Menu ---- */
/**
 * 打开侧边菜单。
 * @returns {void} 无返回值。
 */
function openSideMenu() {
  DOMRef["side-menu"].classList.add("open");
  DOMRef["menu-toggle"].classList.add("menu-open");
}

/**
 * 关闭侧边菜单。
 * @returns {void} 无返回值。
 */
function closeSideMenu() {
  DOMRef["side-menu"].classList.remove("open");
  DOMRef["menu-toggle"].classList.remove("menu-open");
}

/* ---- ☰ 拖动 ---- */
const TOGGLE_DRAG = { on: false, sx: 0, sy: 0, ox: 0, oy: 0, moved: false };

/**
 * 初始化菜单按钮拖拽。
 * @returns {void} 无返回值。
 */
function initToggleDrag() {
  const btn = DOMRef["menu-toggle"];
  const sideMenu = DOMRef["side-menu"];

  const saved = localStorage.getItem("turtlesoup-toggle-pos");
  if (saved) {
    try {
      const pos = JSON.parse(saved);
      btn.style.right = "auto";
      btn.style.left =
        pos.side === "right"
          ? window.innerWidth - btn.offsetWidth + "px"
          : "0px";
      btn.style.top = pos.t + "px";
    } catch (_) {}
  }

  /**
   * 获取拖拽坐标。
   * @param {Event} e 事件对象。
   * @returns {Object} 返回结果对象。
   */
  function getXY(e) {
    return e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };
  }

  /**
   * 处理开始拖拽事件。
   * @param {Event} e 事件对象。
   * @returns {void} 无返回值。
   */
  function onStart(e) {
    if (TOGGLE_DRAG.on) return;
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

  /**
   * 处理拖拽移动事件。
   * @param {Event} e 事件对象。
   * @returns {void} 无返回值。
   */
  function onMove(e) {
    if (!TOGGLE_DRAG.on) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    const dx = x - TOGGLE_DRAG.sx;
    const dy = y - TOGGLE_DRAG.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) TOGGLE_DRAG.moved = true;
    btn.style.left =
      Math.max(
        0,
        Math.min(window.innerWidth - btn.offsetWidth, TOGGLE_DRAG.ox + dx),
      ) + "px";
    btn.style.top =
      Math.max(
        0,
        Math.min(window.innerHeight - btn.offsetHeight, TOGGLE_DRAG.oy + dy),
      ) + "px";
  }

  /**
   * 处理拖拽结束事件。
   * @returns {void} 无返回值。
   */
  function onEnd() {
    if (!TOGGLE_DRAG.on) return;
    TOGGLE_DRAG.on = false;
    btn.style.transition = "left 0.25s ease, top 0.25s ease";

    const bw = btn.offsetWidth;
    const bh = btn.offsetHeight;
    const cx = parseFloat(btn.style.left) + bw / 2;
    const snapLeft = cx < window.innerWidth / 2;
    btn.style.left = (snapLeft ? 0 : window.innerWidth - bw) + "px";
    btn.style.right = "auto";
    btn.style.top =
      Math.max(
        0,
        Math.min(window.innerHeight - bh, parseFloat(btn.style.top)),
      ) + "px";

    setTimeout(() => {
      btn.style.transition = "";
    }, 260);

    localStorage.setItem(
      "turtlesoup-toggle-pos",
      JSON.stringify({
        side: snapLeft ? "left" : "right",
        t: parseFloat(btn.style.top),
      }),
    );

    if (!TOGGLE_DRAG.moved) {
      sideMenu.classList.contains("open") ? closeSideMenu() : openSideMenu();
    }
  }

  btn.addEventListener("touchstart", onStart, { passive: false });
  btn.addEventListener("mousedown", onStart);
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);
}

/* ---- 侧边菜单拖动 ---- */
const MENU_DRAG = { on: false, sx: 0, st: 0, last: 0, fromEdge: false };

/**
 * 初始化侧边菜单拖拽。
 * @returns {void} 无返回值。
 */
function initMenuDrag() {
  const drawer = DOMRef["menu-drawer"];
  const sideMenu = DOMRef["side-menu"];
  const overlay = DOMRef["menu-overlay"];

  /**
   * 获取横向坐标。
   * @param {Event} e 事件对象。
   * @returns {number} 返回数值。
   */
  function getX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  /**
   * 处理开始拖拽事件。
   * @param {Event} e 事件对象。
   * @returns {void} 无返回值。
   */
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
    MENU_DRAG.fromEdge = nearEdge;
    drawer.classList.add("dragging");
  }

  /**
   * 处理拖拽移动事件。
   * @param {Event} e 事件对象。
   * @returns {void} 无返回值。
   */
  function onMove(e) {
    if (!MENU_DRAG.on) return;
    e.preventDefault();
    const w = drawer.offsetWidth;
    const dx = getX(e) - MENU_DRAG.sx;
    let t = MENU_DRAG.st + dx;
    t = Math.max(0, Math.min(w, t));
    MENU_DRAG.last = t;
    const dist = Math.abs(dx);
    if (dist > 5 && MENU_DRAG.fromEdge) {
      sideMenu.classList.add("open");
      overlay.style.transition = "none";
      MENU_DRAG.fromEdge = false;
    }
    drawer.style.transform = "translateX(" + t + "px)";
    const p = 1 - t / w;
    overlay.style.opacity = p;
    overlay.style.pointerEvents = p > 0.01 ? "auto" : "none";
  }

  /**
   * 处理拖拽结束事件。
   * @returns {void} 无返回值。
   */
  function onEnd() {
    if (!MENU_DRAG.on) return;
    MENU_DRAG.on = false;
    drawer.classList.remove("dragging");
    drawer.style.transform = "";
    overlay.style.transition = "";
    overlay.style.opacity = "";
    overlay.style.pointerEvents = "";
    MENU_DRAG.last < drawer.offsetWidth * 0.4
      ? openSideMenu()
      : closeSideMenu();
  }

  document.addEventListener("touchstart", onStart, { passive: false });
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);
  document.addEventListener("mousedown", onStart);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);
}

/* ---- 移动端面板占比拖动 ---- */
const SPLIT_DRAG = { on: false, sy: 0, sh: 0 };

/**
 * 初始化游戏分栏拖拽。
 * @returns {void} 无返回值。
 */
function initGameSplitHandle() {
  const handle = document.getElementById("game-split-handle");
  const layout = document.querySelector(".game-layout");
  if (!handle || !layout) return;

  /**
   * 获取纵向坐标。
   * @param {Event} e 事件对象。
   * @returns {number} 返回数值。
   */
  function getY(e) {
    return e.touches ? e.touches[0].clientY : e.clientY;
  }

  /**
   * 判断是否移动端。
   * @returns {boolean} 返回布尔结果。
   */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * 处理开始拖拽事件。
   * @param {Event} e 事件对象。
   * @returns {void} 无返回值。
   */
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

  /**
   * 处理拖拽移动事件。
   * @param {Event} e 事件对象。
   * @returns {void} 无返回值。
   */
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

  /**
   * 处理拖拽结束事件。
   * @returns {void} 无返回值。
   */
  function onEnd() {
    if (!SPLIT_DRAG.on) return;
    SPLIT_DRAG.on = false;
    handle.classList.remove("dragging");
    const rows = layout.style.gridTemplateRows;
    const m = rows.match(/^([\d.]+)%/);
    if (m) localStorage.setItem("turtlesoup-split", parseFloat(m[1]));
  }

  /**
   * 恢复分栏比例。
   * @returns {void} 无返回值。
   */
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
