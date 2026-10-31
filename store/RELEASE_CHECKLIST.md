# SahiMauka — Play Console Release Checklist

Step-by-step runbook from zero to a published app. Package/application ID:
**`app.sahimauka.android`**. Work top to bottom; do not skip the keystore
backup step.

---

## 0. Prerequisites

- [ ] Node.js 18+ and npm installed; repo cloned at `C:\Users\Devesh tiwari\q-trust-projects\sahimauka`
- [ ] JDK 17 + Android Studio (for a local AAB build; only needed if not using EAS)
- [ ] App builds: `cd sahimauka-app && npm install && npx expo export --platform android` sanity-checks the JS bundle
- [ ] Brand assets generated (`python brand/make_assets.py`) and copied into `sahimauka-app/assets/images/`
- [ ] All listing copy ready: `store/PLAY_LISTING.md` (title, descriptions, form answers)

## 1. Create the developer account — one-time, $25

1. Go to <https://play.google.com/console> and sign in with the Google account you will keep long-term (the publisher identity is public in listing metadata).
2. Accept the Developer Distribution Agreement and pay the **US $25 one-time registration fee**.
3. Complete **identity verification**: government-issued ID + a short video/selfie check as prompted. Approval is usually minutes to a couple of days.
4. Set up a **developer profile** (developer name shown on the listing — use a consistent name, e.g. the name tied to the GitHub repo).
5. **New personal accounts (created after Nov 13 2023):** before production access for your *first* app, Play requires a closed test with **at least 12 testers opted-in for 14 consecutive days**. If your account is brand new, plan this in — run the app as a Closed testing release (step 8) with 12+ Gmail testers while the rest of the checklist proceeds. Organisation accounts are exempt.

## 2. Prepare the Android project (once per machine)

1. Generate native folders (CNG — safe to re-run; do not hand-edit other files):

   ```bash
   cd sahimauka-app
   npx expo prebuild -p android
   ```

2. Confirm `android/app/build.gradle` has the right application ID:

   ```gradle
   defaultConfig {
       applicationId "app.sahimauka.android"
   }
   ```

   (If `expo prebuild` generated a different ID, fix `android.package` in
   `sahimauka-app/app.json` first, then re-run prebuild.)

## 3. Generate the upload keystore (local, one-time)

The **upload key** signs every AAB you submit. Play's **App Signing** holds a
separate release key managed by Google — you never handle that one.

Run (Git Bash; from the repo root):

```bash
mkdir -p keystores
keytool -genkeypair -v \
  -keystore keystores/sahimauka-upload.keystore \
  -alias sahimauka \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

(Windows CMD: replace the `\` line-continuations with `^`. If `keytool` is not
on PATH, it ships with the JDK — e.g. `"%JAVA_HOME%\bin\keytool"`.)

Prompts — fill in and **store the passwords in a password manager**:

| Prompt | Value |
|---|---|
| keystore password | choose a strong password (record it) |
| key password (can match) | choose + record |
| Common Name (CN) | SahiMauka |
| Organizational Unit | Mobile |
| Organization | SahiMauka |
| City / State / Country | your city / state / `IN` |

Validity 10000 days ≈ 27 years — Google requires the upload key to stay valid
past **Oct 2033**; 10000 days covers it comfortably.

**Where it lives + secret hygiene:**

- Keystore path: `C:\Users\Devesh tiwari\q-trust-projects\sahimauka\keystores\sahimauka-upload.keystore`
- **Never commit it.** Add to `.gitignore` (root):

  ```gitignore
  keystores/
  *.keystore
  *.jks
  ```

- Keep **two backups** (encrypted cloud storage / offline USB). A lost upload
  key means a Play Support key-reset (weeks, and only possible after the app is live).
- Record: keystore alias (`sahimauka`), keystore password, key password.

## 4. Wire the signing config into Gradle

File to edit (created by `expo prebuild`; re-check after every prebuild):
**`sahimauka-app/android/app/build.gradle`**

Keep the secrets out of the repo — put them in `android/gradle.properties`
(also git-ignored) or environment variables:

```properties
SAHIMAUKA_UPLOAD_STORE_FILE=../../keystores/sahimauka-upload.keystore
SAHIMAUKA_UPLOAD_STORE_PASSWORD=********
SAHIMAUKA_UPLOAD_KEY_ALIAS=sahimauka
SAHIMAUKA_UPLOAD_KEY_PASSWORD=********
```

Then in `android/app/build.gradle`, inside the `android { }` block:

```gradle
signingConfigs {
    release {
        storeFile file(SAHIMAUKA_UPLOAD_STORE_FILE)
        storePassword SAHIMAUKA_UPLOAD_STORE_PASSWORD
        keyAlias SAHIMAUKA_UPLOAD_KEY_ALIAS
        keyPassword SAHIMAUKA_UPLOAD_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release   // replace the default debug signingConfig
        minifyEnabled true
        shrinkResources true
    }
}
```

Alternative (no local Gradle surgery): let EAS manage credentials —
`npx eas credentials -p android`, upload the keystore, then build on EAS
(5b). The file-based path above is for fully local builds.

## 5. Build the AAB

**5a. Local build:**

```bash
cd sahimauka-app/android
./gradlew bundleRelease        # Windows: gradlew.bat bundleRelease
```

**AAB output path (upload this):**

```
sahimauka-app/android/app/build/outputs/bundle/release/app-release.aab
```

**5b. Or EAS build:**

```bash
cd sahimauka-app
npx eas build -p android --profile production
```

Download the `.aab` from the link EAS prints when the build finishes.

## 6. Create the app in Play Console

1. Play Console → **All apps → Create app**.
2. App name: `SahiMauka: Opportunities` · Default language: **English (India) — en-IN**
3. **App** (not game) · **Free** (not paid)
4. Declarations: accepts the Developer Program Policies, US export laws — tick both.
5. Create. You land in the dashboard; every checklist item below maps to a
   dashboard task.

## 7. Fill the store listing

Play Console → Grow → **Main store listing** — copy values verbatim from
`store/PLAY_LISTING.md`:

- [ ] App name (24/30 chars), short description (78/80), full description
- [ ] App icon: upload `brand/assets/play-icon-512.png`
- [ ] Feature graphic: upload `brand/assets/feature-graphic-1024x500.png`
- [ ] Phone screenshots: capture from the running app/emulator (need ≥ 2):
      feed view, item detail showing the official-source link, reminder screen
- [ ] Privacy policy URL (paste from `store/PRIVACY_URL.txt`):
      `https://deveshtiwari1025-debug.github.io/sahimauka/privacy.html`
