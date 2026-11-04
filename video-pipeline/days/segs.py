# Segment plan + narration for "I Survived 100 Days in Hardcore Minecraft". Writes segs.json (read by the scene and tts.py).
import json
S = []
def seg(kind, dur, day, title, lines, **kw): S.append(dict(kind=kind, dur=dur, day=day, title=title, lines=lines, **kw))

seg('hook', 14, None, None, [
  (0.3, "I survived one hundred days in hardcore Minecraft."),
  (3.7, "One life. No second chances."),
  (6.5, "And on day eighty-seven... I fought the Ender Dragon."),
  (11.0, "This is what happened.")])
seg('day1', 34, 1, 'THE BEGINNING', [
  (3.2, "Day one. I spawned in the middle of a plains biome, with absolutely nothing."),
  (8.6, "So I did what every player does first. I punched a tree."),
  (15.0, "Logs became planks. Planks became a crafting table."),
  (19.6, "And then, my very first wooden pickaxe."),
  (24.4, "But the sun was already going down. And in hardcore, the first night can end everything.")])
seg('night1', 30, 1, 'THE FIRST NIGHT', [
  (2.6, "I threw together a tiny dirt hut, and sealed myself inside."),
  (7.6, "Then the zombies came. One... two... three of them."),
  (13.6, "I just stood there, holding my only torch, waiting for the sun."),
  (19.4, "Not my proudest moment..."),
  (22.4, "but at sunrise, the zombies burned, and I survived night one.")])
seg('clip', 28.5, 6, 'FIRST HOUSE', [
  (3.0, "Day two. It was time for a real home."),
  (6.4, "I chopped half a forest, crafted stacks of planks, and started building."),
  (12.6, "Oak logs in the corners. Glass windows. A flat roof."),
  (20.6, "And on day six, my first real house was done.")], clip=20, nopop=True, pops=[[20.4, 'HOUSE DONE!', '#5cff7a']], label='DAY 2-6')
seg('clip', 28.5, 8, 'ZOMBIE AMBUSH', [
  (2.4, "Day eight. I stayed out too late, and three zombies cornered me."),
  (6.9, "Good thing I'd just crafted an iron sword."),
  (13.4, "Three zombies. Three hits."),
  (17.2, "In hardcore, every fight is life or death. So from now on, I never leave home without a sword.")], clip=17)
seg('farm', 34, 12, 'FARM & ANIMALS', [
  (3.0, "By day twelve, my food was running low, so I built a farm."),
  (7.6, "Water in the middle, and wheat planted on every side."),
  (12.2, "A few days later... my first harvest."),
  (16.4, "Then I used that wheat to lead some cows and sheep home, and fenced them in."),
  (23.6, "By day fifteen, I had bread, steak, and wool for a bed."),
  (28.4, "Now I could finally skip the nights.")], label='DAY 12-15')
seg('clip', 28.5, 19, 'CREEPER!', [
  (1.6, "Day nineteen. I was chopping wood when I heard it."),
  (5.0, "That hiss."),
  (9.6, "Here it is in slow motion. I backed off at the very last second."),
  (19.6, "One more step, and this would have been a very short video.")], clip=11)
seg('clip', 28.5, 23, 'DIAMONDS', [
  (1.4, "Days twenty-three to thirty, I went deep. Branch mining, one tunnel at a time."),
  (7.4, "And then... I saw it."),
  (10.0, "Diamonds!"),
  (14.6, "One vein. Then another. Then another."),
  (22.6, "Nine diamonds. Enough for a pickaxe, a sword, and armor.")], clip=18, label='DAY 23-30')
seg('clip', 28.5, 34, 'DISASTER', [
  (1.0, "Day thirty-four. I came home from the mine, and there was a creeper next to my house."),
  (6.6, "I couldn't stop it."),
  (10.6, "Thirty-four days of work... and half my house was gone."),
  (19.6, "So I rebuilt it, and put torches on every single block around it.")], clip=5)
