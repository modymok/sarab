#!/usr/bin/env bash
# Normalize raw renders into web-ready clips under public/videos.
#   - H.264 8-bit yuv420p: plays everywhere (raw set mixes HEVC 10-bit, which Firefox/most Windows can't decode)
#   - 1920x1080 for every clip (floor zooms were delivered at 854x480)
#   - keyframe every 12 frames so currentTime=0 + play() starts instantly
#   - faststart so playback begins before the file finishes downloading
#   - poster jpg for each idle loop (first paint before video is ready)
# Usage: scripts/encode.sh [/path/to/sarab-videos]
set -euo pipefail
SRC="${1:-$HOME/Downloads/sarab-videos}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/videos"
mkdir -p "$OUT"

# dest name <- source file (raw names kept as delivered, typos included)
CLIPS=(
  "main:Ideal/Camera_Ideal_Zone_All.mp4"
  "building:Ideal/Camera_Ideal_Zone_buildingA.mp4"
  "mosque:Ideal/Camera_Ideal_Zone_Mosqe.mp4"
  "floor:Ideal/Camera_Ideal_TopView_Zone_floor.mp4"
  "main-to-building:ZoomIn/Camera_ZoomIn_Zone_buildingA.mp4"
  "building-to-main:ZoomOut/Camera_ZoomOut_Zone_buildingA.mp4"
  "main-to-mosque:ZoomIn/Camera_ZoomIn_Zone_Mosqe.mp4"
  "mosque-to-main:ZoomOut/Camera_ZoomOut_Zone_Mosqe.mp4"
  "building-to-floor:ZoomIn/Camera_ZoonIn_TopView_Zone_floor.mp4"
  "floor-to-building:ZoomOut/Camera_ZoonOut_TopView_Zone_floor.mp4"
)
IDLES="main building mosque floor"

for pair in "${CLIPS[@]}"; do
  name="${pair%%:*}"; src="$SRC/${pair#*:}"
  [ -f "$src" ] || { echo "missing: $src" >&2; exit 1; }
  echo "→ $name"
  ffmpeg -v error -y -i "$src" -an \
    -vf "scale=1920:1080:flags=lanczos,format=yuv420p" \
    -c:v libx264 -profile:v high -preset slow -crf 21 -g 12 -keyint_min 12 -sc_threshold 0 \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -movflags +faststart "$OUT/$name.mp4"
  if [[ " $IDLES " == *" $name "* ]]; then
    ffmpeg -v error -y -i "$OUT/$name.mp4" -frames:v 1 -q:v 4 "$OUT/$name.jpg"
  fi
done
du -sh "$OUT"
