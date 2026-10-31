# SahiMauka — Play Store Listing (copy-paste values)

Everything below is written to be pasted directly into Play Console. Character
counts are noted and verified against the Play Console limits. All claims are
honest and traceable to the app itself and to `docs/privacy.html` — no
invented metrics, no invented sources.

---

## 1. App title — limit 30 characters

```
SahiMauka: Opportunities
```

**24 characters.** ("SahiMauka: Verified Opportunities" is 33 — over the limit;
rejected. Alternate if "Opportunities" ever needs to change:
`SahiMauka – Verified Mauka`, 25 chars.)

## 2. Short description — limit 80 characters

```
Verified opportunities for students: scholarships, hackathons, exams, schemes.
```

**78 characters.**

## 3. Full description — limit 4000 characters

```
SahiMauka shows students verified opportunities — scholarships, hackathons, exams and government schemes — with every item linked to its official source. Sahi mauka, sahi samay: the right opportunity, at the right time.

WHAT MAKES IT DIFFERENT

• Verified sources only. Every listing comes straight from official channels: the Devpost API and the Press Information Bureau (PIB), Government of India. Each item links to its original official page — the app opens the source, never a copy.

• No scams. Listings that match pay-to-apply and other scam patterns are filtered out and never rendered in the feed.

• Never miss a deadline. Track the categories you care about and get deadline reminders on your phone.

• No filler. If a source is down, it contributes nothing that run — the feed shows only what was actually published by the official sources. No demo data, ever.

CATEGORIES

• Hackathons (Devpost)
• Government schemes and announcements (PIB, Government of India)
• Scholarships and exams, as published by the connected official sources

PRIVACY FIRST

• No sign-up, no account, no login.
• No analytics SDK, no advertising SDK.
• Nothing about you leaves your device. Tracked categories and reminders are stored only on your phone (app-local storage) so notifications can fire — delete the app and that data is gone.
• The only network activity: downloading the public feed JSON (no identifiers sent) and opening official opportunity links in your browser.

FREE, FOREVER

The full verified feed, deadline countdowns and reminders are free. SahiMauka contains no ads.

WHO IT'S FOR

Students in India looking for scholarships, hackathons, competitive exams and government welfare or education schemes — and anyone tired of scam "opportunity" boards and dead links.

HONESTY NOTE

SahiMauka is a discovery and reminder tool. We link to official sources; always read the official page before applying. Eligibility rules, deadlines and decisions belong to the issuing organisation.
```

**≈1,940 characters** — comfortably under the 4,000 limit.

## 4. Category & tags

| Field | Value |
|---|---|
| App category | **Education** |
| Tags (Play Console tag picker) | Education · Careers · Student life · Productivity |

(Play Console offers a fixed tag list — pick the closest matches in this order; "Education" is the primary category, the rest are secondary tags where available.)

## 5. Contact details (Store listing → App contact)

| Field | Value |
|---|---|
| Privacy policy | `https://deveshtiwari1025-debug.github.io/sahimauka/privacy.html` (see `store/PRIVACY_URL.txt`) |
| Website | `https://deveshtiwari1025-debug.github.io/sahimauka/` |
| Email | use the developer Google account's contact email (required by Play Console) |
| Phone | not required (optional field — leave empty) |

## 6. Graphic assets

| Asset | File | Requirement |
|---|---|---|
| App icon (512×512 PNG) | `brand/assets/play-icon-512.png` | full-square opaque; Play applies its own rounded mask |
| Feature graphic (1024×500 PNG) | `brand/assets/feature-graphic-1024x500.png` | exactly 1024×500 |
| Phone screenshots | **capture manually** (not generated) — min 2, from the running app: home/feed, item detail with official-source link, reminder/tour screen; 9:16 portrait, 320–3840 px | required before publishing |

## 7. Content rating questionnaire (IARC) — answers

Questionnaire lives at Play Console → Policy → App content → Content rating.
Answer as follows (outcome expected: **Everyone / PEGI 3 / USK 0**):

