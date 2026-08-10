# Fact-Check Beacon — Product Overview

> *Real-time AI claim verification for the open web. Built to protect people from misinformation before it spreads.*

---

## What Is Fact-Check Beacon?

**Fact-Check Beacon** is an AI-powered misinformation defense system that works invisibly in the background as you browse. It consists of two products working in tandem:

1. **A Chrome Browser Extension** — the personal fact-checker that lives in your browser and activates on any text you highlight on any website.
2. **A Next.js Web Dashboard** — a community intelligence hub that aggregates crowd-reported misinformation into a live leaderboard and analytics feed.

Together, they form a lightweight, always-available truth layer that sits between you and the information you consume.

---

## The Problem It Solves

Misinformation has never been easier to create or harder to escape. It flows through news articles, social media posts, WhatsApp messages, email forwards, and comment sections with no warning label, no friction, no accountability. The consequences are real:

- People share health misinformation during disease outbreaks, accelerating harm.
- False political narratives spread millions of times before corrections reach a fraction of viewers.
- Viral myths (5G causes disease, vaccines cause autism) persist for years despite scientific consensus.
- The average person has no fast, frictionless way to verify a claim in the moment they encounter it.

Existing fact-checking websites require a user to:
1. Copy the suspicious text
2. Open a new tab
3. Navigate to a fact-checking site
4. Search the claim manually
5. Read through an article
6. Return to the original page

**That 5-step process fails** because it adds too much friction. People skip it. Fact-Check Beacon collapses that workflow into a **single click**.

---

## How It Works

### For the End User (Extension)

1. **Select any text** on any webpage — a news headline, a tweet, a WhatsApp screenshot, a blog claim, anything with 3+ characters.
2. A floating **"Verify with Beacon"** button appears near your cursor automatically.
3. Click it — within 2–5 seconds, an overlay result card appears showing:
   - **Trust Score (0–100)**: A color-coded ring gauge. Green (80–100), Yellow (40–79), Red (0–39).
   - **Status Label**: `Verified True`, `Needs Context`, or `Likely False`.
   - **AI Explanation**: A concise, 50-word synthesis of evidence.
   - **Factual Correction or Context**: What the verified reality actually says.
   - **Up to 3 Grounding Sources**: Real URLs (Wikipedia, WHO, Reuters, BBC, AP, CDC, Snopes, etc.) that support the evaluation.
4. If the score is **below 80**, a **"Think Before You Share"** modal fires automatically — interrupting the natural impulse to copy-paste or screenshot the claim.
5. From any result, you can **"Report as Rumor"** — one click sends the claim to the community database.

### For the Community (Web Dashboard)

- The **web dashboard** shows all community-reported rumors in real time via Firebase Firestore.
- **Stat Cards** show total claims analyzed, average trust score, and top reporter.
- **Live Rumor Feed** shows recent reports with status badges and filter controls.
- **Reporter Leaderboard** ranks users by total reports submitted, incentivizing community participation.
- **Interactive Sandbox** lets anyone paste a claim into the dashboard and test it directly.

---

## Core Features

### 🧠 Multi-Provider AI Engine
The backend uses a graceful fallback chain with no single point of failure:

| Priority | Provider | Model | Cost |
| :--- | :--- | :--- | :--- |
| 1st | **Groq** | Llama 3.3 70B Versatile | Free tier |
| 2nd | **OpenRouter** | Llama 3.3 70B Instruct | Free credits |
| 3rd | **Gemini** | Flash 2.0 / 1.5 | If AIzaSy key present |
| 4th | **Wikipedia Live Engine** | Keyword grounding | Zero API key — always works |

Fact-Check Beacon can operate **24/7 with zero API cost** in its baseline mode, and upgrades to premium LLM mode simply by dropping in an API key.

---

### 📎 Live Grounding — Not Hallucination
Unlike raw LLM responses, Fact-Check Beacon always grounds answers in **real web citations**:
- Before calling any LLM, it queries the **Wikipedia Search API** to retrieve contextually relevant snippets.
- These snippets are embedded into the LLM prompt as evidence — the AI analyzes real data, not just its training memory.
- When Gemini is used, it additionally uses Google's **Search Grounding API** to pull live web results at inference time.
- Citations shown to the user are **real URLs** pulled from these grounding calls, not invented by the model.

