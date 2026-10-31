# Episode 4: 3 villager tricks (zombie cure discount, Mending reroll, sticks for emeralds)

`scene.js` = episode-2 engine head + `part_world4.js` (village by the cliff: shaded zombie-villager pen, house, tree,
villager models with swappable professions) + `part_tl4.js` (cure sequence, lectern reroll loop, tree chop,
emerald montage, 2:30 timeline) + `part_ov4.js` (Minecraft-style trading panel with price drops, lock, crafting chain).
Serve this folder on port 8768, then render frames 0–4500 at 30fps (see ../README.md).
`../chain-render.sh` shows how to start one episode's render automatically when the previous one finishes.
