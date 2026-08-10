# Fact-Check Beacon — Project Handoff Document

> **Last Updated**: August 2026  
> This document captures the **actual current state** of the codebase. A new agent or developer reading this should be able to pick up development immediately with zero prior context.

---

## 1. Project Intent

Fact-Check Beacon is a real-time AI claim verification ecosystem consisting of a Chrome Extension (Manifest V3) and a Next.js web application. When a user highlights any claim or sentence on any webpage, the extension provides instant fact-checking powered by a multi-provider AI engine (Groq Llama 3.3 70B / OpenRouter / Gemini / Wikipedia Live Search). It computes a numerical Trust Score (0–100), presents verified ground-truth web citations with entity relevance filtering, warns users via a "Think Before You Share" modal if a claim scores below 80, and allows reporting unverified rumors (including the original webpage URL) to a community-wide rumor radar backed by Firebase Firestore. The web dashboard provides real-time analytics, a live leaderboard of top community reporters, an interactive claim sandbox with document upload support, and direct links back to original rumor sources.

---

## 2. Tech Stack (actual, as implemented)

### Chrome Extension (`/extension`)
| Component | Detail |
| :--- | :--- |
| Manifest Version | Manifest V3 |
| Logic | Vanilla JavaScript (ES6+, Shadow DOM) |
| Styling | Tailwind CSS v3 — locally compiled `tailwind.css` (**no CDN**, CSP-compliant) |
| Permissions | `activeTab`, `scripting`, `storage` |
| Host Permissions | `<all_urls>`, `http://localhost:3000/*`, `https://*.vercel.app/*` |

### Web Application & Backend API (`/web-app`)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `next` | `^14.2.35` | App Router framework |
| `react` / `react-dom` | `^18.3.1` | UI rendering |
| `@google/generative-ai` | `^0.21.0` | Gemini fallback (optional) |
| `firebase` | `^10.13.0` | Firestore database |
| `lucide-react` | `^0.428.0` | Icon components |
| `clsx` | `^2.1.1` | Class utility |
| `tailwind-merge` | `^2.5.2` | Tailwind class merging |
| `tailwindcss` | `^3.4.10` | CSS framework |
| `autoprefixer` | `^10.4.20` | PostCSS plugin |
| `postcss` | `^8.4.41` | CSS toolchain |

---

## 3. Architecture Overview

The system has three interconnected layers: **Chrome Extension (Client) ↔ Next.js API (Backend) ↔ Multi-Provider AI Engine & Firebase Firestore (Cloud Services)**.

### Data Flow
1. User selects ≥3 characters of text on any webpage.
2. `content.js` detects the selection, mounts a floating **"Verify with Beacon"** Shadow DOM trigger button near the highlighted text.
3. Clicking it sends a `checkClaim` message to `background.js` (service worker).
4. `background.js` probes `http://localhost:3000` through `3004` until a live backend is found, then sends `POST /api/check-claim`.
5. `route.js` calls `verifyClaimUniversal()` from `lib/factchecker.js`.
6. `verifyClaimUniversal()` extracts proper nouns and key entities, fetches live **Wikipedia grounding citations** filtered via strict relevance checking (`isSourceRelevant`), then attempts providers in order: **Groq → OpenRouter → Gemini → Zero-Key Wikipedia Grounding Engine**.
7. The backend returns CORS-enabled structured JSON to the extension.
8. `content.js` renders an in-page **Shadow DOM result card** with Trust Score ring, status badge, grounding sources, and a warning modal for scores < 80.
9. "Report Rumor" button sends `POST /api/report-rumor` with claim text, score, status, reporter ID, and `sourceUrl` (the current webpage URL), writing to the Firestore `reports` collection.
10. The Next.js web dashboard subscribes to Firestore via `onSnapshot` and updates the rumor feed, source links, and leaderboard in real time.

---

## 4. File-by-File Reference

### Extension (`/extension`)

