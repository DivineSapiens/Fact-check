# Fact-Check Beacon — Product Overview

> *Real-time AI claim verification for the open web. Built to protect people from misinformation before it spreads.*

---

## What Is Fact-Check Beacon?

**Fact-Check Beacon** is an AI-powered misinformation defense system that works invisibly in the background as you browse. It consists of two products working in tandem:

1. **A Chrome Browser Extension** — the personal fact-checker that lives in your browser and activates on any text you highlight on any website.
2. **A Next.js Web Dashboard** — a community intelligence hub that aggregates crowd-reported misinformation into a live leaderboard, analytics feed, and interactive claim sandbox with document upload support.

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
   - **Entity-Verified Grounding Sources**: Up to 3 verified URLs (Wikipedia, WHO, Reuters, BBC, AP, CDC, Snopes, or 1-click `🔍 Verify Web News` links) filtered by strict Proper Noun relevance.
4. If the score is **below 80**, a **"Think Before You Share"** modal fires automatically — interrupting the natural impulse to copy-paste or screenshot the claim.
5. From any result, you can **"Report as Rumor"** — one click sends the claim and your current webpage URL (`sourceUrl`) to the community database.

### For the Community (Web Dashboard)

- The **web dashboard** shows all community-reported rumors in real time via Firebase Firestore.
- **Stat Cards** show total claims analyzed, average trust score, and active reporters.
- **Live Rumor Feed** shows recent reports with status badges, filter controls, and **Original Webpage Source ↗** direct links.
- **Reporter Leaderboard** ranks users by total reports submitted, incentivizing community participation.
- **Interactive Sandbox** lets anyone paste a claim or upload documents (`.pdf`, `.doc`, `.txt`) into the dashboard and test them directly.

---

## Core Features

### 🧠 Multi-Provider AI Engine
The backend uses a graceful fallback chain with no single point of failure:

| Priority | Provider | Model | Cost |
| :--- | :--- | :--- | :--- |
| 1st | **Wikipedia Live Engine** | Proper Noun & Relevance Filtered Search | Zero API key — always works |
| 2nd | **Groq** | Llama 3.3 70B Versatile | Free tier |
| 3rd | **OpenRouter** | Llama 3.3 70B Instruct | Paid credits (free tier deprecated) |
| 4th | **Gemini** | Flash 2.0 / 1.5 | If AIzaSy key present |

Fact-Check Beacon can operate **24/7 with zero API cost** in its baseline mode, and upgrades to premium LLM mode simply by dropping in an API key.

---

### 📎 Live Grounding & Entity Relevance
Unlike raw LLM responses, Fact-Check Beacon always grounds answers in **real web citations**:
- Before calling any LLM, it queries the **Wikipedia Search API** to retrieve contextually relevant snippets.
- **Strict Relevance Checking (`isSourceRelevant`)**: Extracts Proper Nouns (e.g. `NALSAR`, `WHO`, `CDC`) and non-generic terms to filter out unrelated Wikipedia pages (eliminating false positive links like Kota Factory or Singapore education).
- When Gemini is used, it additionally uses Google's **Search Grounding API** to pull live web results at inference time.
- Citations shown to the user are **real, entity-verified URLs**, or clean 1-click `🔍 Verify Web News` search verification links.

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

### 📄 Interactive Sandbox with Document Uploads
- Test text claims or upload documents (`.pdf`, `.doc`, `.docx`, `.txt`, `.md`, `.json`, `.csv`) directly from your device.
- Native `FileReader` extracts text instantly into the sandbox with file size and attachment metadata pill displays.
- Quick `X` button allows instant clearing of inputs and attached documents.
