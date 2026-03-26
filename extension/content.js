/**
 * Dataveil — Content Script
 * Intercepts form submissions and fetch calls on AI chat pages
 * before prompts are sent to the AI service.
 */

(function () {
  "use strict";

  // --- Intercept the native fetch API ---
  const originalFetch = window.fetch;

  window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : input.url;

    // Only intercept POST requests with a body (prompt submissions)
    if (init.method?.toUpperCase() !== "POST" || !init.body) {
      return originalFetch(input, init);
    }

    if (!isAIEndpoint(url)) {
      return originalFetch(input, init);
    }

    try {
      const bodyText =
        typeof init.body === "string"
          ? init.body
          : new TextDecoder().decode(init.body);

      const body = JSON.parse(bodyText);
      const promptText = extractPromptText(body);

      if (!promptText) return originalFetch(input, init);

      // Ask background worker to scrub PII
      const result = await chrome.runtime.sendMessage({
        type: "SCRUB_PROMPT",
        text: promptText,
      });

      if (result.redactions.length > 0) {
        const cleanedBody = injectCleanedText(body, result.cleaned);
        const newInit = {
          ...init,
          body: JSON.stringify(cleanedBody),
        };
        return originalFetch(input, newInit);
      }
    } catch (e) {
      // If anything fails, pass through unchanged — never block the user
      console.warn("[Dataveil] Scrub failed, passing through:", e);
    }

    return originalFetch(input, init);
  };

  // --- Intercept XMLHttpRequest as fallback ---
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open.bind(xhr);
    const originalSend = xhr.send.bind(xhr);

    let method = "";
    let url = "";

    xhr.open = function (m, u, ...args) {
      method = m;
      url = u;
      return originalOpen(m, u, ...args);
    };

    xhr.send = function (body) {
      if (
        method.toUpperCase() === "POST" &&
        isAIEndpoint(url) &&
        typeof body === "string"
      ) {
        try {
          const parsed = JSON.parse(body);
          const promptText = extractPromptText(parsed);

          if (promptText) {
            chrome.runtime
              .sendMessage({ type: "SCRUB_PROMPT", text: promptText })
              .then((result) => {
                if (result.redactions.length > 0) {
                  const cleaned = injectCleanedText(parsed, result.cleaned);
                  return originalSend(JSON.stringify(cleaned));
                }
                return originalSend(body);
              })
              .catch(() => originalSend(body));
            return;
          }
        } catch (e) {
          // pass through
        }
      }
      return originalSend(body);
    };

    return xhr;
  };

  // --- Helpers ---

  function isAIEndpoint(url) {
    const AI_HOSTS = [
      "api.openai.com",
      "chatgpt.com",
      "chat.openai.com",
      "generativelanguage.googleapis.com",
      "gemini.google.com",
      "copilot.microsoft.com",
    ];
    try {
      const host = new URL(url).hostname;
      return AI_HOSTS.some((h) => host.includes(h));
    } catch {
      return false;
    }
  }

  /**
   * Extract the user's prompt text from common AI API request bodies.
   * Handles OpenAI chat completions format and basic message arrays.
   */
  function extractPromptText(body) {
    // OpenAI chat completions: { messages: [{ role, content }] }
    if (Array.isArray(body?.messages)) {
      const last = body.messages[body.messages.length - 1];
      if (last?.role === "user") {
        return typeof last.content === "string"
          ? last.content
          : JSON.stringify(last.content);
      }
    }
    // Simple { prompt: "..." } format
    if (typeof body?.prompt === "string") return body.prompt;
    // Gemini: { contents: [{ parts: [{ text }] }] }
    if (Array.isArray(body?.contents)) {
      const last = body.contents[body.contents.length - 1];
      return last?.parts?.[0]?.text ?? null;
    }
    return null;
  }

  /**
   * Replace the prompt text in the request body with the cleaned version.
   */
  function injectCleanedText(body, cleanedText) {
    const clone = JSON.parse(JSON.stringify(body));

    if (Array.isArray(clone?.messages)) {
      const last = clone.messages[clone.messages.length - 1];
      if (last?.role === "user") {
        if (typeof last.content === "string") {
          last.content = cleanedText;
        }
      }
    } else if (typeof clone?.prompt === "string") {
      clone.prompt = cleanedText;
    } else if (Array.isArray(clone?.contents)) {
      const last = clone.contents[clone.contents.length - 1];
      if (last?.parts?.[0]?.text) {
        last.parts[0].text = cleanedText;
      }
    }

    return clone;
  }
})();
