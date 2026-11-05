# Sky Island look test: gameplay-style render (2:00)

A test of the new realistic gameplay look for "I Survived 100 Days on a Sky Island in Hardcore Minecraft".

- `world_g.js`:
  - leaves with transparent gaps, cobblestone, ice and chest textures, plus new item icons
  - an island mesher with per-vertex ambient occlusion (soft corner shading)
  - an original skeleton model and a chest with an opening lid
  - block outline, breaking-crack overlay and a held block in first person
- `tail_g.js`, the shot-by-shot direction:
  - first-person camera with view bob, a hook and flash-forward, mining, crafting, the cobblestone generator, a near-fall, the night skeleton fight, and a day-3 reveal
  - inventory, health and hunger over time
  - real-time sun shadows and fill light
  - HUD (hotbar, hearts, hunger, XP, crosshair, item names), chest and crafting panels, word-pop captions and a small day counter
  - post effects: grade, bloom, sun rays, vignette, hurt flash, vertigo
- `assemble.py` builds `scene.js` on top of the existing engine, the compilation (`comp2`) world and the 100 Days world, with `tail_d.js` providing the apply loop. It removes the episode-1 cliff from the terrain.
- `segs.py` holds the script, with timings. `tts.py` runs Kokoro (`am_michael`, speed 1.12). `sfx_g.py` builds wind, heartbeat, chest, ice-break, skeleton-rattle and hurt sounds, plus the music.
- Serve the folder on port 8772. Render frames 0–3600 at 30 fps.
