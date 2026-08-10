# Fact-Check Beacon

> **Real-time AI claim verification for the open web.** Highlight any text on any webpage and get an instant Trust Score backed by live web grounding from WHO, Reuters, BBC, AP, Snopes, and more.

---

## What It Is

Fact-Check Beacon is an AI-powered misinformation defense system with two components:

- **Chrome Extension (Manifest V3)** — Detects text selection on any page, shows a floating "Verify with Beacon" button, renders an in-page result card with Trust Score, entity-verified grounding sources, and a "Think Before You Share" modal for low-scoring claims.
- **Next.js Web Dashboard** — Real-time community rumor feed with original webpage source links, reporter leaderboard, and interactive claim sandbox supporting direct document uploads (`.pdf`, `.doc`, `.txt`) — all backed by Firebase Firestore.

---

## Key Features

| Feature | Detail |
| :--- | :--- |
| **Instant In-Page Verification** | Highlight ≥ 3 characters → click → result in 2–5 seconds |
| **Multi-Provider AI Engine** | Groq → OpenRouter → Gemini → Zero-Key Wikipedia (automatic fallback chain) |
| **Live Web Grounding & Entity Verification** | Entity relevance matching (`isSourceRelevant`) filters out false/unrelated articles; provides direct `🔍 Verify Web News` search verification links |
| **Original Source Tracking** | Reports capture webpage URL; dashboard renders an **Original Webpage Source ↗** link for manual verification |
| **Sandbox Document Upload** | Upload `.pdf`, `.doc`, `.docx`, `.txt`, `.md` directly into the sandbox with client-side FileReader parsing |
| **Quick Clear Input (`X`)** | One-click button inside claim input field to clear text & attached files instantly |
| **Trusted Source Bias** | WHO, CDC, UN, UNESCO, AFP, Reuters, Snopes, AP, BBC injected into every LLM prompt |
| **Color-Coded Trust Score** | 🟢 80–100 Verified True · 🟡 40–79 Needs Context · 🔴 0–39 Likely False |
| **Think Before You Share Modal** | Auto-fires for scores < 80 with factual correction + "Copy Correction" button |
| **Community Rumor Radar** | Report Rumor → Firestore → Live dashboard feed + leaderboard |
| **Shadow DOM Isolation** | Extension UI never conflicts with host page CSS |

---

## Tech Stack

### Chrome Extension
- Manifest V3 · Vanilla JavaScript · Shadow DOM · Pre-compiled Tailwind CSS (CSP-safe)

### Web App & Backend API
- Next.js 14 (App Router) · React 18 · Tailwind CSS 3
- `@google/generative-ai` · `firebase` · `lucide-react`

---

## Folder Structure

```
FactCheck/
├── extension/                     # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js              # Service worker — proxies API calls, port auto-probe
│   ├── content.js                 # In-page selection detection, Shadow DOM result card
│   └── tailwind.css               # Pre-compiled Tailwind (CSP-compliant, no CDN)
├── web-app/                       # Next.js App Router Web Dashboard & Backend
│   ├── next.config.js             # Next.js App Router configuration
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── check-claim/route.js   # POST /api/check-claim — calls verifyClaimUniversal()
│   │   │   │   └── report-rumor/route.js  # POST /api/report-rumor — writes to Firestore
│   │   │   ├── page.jsx           # Live Dashboard, Leaderboard, Sandbox Tester with File Upload
│   │   │   ├── layout.jsx
│   │   │   └── globals.css
│   │   └── lib/
│   │       ├── factchecker.js     # ⭐ Universal AI engine (Groq/OpenRouter/Gemini/Relevance Filtering)
│   │       ├── gemini.js          # Gemini-specific module with Search Grounding
│   │       └── firebase.js        # Firestore singleton
│   ├── data/
│   │   └── mockResponses.json     # 5 pre-captured responses for USE_MOCK=true
│   ├── .env.local                 # Your credentials (not committed)
│   ├── .env.example               # Template
│   └── package.json
├── scripts/
│   └── capture-mock-data.js       # Regenerates mockResponses.json via live Gemini
├── HANDOFF.md                     # Full technical handoff document
├── OVERVIEW.md                    # Product overview & feature detail
└── README.md
```

---

## AI Provider Priority Chain

The fact-checking engine in `lib/factchecker.js` always runs in this order:

```
1. Wikipedia Live Search  →  (always fetched first with Proper Noun & relevance filtering)
2. Groq API              →  llama-3.3-70b-versatile  (GROQ_API_KEY)
3. OpenRouter API        →  llama-3.3-70b-instruct  (OPENROUTER_API_KEY)
4. Gemini API            →  gemini-2.0-flash  (GEMINI_API_KEY, must start with AIzaSy)
5. Zero-Key Engine       →  Keyword sentiment scoring + 🔍 Verify Web News link  (always works)
```

**You only need one API key to get full LLM-powered responses.** Groq is the recommended free-tier provider.

---

## Setup & Execution

### 1. Configure Environment Variables

Edit `web-app/.env.local`:

```env
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=

USE_MOCK=false

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fact-check-7df9e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fact-check-7df9e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fact-check-7df9e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=780400618657
NEXT_PUBLIC_FIREBASE_APP_ID=1:780400618657:web:8cc219bcd43d1b1767d4e0

NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Run the Application

```bash
cd web-app
npm install
npm run dev
# → Web app runs on http://localhost:3000 (or 3001/3002)
```

### 3. Load Chrome Extension
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `extension/` folder
