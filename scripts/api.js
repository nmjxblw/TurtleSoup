/* ================================================================
   api.js — DeepSeek API 请求
   ================================================================ */

/**
 * 中文说明：发起 API 请求。
 * @param {Array<any>} messages 消息列表。
 * @param {number} temperature 采样温度。
 * @returns {Promise<any>} 返回接口响应数据。
 */
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
    const err = new Error(`${resp.status}: ${t}`);
    handleApiError(err, "api");
    throw err;
  }
  return resp.json();
}

/**
 * 中文说明：发起流式 API 请求。
 * @param {Array<any>} messages 消息列表。
 * @param {number} temperature 采样温度。
 * @param {Function} onChunk 分块回调。
 * @returns {Promise<string>} 返回完整的流式响应文本。
 */
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
    const err = new Error(`${resp.status}: ${t}`);
    handleApiError(err, "stream");
    throw err;
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
