# EP02 "Monster Babysitters" (Remotion build)

Mom and Dad go out for the night, and the four monsters from EP01 secretly
babysit Milo. Every job goes wrong, and grumpy Milo fixes it himself:

| Scene | Gag |
|---|---|
| Parents leave | Kiss, wave, door shuts |
| The reveal | Monsters pop out of the chest, closet, window and shelf. Title card, then Milo's raised eyebrow |
| Feeding | Woofle's "airplane" spoon. He sniffs it, gulps it, gobbles the whole bowl. Milo: spoon BONK |
| Bath | Sheets the ghost scrubs Milo, his sheet shrinks in the water, the embarrassed skeleton gets a towel |
| Pajamas | The skeleton's arm pops off and boomerangs round the room. Milo puts his own pajamas on and hands it back |
| Lullaby | Count Nibbles sings opera (glass rattles, Jack cries, Woofle howls). Milo plugs him with his pacifier. Everyone falls asleep but Milo |
| Parents return | Monsters sprawled everywhere, parents shocked, Milo: "shh". Woofle snores, so Milo throws a teddy in his mouth. THE END |

**Pacing:** 62 cuts in 93.8 s (one cut every 1.5 s on average), matching the
fast-cut reference format. Each scene animates continuously and the edit cuts
between camera angles (wide, reaction close-ups, inserts), like a multi-camera
animated short.

## Build

```bash
npm install            # or reuse ../ep01-remotion/node_modules
npm run build          # soundtrack → render (~35 min on 4 cores) → master + Shorts version + thumbnail frame
./scripts/make_shorts.sh   # 5 captioned gag Shorts into out/shorts/
```

## How it's organised

| File | Contents |
|---|---|
| `src/edit.json` | **The edit**: scenes → cuts (camera, duration) + sound cues per cut. Retime the episode here |
| `src/edit.ts` | Turns the cut list into a timeline; camera moves and shake |
| `src/Scenes.tsx` | The 7 scenes: camera table + all animation, timed against cut starts |
| `src/chars/*`, `src/sets.tsx`, `src/props.tsx` | Cast, sets (nursery, hallway, bathroom) and props, shared with EP01 |
| `scripts/make_audio.py` | Score (tiptoe → sneaky → bouncy → bubbly → lullaby/opera → music box) + 51 synthesized SFX |

Because sound cues are pinned to cuts, changing a cut's duration in
`edit.json` moves its picture and sound together.
