# Sarab — plan, stack, lessons

Code name **Sarab** (سراب, "mirage"): the 3D you see is video. Internal POC to prove we can
deliver the same experience as the Vinode-powered explorer on safainv.sa, with our own stack.

## 1. How the reference works (analysed 2026-09-24)

safainv.sa is a Laravel/jQuery site that iframes `safa82.vinode.io` — a white-label Next.js app by
Prographers. Their stack: Next.js + React + zustand + styled-components, three.js (Draco, EXR,
EffectComposer), Strapi v4 for units, clips on `data.prographers.com` behind Cloudflare, and Epic's
Pixel Streaming libs as an optional live-Unreal mode.

The trick:
1. Everything is rendered offline in Unreal (Sequencer). No real-time 3D on the client.
2. Two clip kinds per camera: idle loop `Sequencer_<A>_<A>` and transition `Sequencer_<A>_<B>`.
   The app is a graph of views; clicks queue clips (zone → building → floor).
3. Short H.264 clips (1–5 s, 1080p, ~4 Mbps), desktop + mobile variants.
4. Invisible three.js layer: low-poly `*_Outlines.glb` per building + per-shot camera keyframes
   exported from Sequencer (`Sequencer<Project>Desktop.json`). The three.js camera follows the
   video's `currentTime` via `requestVideoFrameCallback`, so raycast hover/highlight lines up
   pixel-perfect with the render — even while the camera moves.
5. HTML cards projected from 3D points; interiors via panoramas; all data-driven JSON + CMS.

## 2. What Sarab POC does (this repo)

| Concern | Choice | Why |
|---|---|---|
| App | One static page, vanilla JS modules, Vite dev server; `/` = project list, `/<id>` = explorer | Smallest thing that proves the UX. No framework needed. |
| Video | One `<video>` per clip, stacked; crossfade transition → idle | Instant switches; crossfade hides render seams (see §4). |
| Hotspots | HTML buttons in a 16:9 "cover" stage, x/y = 0..1 of the frame | Idle loops barely move, so 2D pins hold. No 3D export needed. |
| Config | `public/projects/<id>/scenes.json` (graph + hotspots), `content.json` (bilingual copy + fabricated data), `public/projects/index.json` (project list) | Swap footage or add a project without touching code. |
| i18n | Arabic default (RTL), English toggle, Latin digits in both | Saudi market norm for prices/areas. |
| Encoding | `scripts/encode.sh <id> <raw>`: web-ready H.264 1080p is copied (faststart); anything else is transcoded to H.264 8-bit 1080p, CRF 21 capped at 6 Mbps, GOP 48; posters for idles | Sarab's raw set mixed HEVC 10-bit (no Firefox/most Windows); Fayrouz was already web-ready. |
| 360° rooms | three.js (lazy-loaded chunk), equirectangular image inside a sphere; drag / wheel / pinch / arrow keys | Floor-plan pins with `pano` dive in: the video scales around the pin while the room fades in. |
| UI | Milk-glass panels (backdrop-filter), Reem Kufi display + Readex Pro UI | Matches the warm sunset renders; Kufic echoes the mosque. |

Dev helper: open `/<id>?edit`, click the video → normalized `x/y` is logged + copied for `scenes.json`.

## 3. Clip inventory: `sarab` (from `~/Downloads/sarab-videos`)

| Web name | Source | Kind | Length |
|---|---|---|---|
| main | Ideal/Camera_Ideal_Zone_All | idle | 8.0 s |
| building | Ideal/Camera_Ideal_Zone_buildingA | idle | 8.0 s |
| mosque | Ideal/Camera_Ideal_Zone_Mosqe | idle | 8.0 s |
| floor | Ideal/Camera_Ideal_TopView_Zone_floor | idle | 8.0 s |
| main-to-building | ZoomIn/Camera_ZoomIn_Zone_buildingA | transition | 4.0 s |
| building-to-main | ZoomOut/Camera_ZoomOut_Zone_buildingA | transition | 4.0 s |
| main-to-mosque | ZoomIn/Camera_ZoomIn_Zone_Mosqe | transition | 4.0 s |
| mosque-to-main | ZoomOut/Camera_ZoomOut_Zone_Mosqe | transition | 4.0 s |
| building-to-floor | ZoomIn/Camera_ZoonIn_TopView_Zone_floor | transition | 8.0 s |
| floor-to-building | ZoomOut/Camera_ZoonOut_TopView_Zone_floor | transition | 8.0 s |

### Clip inventory: `fayrouz` (from `~/Downloads/new cost profject `, added 2026-10-05)

Coastal resort demo ("Fayrouz Bay"): main → bridge / residences / marina, one level deep. Mapping lives in
`scripts/clips/fayrouz.txt`. All clips are H.264 Main, 1080p30, ~2 Mbps, keyframe every 1 s, so `encode.sh`
copies them with faststart only (28 MB total; re-encoding them made 117 MB).

| Web name | Kind | Length |
|---|---|---|
| main | idle | 20 s |
| bridge, residences, marina | idle | 10 s each |
| main-to-{bridge,residences,marina} | transition | 10 s each |
| {bridge,residences,marina}-to-main | transition | 10 s each |