#### [`extension/manifest.json`](file:///c:/Users/kvsre/Downloads/FactCheck/extension/manifest.json)
- **What it does**: Manifest V3 config — registers service worker, content scripts, popup, and permissions.
- **Callers**: Loaded by Chrome browser.
- **Hardcoded**: Host permissions include `http://localhost:3000/*` and `https://*.vercel.app/*`.

#### [`extension/background.js`](file:///c:/Users/kvsre/Downloads/FactCheck/extension/background.js)
- **What it does**: Service Worker. Handles messages `setSelectedText`, `getStoredText`, `checkClaim`, `reportRumor`. Proxies all backend API calls by probing ports 3000–3004.
- **Callers**: Called by `content.js` and `popup.js` via `chrome.runtime.sendMessage()`.
- **Hardcoded**: `API_ENDPOINTS` array with localhost ports 3000–3004. Parses error JSON to send clear diagnostics to UI.

#### [`extension/content.js`](file:///c:/Users/kvsre/Downloads/FactCheck/extension/content.js)
- **What it does**: Main in-page content script. Listens for selection events, injects floating Shadow DOM trigger button, sends claim to background worker, renders full Shadow DOM result card overlay with score ring, sources, warning modal, and report button. Captures `window.location.href` on report and validates response status.
- **Callers**: Injected into `<all_urls>`.
- **Hardcoded**: Card width 360px, z-index `2147483647`, random reporter ID generation (`user_XXXXX`).

#### [`extension/popup.html`](file:///c:/Users/kvsre/Downloads/FactCheck/extension/popup.html)
- **What it does**: HTML for the secondary Chrome toolbar popup. Contains "No Selection", "Loading", "Result Card", and "Think Before You Share" modal states.
- **Callers**: `manifest.json` → `action.default_popup`. Loads `tailwind.css` and `popup.js`.

#### [`extension/popup.js`](file:///c:/Users/kvsre/Downloads/FactCheck/extension/popup.js)
- **What it does**: Popup logic. Grabs current selection via `chrome.scripting.executeScript`, falls back to `chrome.storage.local`, triggers fact check, renders results and warning modal. Captures active tab URL on report and handles response status.
- **Callers**: `popup.html`.
- **Hardcoded**: Score threshold 80 triggers modal.

#### [`extension/tailwind.css`](file:///c:/Users/kvsre/Downloads/FactCheck/extension/tailwind.css)
- **What it does**: Pre-compiled Tailwind stylesheet for popup UI (CSP-safe, no CDN).
- **Callers**: `popup.html`.

---

### Web App (`/web-app`)

#### [`web-app/next.config.js`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/next.config.js)
- **What it does**: Next.js 14 configuration file establishing strict React mode and App Router build settings.

#### [`web-app/src/lib/factchecker.js`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/lib/factchecker.js) ⭐ **Primary AI Engine**
- **What it does**: Universal multi-provider fact-checking engine. Exports `verifyClaimUniversal(claimText)`. Execution order:
  1. Extract proper nouns and key entities from `claimText`
  2. Fetch Wikipedia grounding citations and filter via `isSourceRelevant()` to reject unrelated articles
  3. Try **Groq** (`GROQ_API_KEY`, `llama-3.3-70b-versatile`)
  4. Try **OpenRouter** (`OPENROUTER_API_KEY`, `meta-llama/llama-3.3-70b-instruct`)
  5. Try **Gemini** (`GEMINI_API_KEY`, only if key starts with `AIzaSy`)
  6. Fall back to **Zero-Key Wikipedia Grounding Engine** with `🔍 Verify Web News` search verification links
- **Callers**: `src/app/api/check-claim/route.js`
- **Env vars**: `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`
- **Trusted Sources**: WHO, CDC, UN, UNESCO, AFP, Reuters, Snopes, Google Fact Check Tools, AP, BBC — injected as prompt instruction to all LLM providers.

