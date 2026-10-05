# Sarab — agent notes

Video-driven real-estate explorer POC. Read `docs/PLAN.md` first.

- No framework. `src/main.js` (player + UI), `src/style.css`, `index.html`. Keep it that way until the roadmap says otherwise.
- All behaviour is data: `public/config/scenes.json` = view graph, hotspots and transitions; `public/config/content.json` = every user-facing string as `{ar, en}` plus the fabricated demo data.
- Every string ships in both Arabic and English. Arabic is the default (`dir=rtl`). Use Latin digits in both languages, and wrap units/currency in `<bdi>`.
- Panel sits on the physical right and the title on the bottom-left, on purpose (this footage keeps its hotspots on the left/centre). Revisit if the footage changes.
- Clips: never commit raw renders. Run `scripts/encode.sh <raw-dir>` and commit only `public/videos/*` (H.264, GOP 12, faststart).
- 360° rooms: `src/pano.js` (three.js, loaded by dynamic import only when a room opens). Enable by adding `"pano": "panos/<file>.jpg"` to a hotspot. Body attribute `data-room` = state; buttons use `data-open` (never reuse `data-room` on buttons, since `closest()` would match `<body>`).
- Hotspot coordinates: run the app with `?edit` and click.
- Verify in a visible browser. Videos do not play in a hidden tab, and `nextFrame` is capped so the app doesn't hang there.
