#!/usr/bin/env bash
# Cuts gag Shorts (9:16, hook caption on top) out of the finished master.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=out/episode_16x9.mp4
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
mkdir -p out/shorts
cut() { # name start end "caption line 1" "caption line 2"
  local d; d=$(python3 -c "print(round($3-$2, 2))")
  ffmpeg -v error -y -ss "$2" -to "$3" -i "$SRC" -filter_complex "\
[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:2[bg];\
[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,\
drawtext=fontfile=$FONT:text='$4':fontsize=76:fontcolor=white:borderw=7:bordercolor=black:x=(w-tw)/2:y=330,\
drawtext=fontfile=$FONT:text='$5':fontsize=76:fontcolor=#ffb23a:borderw=7:bordercolor=black:x=(w-tw)/2:y=430,format=yuv420p[v];\
[0:a]afade=t=in:d=0.15,afade=t=out:st=$(python3 -c "print($d-0.4)"):d=0.4[a]" \
    -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -c:a aac -b:a 192k -movflags +faststart "out/shorts/$1.mp4"
  echo "out/shorts/$1.mp4 (${d}s)"
}
cut 01_werewolf_ate_baby_food 23.5 34.8 "THE WEREWOLF ATE" "THE BABY FOOD"
cut 02_ghost_shrunk_in_bath   38.0 50.1 "NEVER WASH A GHOST" "IN THE BATH"
cut 03_skeleton_arm_popped    53.1 63.0 "HIS ARM" "POPPED OFF"
cut 04_vampire_lullaby        65.0 78.6 "VAMPIRE SINGS" "A LULLABY"
cut 05_parents_came_home      78.6 93.8 "PARENTS CAME HOME" "TO THIS"
