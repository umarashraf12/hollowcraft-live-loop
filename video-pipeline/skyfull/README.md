# "I Survived 100 Days on a Sky Island in Hardcore Minecraft": full video (14:20)

This builds on `../sky` (the approved look test). The test's hook and days 1–3 are reused as-is; six new sections follow:
- farm and house
- mob farm, iron and the creeper
- dripstone lava, obsidian portal, the Nether, the fortress and blazes
- endermen, the castle and the hidden portal under the island
- the first-person Ender Dragon fight
- day 100

Files:
- `segs_full.py` holds the 8 sections with timed teen-narrator lines. `tts_teen.py` uses Kokoro `am_eric`, then rubberband pitch 1.122 with formants shifted.
- `world_f.js`: island farm wheat, torches, cauldron and pointed dripstone, the island portal, an original enderman and blaze, and a nether-brick fortress.
- `tail_f.js`:
  - island build history (every block placed or broken, with a timestamp)
  - per-section direction: first-person and third-person shots, HUD inventory, mobs, effects
  - sound events and the extra overlays (crafting panel, fire, nausea, armor)
- `assemble.py` builds `scene.js` from the engine, comp2, the 100 Days world, the sky test and these files. It patches in hooks for `__applyF` and `__drawF`, the armor row and farmland texturing.
- Serve the folder on port 8773. The full render is 25,800 frames at 30 fps (3 workers, about 2.5 h). `sfx_f.py` builds location-based ambience and music that follows each section's mood.
