/**
 * Dataveil — Background Service Worker (Manifest V3)
 */

import { scrubPII, buildLogEntry } from "./pii/scrubber.js";

// All supported AI endpoints → service name
const AI_ENDPOINTS = {
  "api.openai.com":                    "ChatGPT",
  "chatgpt.com":                       "ChatGPT",
  "chat.openai.com":                   "ChatGPT",
  "generativelanguage.googleapis.com": "Gemini",
  "gemini.google.com":                 "Gemini",
  "copilot.microsoft.com":             "Copilot",
  "claude.ai":                         "Claude",
  "api.anthropic.com":                 "Claude",
  "perplexity.ai":                     "Perplexity",
  "grok.x.com":                        "Grok",
  "api.mistral.ai":                    "Mistral",
};

// Free tier: only protect these hosts
const FREE_TIER_HOSTS = [
  "api.openai.com",
  "chatgpt.com",
  "chat.openai.com",
];

let sessionRedactionCount = 0;

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        enabled: true,
        incognito: false,
        plan: "free",
        enabledCategories: ["ssn","credit_card","email","phone","dob","passport","ip_address","street_address"],
        customRules: [],
        keywords: [],
        apiToken: null,
      },
      resolve
    );
  });
}

async function sendLog(logEntry, apiToken) {
  if (!apiToken) return;
  try {
    await fetch("https://api.dataveil.com/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(logEntry),
    });
  } catch {
    // Non-critical — silently fail
  }
}

function updateBadge(count) {
  sessionRedactionCount += count;
  chrome.action.setBadgeText({
    text: sessionRedactionCount > 0 ? String(sessionRedactionCount) : "",
  });
  chrome.action.setBadgeBackgroundColor({ color: "#ff3b3b" });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "SCRUB_PROMPT") return;

  (async () => {
    const settings = await getSettings();

    if (!settings.enabled) {
      sendResponse({ cleaned: message.text, redactions: [], blocked: false });
      return;
    }

    // Free tier: only protect ChatGPT endpoints
    const hostname = (() => {
      try { return new URL(sender.url || "").hostname; } catch { return ""; }
    })();

    if (settings.plan === "free" && !FREE_TIER_HOSTS.some((h) => hostname.includes(h))) {
      sendResponse({ cleaned: message.text, redactions: [], blocked: false, tierBlocked: true });
      return;
    }

    const { cleaned, redactions } = scrubPII(
      message.text,
      settings.enabledCategories,
      settings.customRules ?? [],
      settings.keywords ?? []
    );

    const totalRedacted = redactions.reduce((s, r) => s + r.count, 0);

    if (totalRedacted > 0) {
      updateBadge(totalRedacted);

      // Skip server logging if incognito mode is on
      if (!settings.incognito) {
        const service = Object.entries(AI_ENDPOINTS).find(([k]) => hostname.includes(k))?.[1] ?? "Unknown";
        const logEntry = buildLogEntry(service, redactions);
        sendLog(logEntry, settings.apiToken);

        chrome.runtime.sendMessage({ type: "REDACTION_EVENT", logEntry }).catch(() => {});
      }
    }

    sendResponse({ cleaned, redactions, blocked: false });
  })();

  return true;
});