- [ ] Contact email (the developer account's monitored inbox)

## 8. App content sections (Policy → App content)

Work each card; answers are in `store/PLAY_LISTING.md`:

- [ ] **Privacy policy** — the URL above
- [ ] **Ads** — "No, my app does not contain ads"
- [ ] **Content rating** — run the IARC questionnaire, answers in PLAY_LISTING §7 (expected outcome: Everyone / PEGI 3 / USK 0)
- [ ] **Target audience** — age groups **13–15, 16–17, 18+**; "designed for or directed at children": **No**; appeal-to-children: No
- [ ] **Data safety** — "Does your app collect or share any of the required user data types?" → **No** (nothing leaves the device; see PLAY_LISTING §8 for the exact reasoning and the encryption-in-transit N/A note)
- [ ] **Government apps** — No · **Financial features** — No · **Health** — No · **News** — No
- [ ] **App access** — "All functionality is available without restrictions" (no credentials needed; no demo data exists, per the honesty rules)
- [ ] Countries/regions: India first (Settings → Advanced → add later if wanted)

## 9. Release

1. Play Console → Release → **Production** (or **Closed testing** first if your
   account needs the 12-tester/14-day requirement from step 1.5).
2. Create new release → upload the AAB
   (`sahimauka-app/android/app/build/outputs/bundle/release/app-release.aab`).
3. Release notes ("What's new"):

   ```
   Initial release. Verified opportunities from official sources (Devpost, PIB Govt. of India), deadline reminders, no accounts, no data collection.
   ```

4. Review the pre-launch report after upload (Play runs it automatically — fix any crash/ANR it finds, or dismiss with a note).
5. **Review release → Start rollout to Production → Send for review.**

**Review timeline:** for a first app expect roughly **1–7 days** for the initial
review (Google's official guidance is "up to 7 days or longer"; new accounts
often take the full week, updates to a live app are usually 1–3 days). Status
shows under Publishing overview; approval flips the release to "In production".

## 10. After approval

- [ ] Open the Play Store link on a real device; install; verify: feed loads from the live GitHub Pages JSON, item taps open the **official** source, reminders fire, no account prompts.
- [ ] Confirm Play App Signing is active (Release → Setup → App signing) — the upload keystore stays only on your machine/backups.
- [ ] Monitoring: Android vitals for crashes/ANRs; answer reviews.
- [ ] Update cadence: bump `version` + `versionCode` in `sahimauka-app/app.json` → rebuild AAB → new Production release (updates review in ~1–3 days).
- [ ] When **SahiMauka Plus** (IAP) ships: add Play Billing, then update the content-rating answer for purchases, the Data safety form, and this checklist.

## Quick reference

| Thing | Value / path |
|---|---|
| Application ID | `app.sahimauka.android` |
| Keystore alias | `sahimauka` |
| Keystore validity | 10000 days |
| Keystore path | `keystores/sahimauka-upload.keystore` (repo root, git-ignored) |
| Signing config file | `sahimauka-app/android/app/build.gradle` (secrets in `android/gradle.properties`) |
| AAB output | `sahimauka-app/android/app/build/outputs/bundle/release/app-release.aab` |
| Store listing copy | `store/PLAY_LISTING.md` |
| Privacy policy | `https://deveshtiwari1025-debug.github.io/sahimauka/privacy.html` |
| Play icon / feature graphic | `brand/assets/play-icon-512.png` / `brand/assets/feature-graphic-1024x500.png` |
