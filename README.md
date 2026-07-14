# ResumeIQ — AI Candidate Screener
### Built by Aruna Rajamani · aruna_ranga@hotmail.com

---

## What It Does

ResumeIQ is an AI-powered recruiting prototype that screens and ranks candidates against a job description in real time. Recruiters paste a job description and up to 5 resumes, and the system instantly scores each candidate, ranks them by fit, and surfaces the key reasons why - without a human reading a single resume first.

This is a working proof-of-concept, not a mock. It calls the Claude API live and returns real scored output every time.

---

## The Problem It Solves

Recruiting teams spend hours manually reading resumes before identifying which candidates are even worth a conversation. For high-volume roles, this creates a bottleneck that slows time-to-hire and introduces inconsistency - different recruiters weight different things, and fatigue affects judgment.

ResumeIQ moves the first-pass screening from human effort to AI, so recruiters can focus on what they do best: evaluating fit and selling the role to top candidates.

---

## How It Works

1. **Paste a job description** - the full posting, requirements and all
2. **Add up to 5 candidate resumes** - one per tab, plain text paste
3. **Click Screen Candidates** - Claude reads each resume against the JD
4. **Get ranked results** - every candidate scored 0–100 with:
   - Overall match score
   - Per-criterion breakdown (Experience, Technical Skills, Domain Knowledge, Leadership, Communication)
   - Top 3 profile tenets
   - Red flags (if any)
   - Interview recommendation (Yes / No)

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| AI Scoring | Anthropic Claude API (claude-sonnet-4-5) |
| API Proxy | Cloudflare Workers (handles CORS + API key security) |
| Hosting | Netlify |

The API key is stored as an encrypted secret in Cloudflare — it is never exposed in the frontend code.

---

## What the Production Version Would Add

This prototype demonstrates the core scoring logic. A full production implementation would include:

- **Google Drive integration** - resumes dropped into a folder trigger automatic screening (built in n8n)
- **Google Sheets output** - ranked results auto-written to a live spreadsheet
- **Gmail notifications** - top 5 candidates emailed to the recruiter after each batch
- **Per-role configuration** - different scoring criteria and weighting per job
- **ATS integration** - push ranked candidates directly into Greenhouse, Lever, or Workday
- **Batch processing** - screen 50+ resumes in a single run
- **Audit trail** - every scoring decision logged for compliance and bias review

The n8n workflow JSON for the production implementation is available on request.

---

## Design Decisions Worth Noting

**Why Claude for scoring?**
Claude returns structured JSON reliably and handles nuanced resume language well — it understands that "led a team of 12" and "managed cross-functional delivery" both signal leadership, even when the exact keyword isn't present. This prototype uses Claude's forced tool-use feature (`worker_final.js`) so every response is guaranteed to match the expected score schema.

**Why Cloudflare Workers for the proxy?**
Browser-based apps can't call the Anthropic API directly due to CORS restrictions. The Worker acts as a secure middleman - the API key lives in Cloudflare's encrypted secret store, never in the HTML.

**Why plain text paste instead of PDF upload?**
For a POC, text paste eliminates PDF parsing complexity and lets the demo run entirely in the browser with no backend infrastructure beyond the Worker.

**Why 5 candidates per run?**
A deliberate constraint for the prototype - keeps latency low and costs minimal. Each scoring call costs fractions of a cent; a 5-candidate run costs under $0.02.

---

## Repo Contents

| File | Purpose |
|---|---|
| `index.html` | The entire frontend — self-contained HTML/CSS/JS, no build step |
| `worker_final.js` | Cloudflare Worker source — proxies scoring requests to the Anthropic API |
| `README.md` | This file |

---

## How to Run It Locally

1. Clone this repo
2. Open `index.html` in any browser
3. The app calls `https://resumeiq-proxy.aruna-ranga.workers.dev` - no local setup needed

To deploy your own version:
1. Deploy the Cloudflare Worker (`worker_final.js`) with your own Anthropic API key as an environment secret named `ANTHROPIC_KEY`
2. Update the `WORKER_URL` constant near the top of the `<script>` block in `index.html` to point at your own Worker
3. Drag `index.html` to [Netlify Drop](https://app.netlify.com/drop)

---

## Live Demo

🔗 [superb-khapse-20b8f2.netlify.app](https://superb-khapse-20b8f2.netlify.app)
