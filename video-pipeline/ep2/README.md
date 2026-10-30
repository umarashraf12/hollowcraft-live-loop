# Episode 2: 3 tricks (diamonds, speed bridging, elytra mace)

`scene.js` is the episode-1 engine plus `part_world.js` (underground mine at x≈200 with branch tunnels, diamond ore,
torches and a floating island at the end of the bridge) and `part_tail.js` (dynamic dug/placed blocks, elytra wings,
firework trail, F3 coordinate panel, Y-level chart, top-view branch map, keycap prompts, X-ray outlines, and the 2:30 timeline).

Build steps are the same as episode 1 (see ../README.md). Serve this folder on port 8766, then render frames 0–4500 at 30fps.

## Thumbnail
`thumb2.js` renders two hero frames with `window.renderThumb2(mode, opts)` (`mine` = diamond vein burst, `dive` = elytra mace dive).
`thumb2_compose.py` joins them into a slanted split and adds "3 TRICKS", the "Y -58" tag and the flying pixel diamonds.

```bash
node thumb2.js '[["dive",{}],["mine",{"cx":206.0,"cy":-56.9,"cz":17.9,"fov":56}]]'   # -> thumb_dive0.png, thumb_mine1.png
python3 thumb2_compose.py thumb_mine1.png thumb_dive0.png thumbnail.jpg
```
