#!/bin/bash
cd /home/user/hc-work/ep3/parts
until [ "$(cat l*.txt | grep -c DONE)" = 3 ] || grep -q PAGEERR l*.txt; do sleep 15; done
cat l*.txt | grep -E "DONE|ERR"
cd /home/user/hc-work/ep4 && mkdir -p parts
node render.js 0 1500 parts/p0.mp4 > parts/l0.txt 2>&1 &
node render.js 1500 3000 parts/p1.mp4 > parts/l1.txt 2>&1 &
node render.js 3000 4500 parts/p2.mp4 > parts/l2.txt 2>&1 &
echo "ep4 render started"