#### [`web-app/src/lib/gemini.js`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/lib/gemini.js)
- **What it does**: Gemini-specific fact-check module. Attempts models `gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-2.5-flash` with model fallback loop. Extracts grounding citations strictly from `candidate.groundingMetadata.groundingChunks`. Sanitizes `correctedText` to prevent claim echoing.
- **Callers**: `lib/factchecker.js`
- **Env vars**: `GEMINI_API_KEY` (must start with `AIzaSy` to be invoked)

#### [`web-app/src/lib/firebase.js`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/lib/firebase.js)
- **What it does**: Singleton Firebase App + Firestore initialization.
- **Callers**: `api/report-rumor/route.js`, `app/page.jsx`
- **Env vars**: `NEXT_PUBLIC_FIREBASE_*` (6 variables)

#### [`web-app/src/app/api/check-claim/route.js`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/app/api/check-claim/route.js)
- **What it does**: `POST /api/check-claim`. Handles CORS preflight, checks `USE_MOCK` flag, matches mock dataset if `USE_MOCK=true`, otherwise calls `verifyClaimUniversal()`. Returns HTTP 200 even on internal AI errors (graceful degradation).
- **Callers**: `extension/background.js` (via fetch), `app/page.jsx` (sandbox tester)
- **Env vars**: `USE_MOCK`

#### [`web-app/src/app/api/report-rumor/route.js`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/app/api/report-rumor/route.js)
- **What it does**: `POST /api/report-rumor`. Writes `{claim, score, status, reporterId, sourceUrl, sources, timestamp, createdAt}` to Firestore `reports` collection.
- **Callers**: `extension/background.js`

#### [`web-app/src/app/page.jsx`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/app/page.jsx)
- **What it does**: Main Next.js dashboard (`"use client"`). Real-time Firestore `onSnapshot` subscription showing top 50 reports. Renders: 3 stat cards, live claim sandbox tester with quick clear (`X`) and document upload (`.pdf`, `.doc`, `.txt`), recent rumors feed with filter & **Original Webpage Source ↗** direct links, and reporter leaderboard.
- **Callers**: Next.js root route `/`
- **Env vars**: Firebase `NEXT_PUBLIC_*` vars (used via `lib/firebase.js`)

#### [`web-app/src/app/layout.jsx`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/app/layout.jsx)
- **What it does**: Root Next.js layout with page `<title>`, `<meta description>`, and dark background body.

#### [`web-app/src/app/globals.css`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/src/app/globals.css)
- **What it does**: Tailwind directives + CSS custom properties for background/foreground colors.

#### [`web-app/data/mockResponses.json`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/data/mockResponses.json)
- **What it does**: Array of 5 pre-captured ground-truth fact-check responses used when `USE_MOCK=true`. Contains claims: Great Wall / Moon, Bananas on trees, Water boiling point, 10% brain myth, 5G disease myth.
- **Callers**: `api/check-claim/route.js`

---

## 5. Feature-to-Code Map

