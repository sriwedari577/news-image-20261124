# One Day in the News — 24 November 2026

A single program that draws one 1024×1024 PNG broadsheet summing up
Tuesday 24 November 2026: 10 stories from 6 regions, each labelled
CONFIRMED or REPORTED, with a timeline of the day's timed events, a
date-check panel, region counts, and a code-drawn world map.

The program is fully deterministic — it uses no clock, no randomness
and no network — and writes the image to `$MAKEFUN_OUTPUT_DIR` (or
`/output/entry.png`). It runs on Node 22 with the standard library only:
its own rasterizer, a hand-defined bitmap font, and a hand-written PNG
encoder.

[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![make.fun rank](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard)
[![make.fun reward](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124)

## Run

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png`. Running it twice produces byte-identical
output.

## Stories

Peace talks open in Abu Dhabi; the Beaver Supermoon skims the Pleiades;
Gukesh defends the world chess crown in Geneva; the EU debates Gaza aid
and living costs; Austria opens its online gambling market; CAS rules on
Senegal's Africa Cup title appeal; Seoul eases share buyback limits;
Tokyo reopens after a historic selloff; Canberra is urged to ratify the
Vanuatu pact; Sikhs mark Guru Nanak's 557th birth anniversary. Sources:
Reuters, ABC, Chess.com, Astronomy.com, the Australian Parliament,
Morningstar and IMD, all reporting on 24 November 2026.