seg('clip', 28.5, 41, 'NETHER PORTAL', [
  (1.4, "Day forty-one. I didn't want to waste diamonds mining obsidian, so I used a trick."),
  (6.8, "Lava into a dirt mold, then water on top. One block at a time."),
  (12.4, "Ten obsidian, flint and steel..."),
  (16.4, "and I was going to the Nether.")], clip=12)
seg('clip', 28.5, 45, 'ICE HIGHWAY', [
  (1.6, "The Nether is huge and deadly, so on day forty-five, I built an ice highway."),
  (7.0, "Blue ice, a boat, and glass walls on both sides."),
  (11.6, "Seventy-two blocks per second. Nothing in the Nether could catch me.")], clip=13)
seg('clip', 28.5, 52, 'NETHERITE', [
  (1.0, "Day fifty-two. I needed netherite, the best gear in the game."),
  (5.6, "Beds explode in the Nether, so I used one to blow up the wall."),
  (11.6, "Watch it again."),
  (20.6, "Three ancient debris, from one blast.")], clip=9)
seg('clip', 28.5, 60, 'CLOSE CALL', [
  (0.8, "Day sixty almost ended everything. I was bridging to a sky island..."),
  (5.2, "and I slipped."),
  (12.6, "In hardcore, that's game over. Unless you have a water bucket."),
  (19.4, "One click before the ground, and I lived.")], clip=4)
seg('clip', 28.5, 74, 'THE MACE', [
  (0.8, "Day seventy-four. In a trial chamber, I found the strongest weapon in the game."),
  (5.6, "The mace. Wind charge up..."),
  (9.6, "fall down... smash."),
  (14.6, "The higher you fall, the harder it hits.")], clip=6)
seg('endportal', 30, 80, 'THE STRONGHOLD', [
  (2.0, "Day eighty. Diamond gear, golden apples, and a stack of arrows. I was ready."),
  (7.6, "I followed my eyes of ender to a stronghold, and filled the portal frame."),
  (17.4, "Twelve eyes. The portal was open."),
  (22.6, "There was no turning back now.")], label='DAY 80-86')
seg('dragon', 72, 87, 'THE ENDER DRAGON', [
  (2.2, "Day eighty-seven. The End."),
  (5.4, "The Ender Dragon was circling the island, and the crystals on the pillars kept healing it."),
  (13.6, "So first, the crystals. One arrow at a time."),
  (29.6, "Then the dragon came for me."),
  (37.6, "It landed on the portal, and that was my chance."),
  (47.0, "Every hit counted. One mistake, and it was over."),
  (55.4, "Last hit..."),
  (60.6, "The Ender Dragon was dead! I beat the game, in hardcore.")])
seg('clip', 28.5, 93, 'ELYTRA', [
  (1.0, "Day ninety-three. In an End city, I found elytra."),
  (5.2, "Finally, I could fly."),
  (9.4, "I built eight rings across my world, and flew through every single one.")], clip=10)
seg('clip', 28.5, 97, 'FINAL CHALLENGE', [
  (0.6, "Day ninety-seven. One last challenge."),
  (3.6, "Jump off a fifty-five block tower, with a mace."),
  (10.6, "Here it is, slowed down."),
  (18.8, "Fifty-five blocks. One hit.")], clip=1)
seg('tour', 45, 100, 'THE FINAL DAY', [
  (2.4, "Day one hundred."),
  (4.8, "From a dirt hut, to a full base, a farm, the Nether, and the Ender Dragon."),
  (11.6, "One hundred days. One life. And I never died."),
  (18.4, "Should I do two hundred days? Tell me in the comments."),
  (23.6, "And subscribe to HollowCraft, so you don't miss it.")])
t = 0
for s in S: s['start'] = round(t, 3); t += s['dur']
json.dump({'total': round(t, 3), 'segs': S}, open('segs.json', 'w'), indent=1)
print('total', t, 'segments', len(S))
