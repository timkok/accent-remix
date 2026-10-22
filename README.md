# Accent Remix — The Secret Pinyin Adventure

A working React + TypeScript + Vite + Tailwind game for an English-speaking child aged 9–10. All runtime features run in the browser. No accounts, paid APIs, tokens, backend, analytics, or speech-recognition services.

## Play

Start with familiar English words and invent a character voice. Follow five missions:

1. **English Voice Remix:** LIMIT, LULU, MIMI, LALA, PAPA, MAMA; rising first sound, falling second sound; slow, fast, superhero, robot and movie-character prompts.
2. **Voice Detective:** eight electronic pitch clues, replay, gentle retries and streaks.
3. **Secret Pinyin:** discover tones 2 and 4 first, then 1 and 3. No Pinyin drill on the opening screen.
4. **Pinyin Sound Lab:** explore ten syllables, compare contours, record and replay, and reveal selected word meanings.
5. **Tone Master:** 5/8/10-question rounds from 136 curated question entries across six question types. Earn a badge at 60% accuracy. Recently seen questions are deprioritized; older missed questions return (up to two per round). This is lightweight spaced review, not a calendar-based SRS algorithm.

Bonus: draw four pitch contours with pointer/touch events. The score measures drawing similarity, never speech quality. Parent Base shows practice time, first-attempt accuracy, per-tone progress, recent events and badges, and supports difficulty/sound/microphone settings and confirmed reset.

## Run locally

Requires Node 22 (Node 20.19+ also supports the current tools).

```sh
npm ci
npm test
npm run dev
```

Build and preview the offline-enabled production app:

```sh
npm run build
npm run preview
```

Use localhost or HTTPS for microphone and service-worker access. Do not double-click `dist/index.html`: browsers restrict module scripts, recording, and service workers on `file://` URLs.

## GitHub Pages — free static hosting

The complete deployment workflow is `.github/workflows/deploy.yml`.

1. Create a public GitHub repository and push the project to `main`.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Run the “Build and deploy Accent Remix” workflow, or push to `main`.
4. Open the URL shown by the deployment job.

The workflow installs dependencies, runs tests, builds and uploads `dist`, then deploys via GitHub Pages. Vite uses relative asset paths so repository subpaths work. No secrets are needed. For manual static hosting, upload the contents of `dist/` to any HTTPS static server.

Official publishing instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Important audio status — read before teaching

**38 human Mandarin recordings are included in the deployed game.** They come from [Chinese-Lessons.com’s Mandarin Sounds download](https://chinese-lessons.com/download.htm), credited to Chinese-Lessons.com and its volunteer voice contributors, under [CC BY-NC-ND 3.0 US](https://creativecommons.org/licenses/by-nc-nd/3.0/us/). This is a free, noncommercial educational game. The selected original MP3 files are redistributed byte-for-byte; no edited recordings are distributed. Individual speaker names are not provided by the source. These are human recordings, not synthetic speech; they have not received a separate expert phonetic review for this project.

The first mission’s two sound cards and recording example now play real syllables (for LIMIT: lí + mì). Secret Pinyin, Sound Lab, and listening questions use the same recordings. Slow playback requests pitch preservation. English narration still uses an installed local device voice. The electronic mystery trails in Voice Detective remain ear-training effects, explicitly labeled as such.

`limit → LI + MI` is a playful memory bridge, not an English phonetic transcription. Character modes are performance prompts for the child; they do not change the Mandarin recordings into accents. Indian English is not imitated or treated as a Mandarin-tone formula.

The sound set covers all four tones for ma, mi, li, lu, la, ba, da and tu, plus pa1/pa2/pa4 and na2/na3/na4. pǎ and nā remain visual practice. lī and lá are less common readings, with no invented everyday vocabulary example. All listening-quiz combinations have recordings.

### Audio packaging and credits

- `public/mandarin-audio.json` lists source, license, acknowledgements, original archive checksum and every MP3 checksum. Parent Base links to the source, license and full manifest.
- Building requires Python 3 and an internet connection on the first build. `scripts/build-sw.mjs` downloads the original licensed archive into a temporary build cache, verifies checksums, and extracts only the 38 selected files into `dist/audio/mandarin/` before generating the offline cache. Changed or missing source files fail the build.
- Once deployed, playback is served entirely from this game’s own host. The child’s browser never contacts the source site to play a clip. All recordings are cached for offline play with the app.
- To replace a recording, use a source that permits redistribution, update its attribution and checksum, and verify the filename, syllable and tone. Do not upload a child’s recordings.

## Privacy and storage

- No microphone permission is requested on load. Recording begins only after the user presses Start recording and grants permission.
- Clips remain as in-memory blobs, never uploaded, never persisted. Recording stops after 15 seconds or when the page becomes hidden. Leaving an activity, deleting the clip or closing the session releases the recording and microphone tracks.
- The host responds to buttons and scores, not speech. No speech recognition, pronunciation scoring or open-ended AI conversation is claimed.
- LocalStorage stores points, completed missions, practice time, per-tone statistics, review IDs, settings and short progress messages. It stores no audio. Parent reset removes this local progress.
- Browser storage can be cleared by device settings and may be unavailable in restricted/private browsing. A visible warning appears if saving fails.

## Offline / PWA

The build generates a content-hashed service-worker cache containing the app shell and all bundled assets. Open the production HTTPS site online once and wait for Parent Base to report that assets are cached. Then install using the browser menu (iOS/iPadOS: Share → Add to Home Screen). Reopen offline.

Visual games, electronic pitch guides, scoring, saved progress and local recording need no internet once cached. Recorded Mandarin examples are cached with the app; only English host narration requires a preinstalled local device voice. Installation and microphone behavior vary by OS/browser. The service worker is enabled only in production. New versions activate after the prior app tabs close; close/reopen to update.

## Tests and verification

`npm test` covers question validity, all 40 tone marks, unique round length, recent-question avoidance, missed-question review, streak scoring, progress migration/save failures, drawing geometry, the English-first unlocking flow, no duplicate first-attempt credit, parent settings, a complete final quiz without a Mandarin voice, and microphone-denial behavior.

See `VERIFICATION.md` for actual verification results and remaining device checks. Synthetic test environments cannot verify acoustic quality or replace real iPhone/iPad recording and touch checks.

## Files

- `src/App.tsx`: missions, quiz, map, parent dashboard
- `src/components.tsx`: host, contours, recorder and drawing game
- `src/data.ts`: question content and round selection
- `src/audio.ts`: local speech, audio manifest, Web Audio pitch guides
- `src/engine.ts`: storage, scoring, drawing matching
- `scripts/build-sw.mjs`: offline cache generation
- `public/`: install metadata, icon and Mandarin audio license manifest
- `tests/`: unit, UI and offline-worker tests
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy
