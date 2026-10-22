# Accent Remix V2.1: audit and selective benchmark

Inspected 2026-10-22. Public official descriptions were read; paid lessons, proprietary code and assets were not accessed or copied. Marketing claims are not evidence of learning effectiveness.

| Feature | Existing main / reviewed local V2.1 | Public reference | Implemented improvement | Priority |
|---|---|---|---|---|
| Listening | Mixed final quiz; reviewed V2.1 whole-word quiz | [ToneDeck](https://tonedeck.app/) short ear check and drills | Dedicated Which Tone; balanced eight-item check, rotating syllables; no timer pressure | P0 |
| Same-syllable contrasts | Whole-word same/different only | [Dong Chinese](https://www.dong-chinese.com/learn/sounds/pinyin/toneTrainer) selectable tones and pairs | Sound Twins uses identical consonant/vowel; choose at least two tones | P0 |
| Connected tones | Whole-word recordings and explanatory notes | [Panda Tone Toss](https://www.saymei.app/games/tone-pop) separates listening from recall and spoken from written patterns | Thirteen curated pair examples; beginner/advanced toggle, 3–3 versus 2–3, half-third and light endings | P0 |
| Voice comparison | Temporary record/replay; reviewed V2.1 shared A/B player | [Cantone](https://apps.apple.com/us/app/cantone/id1602297692) perception/production and contours | Retain Listen–Record–Compare–Repeat and scoped cleanup; defer unvalidated pitch estimation | P0 |
| Word trains | Six-word ordered playback, speed/repeat/echo; reviewed saved lists | Own existing interaction, coherent bite-size activity principle | Preserve playback; add explicit 2–6 distinct-word reconstruction, rename, reload, reorder and confirmed delete | P0 |
| Sound exploration | Ten syllables, 38 recordings; 48 words | [Chinese Boost](https://www.chineseboost.com/tools/pinyin-chart/) searchable syllables, tone comparison, characters | Retain existing exploration; add child-sized contrast lab and parent natural-speech notes; no duplicate chart/audio downloads | P1 |
| Daily flow | Reviewed warm-up, word review, discovery, finale | [HelloChinese](https://www.hellochinese.cc/) bite-size progression and review | Insert targeted tone listening, keep self-paced short sequence and Echo | P1 |
| Learning evidence | Original mixed totals; reviewed separate skills | ToneDeck targets confusions and separates listening/speaking | Separate tone pairs and contrasts; due-question scheduling, distinct-day word recognition, recent history; active-interaction estimate | P1 |

## Decisions and limitations

- Reuse all 86 licensed MP3s byte-for-byte. No new voice, competitor content, API, dependency, backend, analytics or child audio upload.
- Keep original five missions and legacy points/badges. Prior mixed score and open-page seconds remain in their original store; new evidence is distinct.
- Short check rotates available syllables and balances tones. It is not held-out validation: recordings can be encountered elsewhere. Do not claim effectiveness from it.
- Pair metadata describes standard connected-speech categories, not measured F0. The advanced 3–3 words ask for 2–3, never penalize a rising first syllable for not matching spelling. Neutral tone is labeled light, not a fixed flat contour.
- [AllSet Learning tone-change rules](https://resources.allsetlearning.com/chinese/pronunciation/Tone_change_rules) inform terminology. Detailed acoustic expert review remains outstanding. 一/不 contextual drills are deferred because this release lacks an audited contextual audio set.
- Original art, lightweight CSS mystery-sound reveal and Echo retained. No imitation of competitor characters, slingshot, 3D layouts, speech grading or pressure-based streak mechanics.
- Existing Sound Lab and voice comparison were retained rather than rebuilt. Optional experimental ZIP was inspected as text; its apply.py was never executed.
