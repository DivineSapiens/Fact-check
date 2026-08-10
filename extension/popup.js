// Popup logic for Fact-Check Beacon

document.addEventListener("DOMContentLoaded", async () => {
  const noSelectionState = document.getElementById("no-selection-state");
  const loadingState = document.getElementById("loading-state");
  const resultState = document.getElementById("result-state");
  const warningModal = document.getElementById("warning-modal");

  const claimTextEl = document.getElementById("claim-text");
  const checkingClaimPreviewEl = document.getElementById("checking-claim-preview");
  const scoreCircleEl = document.getElementById("score-circle-container");
  const scoreTextEl = document.getElementById("score-text");
  const statusBadgeEl = document.getElementById("status-badge");
  const explanationTextEl = document.getElementById("explanation-text");
  const sourcesListEl = document.getElementById("sources-list");
  const sourcesCountEl = document.getElementById("sources-count");

  const reportRumorBtn = document.getElementById("report-rumor-btn");
  const recheckBtn = document.getElementById("recheck-btn");
  const reportToast = document.getElementById("report-toast");

  const modalScoreEl = document.getElementById("modal-score");
  const correctedTextBodyEl = document.getElementById("corrected-text-body");
  const copyCorrectionBtn = document.getElementById("copy-correction-btn");
  const shareAnywayBtn = document.getElementById("share-anyway-btn");

  let currentResult = null;
  let currentSelectionText = "";

  // Retrieve highlighted text
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString().trim(),
      }).catch(() => []);

      if (results && results[0] && results[0].result) {
        currentSelectionText = results[0].result;
      }
    }
  } catch (err) {
    console.log("Scripting query fallback:", err);
  }

  if (!currentSelectionText) {
    const storageData = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getStoredText" }, (response) => {
        resolve(response?.text || "");
      });
    });
    currentSelectionText = storageData;
  }

  if (!currentSelectionText) {
    showState(noSelectionState);
    return;
  }

  runFactCheck(currentSelectionText);

  recheckBtn.addEventListener("click", () => {
    runFactCheck(currentSelectionText);
  });

  reportRumorBtn.addEventListener("click", async () => {
    if (!currentResult) return;

    reportRumorBtn.disabled = true;
    reportRumorBtn.innerText = "Reporting...";
    const reporterId = await getReporterId();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
    const sourceUrl = tab?.url || "";

    chrome.runtime.sendMessage(
      {
        action: "reportRumor",
        payload: {
          claim: currentResult.claim,
          score: currentResult.trustScore,
          status: currentResult.status,
          reporterId: reporterId,
          sourceUrl: sourceUrl,
          sources: currentResult.sources || [],
        },
      },
      (response) => {
        if (response && response.success) {
          reportRumorBtn.disabled = true;
          reportRumorBtn.innerHTML = `✓ Reported`;
          reportToast.className = "text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 py-1.5 px-3 rounded-lg";
          reportToast.innerText = "✓ Reported to community rumor radar!";
          reportToast.classList.remove("hidden");
          setTimeout(() => reportToast.classList.add("hidden"), 3500);
        } else {
          reportRumorBtn.disabled = false;
          reportRumorBtn.innerText = "🚩 Report Rumor";
          reportToast.className = "text-center text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 py-1.5 px-3 rounded-lg";
          reportToast.innerText = `⚠️ Report failed: ${response?.error || "Firestore disabled"}`;
          reportToast.classList.remove("hidden");
          setTimeout(() => reportToast.classList.add("hidden"), 4000);
        }
      }
    );
  });

  shareAnywayBtn.addEventListener("click", () => {
    warningModal.classList.add("hidden");
  });

  copyCorrectionBtn.addEventListener("click", async () => {
    if (!currentResult) return;
    const textToCopy = currentResult.correctedText || currentResult.explanation;
    try {
      await navigator.clipboard.writeText(textToCopy);
      copyCorrectionBtn.innerText = "✓ Copied to Clipboard!";
      setTimeout(() => {
        copyCorrectionBtn.innerText = "Copy Correction";
        warningModal.classList.add("hidden");
      }, 1200);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  });

  function runFactCheck(text) {
    showState(loadingState);
    checkingClaimPreviewEl.innerText = `"${text.substring(0, 70)}${text.length > 70 ? "..." : ""}"`;

    chrome.runtime.sendMessage(
      { action: "checkClaim", text: text },
      (response) => {
        if (!response || !response.success) {
          renderResult({
            claim: text,
            trustScore: 0,
            status: "Likely False",
            explanation: "Unable to reach fact-check backend.",
            sources: [],
            correctedText: "Fact-check service unreachable.",
          });
          return;
        }

        currentResult = response.data;
        renderResult(currentResult);
      }
    );
  }

  function renderResult(data) {
    showState(resultState);

    claimTextEl.innerText = `"${data.claim}"`;
    scoreTextEl.innerText = data.trustScore;
    explanationTextEl.innerText = data.explanation;

    const score = data.trustScore;
    if (score >= 80) {
      scoreCircleEl.className = "relative w-16 h-16 shrink-0 rounded-full flex items-center justify-center border-4 font-extrabold text-lg shadow-lg bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-emerald-500/20";
      statusBadgeEl.className = "px-2 py-0-5 text-[11px] font-bold rounded-md uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
      statusBadgeEl.innerText = data.status || "Verified True";
    } else if (score >= 40) {
      scoreCircleEl.className = "relative w-16 h-16 shrink-0 rounded-full flex items-center justify-center border-4 font-extrabold text-lg shadow-lg bg-amber-500/10 text-amber-400 border-amber-500 shadow-amber-500/20";
      statusBadgeEl.className = "px-2 py-0-5 text-[11px] font-bold rounded-md uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40";
      statusBadgeEl.innerText = data.status || "Needs Context";
    } else {
      scoreCircleEl.className = "relative w-16 h-16 shrink-0 rounded-full flex items-center justify-center border-4 font-extrabold text-lg shadow-lg bg-rose-500/10 text-rose-400 border-rose-500 shadow-rose-500/20";
      statusBadgeEl.className = "px-2 py-0-5 text-[11px] font-bold rounded-md uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40";
      statusBadgeEl.innerText = data.status || "Likely False";
    }

    sourcesListEl.innerHTML = "";
    const sources = data.sources || [];
    sourcesCountEl.innerText = `${sources.length} source${sources.length === 1 ? "" : "s"}`;

    if (sources.length === 0) {
      sourcesListEl.innerHTML = `<p class="text-[11px] text-slate-500 italic">No sources found for this claim</p>`;
    } else {
      sources.forEach((src) => {
        const link = document.createElement("a");
        link.href = src.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "block bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2 rounded-lg text-xs text-indigo-400 transition-colors flex items-center justify-between";
        
        link.innerHTML = `
          <span class="truncate max-w-[280px] text-[11px] font-medium">${src.title || src.url}</span>
          <svg class="w-3 h-3 text-slate-500 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        `;
        link.addEventListener("click", (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: src.url });
        });
        sourcesListEl.appendChild(link);
      });
    }

    if (score < 80) {
      modalScoreEl.innerText = `${score}/100`;
      correctedTextBodyEl.innerText = data.correctedText || data.explanation;
      warningModal.classList.remove("hidden");
    } else {
      warningModal.classList.add("hidden");
    }
  }

  function showState(el) {
    [noSelectionState, loadingState, resultState].forEach((s) => s.classList.add("hidden"));
    el.classList.remove("hidden");
  }

  async function getReporterId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["reporterId"], (res) => {
        if (res.reporterId) resolve(res.reporterId);
        else {
          const newId = `user_${Math.random().toString(36).substring(2, 7)}`;
          chrome.storage.local.set({ reporterId: newId });
          resolve(newId);
        }
      });
    });
  }
});
