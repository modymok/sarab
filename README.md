# Sarab

POC: a real-estate explorer driven by pre-rendered video. Idle loops plus zoom transitions, glass UI on top,
Arabic (default) and English. The demo content is fabricated.

```
main ──▶ building ──▶ floor (unit A-12, room hotspots)
  └────▶ mosque
```

## Run

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

`/?edit` turns on edit mode: click the video and it prints hotspot coordinates for `scenes.json`.

## Change footage

1. Put the raw renders in a folder outside the repo.
2. `pnpm encode /path/to/raw` writes web clips and posters to `public/videos/`.
3. Edit `public/config/scenes.json` (views, hotspots, transitions) and `content.json` (copy and data).

See [docs/PLAN.md](docs/PLAN.md) for how the reference works, the stack, render feedback and the roadmap.
