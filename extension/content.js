// In-Page Floating Fact-Checker for Fact-Check Beacon (Shadow DOM Encapsulated)

let currentSelection = "";
let triggerHost = null;
let triggerShadow = null;
let cardHost = null;
let cardShadow = null;

// Complete Shadow DOM CSS styles for pixel-perfect layout & spacing
const shadowStyles = `
*, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; }
:host { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; font-size: 13px; line-height: 1.4; text-align: left; }

.card-container {
  width: 360px;
  background-color: #020617;
  color: #f8fafc;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #1e293b;
  padding-bottom: 10px;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-badge {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: #4f46e5;
  color: #ffffff;
  font-weight: 800;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  background-color: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  white-space: nowrap;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s ease;
}
.close-btn:hover { color: #ffffff; }

.claim-box {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 12px;
}

.section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.claim-text {
  font-size: 12px;
  font-style: italic;
  color: #e2e8f0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.score-row {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.score-ring {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid;
  font-size: 18px;
  font-weight: 800;
}

.score-ring.green { background-color: rgba(34, 197, 94, 0.1); color: #4ade80; border-color: #22c55e; }
.score-ring.yellow { background-color: rgba(234, 179, 8, 0.1); color: #facc15; border-color: #eab308; }
.score-ring.red { background-color: rgba(239, 68, 68, 0.1); color: #f87171; border-color: #ef4444; }

.status-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid;
  align-self: flex-start;
}

.status-badge.green { background-color: rgba(34, 197, 94, 0.2); color: #4ade80; border-color: rgba(34, 197, 94, 0.4); }
.status-badge.yellow { background-color: rgba(234, 179, 8, 0.2); color: #facc15; border-color: rgba(234, 179, 8, 0.4); }
.status-badge.red { background-color: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.4); }

.explanation-text {
  font-size: 11px;
  color: #cbd5e1;
  line-height: 1.35;
}

.warning-banner {
  background-color: #0f172a;
  border: 1px solid rgba(234, 179, 8, 0.35);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning-header {
  font-size: 11px;
  font-weight: 700;
  color: #facc15;
  display: flex;
  align-items: center;
  gap: 6px;
}

.correction-text {
  font-size: 11px;
  color: #f8fafc;
  line-height: 1.4;
  font-weight: 500;
}

.warning-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.btn-primary {
  flex: 1;
  background-color: #4f46e5;
  color: #ffffff;
  font-weight: 600;
  font-size: 11px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.btn-primary:hover { background-color: #4338ca; }

.btn-secondary {
  background-color: #1e293b;
  color: #94a3b8;
  font-weight: 600;
  font-size: 11px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
}
.btn-secondary:hover { color: #f8fafc; }

.sources-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
}

.source-item {
  background-color: #0f172a;
  border: 1px solid #1e293b;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11px;
  color: #818cf8;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: border-color 0.15s ease;
}
.source-item:hover { border-color: rgba(99, 102, 241, 0.5); }
.source-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px; }

.empty-sources {
  font-size: 11px;
  color: #64748b;
  font-style: italic;
  padding: 4px 0;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
}

.report-btn {
  flex: 1;
  background-color: #0f172a;
  border: 1px solid #1e293b;
  color: #f87171;
  font-weight: 600;
  font-size: 11px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.15s ease;
}
.report-btn:hover { background-color: #1e293b; }

.toast {
  font-size: 10px;
  color: #4ade80;
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 6px;
  border-radius: 6px;
  text-align: center;
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #4f46e5;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
  margin: 12px auto;
}
`;

// Track text selection and render Shadow DOM floating trigger button
function handleSelectionChange() {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (!text || text.length < 3) {
    removeTriggerButton();
    return;
  }

  currentSelection = text;
  chrome.runtime.sendMessage({ action: "setSelectedText", text: currentSelection }).catch(() => {});

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      showTriggerButtonInShadowDOM(rect);
    }
  }
}

