#!/usr/bin/env python3
"""Assemble an episode from shots.json using only ffmpeg (free).

Per shot it uses clips/shotNN.(mp4|mov|webm) if present, otherwise animates
keyframes/shotNN.(png|jpg|webp) with a slow zoom, otherwise a black card.
Then it lays music + sound effects, adds a watermark, normalises loudness
and writes out/episode_16x9.mp4 plus out/episode_shorts_9x16.mp4.

    python3 make_video.py                 # build everything
    python3 make_video.py --clip-audio 0.6  # keep AI-generated clip audio
    python3 make_video.py --no-shorts
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
W, H, FPS = 1920, 1080, 30
VIDEO_EXT = (".mp4", ".mov", ".webm", ".mkv")
IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg failed:\n{' '.join(cmd)}\n{r.stderr[-2000:]}")


def find(folder, stem, exts):
    for ext in exts:
        p = ROOT / folder / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def has_audio(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a",
                        "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True)
    return bool(r.stdout.strip())


def render_shot(shot, out):
    stem = f"shot{shot['id']:02d}"
    dur = shot["duration"]
    fit = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
           f"setsar=1,fps={FPS},format=yuv420p")
    silence = ["-f", "lavfi", "-t", str(dur), "-i", "anullsrc=r=48000:cl=stereo"]
    enc = ["-c:v", "libx264", "-preset", "medium", "-crf", "18",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
           "-t", str(dur), str(out)]

    clip = find("clips", stem, VIDEO_EXT)
    if clip:
        # tpad freezes the last frame if the AI clip is shorter than the slot.
        vf = f"{fit},tpad=stop_mode=clone:stop_duration={dur}"
        if has_audio(clip):
            cmd = ["ffmpeg", "-y", "-i", str(clip), "-vf", vf,
                   "-af", f"apad,atrim=0:{dur}", "-map", "0:v:0", "-map", "0:a:0"]
        else:
            cmd = ["ffmpeg", "-y", "-i", str(clip), *silence, "-vf", vf,
                   "-map", "0:v:0", "-map", "1:a:0"]
        run(cmd + enc)
        return "clip"

    img = find("keyframes", stem, IMAGE_EXT)
    if img:
        frames = dur * FPS
        # Upscale first so the slow zoom stays smooth instead of jittering.
        vf = (f"scale={W * 2}:{H * 2}:force_original_aspect_ratio=increase,crop={W * 2}:{H * 2},"
              f"zoompan=z='min(1+0.10*on/{frames},1.10)':d={frames}"
              f":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
              f"setsar=1,format=yuv420p")
        run(["ffmpeg", "-y", "-loop", "1", "-i", str(img), *silence, "-vf", vf,
             "-map", "0:v:0", "-map", "1:a:0"] + enc)
        return "keyframe"

    vf = (f"drawtext=fontfile={FONT}:text='SHOT {shot['id']} MISSING':"
          f"fontcolor=white:fontsize=72:x=(w-tw)/2:y=(h-th)/2")
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={FPS}:d={dur}",
         *silence, "-vf", vf, "-map", "0:v:0", "-map", "1:a:0"] + enc)
    return "missing"


def build_audio_mix(cfg, video, total, clip_audio, out):
    inputs, filters, labels = ["-i", str(video)], [], []
    n = 1
    if clip_audio > 0:
        filters.append(f"[0:a]volume={clip_audio}[ca]")
        labels.append("[ca]")

    music = ROOT / cfg["music"]["file"]
    if music.exists():
        inputs += ["-stream_loop", "-1", "-i", str(music)]
        filters.append(f"[{n}:a]atrim=0:{total},volume={cfg['music']['volume']},"
                       f"afade=t=in:d=1.5,afade=t=out:st={max(total - 3, 0)}:d=3[m]")
        labels.append("[m]")
        n += 1
    else:
        print(f"  ! no music at {music.relative_to(ROOT)} (building without it)")

    missing, start = [], 0.0
    for shot in cfg["shots"]:
        for fx in shot.get("sfx", []):
            p = ROOT / "audio" / "sfx" / fx["file"]
            if not p.exists():
                missing.append(fx["file"])
                continue
            ms = int((start + fx["at"]) * 1000)
            inputs += ["-i", str(p)]
            filters.append(f"[{n}:a]volume={fx.get('vol', 0.8)},adelay={ms}|{ms}[s{n}]")
            labels.append(f"[s{n}]")
            n += 1
        start += shot["duration"]
    if missing:
        print(f"  ! {len(missing)} sound effects missing in audio/sfx/: {', '.join(sorted(set(missing)))}")

    if not labels:
        filters.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{total}[mix]")
    else:
        # normalize=0 keeps each layer at the volume set in shots.json.
        filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,"
                       f"atrim=0:{total}[mix]")
    filters.append("[mix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]")
    run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filters),
         "-map", "[out]", "-c:a", "pcm_s16le", str(out)])


def watermark_filter(cfg):
    logo = ROOT / "logo.png"
    if logo.exists():
        return logo, "[1:v]scale=220:-1,format=rgba,colorchannelmixer=aa=0.85[lg];[0:v][lg]overlay=W-w-40:H-h-30[v]"
    text = cfg["channel_name"].replace("'", "").replace(":", "")
    return None, (f"[0:v]drawtext=fontfile={FONT}:text='{text}':fontcolor=white@0.85:fontsize=34:"
                  f"borderw=3:bordercolor=black@0.6:x=w-tw-40:y=h-th-30[v]")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clip-audio", type=float, default=0.0,
                    help="volume of the audio baked into AI clips (0 = mute, default)")
    ap.add_argument("--no-shorts", action="store_true")
    args = ap.parse_args()

    cfg = json.loads((ROOT / "shots.json").read_text())
    tmp, out = ROOT / "tmp", ROOT / "out"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    out.mkdir(exist_ok=True)

    segs, used = [], {}
    for shot in cfg["shots"]:
        seg = tmp / f"seg{shot['id']:02d}.mp4"
        kind = render_shot(shot, seg)
        used[kind] = used.get(kind, 0) + 1
        print(f"  shot {shot['id']:2d}: {kind}")
        segs.append(seg)
    total = sum(s["duration"] for s in cfg["shots"])

    concat = tmp / "list.txt"
    concat.write_text("".join(f"file '{s}'\n" for s in segs))
    joined = tmp / "joined.mp4"
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(joined)])

    mix = tmp / "mix.wav"
    build_audio_mix(cfg, joined, total, args.clip_audio, mix)

    logo, wm = watermark_filter(cfg)
    final = out / "episode_16x9.mp4"
    cmd = ["ffmpeg", "-y", "-i", str(joined)]
    if logo:
        cmd += ["-i", str(logo)]
    cmd += ["-i", str(mix), "-filter_complex", wm, "-map", "[v]", "-map", f"{2 if logo else 1}:a",
            "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(final)]
    run(cmd)
    print(f"  -> {final.relative_to(ROOT)} ({total}s)")

    if not args.no_shorts:
        # Vertical cut: blurred full-bleed background with the 16:9 picture centred.
        shorts = out / "episode_shorts_9x16.mp4"
        vf = ("[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,"
              "crop=1080:1920,boxblur=30:2[bg];[b]scale=1080:-2[fg];"
              "[bg][fg]overlay=0:(H-h)/2,format=yuv420p[v]")
        run(["ffmpeg", "-y", "-i", str(final), "-filter_complex", vf, "-map", "[v]", "-map", "0:a",
             "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-c:a", "copy",
             "-movflags", "+faststart", str(shorts)])
        print(f"  -> {shorts.relative_to(ROOT)}")

    if used.get("missing"):
        print(f"\n{used['missing']} shot(s) still missing - drop files into clips/ or keyframes/ and rerun.")


if __name__ == "__main__":
    main()
