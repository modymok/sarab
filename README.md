# Sarab

POC: real-estate explorers driven by pre-rendered video. Idle loops plus zoom transitions, glass UI on top,
English only for now (every string is still stored in Arabic and English; the toggle is switched off until ayntwin.com is bilingual). All demo content is fabricated.

Live: https://sarab-xi.vercel.app (home lists the projects; deployed with `npx vercel deploy --prod`)

| Path | Project | Views |
|---|---|---|
| `/sarab` | Al Ufuq Villas / فلل الأفق | main → building → unit A-12 floor (360° kitchen, family, living rooms); main → mosque |
| `/fayrouz` | Fayrouz Bay / خليج فيروز | main → bridge, residences, marina (info pins in each) |

## Run

```bash
pnpm install
pnpm dev          # http://localhost:5173
SARAB_BASE=/demos/ pnpm build   # build for a URL prefix (ayntwin.com/demos/)
```

`/<id>?edit` turns on edit mode: click the video and it prints hotspot coordinates for that project's `scenes.json`.

## Add or change a project

1. Put the raw renders in a folder outside the repo and list them in `scripts/clips/<id>.txt` (`web-name:source`).
2. `pnpm encode <id> /path/to/raw` writes web clips and posters to `public/projects/<id>/videos/`.
3. Write `public/projects/<id>/scenes.json` (views, hotspots, transitions) and `content.json` (copy and data).
4. Add the project to `public/projects/index.json` so the home page lists it.

See [docs/PLAN.md](docs/PLAN.md) for how the reference works, the stack, render feedback and the roadmap.