Continuity is good: every boundary pair measures 31–34 dB (Sarab's were 13–20), so the fade is only 300 ms.
Main-view pins were placed by tracking each zoom's last frame back to frame 0 (patch matching), then checked by eye.
Pacing note: each zoom is 10 s and the first ~4 s barely move. 5–6 s zooms would feel more responsive on click.

### Clip inventory: `marjan` (from `~/Downloads/Amaala`, added 2026-10-13)

Coastal wellness resort demo ("Marjan Bay"; footage delivered as "Amaala"): main → hotel-1 / hotel-2 / left / right / marina, one level deep.
Mapping lives in `scripts/clips/marjan.txt` (flat delivery: `LS_Idle_<Zone>`, `LS_T_F_<Zone>` = zoom in,
`LS_T_R_<Zone>` = zoom out, `LS_AmallaMain_Idle` = main). Sources are 2560×1440 H.264 at 15–17 Mbps, so
`encode.sh` transcodes them to 1080p.

| Web name | Kind | Length |
|---|---|---|
| main | idle | 20 s |
| hotel-1, hotel-2, left, right, marina | idle | 10 s each |
| main-to-{hotel-1,hotel-2,left,right,marina} | transition | 10 s each |
| {hotel-1,hotel-2,left,right,marina}-to-main | transition | 10 s each |

- Zoom-in end → idle start: 36–38 dB on all five (clean).
- Main → zoom-in start: 18–22 dB (Right 34), and zoom-out end → main: 18–22 dB. Four of five zooms were not
  rendered from main's frame; the 300 ms crossfade covers it.
- Idle loops (last → first frame): Left/Right 36, Hotel_2 29, Hotel_1 27, Marina 24, main 23 dB (boats and water move).
- Main-view pins were estimated from frame 0 of each idle; still to be checked by eye with `/marjan?edit`.

## 4. Render feedback for the 3D team (measured, PSNR between boundary frames)

- Idle loops close well (32–34 dB). Keep doing that.
- **Transition end ≠ idle start**: zoom-in last frame vs target idle first frame = 18–20 dB
  (building, mosque), **13 dB for the floor** (visible jump; rotation differs). Crossfade hides it,
  but rule for next renders: *last frame of A→B must equal first frame of B's idle, and first frame
  of A→B must equal first frame of A's idle.* Same camera, same frame, same lighting/time of day.
- Floor zoom clips were delivered at 854×480 (others 1920×1080) — re-render at 1080p.
- Zoom-in clips came as 48 Mbps HEVC 10-bit; export H.264 (or ProRes masters) and let `encode.sh` compress.
- Filenames have typos (`Mosqe`, `Zoon`). Proposed convention: `<from>__<to>.mp4`, idle = `<view>__<view>.mp4`.
- Marjan (Amaala footage): deliver zooms that start on main's exact idle frame (4 of 5 don't), and say which resolution you export (1080p or 1440p are both fine).

### 360° interiors (delivered 2026-10-05)

- `living.jpg` (1), `dining.jpg` (2, shown as "Family room"), `kitchen.jpg` (3), wired to floor-plan pins in `scenes.json`.
- All three are 1600 px wide, which looks soft full-screen. Deliver **6000×3000 or larger**, 2:1, JPEG q85.
- **None of them wrap**: the left and right edges don't meet (visible seam). The viewer stops the turn before the seam.
  A true 360° render (Unreal/V-Ray/Corona spherical camera) wraps cleanly; then add a `wraps` flag and remove the limit.
- `dining.jpg` is 1600×699 (not 2:1), so it has no ceiling/floor poles. The viewer builds only the band it covers and limits tilt.
- No bedroom panorama yet. Add `"pano": "panos/<file>.jpg"` to any floor hotspot to enable one.

## 5. Roadmap (only if the POC convinces)

1. **Seamless renders** per §4 → drop the crossfade, cut on the exact frame.
2. **Mobile**: done in part: tall screens can drag the stage sideways (`--pan`), with a one-time hint.
   Still open: a portrait render set and 720p mobile encodes.
3. **Hover-while-moving**: export Unreal camera keyframes + low-poly unit meshes (GLB/Draco), add a
   three.js overlay synced with `requestVideoFrameCallback` — the Vinode approach.
4. **Live inventory**: Supabase table for units (status/price) + admin; colour units by status.
5. **Lead capture**: WhatsApp handoff + form (PII → needs privacy notice, RLS, rate limit).
6. **Hosting**: Cloudflare Pages + R2 for clips (no egress fees for video) or Vercel + R2.
   Load only the current view + its outgoing transitions instead of every clip.
7. **Productise**: multi-project config, per-client theming, embeddable iframe.
   URL prefix: the build takes `SARAB_BASE=/demos/` to run under ayntwin.com/demos (home at `<base>`,
   explorer at `<base><id>`). The host needs an SPA rewrite of `<base><id>` → `<base>index.html`
   (a CloudFront Function on ayntwin.com; `vercel.json` on Vercel, where base is `/`).