---

### 🎯 Trusted Source Priority Bias
All AI providers are instructed to prioritize these trusted domains:

| Category | Source |
| :--- | :--- |
| Health Global | World Health Organization (who.int) |
| Health US | CDC (cdc.gov) |
| International | United Nations (un.org), UNESCO (unesco.org) |
| Fact-Check | AFP Fact Check, Reuters Fact Check, Snopes, Google Fact Check Tools |
| News | Associated Press (apnews.com), BBC News (bbc.com/news) |

---

### ⚡ Instant In-Page UI (Shadow DOM Isolation)
All extension UI elements are rendered inside **Shadow DOM containers**:
- The extension's CSS never conflicts with the target website's CSS.
- Works on any website, regardless of CSS frameworks or themes.
- The overlay is fully self-contained and does not modify the host page's DOM.

---

### 🚨 Behavioral Friction Against Sharing Misinformation
When a claim scores below 80/100, a **"Think Before You Share"** modal fires proactively:

> *Interrupting the share reflex at the point of exposure is more effective than correcting misinformation after it has spread.*

The modal offers:
- A red warning header explaining the risk level.
- The verified factual correction.
- A **"Copy Correction"** button — making it easy to share the truth instead.
- A **"Dismiss"** button (no gatekeeping — just awareness).

---

### 🏛️ Community Rumor Radar (Firestore-Backed)
Every reported claim is stored in Firebase Firestore with claim text, Trust Score, verdict status, anonymous reporter ID, and timestamp. The web dashboard subscribes in real-time via `onSnapshot`, creating a crowdsourced early-warning system for trending misinformation.

---

### 🔒 Privacy-First Design
- **No account required** — the extension generates a random anonymous reporter ID.
- **No browsing history stored** — only user-initiated, explicitly reported claims reach Firestore.
- **No tracking pixels** in the extension.
- Chrome **Manifest V3** (most restrictive extension architecture) used by design.

---

## Impact Potential

| Metric | Detail |
| :--- | :--- |
| Speed | 2–5 seconds per claim vs. 5–10 minutes manual research |
| Friction | Inline overlay — zero tab-switching required |
| Uptime | 100% with Zero-Key Wikipedia engine (no API dependency) |
| Source reliability | Top 10 globally trusted domains biased into every evaluation |
| Community scale | Each report enriches the shared database for all users |

### Real-World Impact Scenarios

**Health Crisis**: A viral WhatsApp message claims an unproven treatment for a disease. A user receives it, pastes the claim into the extension popup, sees score 12/100 ("Likely False") with a WHO citation, and reads the correction before forwarding.

**Election Misinformation**: A user sees a political claim on a news article. One click gives a Trust Score with AP, Reuters, and BBC grounding — in seconds, not hours.

**Education**: Students, researchers, and journalists use the sandbox tester on the dashboard for rapid preliminary fact-checks before citing a source.

**Platform Moderation**: Community reports flow into the dashboard as an early-warning signal for claims going viral that warrant deeper investigation.

---

## Technical Highlights

- **Zero vendor lock-in**: Switch from Groq to OpenRouter to Gemini to zero-API mode with no code change — just update `.env.local`.
- **CORS-enabled API**: The Next.js backend enables direct extension calls without proxy complexity.
- **Graceful degradation**: Every AI provider failure cascades to the next, ending at the Wikipedia engine. The user always gets a result.
- **Prompt-hardened outputs**: All LLM providers are given structured JSON schemas with explicit anti-echoing instructions for `correctedText`.
- **Mock Mode**: `USE_MOCK=true` enables fully offline development with pre-captured responses.

---

## Roadmap

- [ ] **Vercel Deployment** — production deployment with Groq + Firebase env vars
- [ ] **Chrome Web Store Submission** — package and publish the extension
- [ ] **Historical Trend Analytics** — chart claim volume and trust score trends
- [ ] **Topic Clustering** — group related rumors into topics (health, politics, science)
- [ ] **Social Share Integration** — pre-filled tweet/post with the factual correction
- [ ] **Mobile Companion App** — Android/iOS share sheet for WhatsApp/Telegram claims
- [ ] **Public API Access** — expose `/api/check-claim` for third-party integrations
- [ ] **Firefox Extension Port** — Manifest V3 compatibility for Gecko-based browsers
