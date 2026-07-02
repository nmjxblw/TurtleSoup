/* ================================================================
   timer.js — 速度计时器（普通正计时 & 死亡模式倒计时）
   ================================================================ */

/**
 * 中文说明：格式化计时器显示。
 * @param {number} seconds 秒数。
 * @returns {string} 返回字符串。
 */
function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 中文说明：启动速度计时器。
 * @returns {void} 无返回值。
 */
function startSpeedTimer() {
  if (GameState.deathMode) {
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

/**
 * 中文说明：停止速度计时器。
 * @returns {void} 无返回值。
 */
function stopSpeedTimer() {
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

/**
 * 中文说明：冻结死亡模式计时器。
 * @returns {void} 无返回值。
 */
function freezeDeathTimer() {
  if (!GameState.deathMode || GameState.deathModeFrozen) return;
  GameState.deathModeFrozen = true;
  stopSpeedTimer();
}

/**
 * 中文说明：恢复死亡模式计时器。
 * @returns {void} 无返回值。
 */
function resumeDeathTimer() {
  if (!GameState.deathMode || !GameState.deathModeFrozen) return;
  if (GameState.deathModeExpired || GameState.isFinished) return;
  GameState.deathModeFrozen = false;
  updateSpeedTimer();
  gameTimerInterval = setInterval(updateSpeedTimer, 1000);
}

/**
 * 中文说明：更新速度计时器显示。
 * @returns {void} 无返回值。
 */
function updateSpeedTimer() {
  if (GameState.deathMode) {
    if (GameState.deathModeFrozen || GameState.deathModeExpired) return;
    GameState.deathModeRemaining = Math.max(
      0,
      GameState.deathModeRemaining - 1,
    );
    const remaining = GameState.deathModeRemaining;
    const total = GameState.deathModeTotal || 1;
    DOMRef["speed-timer-text"].textContent = formatTimer(remaining);

    const ratio = Math.max(0, Math.min(1, remaining / total));
    const dangerStart = 0.5;
    const t = ratio >= dangerStart ? 1 : ratio / dangerStart;
    DOMRef["speed-timer-text"].style.color = "";

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
    if (!GameState.gameStartTime) return;
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - GameState.gameStartTime) / 1000),
    );
    DOMRef["speed-timer-text"].textContent = formatTimer(elapsed);
  }
}

/**
 * 中文说明：处理死亡模式超时。
 * @returns {void} 无返回值。
 */
function handleDeathModeExpiration() {
  stopSpeedTimer();
  GameState.deathModeExpired = true;
  GameState.remainingQuestions = 0;
  GameState.canSubmit = true;
  DOMRef["question-input"].disabled = true;
  DOMRef["question-input"].placeholder = t("deathExpiredPH");
  DOMRef["ask-btn"].disabled = true;
  DOMRef["speed-timer-text"].textContent = "00:00";
  DOMRef["speed-timer-text"].classList.add("breathing");
  DOMRef["speed-timer-text"].style.color = "var(--danger)";
  DOMRef["submit-soup-btn"].disabled = false;
  updateGameStats();
  addChatMsg("assistant", t("deathExpired"), "chatRoleSystem", "deathExpired");
  GameState.questionLog.push({
    role: "assistant",
    content: t("deathExpired"),
    i18nKey: "deathExpired",
    at: new Date().toISOString(),
  });
  saveGameProgress();
}

/**
 * 中文说明：增加死亡模式补时。
 * @param {number} seconds 秒数。
 * @returns {void} 无返回值。
 */
function addDeathTime(seconds) {
  if (!GameState.deathMode || GameState.deathModeExpired) return;
  GameState.deathModeRemaining += seconds;
  if (GameState.deathModeRemaining > GameState.deathModeTotal) {
    GameState.deathModeRemaining = GameState.deathModeTotal;
  }
  updateSpeedTimer();

  const timer = DOMRef["speed-timer"];
  if (!timer) return;
  const bonus = document.createElement("span");
  bonus.className = "speed-timer-bonus";
  bonus.textContent = t("speedBonus", { seconds });
  timer.appendChild(bonus);
  bonus.addEventListener("animationend", () => {
    bonus.remove();
  });
}