| Question | Answer |
|---|---|
| Do you want to request a rating for a specific country? | No |
| What is the name of your app? | SahiMauka (pre-filled) |
| What category best describes your app? | Education / Reference |
| Does your app contain or display user-generated content (posts, chat, uploads)? | **No** — the feed is read-only and curated; users cannot post, comment or upload anything |
| Do users share content with each other? | No |
| Can users interact with unknown people through the app? | No |
| Does your app contain violence (cartoon, realistic, fantasy)? | **No** |
| Does your app reference or depict illegal drugs, alcohol or tobacco? | No |
| Does your app contain sexual content or nudity? | No |
| Does your app contain offensive language or crude humour? | No |
| Does your app contain gambling (real or simulated), contests, or wagering? | **No** — nothing of the sort; the app is a free information feed |
| Does your app allow users to purchase digital content or goods? | No (v1 is fully free; if SahiMauka Plus ships later via Play Billing, update this answer and the questionnaire) |
| Does your app collect, share or require personal/financial information? | No |
| Does your app share a user's data location or browsing history with third parties? | No |
| Does your app contain ads? | **No** |
| Does the app contain religious content? | No |
| Miscellaneous sensitive topics as asked | No (the feed contains official opportunity announcements only) |

## 8. Data safety form (Play Console → App content → Data safety)

Source of truth: `docs/privacy.html` ("This app collects and transmits NO
personal data to any server"). The honest answers:

**Q: Does your app collect or share any of the required user data types?**
→ **No**

Reasoning (for your own records, not a form field): Play's definition of
"collect" is data transmitted off the user's device. SahiMauka:

- has no accounts, no sign-up, no analytics SDK, no ads SDK;
- stores tracked categories and reminder schedules **only in app-local
  storage** so local notifications can fire — nothing is transmitted;
- its only network activity is downloading the public feed JSON from
  `deveshtiwari1025-debug.github.io` (no identifiers sent) and opening
  official links in the browser.

Because the answer is **No**:

- Play does not ask per-data-type questions (location, contacts, etc. —
  answer nothing; there is nothing to declare).
- The "data encrypted in transit" question never appears — it applies only
  when data types are declared. **Nothing is transmitted, so encryption in
  transit is N/A** — do not claim encryption you cannot assert.
- "Data deletion mechanism": no server-side data exists; app-local data
  (tracked categories/reminders) is removed when the user uninstalls the app.
  If the form demands a deletion-URL answer anyway, the privacy policy page
  documents this: `https://deveshtiwari1025-debug.github.io/sahimauka/privacy.html`.

Other App-content sections (for completeness):

| Section | Answer |
|---|---|
| Ads | **No, my app does not contain ads** |
| Data safety summary shown to users | "No data collected, no data shared" (auto-derived from the No answer) |
| Privacy policy URL | `https://deveshtiwari1025-debug.github.io/sahimauka/privacy.html` |

## 9. Target audience & content

| Field | Answer |
|---|---|
| Target age groups | **13–15, 16–17, 18 and over** (i.e. 13+; do **not** select under-13 groups) |
| Is your app designed for or directed at children? | **No** (it collects no personal data from anyone, per the privacy policy, but it is not a children's app) |
| Appeal to children aside from selected groups | No |
| News app declaration | No |
| COVID-19 apps declaration | No |
| Government apps declaration | No (it links to PIB, Govt. of India, but is not an official government app — say so if asked) |
| Financial features declaration | No |
| Health apps declaration | No |

## 10. Release

| Field | Value |
|---|---|
| Countries/regions | India first (add more later) |
| Release track | Production (or Closed testing first if the account is brand new — see RELEASE_CHECKLIST.md) |
| What's new (release notes) | `Initial release. Verified opportunities from official sources (Devpost, PIB Govt. of India), deadline reminders, no accounts, no data collection.` |
| Type | App (not Game) |
| Free or paid | **Free** |
| Contains ads | No |
| Price | ₹0 (no in-app purchases in v1) |
