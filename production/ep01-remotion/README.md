# EP01 "The Halloween Candy Guard" (Remotion build)

The full episode made 100% in code, for free: a 3D animated cartoon rendered with
[Remotion](https://www.remotion.dev) + React Three Fiber, plus an original
score and 34 sound effects synthesized in Python. No AI credits, no stock
footage, no samples, so there's nothing to license and nothing that can be
claimed.

- **Runtime:** 97 s, 16 shots, 1080p30
- **Outputs:** `out/episode_16x9.mp4` (YouTube master, −14 LUFS),
  `out/episode_shorts_9x16.mp4` (Shorts/Reels/TikTok), `out/thumbnail_base.jpg`

## Build

```bash
npm install
npm run build          # soundtrack → render (~30 min on 4 CPU cores) → master + Shorts + thumbnail
```

Needs Node 18+, Python 3 with numpy, ffmpeg, and Chrome/Chromium. On a normal
desktop, delete the `setBrowserExecutable` line in `remotion.config.ts` (or set
`REMOTION_CHROME`) and Remotion downloads its own headless browser.

Other commands:

| Command | What it does |
|---|---|
| `npm run studio` | Opens Remotion Studio: scrub the timeline, preview shots live |
| `npm run stills` | One review frame per shot into `out/stills/` |
| `npm run audio` | Regenerate only the soundtrack |
| `SKIP_RENDER=1 npm run build` | Re-mix audio onto an existing render |

## How it's organised

| File | Contents |
|---|---|
| `src/timeline.json` | Shot durations + sound-effect cues. The video and the audio both read this |
| `src/Shots.tsx` | The 16 shots: camera moves and all character animation |
| `src/chars/*` | Milo, Woofle (werewolf), Sheets (ghost) + skeleton, Jack (pumpkin-head), Nibbles (vampire) + bat, Mom |
| `src/sets.tsx` | Nursery (night + morning) and hallway sets, with lighting |
| `src/props.tsx` | Candy bucket, squeaky bone, star flashlight, puffs, steam, sparkles, hearts |
| `src/Episode.tsx` | Sequences the shots, title card, watermark, fades. Change `CHANNEL` here |
| `scripts/make_audio.py` | Score (sneaky pizzicato → hallway tension → warm twist → music-box morning) + all SFX |

## Making the next episode
The cast, sets and props are reusable. A new episode is a new `Shots.tsx` plus
a new `timeline.json`: same characters, new gags. That consistency is what
builds a recurring-character channel.
