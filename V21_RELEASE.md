# Accent Remix V2.1 — published release history

V2.1 was published on 2026-10-22 through [PR #1](https://github.com/timkok/accent-remix/pull/1), merge `427bc3f90dfc442cbebd19d6656f0752608497f6`. [Pages build and deployment succeeded](https://github.com/timkok/accent-remix/actions/runs/39840829710). Its final 64-test suite passed. Connected Chrome checks covered update activation, listening gates, hint-assisted evidence, three-word playback and a 390px layout. Physical Safari recording was not verified.

The sections below preserve the earlier development history, including the initial blocked API attempt and intermediate 53-test result. Those were historical states, not the current publication status. See V22_RELEASE.md for subsequent work.

## Historical development log

### 1. Verified starting point

Repository: https://github.com/timkok/accent-remix

Base: `main` commit `3e4d878abc907167d9915d0d10057441d129a83b`. Latest main was fetched before work. Its GitHub Pages run `39700072061` reported successful build, tests and deployment. The public home page at https://timkok.github.io/accent-remix/ was inspected in connected Chrome and showed the English-first introduction and Word Train entry.

The actual source contained five missions, 136 question entries, 38 Mandarin syllable recordings, 48 complete-word recordings, a six-word train with slow/repeat/echo controls, local recording, tone drawing, Parent Base and an offline service worker. The baseline suite passed all 28 tests.

## 2. Optional patch review

The uploaded archive was read with Python's ZIP reader. Neither `apply.py` nor `verify_patch.py` was executed, and none of its replacement transforms were applied. No executable or dependency from the archive was installed.

Useful concepts retained: same-category distractors, bounded local named trains, word review intervals and keeping assisted answers separate. The actual implementation was rewritten against current main.

Issues addressed beyond the reference:

- Its recorder had a separate player outside global audio cancellation. Native and child playback now share the app controller; stopping/muting another activity cancels pending clips.
- UTC dates and repeated same-day successes could push reviews too far ahead. Review scheduling now uses local calendar dates and limits interval advancement to once a day.
- The old app mixed sound, visual and written-word questions when reporting accuracy and weak tones. New assessment evidence is separated by skill. Existing totals remain clearly labeled as legacy mixed game statistics.
- Visual hints, including a clue displayed while muted, remain latched as assistance even if sound is turned back on.
- Storage parsing validates allowed word IDs, event categories, counts, dates and duplicate saved-train IDs. A full saved-train list cannot silently evict a child's existing favorite.

## 3. Actual code changes

- `src/learning.ts`: versioned, bounded local evidence; migration from experimental V1 word statistics; named trains; locally dated review; discovery exposure; speaking participation; daily completion history. No child audio is serialized.
- `src/WordQuiz.tsx`: four-option audio-to-meaning/picture questions, same/different recordings, three-word ordering and choosing which of two recordings matches a meaning. Generic accessible labels do not expose the answer. Only completed playback enables an answer. First responses are recorded once; hints produce practice evidence; the native recording replays after feedback.
- `src/Recorder.tsx`: native/slow/child/combined playback through one controller, visible playback states, a 15-second recording limit, denied/late-permission handling, stream cleanup and Blob URL disposal. Used in the existing remix, lab and word train, as well as daily discovery.
- `src/WordTrain.tsx`: persistent draft, twelve named local favorites, explicit deletion confirmation, reloading and Challenge My Train. Existing six-word playback controls and original recordings remain.
- `src/DailyAdventure.tsx`: English remix warm-up, due/known-word review, a new daily discovery and final mini challenge. Newly taught material is practice, not independent listening evidence. The approximate 3/5/8-minute goal changes review length; timing is self-paced, not calibrated to every child.
- `src/LearningDashboard.tsx`: independent and assisted results by skill; tone sample thresholds; due words; exposure versus recognition; participation and daily session history.
- `src/App.tsx`: integration, original-mission evidence, meaningful TU-word reveal, backward-compatible progress, reset of both stores and a service-worker update action.
- `src/audio.ts`, `src/main.tsx`, `scripts/build-sw.mjs`: scoped sequence cancellation, safe Blob playback, prevention of a late AudioContext resume after cancellation and explicit waiting-worker activation.
- Responsive styles: 44px minimum button targets, wrapped train controls, separate mobile skill rows and reduced-motion support.

## 4. Educational changes

The opening is still English-first, with all five original missions available in their original sequence. No ethnic accent imitation was added. Whole words remain complete unedited human recordings; playlists are explicitly separate words, not naturally spoken sentences.

The application now distinguishes Mandarin tone listening, visual pitch patterns, Pinyin tone marks, whole-word meanings from audio, audio comparison/order, electronic pitch listening and written vocabulary. Microphone use measures participation only. Listening evidence requires audio availability, completed playback, a first choice and no revealed hint. Playback alone never counts as recognition.

Independent whole-word success schedules reviews after 1, 2, 4, 8 or 14 days. Missed and assisted words return sooner. Tone recommendations need at least 20 independent tone attempts and at least five samples per compared tone; smaller samples display “more examples needed.” These are modest learning heuristics, not validated diagnostic scores.

## 5. Tests added and changed

- Added 10 learning-engine tests: independent/assisted separation, skill separation, due ordering, same-day review protection, local dates, corrupt-data validation and V1 migration, safe favorite capacity, answer ambiguity, varied challenges and non-scored participation.
- Added 15 UI/lifecycle tests: answer secrecy including accessibility attributes, completion gating, first-choice-only records, hint/mute/failure behavior, a full mixed challenge, latched visual hints, train remount/load, old progress/reset, a complete daily session, original/child playback order, cancellation, Blob disposal, late and hidden-page permission results, recorder errors and 15-second timeout.
- Kept all 28 baseline tests. The final-quiz regression now explicitly requests the visual clue when it has not played audio, matching the corrected answer gate.
- Extended the existing offline test to verify explicit update activation in addition to checksums and simulated offline responses for all 86 recordings.

## 6. Actual build and test results

`npm run build && npm test` completed successfully on the final implementation:

- TypeScript build: pass.
- Vite production build: pass.
- Full suite: **53 tests passed, 5 files, 0 failed, 0 skipped**.
- All 86 original Mandarin audio checksums and offline responses: pass.
- Current HTML's hashed JS and CSS assets are both present in the generated worker cache.
- `git diff --check`: pass.

Build and test logs are included with the downloadable patch. No new npm dependency or runtime service was added. Existing source/license manifests are unchanged.

## 7. Browser and device validation

Completed: read-only inspection of the existing production home page in connected Chrome, before changes. It is the prior release, not the new branch.

Not completed: visual and real-media testing of this new build in Chrome or Safari. A local Vite preview server successfully started at `http://127.0.0.1:4173/`, but the connected browser navigation timed out; the follow-up browser diagnostic request also timed out. The preview server was stopped. Node/jsdom tests validate interaction and lifecycle logic, not physical audio quality or rendered mobile layout.

Before merging, verify the branch on an actual iPad/iPhone: autoplay continuation, MP4 recording, microphone permission denial/revocation, hide/resume, A/B playback, touch targets, keyboard/screen-reader flow and offline restart. Verify an existing install's waiting-service-worker update as well. No screenshot of the new UI is claimed.

## 8. Historical initial API publication attempt (resolved)

Local feature branch: `feature/listening-adventure-v21`. The included `release-manifest.json` gives the actual local commit and base SHA.

GitHub branch creation returned:

`GitHub API error 403: Resource not accessible by integration`

At that initial checkpoint there was no remote feature branch, PR, merge or V2.1 deployment. This was later resolved through the signed-in GitHub UI, as recorded at the top of this document. Following the requested fallback, the deliverable is a reviewable patch instead of direct production editing. No force-push, browser write fallback or workflow modification to bypass permissions was attempted.

At that checkpoint production still served the previous release; V2.1 subsequently shipped at the same URL.

## 9. Remaining work and limits

- Publication and desktop UI validation were subsequently completed. Physical-device recording validation remains outstanding.
- Cross-device backup/restore UI is not implemented. Named trains and progress live in one browser profile and can be lost if browser data is cleared.
- Daily duration is approximate, and no speech recognition or pronunciation grading is provided.
- Recorded speech and expert phonetic accuracy have not been independently assessed in this task. Existing audio credits and licenses remain required.
- No new voice acting, extensive collectible system or clinical language assessment was added.


## Follow-up implementation — 2026-10-22

Remote main re-fetched at 3e4d878abc907167d9915d0d10057441d129a83b. Added BENCHMARK.md; ToneLab.tsx; toneLearning.ts; tone-learning.test.ts. Updated App, DailyAdventure, WordQuiz, WordTrain, learning, LearningDashboard, styles and UI tests.

64/64 automated tests passed across six files; TypeScript and production build passed. Tests include written/spoken pair metadata, real-audio inventory, balanced/rotated check, same-syllable clips, due-pair scheduling, distinct-day recognition, hint latching, two-word reconstruction, rename/reorder/delete persistence and idle/hidden time exclusion. All earlier privacy and offline tests remain.

Browser UI successfully created feature/listening-adventure-v21 after the integration API previously returned 403. PR #1 was subsequently merged and deployed; the completed browser checks are recorded at the top of this document. No real iOS/Safari or microphone acoustic result is claimed.
