# Compilation 2: "Top 20 EPIC Minecraft Moments" (all-new footage, 9:52)

A countdown from #20 to #1. Each clip is 28.5 s, with a 12 s montage intro and a 10 s "vote for your #1" outro. There's no voice-over: just music, SFX and on-screen labels.

- `assemble.py` builds `scene.js` from four pieces:
  - the ep2 engine head and mine
  - the ep3 Nether world
  - the ep2 props
  - `world_c.js` (sky parkour pillars, portal mold, speed-build house plan, creeper model, extra zombies, elytra hoops, crater decal)
  - `tail_c.js` (props, the 20 `clip()` definitions with their SFX events, timeline, state/apply, overlays, `renderFrame`)
- Serve this folder on port 8770. You need a `node_modules` folder with three@0.160.0, plus an empty `caps.json`.
- `still.js t1 t2 …` renders test stills. `render.js a b out.mp4` renders frames [a, b) at 30 fps. The full video is 17,760 frames; three workers took about 1h45m.
- `renderFrame(t, {cam: [pos, look, fov]})` renders without overlays from a custom camera. `thumb.js` uses this for thumbnail hero shots, and `thumb_compose.py` lays out the thumbnail.
- `dump_tl.js` writes `timeline.json` (`window.TIMELINE`). `sfx_c.py` turns it into `audio/sfx.wav` (per-clip events, countdown transitions, environment ambience) and `audio/music.wav` (116 BPM; the chord progression changes every ~200 s).
- Mix: music at 0.55, sidechain-ducked under the SFX, then limited and loudness-normalised to -14 LUFS.
