#!/usr/bin/env bash
# Normalize raw renders into web-ready clips under public/projects/<id>/videos.
#   - H.264 8-bit yuv420p: plays everywhere (raw set mixes HEVC 10-bit, which Firefox/most Windows can't decode)
#   - 1920x1080 for every clip (floor zooms were delivered at 854x480)
#   - capped bitrate, keyframe every ~2 s (the player only ever seeks to 0)
#   - faststart so playback begins before the file finishes downloading
#   - a source that is already web-ready (H.264 8-bit 1080p, <= 6 Mbps) is copied, not re-encoded:
#     re-encoding adds size and generation loss (sarab/ clips predate this rule: GOP 12, CRF 21)
#   - poster jpg for each idle loop (first paint before video is ready)
# Usage: scripts/encode.sh <project-id> <raw-dir>
#   clip list: scripts/clips/<project-id>.txt  (web-name:source lines)
#   output:    public/projects/<project-id>/videos
set -euo pipefail
ID="${1:?project id, e.g. sarab}"
SRC="${2:?folder with the raw renders}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/../public/projects/$ID/videos"
mkdir -p "$OUT"
CLIPS=(); while IFS= read -r line || [[ -n "$line" ]]; do [[ -z "$line" || "$line" == \#* ]] || CLIPS+=("$line"); done < "$HERE/clips/$ID.txt"

for pair in "${CLIPS[@]}"; do
  name="${pair%%:*}"; src="$SRC/${pair#*:}"
  [ -f "$src" ] || { echo "missing: $src" >&2; exit 1; }
  info=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,pix_fmt,bit_rate -of csv=p=0 "$src")
  IFS=, read -r codec w h pix rate <<< "$info"
  [[ "$rate" =~ ^[0-9]+$ ]] || rate=99999999 # ffprobe prints N/A when the container has no bitrate → encode
  if [[ "$codec" == h264 && "$w" == 1920 && "$h" == 1080 && "$pix" == yuv420p && "$rate" -le 6000000 ]]; then
    echo "→ $name (copy)"
    ffmpeg -v error -y -i "$src" -an -c:v copy -movflags +faststart "$OUT/$name.mp4"
  else
    echo "→ $name (encode)"
    ffmpeg -v error -y -i "$src" -an \
      -vf "scale=1920:1080:flags=lanczos,format=yuv420p" \
      -c:v libx264 -profile:v high -preset slow -crf 21 -maxrate 6M -bufsize 12M -g 48 \
      -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
      -movflags +faststart "$OUT/$name.mp4"
  fi
  if [[ "$src" == */[Ii]deal/* ]]; then # idle loops get a poster for first paint
    ffmpeg -v error -y -i "$OUT/$name.mp4" -frames:v 1 -q:v 4 "$OUT/$name.jpg"
  fi
done
du -sh "$OUT"
