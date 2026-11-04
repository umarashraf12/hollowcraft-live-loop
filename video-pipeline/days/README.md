# "I Survived 100 Days in Hardcore Minecraft" (10:01, narrated)

- `segs.py` writes `segs.json`: 19 story segments (hook, day 1, night 1, …, Ender Dragon, day 100). Each has a duration, day label, title and narration lines with their offsets.
- `tts.py` runs Kokoro `am_michael` (speed 1.1) and writes `audio/vo.wav` plus `caps.json`. It flags any line that would overrun its segment.
- `assemble.py <video-pipeline> <comp2 dir>` builds `scene.js` from these pieces:
  - the ep2 engine head and mine, the ep3 Nether, and the ep2 props
  - the compilation's world and its 20 clip scenes (`../comp2/world_c.js`, `tail_c.js` up to its timeline); 12 of those clips are reused as story beats
  - `world_d.js`: textures, dirt hut, house mesh, farm with growing wheat, animal pen, cows and sheep, torch ring, the stronghold portal room, the End island with pillars and crystals, the original dragon model, death beams, stars
  - `tail_d.js`: six new scenes (day 1 tree and crafting, night 1 hut and zombies, farm and animals, stronghold, the dragon fight, the day-100 tour), the segment timeline, day/sunset/night/End lighting blends, base pieces appearing as the days go on, and overlays (day card, day badge with hardcore hearts, crafting panel, boss bar, burned-in captions, outro)
- Serve the folder on port 8771 (it needs `segs.json` and `caps.json`). `still.js t…` renders test stills. `render.js a b out.mp4` renders frames [a, b) at 30 fps; the full video is 18,030 frames.
- `thumb.js` renders hero shots through `renderFrame(t, {cam})`, and `thumb_compose.py` lays out the thumbnail.
- `dump_tl.js` writes `timeline.json`. `sfx_d.py` turns it into `audio/sfx.wav` (events, segment transitions, ambience, crickets) and `audio/music.wav` (116 BPM; the energy and key follow each segment's mood).
- Mix: narration compressed; music sidechain-ducked under the voice (6:1); SFX lightly ducked; limiter, then a two-pass loudnorm to -14 LUFS.
