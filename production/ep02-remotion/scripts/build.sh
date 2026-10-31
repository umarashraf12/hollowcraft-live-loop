#!/usr/bin/env bash
# One command: soundtrack -> 3D render -> loudness-normalised master + Shorts cut + thumbnail frame.
#   ./scripts/build.sh            full build
#   SKIP_RENDER=1 ./scripts/build.sh   re-finish an existing out/video_only.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out

python3 scripts/make_audio.py

if [ -z "${SKIP_RENDER:-}" ]; then
  npx remotion render Episode out/video_only.mp4 --props='{"withAudio":false}' \
    --concurrency="${CONCURRENCY:-4}" --muted --crf=17
fi

# Master: picture + synthesized soundtrack at YouTube loudness (-14 LUFS).
ffmpeg -v error -y -i out/video_only.mp4 -i public/soundtrack.wav \
  -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 \
  -c:a aac -b:a 192k -shortest -movflags +faststart out/episode_16x9.mp4

# Shorts / Reels / TikTok: blurred full-bleed background with the picture centred.
ffmpeg -v error -y -i out/episode_16x9.mp4 -filter_complex \
  "[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:2[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset slow -crf 20 -c:a copy -movflags +faststart out/episode_shorts_9x16.mp4

# Thumbnail base frame (Milo raising one eyebrow at the monsters).
ffmpeg -v error -y -ss 14.0 -i out/episode_16x9.mp4 -frames:v 1 -q:v 2 out/thumbnail_base.jpg

ls -lh out/episode_16x9.mp4 out/episode_shorts_9x16.mp4 out/thumbnail_base.jpg