// In-Page Floating Trigger Button mounted inside Shadow DOM
function showTriggerButtonInShadowDOM(rect) {
  if (!triggerHost) {
    triggerHost = document.createElement("div");
    triggerHost.id = "factcheck-beacon-trigger-host";
    triggerHost.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 2147483646;
      pointer-events: none;
    `;
    triggerShadow = triggerHost.attachShadow({ mode: "open" });
    document.documentElement.appendChild(triggerHost);

    const triggerStyle = document.createElement("style");
    triggerStyle.textContent = `
      .trigger-btn {
        position: absolute;
        pointer-events: auto;
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: #ffffff;
        border: 1.5px solid #a5b4fc;
        border-radius: 9999px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .trigger-btn:hover {
        transform: scale(1.06);
        box-shadow: 0 12px 30px -5px rgba(79, 70, 229, 0.8);
      }
    `;
    triggerShadow.appendChild(triggerStyle);

    const btn = document.createElement("button");
    btn.className = "trigger-btn";
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>Verify with Beacon</span>
    `;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      removeTriggerButton();
      triggerFactCheck(currentSelection, rect);
    });

    triggerShadow.appendChild(btn);
  }

  const btnEl = triggerShadow.querySelector(".trigger-btn");
  if (btnEl) {
    const top = rect.bottom + window.scrollY + 8;
    const left = Math.max(10, rect.left + window.scrollX + rect.width / 2 - 65);
    btnEl.style.top = `${top}px`;
    btnEl.style.left = `${left}px`;
  }
}

function removeTriggerButton() {
  if (triggerHost) {
    triggerHost.remove();
    triggerHost = null;
    triggerShadow = null;
  }
}

