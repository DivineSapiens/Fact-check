// Service Worker for Fact-Check Beacon

let latestSelectedText = "";
const API_ENDPOINTS = [
  "http://localhost:3000",
  "http://localhost:3001",
];

async function postToBackend(path, payload) {
  let lastError = null;
  for (const baseUrl of API_ENDPOINTS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Backend server is unreachable on ports 3000/3001.");
}

// Store selected text & handle API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setSelectedText") {
    latestSelectedText = request.text;
    chrome.storage.local.set({ selectedText: request.text });
    sendResponse({ status: "stored" });
    return true;
  }

  if (request.action === "getStoredText") {
    chrome.storage.local.get(["selectedText"], (result) => {
      sendResponse({ text: result.selectedText || latestSelectedText || "" });
    });
    return true;
  }

  if (request.action === "checkClaim") {
    postToBackend("/api/check-claim", { claim: request.text })
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Async sendResponse
  }

  if (request.action === "reportRumor") {
    postToBackend("/api/report-rumor", request.payload)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
