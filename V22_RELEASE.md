# Accent Remix V2.2 — mobile reliability

## Source and status

Started from latest `main`, `427bc3f90dfc442cbebd19d6656f0752608497f6`, fetched on 2026-10-22. V2.1 is already published: [PR #1](https://github.com/timkok/accent-remix/pull/1), [successful Pages run](https://github.com/timkok/accent-remix/actions/runs/39840829710), [live game](https://timkok.github.io/accent-remix/).

V2.2 release branch: `feature/v22-mobile-reliability`. The [pull request list](https://github.com/timkok/accent-remix/pulls?q=is%3Apr+V2.2) and [Pages workflow runs](https://github.com/timkok/accent-remix/actions/workflows/deploy.yml) record the authoritative merge commit, checks and deployment status. Publication uses the existing GitHub Pages workflow after normal PR review and checks. No force-push or branch-protection bypass is used.

Historical preparation checkpoint: the connector initially lacked write permission and the local browser timed out. Authenticated browser access was restored on 2026-10-22; these were preparation issues, not a current statement that V2.1 was unpublished.

## Changes and reasons

- **Interrupted audio:** `playAudioSequence` keeps the current element/clip on a playback-policy rejection. A fixed, touch-accessible “Tap to continue audio” control resumes that clip. A 12-second no-progress watchdog offers the same recovery instead of leaving a silent queue. No completion evidence is emitted until every clip ends. Stop, mute, navigation, page hide, starting another example or recording invalidate pending callbacks and recovery controls.
- **Recording:** explicit supported-format detection prefers MP4 when available and otherwise uses supported WebM or the browser default. Added cancellation of pending permission, microphone disconnection cleanup and example-identity invalidation. Hidden sessions discard temporary recordings. Delayed permissions release tracks, empty captures earn no participation, and A/B playback still uses the shared sequence controller. No child audio is uploaded or serialized.
- **Progress and updates:** both stores are read before any write. A denied read cannot overwrite history with defaults. Retry controls recover readable history or failed writes. Legacy progress values are sanitized to prevent corrupt settings/recent entries from crashing the dashboard. Update activation first saves both stores and stays in the current game when saving fails. Activation is explicit with status/timeout handling.
- **Offline:** cache names include the full app scope. Activation removes only older caches in that namespace. Legacy unscoped caches are retained because their ownership cannot safely be assumed. Cached navigation, including query URLs, uses the installed release's HTML. Byte-range responses support cached media requests used by Safari. All 86 original audio hashes and licenses are unchanged.
- **Daily practice:** promotes the existing daily entry for returning players; retains the original English-first introduction. Shows current/next steps. A new player skips an unknown-word review round and discovers a word before its assisted challenge. Existing 3/5/8-minute self-paced goals and review heuristics remain.
- **Word Train:** existing save/rename/load/reorder/delete controls are retained. Adds an animal preset using existing recordings; displays word position and repeat round. Describes playback as independent words, not natural sentences. An incorrect ordering challenge can be replayed and corrected as practice, while the original first-answer evidence remains unchanged.
- **Maintenance:** Vitest upgraded from 3.2.7 to 5.0.5, Vite pinned at compatible 6.4.5; no runtime dependency or API added. PRs now run the existing build/test job; deployment remains restricted to main pushes/manual main runs. Historical V2.1 “not published” statements are clearly labeled and corrected at the top of their documents.

## Verification actually performed

- Original baseline: initial parallel run had 62 passes and 2 five-second test timeouts under CPU contention. Re-running the unchanged baseline with one worker passed **64/64 across 6 files**. A clean archive of the starting commit also built successfully, producing the original `index-DPJ0oQ7J.js`. This is a new run, not a copied historical claim.
- Final: **84/84 tests passed across 8 files, 0 failed, 0 skipped**, using Vitest 5.0.5. TypeScript and production build passed; all 86 audio files and 96 cached assets were packaged. See delivery `test-results.json` and `build.log` for exact results.
- Regression coverage includes blocked-second-clip recovery, a stalled-player watchdog, cancellation/late callbacks, answer gating through resume, MP4 selection, empty recording, hidden/disconnected microphone, pending permission cancellation, storage corruption/read denial/quota failure, preserving old settings/rewards/trains, save-before-update, order corrections without duplicate credit, 86 offline audio responses/checksums, ranges, failed installs and foreign-cache isolation.
- `npm audit --json`: **0 known vulnerabilities**, down from 3 (1 moderate, 2 critical) in test tooling. Vitest 5 removes tinypool and uses patched @vitest/mocker. The lockfile is updated without `npm audit fix --force`.
- Source review retained keyboard-operable native buttons, visible focus outlines, existing 44px touch targets and reduced-motion CSS. No new drag-only interaction.
- Browser checks of **this V2.2 build were not completed**: local preview was started, but the connected browser could not reach it and then timed out. The fallback browser verified only the public V2.1 repository and its current commit, not the new game.
- **Not verified:** rendered desktop/mobile V2.2 layout, real audio playback quality, actual offline restart/update in a browser, iPhone Safari and iPad Safari microphone permission/MP4/interruptions, physical touch and screen-reader behavior. Automated mocks do not replace those checks.

- The first PR build compiled successfully but an upstream audio connection reset interrupted packaging. Build downloads now retry transient network errors at most five times with bounded backoff; permanent HTTP failures and checksum mismatches still fail. Download recovery/exhaustion/permanent-error behavior is covered by an additional regression test. The full build and 84-test suite were rerun successfully after this change.

## Release verification

The release PR records the remote source commit and successful checks. The main-branch Pages run records the deployment commit and status. Browser and physical-device results must be reported separately from the automated suite above; pending device checks remain pending after deployment.

No old ZIP script was executed. No account system, backend, paid speech service, AI token, speech scoring, new audio source or unverified 一/不 drill was added.
