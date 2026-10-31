#!/usr/bin/env bash
# Cuts gag Shorts (9:16, hook caption on top) out of the finished master.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=out/episode_16x9.mp4
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
mkdir -p out/shorts
cut() { # name start end "caption line 1" "caption line 2"
  local d; d=$(python3 -c "print($3-$2)")
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$SRC" -filter_complex "\
[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:2[bg];\
[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,\
drawtext=fontfile=$FONT:text='$4':fontsize=78:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=330,\
drawtext=fontfile=$FONT:text='$5':fontsize=78:fontcolor=#ffb23a:borderw=7:bordercolor=black:x=(w-tw)/2:y=430,format=yuv420p[v];\
[0:a]afade=t=in:d=0.15,afade=t=out:st=$(python3 -c "print($d-0.4)"):d=0.4[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -c:a aac -b:a 192k -movflags +faststart "out/shorts/$1.mp4"
  echo "out/shorts/$1.mp4 (${d}s)"
}
cut 01_werewolf_squeaky_toy 17.0 29.0 "WEREWOLF vs" "SQUEAKY TOY"
cut 02_ghost_sheet          30.5 40.5 "HE PULLED OFF" "THE GHOSTS SHEET"
cut 03_pumpkin_sour_candy   42.5 53.0 "NEVER GIVE A PUMPKIN" "SOUR CANDY"
cut 04_vampire_flashlight   55.0 65.0 "VAMPIRE vs" "BABY FLASHLIGHT"
cut 05_mom_found_this       84.0 97.0 "MOM FOUND THIS" "IN THE CRIB"
