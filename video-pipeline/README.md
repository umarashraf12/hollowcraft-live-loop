# HollowCraft trick-video pipeline

Builds `samples/minecraft-2-tricks-sample.mp4`, a 2-minute, 1080p30 sample with 2 tricks
(Water Bucket Clutch, and Wind Charge + Mace Smash). The world, character, mob and item art
are original voxel assets rendered with three.js. There are no game textures or recorded game footage.

| Step | File | Output |
|---|---|---|
| Voiceover (Kokoro TTS, `am_michael`), one clip per line placed on a timeline | `tts.py` | `audio/vo.wav`, `caps.json` |
| Scene, HUD, captions, overlays (deterministic `renderFrame(t)`) | `scene.js`, `index.html` | frames |
| Render frames → H.264 (run ranges in parallel) | `render.js` | `parts/p*.mp4` |
| Sound effects + original music bed | `sfx.py` | `audio/sfx.wav`, `audio/music.wav` |
| Check a few frames | `still.js 12.5 40 80.4` | `stills/*.jpg` |

```bash
npm i three@0.160.0
pip install kokoro-onnx soundfile scipy
# Kokoro model files (from the kokoro-onnx GitHub releases): kokoro-v1.0.onnx, voices-v1.0.bin → audio/
python3 tts.py                      # run from a dir containing audio/
python3 -m http.server 8765 &       # serve this folder
node render.js 0 1200 parts/p0.mp4 & node render.js 1200 2400 parts/p1.mp4 & node render.js 2400 3600 parts/p2.mp4
python3 sfx.py
# concat parts, then mix: VO (compressed) + music (sidechain-ducked under VO) + SFX, loudnorm -14 LUFS
```

To make a new episode, edit the line list in `tts.py` and the `stateAt(t)` timeline in `scene.js`.
Event times in `sfx.py` follow the same timeline.

## Thumbnail
`thumb.js` renders the frozen mace-smash hero frame (`window.renderThumb(opts)` in `scene.js`, with camera, pose and mace angle as options).
`thumb_compose.py` crops it and adds the text, tag and speed lines. The result is a 1280×720 JPG.

```bash
B='"age":0.035,"py":11.4,"pyaw":1.9,"myaw":2.35,"cx":44.2,"cy":10.6,"cz":30.2,"lx":41.1,"ly":12.0,"lz":35.6,"fov":60,"k":0.5'
node thumb.js "[{$B,\"mry\":-0.6,\"mrz\":-40}]"     # -> thumb_raw0.png
python3 thumb_compose.py thumb_raw0.png thumbnail.jpg
```
