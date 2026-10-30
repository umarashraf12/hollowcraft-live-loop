#!/usr/bin/env python3
"""Synthesises the whole soundtrack (score + every sound effect) from scratch.

No samples, no downloads, nothing to license: every sound is generated here
with numpy. Cue timings come from src/timeline.json (same file the video uses).

    python3 scripts/make_audio.py   ->  public/soundtrack.wav
"""
import json
import wave
from pathlib import Path

import numpy as np

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- primitives
def secs(d):
    return np.arange(int(d * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.005, d=0.3, curve=1.0):
    """Linear attack, exponential decay; d = time to fall ~60 dB."""
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    return att * np.exp(-6.9 * np.maximum(t - a, 0) / max(d, 1e-4)) ** curve


def adsr(n, a=0.01, r=0.08):
    t = np.arange(n) / SR
    dur = n / SR
    return np.clip(t / a, 0, 1) * np.clip((dur - t) / r, 0, 1)


def glide(freqs, n):
    """Phase from a (piecewise-linear) frequency trajectory."""
    pts = np.linspace(0, 1, len(freqs))
    f = np.interp(np.linspace(0, 1, n), pts, freqs)
    return 2 * np.pi * np.cumsum(f) / SR


def harm(phase, amps):
    return sum(a * np.sin(phase * (k + 1)) for k, a in enumerate(amps))


def noise(n):
    return rng.standard_normal(n)


def filt(x, lo=None, hi=None, peaks=None):
    """Zero-phase FFT filter: high-pass `lo`, low-pass `hi`, optional formant peaks [(f, bw, gain)]."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / (1 + (f / hi) ** 4)
    if peaks:
        p = np.full_like(f, 0.05)
        for fc, bw, gain in peaks:
            p += gain * np.exp(-0.5 * ((f - fc) / bw) ** 2)
        g *= p
    return np.fft.irfft(X * g, n)


def reverb(x, decay=1.2, wet=0.3, hi=6000):
    ir = filt(noise(int(decay * SR)) * env(int(decay * SR), 0.001, decay), hi=hi)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    n = len(x) + len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x) + len(ir) - 1]
    out = np.zeros(len(y))
    out[: len(x)] += x * (1 - wet)
    out += y * wet * 0.6
    return out


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def cat(*parts):
    return np.concatenate(parts)


def silence(d):
    return np.zeros(int(d * SR))


def place(dst, src, t, gain=1.0):
    i = int(t * SR)
    if i >= len(dst):
        return
    j = min(len(dst), i + len(src))
    dst[i:j] += src[: j - i] * gain


# ------------------------------------------------------------------ voices
VOWELS = {
    'oo': [(300, 80, 1.0), (870, 120, 0.4), (2250, 200, 0.15)],
    'ah': [(730, 110, 1.0), (1090, 130, 0.7), (2440, 220, 0.3)],
    'ee': [(270, 70, 1.0), (2290, 200, 0.5), (3010, 250, 0.3)],
    'eh': [(530, 90, 1.0), (1840, 160, 0.6), (2480, 220, 0.3)],
}


def voice(f0s, d, vowel='ah', vib=5.5, vib_depth=0.02, breath=0.05):
    n = int(d * SR)
    ph = glide(f0s, n)
    ph += vib_depth * 2 * np.pi * np.sin(2 * np.pi * vib * secs(d)) * 3
    src = harm(ph, [1 / (k + 1) for k in range(24)]) + noise(n) * breath
    return filt(src, peaks=VOWELS[vowel])


def pluck(f, d=0.45, bright=1.0):
    n = int(d * SR)
    t = secs(d)
    out = np.zeros(n)
    for k in range(1, 10):
        if f * k > 14000:
            break
        out += np.sin(2 * np.pi * f * k * t) / k ** (1.6 - 0.4 * bright) * np.exp(-t * (6 + k * 3.5))
    return out * np.clip(t / 0.002, 0, 1)


def bell(f, d=1.6):
    t = secs(d)
    parts = [(1, 1.0, 2.2), (2.0, 0.35, 3.5), (2.76, 0.25, 4.5), (5.4, 0.12, 7), (8.93, 0.05, 9)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dec) for r, a, dec in parts) * np.clip(t / 0.002, 0, 1)


def bassoon(f, d):
    n = int(d * SR)
    ph = glide([f, f], n) + 0.01 * np.sin(2 * np.pi * 5 * secs(d))
    return filt(harm(ph, [0.4, 1.0, 0.8, 0.5, 0.3, 0.2, 0.12]), hi=1800) * adsr(n, 0.025, 0.05)


def pad(notes, d, level=0.2):
    n = int(d * SR)
    t = secs(d)
    out = np.zeros(n)
    for m in notes:
        for det in (-0.12, 0.0, 0.11):
            f = midi(m + det)
            out += harm(2 * np.pi * f * t, [1, 0.35, 0.15])
    a = np.clip(t / 0.8, 0, 1) * np.clip((d - t) / 0.8, 0, 1)
    return filt(out, hi=2500) * a * level / len(notes)


def woodblock(f=1100):
    d = 0.08
    t = secs(d)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t * 60)


def timp(f=55, d=1.6):
    t = secs(d)
    return (np.sin(2 * np.pi * f * t * (1 + 0.02 * np.exp(-t * 8))) * np.exp(-t * 2.5) + filt(noise(len(t)), hi=300) * np.exp(-t * 12) * 0.4)


# ------------------------------------------------------------------- score
def score(total):
    out = np.zeros(int((total + 3) * SR))
    bpm = 112
    beat = 60 / bpm
    e8 = beat / 2
    bar = beat * 4

    # main "sneaky" theme, D harmonic minor (8 eighths per bar)
    theme = [
        [74, None, 77, None, 81, None, 80, 81],
        [None, None, 77, None, 76, None, 73, None],
        [70, None, 74, None, 77, None, 76, 74],
        [73, None, 69, None, None, None, None, None],
        [74, None, 77, None, 81, None, 84, 82],
        [81, None, 77, None, 79, None, 76, None],
        [77, 76, 74, None, 73, None, 76, None],
        [74, None, None, None, 69, None, 62, None],
    ]
    roots = [(38, 45), (38, 45), (34, 41), (33, 40), (38, 45), (38, 45), (31, 38), (33, 40)]
    chords = [[62, 65, 69], [62, 65, 69], [58, 62, 65], [57, 61, 64], [62, 65, 69], [62, 65, 69], [55, 58, 62], [57, 61, 64]]

    # 0–6 s intro: celesta motif over a pad
    place(out, pad([50, 57, 62, 65], 6.2, 0.25), 0)
    for i, m in enumerate([74, 77, 81, 80, 81, 77, 74, 73]):
        place(out, bell(midi(m + 12), 1.4) * 0.16, 0.4 + i * 0.62)

    # 6–65 s main groove
    start, end = 6.0, 65.0
    b = 0
    while start + b * bar < end - 0.1:
        t0 = start + b * bar
        idx = b % 8
        r, fth = roots[idx]
        for i, m in enumerate([r, None, fth, None, r, None, fth, r + 12 if b % 2 else None]):
            if m:
                place(out, pluck(midi(m), 0.5, 0.6) * 0.55, t0 + i * e8)
        for k in (1, 3):
            place(out, woodblock(1250 if k == 1 else 1050) * 0.12, t0 + k * beat)
        lead = bassoon if (b // 8) % 2 == 1 else None
        for i, m in enumerate(theme[idx]):
            if m is None:
                continue
            if lead:
                place(out, lead(midi(m - 12), e8 * 0.9) * 0.22, t0 + i * e8)
            else:
                place(out, pluck(midi(m), 0.35, 1.0) * 0.28, t0 + i * e8)
        if idx in (0, 4):
            place(out, pad(chords[idx], bar * 2, 0.1), t0)
        if idx == 7:
            place(out, timp(46, 1.4) * 0.35, t0 + 3 * beat)
        b += 1

    # 65–77 s hallway tension: low tremolo, heartbeat, sparse bells
    d = 12
    t = secs(d)
    trem = (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t)) * np.clip(t / 2, 0, 1) * np.clip((d - t) / 0.4, 0, 1)
    place(out, pad([38, 39, 50], d, 0.35) * trem, 65)
    for i in range(int(d / (beat * 1.0))):
        tt = 65 + i * beat
        place(out, timp(48, 0.5) * (0.18 + 0.02 * i), tt)
        place(out, timp(48, 0.4) * (0.12 + 0.015 * i), tt + 0.18)
    for i, m in enumerate([86, 85, 86, 81]):
        place(out, bell(midi(m), 1.6) * 0.07, 66 + i * 2.6)
    place(out, timp(41, 3.0) * 0.6, 73.0)

    # 77–84 s the twist: warm D major
    place(out, pad([50, 57, 62, 66, 69], 7.4, 0.32), 77)
    arp = [62, 66, 69, 74, 78, 74, 69, 66]
    for i in range(22):
        place(out, bell(midi(arp[i % 8] + 12), 1.3) * 0.11, 77.3 + i * 0.3)

    # 84–97 s morning: music-box lullaby in G
    lull = [79, 83, 86, 83, 84, 81, 79, None, 76, 79, 81, 79, 78, 74, 79, None, 79, 83, 86, 88, 86, 83, 84, 81, 79]
    for i, m in enumerate(lull):
        if m:
            place(out, bell(midi(m + 12), 1.2) * 0.13, 84.4 + i * 0.5)
    for i, ch in enumerate([[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57], [55, 59, 62]]):
        place(out, pad(ch, 2.8, 0.2), 84 + i * 2.6)

    out = reverb(out, 1.6, 0.22)[: len(out)]
    # gentle fades
    n = int(total * SR)
    out = out[:n]
    out[: int(0.6 * SR)] *= np.linspace(0, 1, int(0.6 * SR))
    fade = int(2.5 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


# --------------------------------------------------------------------- SFX
def creak(d=1.4, f0=240, f1=330):
    n = int(d * SR)
    t = secs(d)
    rate = np.interp(t, [0, d * 0.3, d * 0.7, d], [f0, f1, f0 * 1.1, f1 * 0.9]) * (1 + 0.15 * np.sin(2 * np.pi * 3 * t))
    ph = np.cumsum(rate) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    body = filt(pulses * (0.6 + 0.4 * rng.random(n)), lo=300, hi=3500, peaks=[(900, 300, 1.0), (1700, 300, 0.6)])
    return body * adsr(n, 0.05, 0.2)


def growl(d=2.0, f=70, bright=600):
    n = int(d * SR)
    t = secs(d)
    am = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 11 * t + np.sin(2 * np.pi * 1.3 * t) * 2))
    src = harm(glide([f, f * 1.1, f * 0.95], n), [1 / (k + 1) ** 0.7 for k in range(30)]) * 0.5 + noise(n) * 0.6
    return filt(src, lo=40, hi=bright) * am * adsr(n, 0.15, 0.4)


def sweep_noise(d, f_from, f_to, bw=0.5):
    n = int(d * SR)
    out = np.zeros(n)
    bands = np.geomspace(f_from, f_to, 8)
    src = noise(n)
    for i, fc in enumerate(bands):
        centre = (i + 0.5) / len(bands) * d
        w = np.exp(-0.5 * ((secs(d) - centre) / (d / len(bands))) ** 2)
        out += filt(src, lo=fc * (1 - bw / 2), hi=fc * (1 + bw / 2)) * w
    return out


def squeak(d=0.3, f0=900, f1=1600):
    n = int(d * SR)
    ph = glide([f0, f1, f1 * 0.85], n) + 0.3 * np.sin(2 * np.pi * 30 * secs(d))
    return harm(ph, [1, 0.5, 0.25]) * adsr(n, 0.01, 0.05)


def clicks(d, rate, f_lo=800, f_hi=2500, decay=80, jitter=0.4):
    out = np.zeros(int(d * SR))
    t = 0.0
    while t < d - 0.05:
        f = rng.uniform(f_lo, f_hi)
        c = np.sin(2 * np.pi * f * secs(0.05)) * np.exp(-secs(0.05) * decay)
        place(out, c * rng.uniform(0.5, 1.0), t)
        t += (1 / rate) * rng.uniform(1 - jitter, 1 + jitter)
    return out


def chirps(d, count, f=(3200, 5200)):
    out = np.zeros(int(d * SR))
    for _ in range(count):
        a, b2 = rng.uniform(*f), rng.uniform(*f)
        c = np.sin(glide([a, b2, a * 1.1], int(0.09 * SR))) * np.hanning(int(0.09 * SR))
        place(out, c * rng.uniform(0.3, 1.0), rng.uniform(0, d - 0.1))
    return out


def sfx_bank():
    s = {}
    # night ambience
    cr = np.zeros(int(6 * SR))
    for k in range(9):
        t0 = 0.3 + k * 0.62 + rng.uniform(-0.05, 0.05)
        burst = np.sin(2 * np.pi * 4600 * secs(0.22)) * (np.sin(2 * np.pi * 32 * secs(0.22)) > 0) * np.hanning(int(0.22 * SR))
        place(cr, burst * 0.25, t0)
    s['crickets.mp3'] = cr
    s['wolf_howl_distant.mp3'] = filt(reverb(voice([380, 520, 700, 690, 560, 480], 3.0, 'oo', vib=5, vib_depth=0.01, breath=0.02) * adsr(int(3 * SR), 0.4, 1.0), 2.5, 0.6), hi=3000) * 0.6
    s['pacifier_squeak.mp3'] = cat(filt(noise(int(0.07 * SR)), lo=1500, hi=5000) * np.hanning(int(0.07 * SR)) * 0.4, silence(0.06),
                                   filt(noise(int(0.07 * SR)), lo=1500, hi=5000) * np.hanning(int(0.07 * SR)) * 0.4, squeak(0.08, 1300, 1700) * 0.3)
    s['window_creak.mp3'] = creak(1.5, 180, 320)
    s['growl_low.mp3'] = growl(2.0, 62, 500)
    s['werewolf_snarl.mp3'] = growl(1.6, 95, 1600) * 1.2
    s['squeak_toy.mp3'] = cat(squeak(0.22, 1000, 1700), silence(0.08), squeak(0.3, 1100, 1900))
    bark = lambda: voice([520, 640, 380], 0.18, 'ah', breath=0.3) * env(int(0.18 * SR), 0.01, 0.18)
    s['happy_bark.mp3'] = cat(bark(), silence(0.12), bark(), silence(0.1), voice([700, 900, 600], 0.35, 'ee', vib=8, vib_depth=0.04) * adsr(int(0.35 * SR), 0.02, 0.1) * 0.6)
    s['whoosh.mp3'] = sweep_noise(0.7, 300, 3500) * np.hanning(int(0.7 * SR))
    boo = voice([210, 230, 200, 170], 2.4, 'oo', vib=4.5, vib_depth=0.03, breath=0.15) * adsr(int(2.4 * SR), 0.4, 0.8)
    s['ghost_boo.mp3'] = reverb(boo + filt(noise(len(boo)), lo=400, hi=1500) * 0.15 * adsr(len(boo), 0.5, 0.8), 2.2, 0.5)
    s['cloth_whip.mp3'] = filt(noise(int(0.3 * SR)), lo=800, hi=7000) * env(int(0.3 * SR), 0.01, 0.25) ** 0.7
    s['bone_clatter.mp3'] = clicks(2.0, 14, 900, 2600, 90) * np.linspace(1, 0.4, int(2.0 * SR))
    fire = sweep_noise(1.5, 200, 1200, 0.8) * adsr(int(1.5 * SR), 0.3, 0.6) + clicks(1.5, 25, 2000, 5000, 300) * 0.2
    s['fire_whoosh.mp3'] = fire
    laugh = cat(*[cat(voice([150 - i * 8, 140 - i * 8], 0.16, 'ah', breath=0.2) * env(int(0.16 * SR), 0.01, 0.2), silence(0.07)) for i in range(6)])
    s['evil_laugh.mp3'] = reverb(laugh, 1.4, 0.35)
    s['crunch.mp3'] = cat(*[filt(noise(int(0.06 * SR)), lo=600, hi=6000) * env(int(0.06 * SR), 0.002, 0.06) * rng.uniform(0.5, 1) for _ in range(5)])
    kettle = np.sin(glide([1900, 2300, 2250], int(1.3 * SR))) * 0.4 + filt(noise(int(1.3 * SR)), lo=2500, hi=8000) * 0.5
    s['steam_whistle.mp3'] = kettle * adsr(int(1.3 * SR), 0.25, 0.2)
    s['cartoon_yelp.mp3'] = voice([500, 1300, 900], 0.45, 'ee', vib=12, vib_depth=0.05) * adsr(int(0.45 * SR), 0.02, 0.12)
    s['chest_creak.mp3'] = creak(1.2, 120, 220)
    s['bat_flutter.mp3'] = filt(noise(int(1.1 * SR)), lo=300, hi=2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * secs(1.1))) ** 2 * adsr(int(1.1 * SR), 0.05, 0.3)
    s['hiss.mp3'] = filt(noise(int(1.0 * SR)), lo=3000, hi=9000) * adsr(int(1.0 * SR), 0.08, 0.4)
    s['click.mp3'] = np.sin(2 * np.pi * 3000 * secs(0.02)) * np.exp(-secs(0.02) * 300)
    s['dramatic_shriek.mp3'] = reverb(voice([700, 1500, 1350, 1100], 1.2, 'ee', vib=9, vib_depth=0.05, breath=0.1) * adsr(int(1.2 * SR), 0.03, 0.3), 1.0, 0.3)
    poof_n = int(0.6 * SR)
    s['poof.mp3'] = filt(noise(poof_n), hi=900) * env(poof_n, 0.01, 0.5) + np.sin(glide([140, 60], poof_n)) * env(poof_n, 0.002, 0.25) * 0.8
    s['bonk.mp3'] = (np.sin(glide([720, 420], int(0.35 * SR))) + 0.4 * np.sin(glide([1500, 900], int(0.35 * SR)))) * env(int(0.35 * SR), 0.001, 0.3)
    s['teeth_chatter.mp3'] = clicks(3.0, 22, 1800, 3200, 200, 0.2)
    steps = np.zeros(int(4.5 * SR))
    for i in range(8):
        place(steps, filt(noise(int(0.12 * SR)), hi=400) * env(int(0.12 * SR), 0.005, 0.12) + np.sin(2 * np.pi * 80 * secs(0.12)) * env(int(0.12 * SR), 0.002, 0.1), 0.7 + i * 0.5)
    s['baby_footsteps.mp3'] = steps
    s['ominous_hit.mp3'] = reverb(timp(41, 3.0) + filt(noise(int(3 * SR)), hi=200) * env(int(3 * SR), 0.01, 1.2) * 0.5, 2.5, 0.4)
    sp = np.zeros(int(2.2 * SR))
    for i, m in enumerate([86, 90, 93, 98, 102, 98]):
        place(sp, bell(midi(m), 1.0) * 0.5, i * 0.08)
    s['sparkle_chime.mp3'] = sp
    aww = sum(voice([300 + d, 330 + d, 220 + d], 1.6, 'ah', vib=5, vib_depth=0.01, breath=0.1) for d in (-30, -12, 0, 14, 35))
    s['aww.mp3'] = reverb(aww * adsr(len(aww), 0.15, 0.6) / 5, 1.5, 0.4)
    s['birds_morning.mp3'] = chirps(7.0, 26)
    s['door_creak.mp3'] = creak(1.3, 150, 260)
    sn = np.zeros(int(4.5 * SR))
    for i in range(2):
        inh = filt(noise(int(1.0 * SR)), lo=200, hi=900) * np.hanning(int(1.0 * SR)) * 0.4
        exh = filt(harm(glide([70, 62], int(1.0 * SR)), [1 / (k + 1) for k in range(20)]), hi=700) * np.hanning(int(1.0 * SR)) * 0.6
        place(sn, cat(inh, exh), i * 2.2)
    s['snore.mp3'] = sn
    s['baby_shh.mp3'] = filt(noise(int(0.9 * SR)), lo=2200, hi=7000, peaks=[(3500, 900, 1.0)]) * adsr(int(0.9 * SR), 0.06, 0.35)
    ec = np.zeros(int(2.5 * SR))
    for i, m in enumerate([79, 83, 86, 91]):
        place(ec, bell(midi(m), 2.0) * 0.5, i * 0.12)
    s['end_chime.mp3'] = ec
    return {k: norm(v, 0.9) for k, v in s.items()}


def main():
    tl = json.loads((ROOT / 'src' / 'timeline.json').read_text())
    total = sum(s['duration'] for s in tl['shots'])
    music = score(total)
    bank = sfx_bank()
    fx = np.zeros(int(total * SR))
    start = 0.0
    missing = set()
    for shot in tl['shots']:
        for cue in shot['sfx']:
            snd = bank.get(cue['file'])
            if snd is None:
                missing.add(cue['file'])
                continue
            place(fx, snd, start + cue['at'], cue.get('vol', 0.8))
        start += shot['duration']
    if missing:
        raise SystemExit(f'no synth for: {sorted(missing)}')

    mix = norm(music, 0.5) + fx * 0.55
    # soft-clip safety, then stereo with a tiny Haas widening on the music bed
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    d = int(0.012 * SR)
    left = mix
    right = mix * 0.85 + np.concatenate([np.zeros(d), norm(music, 0.5)[:-d]]) * 0.15
    stereo = np.stack([left, right], axis=1)
    stereo = norm(stereo, 0.95)
    pcm = (stereo * 32767).astype('<i2')
    out = ROOT / 'public' / 'soundtrack.wav'
    out.parent.mkdir(exist_ok=True)
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'wrote {out.relative_to(ROOT)} ({total}s, {len(bank)} synthesized effects)')


if __name__ == '__main__':
    main()
