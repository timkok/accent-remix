# Verification record

## User story

The child starts with English word remixes, advances through sound-direction clues and a gradual Mandarin-tone reveal, practices in the sound lab, completes a quiz, and keeps progress locally. No application backend exists.

## Automated checks

- TypeScript and Vite production build: passed.
- 136 unique question entries, all 40 Pinyin tone forms and available listening cues: passed.
- Round sizes, no duplicate questions, recent-question avoidance and delayed missed-question review: passed.
- Capped streak awards, attempt totals and local storage round-trip/corrupt-storage/quota handling: passed.
- All four drawn contours, short/reversed paths and rise/fall distinction: passed.
- React interaction tests: English-first home, first-mission completion, level unlocking and saved progress; first-attempt scoring; parent settings; completing a final quiz with no Mandarin voice: passed.
- Microphone request is deferred until explicit click; permission denial is handled and parental disable works: passed.
- Generated service worker tested with an in-memory Cache API and an unavailable network: precache contains actual build files; offline navigation returns cached index; unrelated caches are preserved: passed. This is a worker simulation, not a real disconnected-device test.

## Limitations requiring real-device review

- Native Mandarin recordings have not been sourced or reviewed. Browser TTS is explicitly temporary and synthetic.
- Acoustic output cannot be verified by the unit tests. Check installed voices with a fluent Mandarin speaker.
- iPhone/iPad touch and recording compatibility needs hardware testing. Pointer events and MIME-type selection are implemented, but are not a guarantee for every device/browser version.
- Internal cloud-browser preview was blocked when it attempted to inspect an error page. No workaround was used. Live production-browser checks are recorded below if completed.

## Live production checks (2026-10-21)

- GitHub Pages build, 22 tests, artifact upload and deploy jobs succeeded.
- Public URL opened in the connected desktop Chrome browser: https://timkok.github.io/accent-remix/
- Home rendered with English-first start button and animated host; no Mandarin lesson on the home screen.
- At 390 × 844 viewport, first-mission content, pitch guides, modes, host prompt and recording controls rendered without visible horizontal overflow. This is a responsive viewport check, not physical iPhone hardware verification.
- Completed three remix words, earned Voice Explorer and advanced to Voice Detective.
- Triggered pitch playback; no browser console warning/error was logged during the checked flow. Acoustic accuracy remains unverified.
- An incorrect detective answer showed a gentle cue; a correct retry advanced without duplicate first-attempt credit.
- Parent Base displayed one completed level and 150 points after reloading, confirming persistent progress in the live browser.
- Parent Base detected a local Mandarin voice and reported completed offline asset caching. Actual disconnected-device playback remains unverified.
- Mobile inspection found a missing accessible name on the icon-only parent button; added aria-label="Parent Base" and reran build/tests successfully.
