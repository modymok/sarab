# Sarab — agent notes

Video-driven real-estate explorer POC. Read `docs/PLAN.md` first.

- No framework. `src/main.js` routes: `/` → `src/home.js` (project list), `/<id>` → `src/player.js` (the explorer). Plus `src/pano.js`, `src/style.css`, `index.html`. Keep it that way until the roadmap says otherwise.
- Projects: `public/projects/index.json` lists them (home copy + one entry per project). Each project is a folder `public/projects/<id>/` with `scenes.json` (view graph, hotspots, transitions, per-view `"panel": "closed"`), `content.json` (every user-facing string as `{ar, en}` + fabricated demo data), `videos/`, `panos/`. Adding a project = new folder + index entry + `scripts/clips/<id>.txt`; no code change.
- Paths are absolute (`/projects/...`, Vite `base: '/'`) because pages are served at `/<id>`; `vercel.json` rewrites non-asset paths to `index.html`.
- Every string ships in both Arabic and English. The UI is English only for now (toggle switched off in `home.js`/`player.js` until ayntwin.com is bilingual; Arabic was the default and will return as `dir=rtl`). Use Latin digits in both languages, and wrap units/currency in `<bdi>`.
- Panel sits on the physical right and the title on the bottom-left. When a view's hotspots fall under the panel, set `"panel": "closed"` on that view (it folds into a Details pill); an opened info pin shows its note in its own tag.
- Clips: never commit raw renders. `scripts/encode.sh <id> <raw-dir>` with `scripts/clips/<id>.txt`; web-ready H.264 1080p sources are copied (faststart only), others transcoded with a bitrate cap.
- 360° rooms: `src/pano.js` (three.js, loaded by dynamic import only when a room opens). Enable by adding `"pano": "panos/<file>.jpg"` to a hotspot. Body attribute `data-room` = state; buttons use `data-open` (never reuse `data-room` on buttons, since `closest()` would match `<body>`).
- Hotspot coordinates: open `/<id>?edit` and click.
- Verify in a visible browser. Videos do not play in a hidden tab, and `nextFrame` is capped so the app doesn't hang there.
