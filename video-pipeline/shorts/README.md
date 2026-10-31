# Shorts pilot: Hollow, Pip & VOID (1080×1920)

`scene.js` = episode-2 engine head (with W/H swapped to vertical) + `world_s.js` (mansion, torch-ringed hut, obsidian security
house with lava moat, sky bedroom, Pip and VOID models, torch/light pools) + `tail_s.js` (night/room lighting, three story
timelines picked with `?s=1|2|3`, speaker-coloured captions, hook and end cards, security checklist).
`tts.py` makes the three character voices (Hollow = narrator voice, Pip pitched up, VOID pitched down with echo).
`sfx_s.py N` builds short N's effects and its playful/tense music crossfade.
Render: serve this folder on port 8769, then `node render_s.js 0 <frames> out.mp4 <N>`.
