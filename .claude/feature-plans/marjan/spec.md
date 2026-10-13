# Spec: Marjan Bay demo project (Amaala footage)
Date: 2026-10-13  ·  Branch: feat/marjan  ·  Status: shipped

## Problem & success criterion
Third demo for the Sarab explorer from 16 renders in ~/Downloads/Amaala. Done = /marjan opens the wide bay
loop, five pins (Hotel 1, Hotel 2, Left, Right, Marina) zoom in, back button zooms out, all strings ar+en,
home list shows the project, verified in a visible browser.

## Scope
Projects touched: public/projects/marjan, public/projects/index.json, scripts/clips/marjan.txt, scripts/encode.sh (poster rule), docs/PLAN.md  ·  Type: feature
In:  clip mapping + encode, scenes.json (hub + 5 spokes), content.json (bilingual fabricated demo data), index entry, PLAN.md inventory + render feedback
Out: panos (none delivered), code changes in src/, mobile encodes

## Data / Auth / Security surface
None. Static JSON + mp4.

## Tasks
- [x] scripts/clips/marjan.txt (16 lines)
- [x] encode.sh: poster for idle loops when source has no /Ideal/ folder (match name without "-to-")
- [x] run encode → public/projects/marjan/videos (1440p → 1080p transcode)
- [x] scenes.json: main + 5 views, pins on main, info pins per view, panel closed where needed
- [x] content.json: all strings {ar,en}, Latin digits, <bdi> units
- [x] index.json entry
- [x] docs/PLAN.md: clip inventory + PSNR findings
- [x] visible-browser verification, pin check via ?edit

## Risks & open decisions
Main→zoom-in seams 18–22 dB (Right 34): crossfade covers. Main loop 23 dB (boats). Pin positions are
estimated from frames, then checked by eye.
