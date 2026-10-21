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

**Verified native Mandarin recordings are NOT included.** The native recording manifest is intentionally empty. Mandarin playback uses a clearly labeled, temporary **local browser Mandarin TTS** fallback when installed. TTS output is synthetic; its pronunciation, tone realization and third-tone context have not been reviewed by a native speaker. A parent/teacher should check it before treating it as a pronunciation model.

Only voices with `localService === true` are selected, avoiding remote speech services. No English voice is used to pronounce Mandarin. If a suitable Mandarin voice is missing, all visual games remain playable and listening questions offer visual clues. On devices with no local English voice, Echo's prompts remain visible as text.

The electronic pitch trails are ear-training sound effects, not speech recordings. Changing character mode changes the performance prompt/visual styling and pitch-guide speed or timbre; it does not synthesize accented English. The child performs the voice remix.

`limit → LI + MI` is explicitly labeled as a playful memory bridge, not the word's phonetic transcription. Indian English is not imitated or treated as a tone formula. Rare combinations (`lá`, `pǎ`, `nā`) and the isolated ambiguous `lī` have no TTS cue; they remain tone-mark/shape explorations without invented everyday meanings. Other character cues may be polyphonic, so TTS is not “verified native audio.”

Full third-tone dipping is introduced as an isolated form. The secret lesson also explains that third tones often stay low in connected speech and rise before another third tone.

## Replace temporary TTS with verified native recordings

1. Obtain or record each syllable with a fluent Mandarin speaker; ensure permission/license for redistribution and teaching. No child recordings should be uploaded.
2. A Mandarin teacher should review the file against its intended syllable, tone and natural isolated pronunciation.
3. Store reviewed clips in `public/audio/mandarin/`, e.g. `ma1.mp3`. Keep similar loudness, trim silence and avoid adding pitch transformations.
4. Add entries in `src/audio.ts` → `audioManifest`:

```ts
ma1: {
  file: 'audio/mandarin/ma1.mp3',
  source: 'Recording session date / original licensed source URL',
  license: 'Actual redistribution permission or license',
  speaker: 'Consenting adult speaker identifier'
}
```

5. Rebuild. The service-worker build includes every file in `dist`, so bundled recordings are cached. Playback selects a manifest recording before TTS; slow playback requests pitch preservation.
6. Test each clip on target iPhone/iPad and desktop browsers. Never mark synthetic or unreviewed clips as verified.

Source guidance on device-local voices: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService

## Privacy and storage

- No microphone permission is requested on load. Recording begins only after the user presses Start recording and grants permission.
- Clips remain as in-memory blobs, never uploaded, never persisted. Recording stops after 15 seconds or when the page becomes hidden. Leaving an activity, deleting the clip or closing the session releases the recording and microphone tracks.
- The host responds to buttons and scores, not speech. No speech recognition, pronunciation scoring or open-ended AI conversation is claimed.
- LocalStorage stores points, completed missions, practice time, per-tone statistics, review IDs, settings and short progress messages. It stores no audio. Parent reset removes this local progress.
- Browser storage can be cleared by device settings and may be unavailable in restricted/private browsing. A visible warning appears if saving fails.

## Offline / PWA

The build generates a content-hashed service-worker cache containing the app shell and all bundled assets. Open the production HTTPS site online once and wait for Parent Base to report that assets are cached. Then install using the browser menu (iOS/iPadOS: Share → Add to Home Screen). Reopen offline.

Visual games, electronic pitch guides, scoring, saved progress and local recording need no internet once cached. Speech requires a preinstalled local device voice. Installation and microphone behavior vary by OS/browser. The service worker is enabled only in production. New versions activate after the prior app tabs close; close/reopen to update.

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
- `public/`: install metadata, icon and future reviewed recordings
- `tests/`: unit, UI and offline-worker tests
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy
