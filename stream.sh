#!/bin/bash
cd /app
python3 -m http.server "${PORT:-7860}" >/dev/null 2>&1 &
while true; do
ffmpeg -hide_banner -loglevel error -re -stream_loop -1 -i loop.mp4 -c copy -f flv "rtmps://a.rtmp.youtube.com/live2/$YT_STREAM_KEY"
sleep 5
done
