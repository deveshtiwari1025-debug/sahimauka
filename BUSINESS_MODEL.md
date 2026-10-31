# SahiMauka — Brand & Business Model (v1, 2026-10-31)

**SahiMauka** ("सही मौका" — *the right opportunity*). Tagline: **"Sahi mauka, sahi samay"**
(*the right opportunity, at the right time*).

Name rationale (checked 2026-10-31): Q-Trust (previous name) is generic; Mauka is crowded
([existing education project](https://solve.mit.edu/challenges/2024-global-learning-challenge/solutions/91896),
Hawaiian usage); Avsar is a Haryana govt education app; Oppora is an existing student-opportunity
startup; Oppwise is a decision-software brand. **SahiMauka** is a distinctive compound that encodes
both differentiators: *sahi* (verified/real — anti-scam trust) + *mauka* (opportunity). Package:
`app.sahimauka.android`. Renaming later is cheap: the brand lives in this file and `app/src/constants`.

## Market evidence (2026-10-31 sweep)

- No dominant platform combines internships + scholarships + hackathons **with proactive deadline
  reminders** — Unstop leads competitions/hiring, Internshala leads internships, Buddy4Study/NSP lead
  scholarships; each leaves the other two thirds thin.
- Students' documented pains: **scam listings** (pay-to-apply "internships"), scattered discovery,
  missed fixed deadlines (e.g., AICTE Swanath, Tata Realty 2026-27 — 31 Oct).
- 62% of organizations expect *vendors* to handle change; in the student world the analogous buyer is
  the *college* — see B2B2C below.

## Business model: verified-opportunity freemium + B2B2C

| Tier | Price | What students get |
|---|---|---|
| **Free, forever** | ₹0 | Full verified feed, deadline countdowns, reminders for 3 tracked categories, tour + how-it-works |
| **SahiMauka Plus** | ₹49/mo, ₹299/yr (student pricing) | Unlimited trackers, personalised matching by course/skills, new-posting alerts within minutes of ingestion, deadline packs (essay/LOR checklists) |
| **Verified Posting (B2B2C)** | ₹499/post; college plans from ₹25k/yr | Universities, employers, NGOs pay to post with a **verification badge** — each posting carries source attestation (who verified, when, source URL). Anti-scam positioning vs free-for-all boards |
| **College dashboards** (later) | ₹1–5 L/yr | Colleges push their own opportunities to their students; anonymised demand analytics (what students chase) — privacy-first, opt-in |

**Why this wins:** verification attacks the #1 trust pain (scam listings); deadline-engineering
attacks the #1 loss pain (missed dates). The ingestion pipeline in `ingest/` IS the verification
moat — every item carries its source URL and verification block, and the app shows the evidence.

## Honesty rules (binding)

1. The feed contains **only** items parsed from the listed official sources this run. A failing
   source contributes nothing (manifest shows last status) — never filler, never demo data.
2. Every item links to its official source; the app opens that URL, not a copy.
3. Flagged items (pay-to-apply patterns) never render in the feed.
4. Any metric claimed publicly must trace to `site/feed/index.json` or the store listing metadata.