| Feature | File(s) | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Floating In-Page Trigger Button** | `extension/content.js` | ✅ Fully Working | Shadow DOM pill button near selection. Min 3 chars. |
| **Floating In-Page Result Card** | `extension/content.js` | ✅ Fully Working | 360px Shadow DOM card with score ring, sources, modal. |
| **Extension Toolbar Popup** | `extension/popup.html`, `popup.js` | ✅ Fully Working | Secondary manual entry via toolbar icon. |
| **Trust Score Display** | `extension/content.js`, `popup.js` | ✅ Fully Working | 80–100 Green, 40–79 Yellow, 0–39 Red. |
| **Think Before You Share Modal** | `extension/content.js`, `popup.js` | ✅ Fully Working | Auto-triggers when score < 80. "Copy Correction" & "Dismiss" buttons. |
| **Report Rumor → Firestore** | `content.js`, `popup.js`, `api/report-rumor/route.js` | ✅ Fully Working | Posts via server-side API route, writes claim, score, status, and `sourceUrl` to Firestore. |
| **Original Source Tracking** | `content.js`, `popup.js`, `page.jsx` | ✅ Fully Working | Captures webpage URL on report, renders **Original Webpage Source ↗** link on dashboard cards. |
| **Sandbox Quick Clear (`X`)** | `app/page.jsx` | ✅ Fully Working | One-click button inside claim input field to clear text & results instantly. |
| **Document Upload (PDF/DOC/TXT)** | `app/page.jsx` | ✅ Fully Working | Upload `.pdf`, `.doc`, `.docx`, `.txt`, `.md`. FileReader parses text directly into sandbox. |
| **Grounding Relevance Filtering** | `lib/factchecker.js` | ✅ Fully Working | `isSourceRelevant()` filters out unrelated Wikipedia pages (e.g. Kota Factory, Singapore education). |
| **Dashboard Rumor Feed** | `app/page.jsx` | ✅ Fully Working | Real-time `onSnapshot`, filterable with source links. |
| **Community Leaderboard** | `app/page.jsx` | ✅ Fully Working | Ranks reporters by report count, top 3 styled distinctly. |
| **Live Sandbox Claim Tester** | `app/page.jsx` | ✅ Fully Working | Interactive input + file upload on dashboard, calls `/api/check-claim`. |
| **Groq LLM Fact-Check** | `lib/factchecker.js` | ✅ Fully Working | `llama-3.3-70b-versatile`, primary active provider. |
| **OpenRouter Fact-Check** | `lib/factchecker.js` | ✅ Configured | `meta-llama/llama-3.3-70b-instruct`, secondary fallback. |
| **Gemini Fact-Check** | `lib/gemini.js` | ⚠️ Optional | Only activates if `GEMINI_API_KEY` starts with `AIzaSy`. |
| **Zero-Key Grounding Engine** | `lib/factchecker.js` | ✅ Always Active | Keyword sentiment scoring + 1-click `🔍 Verify Web News` search verification links. |
| **Mock Mode** | `api/check-claim/route.js`, `data/mockResponses.json` | ✅ Fully Working | Set `USE_MOCK=true`. 5 pre-populated claims. |

---

## 6. Environment & Setup

### All Required Environment Variables

Edit [`web-app/.env.local`](file:///c:/Users/kvsre/Downloads/FactCheck/web-app/.env.local):

```env
# === AI API Keys (at least one recommended, all optional if using Zero-Key mode) ===

# Groq — Free tier, ultra-fast. Get key at: console.groq.com/keys (starts gsk_...)
GROQ_API_KEY=gsk_...

# OpenRouter — Free tier. Get key at: openrouter.ai/keys (starts sk-or-v1-...)
OPENROUTER_API_KEY=sk-or-v1-...

# Gemini — MUST start with AIzaSy. Get key at: aistudio.google.com/app/apikey
GEMINI_API_KEY=

# === Mock Mode ===
USE_MOCK=false

# === Firebase Firestore ===
NEXT_PUBLIC_FIREBASE_API_KEY=Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fact-check-7df9e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fact-check-7df9e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fact-check-7df9e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=780400618657
NEXT_PUBLIC_FIREBASE_APP_ID=1:780400618657:web:8cc219bcd43d1b1767d4e0

NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Steps to Run Locally

```bash
# 1. Install web app dependencies
cd web-app
npm install

# 2. Configure .env.local (see above)

# 3. Start dev server
npm run dev
# → Starts at http://localhost:3000 (or 3001/3002 if port busy)
```

**Load the Chrome Extension:**
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Pin "Fact-Check Beacon" to the toolbar

---

## 7. Known Issues / Maintenance Notes

1. **Gemini API Keys**: Keys starting with `AQ.` (OAuth tokens) do NOT work with the public `generativelanguage.googleapis.com` endpoint — only `AIzaSy...` keys work. The system auto-skips Gemini if the key format is wrong.
2. **Firestore Security Rules**: The `api/report-rumor` route uses the Firebase client SDK (`addDoc`) server-side with public credentials. Ensure Firestore database is created in Native mode in Firebase console.
3. **Extension Port Auto-Probe**: `background.js` probes ports 3000–3004 automatically.
