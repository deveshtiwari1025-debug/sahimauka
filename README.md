# SahiMauka — सही मौका, सही समय

**Verified opportunities for students: scholarships, hackathons, exams, government schemes —
every item links to its official source. Never miss a deadline.**

- Live feed: https://deveshtiwari1025-debug.github.io/sahimauka/ (GitHub Pages, built from docs/)
- Feed API: `feed/index.json`, `feed/all.json`, `feed/{hackathons,scholarships,exams,schemes}.json`
- Business model: [BUSINESS_MODEL.md](BUSINESS_MODEL.md) — free forever + Plus + verified-posting B2B2C
- Honesty rules: real official sources only (Devpost API, PIB Govt. of India RSS); a failing source
  contributes nothing — no demo data, ever. Pay-to-apply scam flags never render.
- Android app: `app/` (Expo/React Native; package `app.sahimauka.android`)

## Update pipeline
`ingest/ingest.py` runs on a schedule, regenerates the feed, and pushes it — the app always
shows the live state of official sources.
