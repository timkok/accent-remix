# Current pronunciation update verification

- 38 original Mandarin MP3 files selected from the licensed Chinese-Lessons.com archive. Original archive and individual file SHA-256 values are pinned in `public/mandarin-audio.json`.
- All 38 MP3 files decode with ffprobe and have durations between 0.3 and 3 seconds; total 560,300 bytes. This checks playable files, not expert phonetic accuracy.
- Production build includes all 38 recordings and 47 cached assets. Offline-worker test checks every clip is served during simulated network failure and matches the original checksum.
- UI test confirms LIMIT uses li2/mi4, LULU uses lu2, slow playback requests pitch preservation, earlier clips stop, and mute stops/disables playback without a Mandarin device voice.
- Original English-first journey, first-attempt scoring, voice guidance and microphone privacy regression tests remain enabled.
- Physical iPhone/iPad sound, recording and touch behavior still require device checks. The source recordings have not undergone a separate expert pronunciation review for this project.

