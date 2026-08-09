# Fact-Check Beacon — Hackathon MVP

**Fact-Check Beacon** is a real-time AI fact-checking system consisting of a Manifest V3 Chrome Extension, Next.js 14 backend with Gemini 3.5 Flash & Google Search grounding, Firebase Firestore database, and a live web dashboard.

---

## Key Features

- **Instant Selection Verification**: Highlight any text on any webpage and click the extension icon to fact-check in sub-2 seconds.
- **Grounding Citations Only**: All `sources[]` are strictly extracted from Gemini Search Grounding metadata — zero invented URLs.
- **Color-Coded Trust Badge**:
  - 🟢 **Green `#22C55E`** (80–100): Verified True
  - 🟡 **Yellow `#EAB308`** (40–79): Needs Context
  - 🔴 **Red `#EF4444`** (0–39): Likely False
- **"Think Before You Share" Modal**: Automatically pops up for claims with trust scores under 80, showing verified context and a one-click "Copy Correction" action.
- **Community Rumor Radar & Leaderboard**: Clicking "Report Rumor" writes to Firebase Firestore server-side (`POST /api/report-rumor`) and updates the web dashboard in real time.
- **Mock Mode Fallback**: Built-in rehearsal fallback (`USE_MOCK=true`) matching pre-captured real claims for offline presentation reliability.

---

## Folder Structure

```
FactCheck/
├── extension/             # Chrome Extension (Manifest V3, Vanilla JS, Tailwind CDN)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   └── content.js
├── web-app/               # Next.js App Router Web Dashboard & Backend API
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── check-claim/route.js
│   │   │   │   └── report-rumor/route.js
│   │   │   ├── page.jsx   # Live Dashboard & Leaderboard
│   │   │   ├── layout.jsx
│   │   │   └── globals.css
│   │   └── lib/
│   │       ├── firebase.js
│   │       └── gemini.js
│   ├── data/
│   │   └── mockResponses.json
│   ├── .env.local
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.js
├── scripts/
│   └── capture-mock-data.js   # Script to pre-capture mock data via live Gemini
├── implementation_plan.md
└── README.md
```

---

## Setup & Execution Guide

### 1. Configure Environment Variables (`web-app/.env.local`)

Copy `.env.example` to `.env.local` inside `web-app/`:

```bash
cd web-app
cp .env.example .env.local
```

Ensure `.env.local` contains your credentials:

```env
# 1. Gemini API Key (Get free key from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key

# 2. Mock Mode Flag (Default: false for live Gemini API calls)
USE_MOCK=false

# 3. Firebase Web App Config (From Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_API_URL=http://localhost:3000
```

> ⚠️ **Note**: `USE_MOCK` defaults to `false`. Live mode executes real-time Gemini Search Grounding for any highlighted claim.

---

### 2. Install & Start Next.js App

```bash
cd web-app
npm install
npm run dev
```

The web dashboard and backend API will start at `http://localhost:3000`.

---

### 3. Load Chrome Extension Unpacked

1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `extension/` folder in this repository.
5. The **Fact-Check Beacon** extension icon will now appear in your browser toolbar!

---

### 4. (Optional) Run Pre-Capture Mock Script

To update or regenerate `web-app/data/mockResponses.json` using live Gemini Search Grounding before a demo:

```bash
# Run from project root
node scripts/capture-mock-data.js
```

---

## Testing End-to-End

1. Open any webpage (e.g. news article or Wikipedia).
2. Highlight a sentence or statement with your mouse cursor.
3. Click the **Fact-Check Beacon** extension icon.
4. Watch the extension fetch real-time grounded verification from Gemini, display the score ring, sources, and trigger the "Think Before You Share" modal if the score is < 80.
5. Click **Report Rumor** to file a report.
6. Open `http://localhost:3000` to watch the report appear live on the dashboard feed and leaderboard!
