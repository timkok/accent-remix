# Current pronunciation update verification

- 38 original Mandarin MP3 files selected from the licensed Chinese-Lessons.com archive. Original archive and individual file SHA-256 values are pinned in `public/mandarin-audio.json`.
- All 38 MP3 files decode with ffprobe and have durations between 0.3 and 3 seconds; total 560,300 bytes. This checks playable files, not expert phonetic accuracy.
- Production build includes 38 syllable recordings and 48 whole-word recordings and 96 cached assets. Offline-worker test checks every clip is served during simulated network failure and matches the original checksum.
- UI test confirms LIMIT uses li2/mi4, LULU uses lu2, slow playback requests pitch preservation, earlier clips stop, and mute stops/disables playback without a Mandarin device voice.
- Original English-first journey, first-attempt scoring, voice guidance and microphone privacy regression tests remain enabled.
- Physical iPhone/iPad sound, recording and touch behavior still require device checks. The source recordings have not undergone a separate expert pronunciation review for this project.


## Word Train update

- All 48 complete word MP3s downloaded from the pinned audio-cmn revision, decoded with ffprobe and hashed. Total added audio: 511,297 bytes.
- UI tests verify both remix sounds play in order, mute cancels the pending second clip, searching/selecting a word loads its whole recording, repeated trains honor the echo gap, leaving the page stops playback, and media failure cannot advance the queue.
- Offline tests verify checksums and offline responses for all 86 Mandarin audio assets.
- Human recordings preserve their original pronunciation. This project has not performed an independent expert review of every recording; device acoustic quality still requires physical-device checking.


## V2.1 feature branch

The branch implementation and the optional uploaded patch are different. The patch's `apply.py` was not executed. See `V21_RELEASE.md` for the actual audit, 53-test verification, known device-validation limitations and blocked publication status.
