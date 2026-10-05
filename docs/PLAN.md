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
| App | One static page, vanilla JS modules, Vite dev server | Smallest thing that proves the UX. No framework needed for 4 views. |
| Video | One `<video>` per clip, stacked; crossfade transition → idle | Instant switches; crossfade hides render seams (see §4). |
| Hotspots | HTML buttons in a 16:9 "cover" stage, x/y = 0..1 of the frame | Idle loops barely move, so 2D pins hold. No 3D export needed. |
| Config | `public/config/scenes.json` (graph + hotspots), `content.json` (bilingual copy + fabricated data) | Swap footage/project without touching code. |
| i18n | Arabic default (RTL), English toggle, Latin digits in both | Saudi market norm for prices/areas. |
| Encoding | `scripts/encode.sh` → H.264 8-bit 1080p, GOP 12, faststart, posters | Raw set mixes HEVC 10-bit (no Firefox/most Windows). |
| 360° rooms | three.js (lazy-loaded chunk), equirectangular image inside a sphere; drag / wheel / pinch / arrow keys | Floor-plan pins with `pano` dive in: the video scales around the pin while the room fades in. |
| UI | Milk-glass panels (backdrop-filter), Reem Kufi display + Readex Pro UI | Matches the warm sunset renders; Kufic echoes the mosque. |

Dev helper: open `/?edit`, click the video → normalized `x/y` is logged + copied for `scenes.json`.

## 3. Clip inventory (from `~/Downloads/sarab-videos`)

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

## 4. Render feedback for the 3D team (measured, PSNR between boundary frames)

- Idle loops close well (32–34 dB). Keep doing that.
- **Transition end ≠ idle start**: zoom-in last frame vs target idle first frame = 18–20 dB
  (building, mosque), **13 dB for the floor** (visible jump; rotation differs). Crossfade hides it,
  but rule for next renders: *last frame of A→B must equal first frame of B's idle, and first frame
  of A→B must equal first frame of A's idle.* Same camera, same frame, same lighting/time of day.
- Floor zoom clips were delivered at 854×480 (others 1920×1080) — re-render at 1080p.
- Zoom-in clips came as 48 Mbps HEVC 10-bit; export H.264 (or ProRes masters) and let `encode.sh` compress.
- Filenames have typos (`Mosqe`, `Zoon`). Proposed convention: `<from>__<to>.mp4`, idle = `<view>__<view>.mp4`.

### 360° interiors (delivered 2026-10-05)

- `living.jpg` (1), `dining.jpg` (2, shown as "Family room"), `kitchen.jpg` (3), wired to floor-plan pins in `scenes.json`.
- All three are 1600 px wide, which looks soft full-screen. Deliver **6000×3000 or larger**, 2:1, JPEG q85.
- **None of them wrap**: the left and right edges don't meet (visible seam). The viewer stops the turn before the seam.
  A true 360° render (Unreal/V-Ray/Corona spherical camera) wraps cleanly; then add a `wraps` flag and remove the limit.
- `dining.jpg` is 1600×699 (not 2:1), so it has no ceiling/floor poles. The viewer builds only the band it covers and limits tilt.
- No bedroom panorama yet. Add `"pano": "panos/<file>.jpg"` to any floor hotspot to enable one.

## 5. Roadmap (only if the POC convinces)

1. **Seamless renders** per §4 → drop the crossfade, cut on the exact frame.
2. **Mobile**: portrait crop hides left-side pins today (16:9 cover). Add drag-to-pan on the stage
   or a portrait render set; 720p mobile encodes.
3. **Hover-while-moving**: export Unreal camera keyframes + low-poly unit meshes (GLB/Draco), add a
   three.js overlay synced with `requestVideoFrameCallback` — the Vinode approach.
4. **Live inventory**: Supabase table for units (status/price) + admin; colour units by status.
5. **Lead capture**: WhatsApp handoff + form (PII → needs privacy notice, RLS, rate limit).
6. **Hosting**: Cloudflare Pages + R2 for clips (no egress fees for video) or Vercel + R2.
   Load only the current view + its outgoing transitions instead of every clip.
7. **Productise**: multi-project config, per-client theming, embeddable iframe.
