# EP01 — "Monsters Tried to Steal Baby's Halloween Candy"

The same style as the reference (3D animated grumpy baby vs. night-time monsters,
no dialogue, music + SFX, ~100 s) with an original story and an **original cast** —
no Freddy/Chucky/Samara look-alikes, so no copyright claims or "reused content"
monetization problems.

> **A fully code-generated version of this episode (free, no AI credits) lives in
> [`../ep01-remotion`](../ep01-remotion).** This folder is for an AI-video version.

**Runtime:** 97 s · 16 shots · 16:9 master + 9:16 Shorts cut
**Release:** Halloween — upload by Oct 31 morning in your main audience's timezone.

## The story (logline)
Baby Milo guards his Halloween candy bucket. Four monsters try to scare him and steal
it — he defeats each with baby logic (squeaky toy, sheet yank, sour candy, flashlight).
The terrified monsters hide in the hallway… and he grumpily *shares* the candy.
Morning: Mom finds all four monsters asleep in the crib in footie pajamas. Milo: "shh."

| # | Beat | Gag |
|---|------|-----|
| 1-2 | Milo guards the candy | Suspicious side-eye |
| 3-5 | Werewolf **Woofle** reaches in | Squeaky bone → he fetches out the window |
| 6-7 | Ghost **Sheets** floats in | Sheet yanked → embarrassed tiny skeleton flees |
| 8-9 | Pumpkin-head **Jack** rises | Sour candy → face puckers, steam, runs |
| 10-11 | Vampire **Nibbles** from toy chest | Flashlight → poof into bat → bonk |
| 12-13 | Monsters hide in hallway | Milo approaches… |
| 14 | Twist | He shares the candy |
| 15-16 | Morning payoff | Monsters asleep in crib, Milo "shh" |

Every shot's exact **image prompt**, **motion prompt** and **SFX cues** are in
[`shots.json`](shots.json).

---

## Free production pipeline

### 1. Character sheets (do this first — it's what keeps characters consistent)
In a free image generator that accepts reference images (e.g. Google Gemini /
Nano Banana, Microsoft Copilot/Bing Image Creator, Meta AI, Leonardo free tokens),
generate one **character turnaround sheet** per character:

```
<style_prefix>, character turnaround sheet of <CHARACTER description>, front view,
3/4 view, side view, neutral grey background
```
Copy `style_prefix` and the character text from `shots.json`. Save the best one
of each. Re-use these sheets as the reference image in every shot.

### 2. Keyframes (16 images)
For each shot: attach the relevant character sheet(s) and prompt
```
<style_prefix>, <shot.image with character names replaced by their descriptions>
```
Use **16:9**. Save as `keyframes/shot01.png … shot16.png`.

> Even with only keyframes, `make_video.py` produces a watchable slow-zoom version
> — good for testing timing before you spend video credits.

### 3. Animate (image → video)
Free daily/trial credits exist on Kling AI, Hailuo (MiniMax), Google Flow/Veo,
Meta AI, Pika and Vidu — limits change often, so check each. Upload the keyframe as
the **start frame**, paste `shot.motion` as the prompt, 5–8 s, 16:9.
Save as `clips/shot01.mp4 … shot16.mp4` (any length/size/fps — the script fits them).

⚠️ **Read each free tier's terms**: several add a visible watermark and/or forbid
commercial use on free plans. A monetized channel needs output you're allowed to
use commercially. Don't crop out someone else's watermark.

Tips that save the most credits:
- Generate 2 takes only for the key gag shots (5, 7, 9, 11, 14, 16).
- Keep motion simple — one action per shot. Complex actions = melted faces.
- If a clip comes out short, the script freezes its last frame to fill the slot.

### 4. Sound (free, commercial-safe)
- **Music:** Pixabay Music or YouTube Audio Library → search *"spooky funny"*,
  *"halloween pizzicato"*, *"mischievous cartoon"*. Save as `audio/music.mp3`.
- **SFX:** Pixabay Sound Effects / YouTube Audio Library. Save into `audio/sfx/`
  with the exact filenames listed in `shots.json` (the script tells you which are
  missing). Timing is already set per shot.
- Optional: if your video model generated good audio, run with `--clip-audio 0.6`.

### 5. Branding
Put your logo as `logo.png` (transparent PNG) here, or set `channel_name` in
`shots.json` and a text watermark is drawn instead.

### 6. Build
```bash
python3 make_video.py
```
Needs only `ffmpeg` + Python 3. Output:
- `out/episode_16x9.mp4` — 1080p master, loudness-normalised to −14 LUFS (YouTube target)
- `out/episode_shorts_9x16.mp4` — vertical version for Shorts / TikTok / Reels

Re-run any time you replace a clip; it rebuilds in ~2 minutes.

---
Titles, thumbnail, description, tags and upload settings: [`PACKAGING.md`](PACKAGING.md).
