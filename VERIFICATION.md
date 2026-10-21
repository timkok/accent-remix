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
