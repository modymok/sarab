# Spec: Sarab POC
Date: 2026-10-02  ·  Branch: main  ·  Status: shipped (local)

## Problem & success criterion
Prove we can deliver a Vinode-style video explorer with our own stack. Done = main idle → building → unit floor plan, and main → mosque, with zoom transitions both ways, a glass UI, AR/EN, and running locally.

## Scope
In: 4 idle loops, 6 transitions, hotspots, bilingual fabricated data, glass UI, edit mode for coordinates.
Out: hosting, CMS, lead capture backend, three.js synced overlay, mobile portrait polish.

## Tasks
- [x] Analyse clips (continuity PSNR, hotspot positions)
- [x] Encode script (H.264 1080p, posters)
- [x] scenes.json + content.json
- [x] Player (crossfade transition → idle, chained navigation)
- [x] Glass UI, AR/EN, RTL
- [x] Playwright click-through
- [x] Docs + GitHub repo

## Risks & open decisions
- Transition/idle frame mismatch (floor worst, 13 dB). Crossfade hides it; real fix is re-rendering.
- Portrait mobile crops the left-side hotspots.
