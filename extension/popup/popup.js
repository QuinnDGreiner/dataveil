const DASHBOARD_URL = "https://app.dataveil.com";

let recentLogs = [];
let sessionRedactions = 0;
let promptsScanned = 0;

// --- Load persisted state ---
chrome.storage.local.get(
  { recentLogs: [], sessionRedactions: 0, promptsScanned: 0 },
  (data) => {
    recentLogs = data.recentLogs;
    sessionRedactions = data.sessionRedactions;
    promptsScanned = data.promptsScanned;
    renderStats();
    renderLogs();
  }
);

// --- Load toggle state ---
chrome.storage.sync.get({ enabled: true }, (data) => {
  document.getElementById("enabled-toggle").checked = data.enabled;
  updateStatusText(data.enabled);
});

// --- Toggle protection ---
document.getElementById("enabled-toggle").addEventListener("change", (e) => {
  const enabled = e.target.checked;
  chrome.storage.sync.set({ enabled });
  updateStatusText(enabled);
});

// --- Button handlers ---
document.getElementById("dashboard-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: DASHBOARD_URL });
});

document.getElementById("settings-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: `${DASHBOARD_URL}/settings` });
});

// --- Listen for live redaction events from background ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "REDACTION_EVENT") return;

  const entry = message.logEntry;
  recentLogs.unshift(entry);
  if (recentLogs.length > 10) recentLogs.pop();

  sessionRedactions += entry.totalRedactions;
  promptsScanned += 1;

  chrome.storage.local.set({ recentLogs, sessionRedactions, promptsScanned });

  renderStats();
  renderLogs();
});

// --- Render helpers ---
function renderStats() {
  document.getElementById("session-count").textContent = sessionRedactions;
  document.getElementById("prompts-count").textContent = promptsScanned;
}

function renderLogs() {
  const container = document.getElementById("log-list");

  if (recentLogs.length === 0) {
    container.innerHTML = `
      <div style="color:#475569;font-size:12px;text-align:center;padding:12px 0;">
        No activity yet — send a prompt to any AI service.
      </div>`;
    return;
  }

  container.innerHTML = recentLogs
    .slice(0, 5)
    .map((log) => {
      const time = new Date(log.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const categories = log.categories.map((c) => c.id).join(", ");
      return `
        <div class="log-item">
          <div>
            <div class="log-service">${log.service}</div>
            <div class="log-meta">${time} · ${categories || "no PII"}</div>
          </div>
          <div class="log-badge">-${log.totalRedactions}</div>
        </div>`;
    })
    .join("");
}

function updateStatusText(enabled) {
  const el = document.getElementById("status-text");
  el.textContent = enabled
    ? "Active — protecting your data"
    : "Paused — protection off";
}
