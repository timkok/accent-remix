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

Requires Node 22.12+ or Node 24, plus Python 3 for the verified audio build.

```sh
npm ci
npm run build
npm test
npm run preview
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

## Connected words and Word Train

The home page and map include **Build a word train**. It offers 48 complete word recordings in seven categories, including family, food, school, animals and sports. These retain the speaker’s within-word tone changes and light syllables; they are not assembled from isolated Mandarin syllables. Written Pinyin keeps dictionary tones. The player offers normal/slow playback, a train of up to six words, reordering/removal, 1–3 repetitions and an optional 2.2-second pause to echo each word. The train is a sequence of separate whole-word recordings, not a natural sentence recording. No automatic speech scoring is performed.

The English remix library now has 12 words/names. **Hear both sounds together** plays its rising and falling recordings in order. This remains a playful approximate memory bridge, not an English pronunciation or a natural Chinese word. Mute, Stop, changing page, starting a recording and hiding the tab cancel the queue and any pending next clip.

Whole-word audio: © 2009 Yue Tan, Shtooka Project / University of Caen; MP3 preparation by Hugo Lopez; technical support by Nicolas Vion. Source: https://github.com/hugolpz/audio-cmn, pinned revision `59dbafbda8b172ffc3b8b295cd5938ae1b3de803`. License: https://creativecommons.org/licenses/by-sa/3.0/us/ (CC BY-SA 3.0 US). The selected 64k MP3s are redistributed unchanged, retaining that license. `public/word-audio.json` includes per-file source URLs, hashes, credits and word metadata. The player links to this manifest. The build fetches these files, verifies their hashes and includes all 48 in the offline cache. It does not contact the source repository during playback.

## Privacy and storage

- No microphone permission is requested on load. Recording begins only after the user presses Start recording and grants permission.
- Clips remain as in-memory blobs, never uploaded, never persisted. Recording stops after 15 seconds or when the page becomes hidden. Leaving an activity, deleting the clip or closing the session releases the recording and microphone tracks.
- The host responds to buttons and scores, not speech. No speech recognition, pronunciation scoring or open-ended AI conversation is claimed.
- LocalStorage stores points, completed missions, practice time, per-tone statistics, review IDs, settings and short progress messages. It stores no audio. Parent reset removes this local progress.
- Browser storage can be cleared by device settings and may be unavailable in restricted/private browsing. A visible warning appears if saving fails.

## Offline / PWA

The build generates a content-hashed service-worker cache containing the app shell and all bundled assets. Open the production HTTPS site online once and wait for Parent Base to report that assets are cached. Then install using the browser menu (iOS/iPadOS: Share → Add to Home Screen). Reopen offline.

Visual games, electronic pitch guides, scoring, saved progress and local recording need no internet once cached. Recorded Mandarin examples are cached with the app; only English host narration requires a preinstalled local device voice. Installation and microphone behavior vary by OS/browser. The service worker is enabled only in production. A waiting update is offered explicitly. Finish your activity, then use Save progress & update; saving must succeed before activation. No automatic reload is requested during practice.

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


## V2.1 learning adventure (published)

The optional experimental patch was reviewed as reference, not executed. V2.1 shipped in [PR #1](https://github.com/timkok/accent-remix/pull/1), merge `427bc3f90dfc442cbebd19d6656f0752608497f6`. See `V21_RELEASE.md` for its historical audit and verification.

- **Listen & Guess:** genuine complete-word recordings, four meaning/picture answers, same/different pairs, ordering three words and matching a displayed meaning to one of two recordings. Audio completion unlocks answers; hints and first responses are recorded explicitly.
- **Voice Compare:** shared playback control for native examples, slow examples, the temporary child clip and original-then-child comparison. All clips are local Blob URLs; microphone tracks and Blob URLs are released after leaving/changing the sound. No speech grading.
- **Saved trains:** current six-word draft and up to twelve named trains are stored locally. Same-name saves update that train; a thirteenth cannot silently evict an existing train. Deletion asks for confirmation. Challenge My Train uses its selected words as targets.
- **Daily adventure:** English remix warm-up, prioritized due/known words, one new word and a short final challenge. Newly taught-word answers are labeled practice. Approximate 3/5/8-minute goals vary the review length; there is no timer requirement or missed-day penalty.
- **Evidence:** Mandarin tone listening, visual pitch, Pinyin marks, whole-word audio meanings, comparison/order, electronic pitch and written vocabulary have separate summaries. Speaking is participation only. Existing game points/badges remain in their original storage key. Old aggregate scores are not retrospectively reclassified as independent listening.
- **Review:** missed or assisted word meanings return immediately; independent success schedules 1, 2, 4, 8, then 14 days. Repeated success in one calendar day cannot inflate the interval. This is a simple heuristic, not a validated learning assessment.
- **Persistence:** `accent-remix-learning-v1` contains version 2 sanitized word IDs, train names, word review aggregates, up to 1,000 assessment events and 365 days of participation/session history. Experimental V1 word aggregates migrate without inventing events. The original progress key is preserved. No audio is serialized. Clearing browser data removes local learning history.
- **Updates:** a waiting service worker offers a Save progress & update button. Activation is explicit; no forced reload mid-recording. Older deployed clients need one close/reopen to receive this update UI.

Run `npm run build && npm test` before review and publication. The build still packages all 86 unchanged licensed Mandarin recordings. No dependency, paid API, backend, account, tracker or new audio source is added.


## Competitor-informed listening release

Echo’s Listening Detective adds focused single-tone listening, same-syllable Sound Twins, authentic whole-word Tone Pair Challenge and an eight-item balanced ear check. Advanced pairs distinguish written 3–3 from spoken 2–3, low third tones and neutral endings. Existing Word Train adds explicit 2–6 distinct-word reconstruction and stable saved-list rename. Daily Adventure now includes targeted tone practice.

Parent Base separates tone, tone-pair, contrast, vocabulary, visual, Pinyin and speaking-participation evidence. A word is counted as repeatedly recognized only after independent successes on different local days. Practice time is an interaction-window estimate, not idle page time. No recording analysis, paid API or new dependency was added. See BENCHMARK.md for the audit, sources and design decisions.


## V2.2 mobile reliability

See [V22_RELEASE.md](V22_RELEASE.md) for the starting commit, fixes, actual verification, device limits and publication tracking. This is an incremental update to the published V2.1 game.

- Blocked/stalled playlists offer **Tap to continue audio** at the current clip. Stop, mute, page hide and activity changes cancel queued audio. Word Train shows word position and repeat round; four presets use the existing licensed vocabulary.
- The recorder detects supported formats (including MP4), cancels delayed permission requests, releases disconnected/hidden microphone sessions and clears clips when the example changes. Recordings remain temporary and local; no speech scoring or uploads.
- Update activation first saves both progress stores. Storage failure keeps the game open; unreadable stored history is protected from overwrite and can be reloaded. Updates are never automatic during practice.
- The offline worker isolates caches by app scope, keeps navigation and assets on one release and serves audio byte ranges. Legacy unscoped caches are conservatively retained to avoid deleting another install's cache.
- Returning players get a prominent existing Daily Adventure button. New players keep the English introduction and meet a new word before the word challenge. Wrong train orders can be corrected as practice without changing the first-attempt record.
- Development requires Node 22.12+ (supported even-numbered versions) and Vite 6.4+. Vitest 5.0.5 replaces vulnerable test tooling. `npm test` uses one worker to avoid CPU-contention timeouts in constrained environments; run `npm run build` first so offline tests inspect the generated worker. Pull requests run build/tests before main deploys through Pages.