// In-Page Result Card Overlay mounted inside Shadow DOM
function triggerFactCheck(text, rect) {
  removeCardOverlay();

  cardHost = document.createElement("div");
  cardHost.id = "factcheck-beacon-card-host";
  
  const top = Math.min(rect.bottom + window.scrollY + 12, document.body.scrollHeight - 480);
  const left = Math.min(Math.max(12, rect.left + window.scrollX - 20), window.innerWidth - 380);

  cardHost.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    z-index: 2147483647;
    width: 360px;
  `;

  cardShadow = cardHost.attachShadow({ mode: "open" });
  document.documentElement.appendChild(cardHost);

  // Inject CSS inside Shadow DOM
  const styleEl = document.createElement("style");
  styleEl.textContent = shadowStyles;
  cardShadow.appendChild(styleEl);

  // Card Outer Container
  const container = document.createElement("div");
  container.className = "card-container";
  cardShadow.appendChild(container);

  // Initial Loading UI State
  container.innerHTML = `
    <div class="header-row">
      <div class="brand-box">
        <div class="logo-badge">FB</div>
        <span class="header-title">Fact-Check Beacon</span>
      </div>
      <div class="header-right">
        <span class="mode-badge">Live Mode</span>
        <button id="close-card-btn" class="close-btn">✕</button>
      </div>
    </div>
    <div style="text-align: center; padding: 16px 0;">
      <div class="spinner"></div>
      <p style="font-size: 12px; font-weight: 600; color: #f8fafc; margin-top: 8px;">Verifying claim with Gemini Search...</p>
      <p style="font-size: 11px; color: #94a3b8; font-style: italic; margin-top: 4px;">"${text.substring(0, 50)}..."</p>
    </div>
  `;

  cardShadow.getElementById("close-card-btn").addEventListener("click", removeCardOverlay);

  // Call API via Background Service Worker
  chrome.runtime.sendMessage({ action: "checkClaim", text: text }, (response) => {
    if (!response || !response.success) {
      renderCardResult(container, {
        claim: text,
        trustScore: 0,
        status: "Likely False",
        explanation: "Unable to connect to fact-check backend server.",
        sources: [],
        correctedText: "Fact-check backend is unreachable. Verify backend execution.",
      });
      return;
    }
    renderCardResult(container, response.data);
  });
}

// Render Result UI inside Shadow DOM Card Container
function renderCardResult(container, data) {
  const score = data.trustScore;
  let scoreClass = "red";
  if (score >= 80) scoreClass = "green";
  else if (score >= 40) scoreClass = "yellow";

  const sources = data.sources || [];
  const sourcesHtml = sources.length === 0
    ? `<p class="empty-sources">No sources found for this claim</p>`
    : sources.map(src => `
        <a href="${src.url}" target="_blank" rel="noopener noreferrer" class="source-item">
          <span class="source-title">${src.title || src.url}</span>
          <span style="font-size: 10px;">↗</span>
        </a>
      `).join("");

  const modalHtml = score < 80 ? `
    <div class="warning-banner">
      <div class="warning-header">
        <span>⚠️ Think Before You Share</span>
      </div>
      <div class="section-label" style="color: #facc15; margin-bottom: 2px;">Verified Correction</div>
      <p class="correction-text">
        ${data.correctedText || data.explanation}
      </p>
      <div class="warning-actions">
        <button id="card-copy-btn" class="btn-primary">Copy Correction</button>
        <button id="card-share-btn" class="btn-secondary">Dismiss</button>
      </div>
    </div>
  ` : "";

  container.innerHTML = `
    <!-- Header -->
    <div class="header-row">
      <div class="brand-box">
        <div class="logo-badge">FB</div>
        <span class="header-title">Fact-Check Beacon</span>
      </div>
      <div class="header-right">
        <span class="mode-badge">Live Mode</span>
        <button id="close-card-btn" class="close-btn">✕</button>
      </div>
    </div>

    <!-- Selected Claim Preview -->
    <div class="claim-box">
      <div class="section-label">Selected Claim</div>
      <p class="claim-text">"${data.claim}"</p>
    </div>

    <!-- Trust Score Ring & Explanation -->
    <div class="score-row">
      <div class="score-ring ${scoreClass}">
        ${score}
      </div>
      <div class="status-column">
        <span class="status-badge ${scoreClass}">
          ${data.status}
        </span>
        <p class="explanation-text">${data.explanation}</p>
      </div>
    </div>

    <!-- Grounding Citations -->
    <div class="sources-section">
      <div class="section-label">Verified Grounding Sources (${sources.length})</div>
      <div class="sources-list">
        ${sourcesHtml}
      </div>
    </div>

    <!-- Warning Banner if Score < 80 -->
    ${modalHtml}

    <!-- Action Row -->
    <div class="action-row">
      <button id="card-report-btn" class="report-btn">
        🚩 Report Rumor
      </button>
    </div>
    <div id="card-report-toast" class="toast hidden">
      ✓ Reported to community rumor radar!
    </div>
  `;

  // Attach Listeners inside Shadow DOM
  cardShadow.getElementById("close-card-btn").addEventListener("click", removeCardOverlay);

  const reportBtn = cardShadow.getElementById("card-report-btn");
  if (reportBtn) {
    reportBtn.addEventListener("click", () => {
      reportBtn.disabled = true;
      reportBtn.innerText = "Reporting...";
      const reporterId = `user_${Math.random().toString(36).substring(2, 7)}`;

      chrome.runtime.sendMessage(
        {
          action: "reportRumor",
          payload: {
            claim: data.claim,
            score: data.trustScore,
            status: data.status,
            reporterId: reporterId,
          },
        },
        () => {
          reportBtn.innerText = "✓ Reported";
          const toast = cardShadow.getElementById("card-report-toast");
          if (toast) toast.classList.remove("hidden");
        }
      );
    });
  }

  const copyBtn = cardShadow.getElementById("card-copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(data.correctedText || data.explanation);
      copyBtn.innerText = "✓ Copied!";
      setTimeout(() => (copyBtn.innerText = "Copy Correction"), 1500);
    });
  }

  const shareBtn = cardShadow.getElementById("card-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      const banner = cardShadow.querySelector(".warning-banner");
      if (banner) banner.remove();
    });
  }
}

function removeCardOverlay() {
  if (cardHost) {
    cardHost.remove();
    cardHost = null;
    cardShadow = null;
  }
}

// Global Event Listeners for Host Webpages
document.addEventListener("mouseup", handleSelectionChange);
document.addEventListener("keyup", handleSelectionChange);

// Dismiss trigger / overlay on outside click
document.addEventListener("mousedown", (e) => {
  if (triggerHost && !triggerHost.contains(e.target)) {
    // Keep trigger if selection active
  }
  if (cardHost && !cardHost.contains(e.target)) {
    removeCardOverlay();
  }
});

// Listener for secondary toolbar popup messaging
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    sendResponse({ text: window.getSelection().toString().trim() || currentSelection });
  }
  return true;
});
