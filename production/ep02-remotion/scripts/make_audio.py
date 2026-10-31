#!/usr/bin/env python3
"""Synthesises the whole soundtrack (score + every sound effect) from scratch.

No samples, no downloads, nothing to license: every sound is generated here
with numpy. Cue timings come from src/edit.json (the same cut list the video uses).

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
def groove(out, t0, dur, theme, roots, lead='pluck', bpm=112, level=1.0, block=True, bells=False):
    beat = 60 / bpm
    e8 = beat / 2
    bar = beat * 4
    b = 0
    while b * bar < dur - 0.05:
        ts = t0 + b * bar
        idx = b % len(theme)
        r, fth = roots[idx]
        for i, m in enumerate([r, None, fth, None, r, None, fth, r + 12 if b % 2 else None]):
            if m and ts + i * e8 < t0 + dur:
                place(out, pluck(midi(m), 0.45, 0.6) * 0.5 * level, ts + i * e8)
        if block:
            for k in (1, 3):
                place(out, woodblock(1250 if k == 1 else 1050) * 0.11 * level, ts + k * beat)
        for i, m in enumerate(theme[idx]):
            if m is None or ts + i * e8 >= t0 + dur:
                continue
            if bells:
                place(out, bell(midi(m + 12), 0.9) * 0.14 * level, ts + i * e8)
            elif lead == 'bassoon' and (b // len(theme)) % 2 == 0:
                place(out, bassoon(midi(m - 12), e8 * 0.9) * 0.22 * level, ts + i * e8)
            else:
                place(out, pluck(midi(m), 0.32, 1.0) * 0.27 * level, ts + i * e8)
        b += 1


MINOR = [
    [74, None, 77, None, 81, None, 80, 81], [None, None, 77, None, 76, None, 73, None],
    [70, None, 74, None, 77, None, 76, 74], [73, None, 69, None, None, None, None, None],
    [74, None, 77, None, 81, None, 84, 82], [81, None, 77, None, 79, None, 76, None],
    [77, 76, 74, None, 73, None, 76, None], [74, None, None, None, 69, None, 62, None],
]
MINOR_ROOTS = [(38, 45), (38, 45), (34, 41), (33, 40), (38, 45), (38, 45), (31, 38), (33, 40)]
MAJOR = [
    [67, None, 71, None, 74, None, 71, 72], [74, None, 76, None, 74, None, 71, None],
    [72, None, 69, None, 72, None, 76, 74], [71, None, 67, None, None, None, None, None],
    [67, None, 71, None, 74, None, 79, 78], [76, None, 74, None, 72, None, 71, None],
    [69, 71, 72, None, 74, None, 66, None], [67, None, None, None, 62, None, 55, None],
]
MAJOR_ROOTS = [(43, 50), (43, 50), (48, 55), (43, 50), (43, 50), (48, 55), (50, 57), (43, 50)]
TIPTOE = [[74, None, None, 73, 74, None, None, None], [77, None, 76, None, 74, None, None, None],
          [70, None, None, 69, 70, None, None, None], [73, None, 74, None, 76, None, None, None]]
TIPTOE_ROOTS = [(38, 45), (38, 45), (34, 41), (33, 40)]
LULL = [79, 83, 86, 83, 84, 81, 79, None, 76, 79, 81, 79, 78, 74, 79, None, 79, 83, 86, 88, 86, 83, 84, 81, 79, None, 74, 79]


def music_box(out, t0, dur, level=1.0, step=0.5):
    for i, m in enumerate(LULL * 3):
        tt = t0 + 0.2 + i * step
        if tt > t0 + dur - 0.3:
            break
        if m:
            place(out, bell(midi(m + 12), 1.2) * 0.13 * level, tt)
    chords = [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]]
    k = 0
    while k * 2.6 < dur - 0.5:
        place(out, pad(chords[k % 4], min(2.8, dur - k * 2.6), 0.18 * level), t0 + k * 2.6)
        k += 1


def bubbles_bed(out, t0, dur):
    t = t0
    while t < t0 + dur - 0.2:
        n = int(0.09 * SR)
        f0 = rng.uniform(250, 500)
        b = np.sin(glide([f0, f0 * 2.6], n)) * env(n, 0.003, 0.09)
        place(out, b * 0.12, t)
        t += rng.uniform(0.12, 0.45)


def score(total, scenes):
    out = np.zeros(int((total + 3) * SR))
    for sc in scenes:
        t0, dur, cuts = sc['t0'], sc['dur'], sc['cut_t']
        style = sc['music']
        if style == 'tiptoe':
            groove(out, t0, dur, TIPTOE, TIPTOE_ROOTS, bpm=96, level=0.7, block=False)
        elif style == 'sneaky':
            place(out, pad([50, 57, 62, 65], dur, 0.2), t0)
            groove(out, t0 + 0.4, dur - 0.4, MINOR, MINOR_ROOTS, bpm=112)
        elif style == 'bouncy':
            groove(out, t0, dur, MAJOR, MAJOR_ROOTS, lead='bassoon', bpm=128)
        elif style == 'bubbly':
            groove(out, t0, dur, MAJOR, MAJOR_ROOTS, bpm=120, bells=True, level=0.9)
            bubbles_bed(out, t0, dur)
        elif style == 'lullaby_break':
            music_box(out, t0, cuts[2] - t0 + 0.1)
            d = cuts[8] - cuts[2]
            tr = secs(d)
            place(out, pad([38, 39, 50], d, 0.22) * (0.6 + 0.4 * np.sin(2 * np.pi * 8 * tr)), cuts[2])
            music_box(out, cuts[8], t0 + dur - cuts[8], level=0.9, step=0.55)
        elif style == 'tiptoe_end':
            groove(out, t0, cuts[7] - t0, TIPTOE, TIPTOE_ROOTS, bpm=96, level=0.7, block=False)
            music_box(out, cuts[7], t0 + dur - cuts[7] + 1.0, level=1.1)
            place(out, pad([55, 59, 62, 67], 4.0, 0.3), t0 + dur - 3.0)
        else:
            raise SystemExit(f'unknown music style {style}')
    out = reverb(out, 1.5, 0.2)[: len(out)]
    n = int(total * SR)
    out = out[:n]
    out[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
    fade = int(2.0 * SR)
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



def boing(f=300, d=0.5, depth=0.35, rate=28):
    n = int(d * SR)
    t = secs(d)
    ph = 2 * np.pi * np.cumsum(f * (1 + depth * np.sin(2 * np.pi * rate * t) * np.exp(-t * 6))) / SR
    return harm(ph, [1, 0.3, 0.1]) * env(n, 0.005, d)


def sfx_bank():
    s = {}
    jing = np.zeros(int(0.7 * SR))
    for _ in range(14):
        f = rng.uniform(3000, 7000)
        place(jing, sum(np.sin(2 * np.pi * f * r * secs(0.25)) * np.exp(-secs(0.25) * 25) for r in (1, 1.5, 2.3)), rng.uniform(0, 0.45))
    s['keys_jingle'] = jing
    s['kiss'] = cat(filt(noise(int(0.04 * SR)), lo=1000, hi=6000) * np.hanning(int(0.04 * SR)), voice([600, 900, 700], 0.28, 'oo', breath=0.3) * env(int(0.28 * SR), 0.01, 0.28))
    s['door_close'] = cat(timp(70, 0.6) + filt(noise(int(0.6 * SR)), hi=500) * env(int(0.6 * SR), 0.002, 0.2), np.sin(2 * np.pi * 2500 * secs(0.03)) * np.exp(-secs(0.03) * 200) * 0.5)
    tick = np.zeros(int(1.6 * SR))
    for i in range(4):
        place(tick, woodblock(1800 if i % 2 else 1400) * 0.8, i * 0.4)
    s['clock_tick'] = tick
    s['chest_creak'] = creak(1.2, 120, 220)
    s['door_creak'] = creak(1.3, 150, 260)
    s['pop_up'] = boing(220, 0.5, 0.25, 18) * 0.6 + np.sin(glide([200, 700], int(0.5 * SR))) * env(int(0.5 * SR), 0.005, 0.3)
    fire = sweep_noise(1.2, 200, 1200, 0.8) * adsr(int(1.2 * SR), 0.2, 0.5) + clicks(1.2, 25, 2000, 5000, 300) * 0.2
    s['fire_whoosh'] = fire
    tada = np.zeros(int(1.6 * SR))
    for m in (67, 71, 74, 79):
        n = int(1.5 * SR)
        brass = filt(harm(glide([midi(m) * 0.98, midi(m)], n), [1 / (k + 1) ** 0.8 for k in range(14)]), hi=3500) * adsr(n, 0.03, 0.5)
        place(tada, brass * 0.3, 0.12)
        place(tada, filt(harm(glide([midi(m)] * 2, int(0.12 * SR)), [1 / (k + 1) for k in range(10)]), hi=3000) * adsr(int(0.12 * SR), 0.01, 0.03) * 0.3, 0)
    s['tada'] = reverb(tada, 1.2, 0.3)
    s['eyebrow_boing'] = boing(380, 0.6, 0.4, 24)
    s['monster_hum'] = cat(*[voice([f, f], 0.35, 'oo', vib=5, vib_depth=0.02, breath=0.05) * adsr(int(0.35 * SR), 0.05, 0.1) for f in (130, 165, 147)])
    s['mush_bubble'] = cat(*[cat(np.sin(glide([140, 320], int(0.12 * SR))) * env(int(0.12 * SR), 0.005, 0.12), silence(0.15)) for _ in range(3)])
    s['baby_hmph'] = voice([470, 360], 0.3, 'eh', vib=6, vib_depth=0.02, breath=0.25) * env(int(0.3 * SR), 0.01, 0.3)
    n = int(2.2 * SR)
    t = secs(2.2)
    brr = harm(glide([110, 160, 120, 170, 115], n), [1 / (k + 1) for k in range(20)]) * (0.6 + 0.4 * np.sin(2 * np.pi * 32 * t))
    s['airplane'] = filt(brr, hi=1800, peaks=VOWELS['oo']) * adsr(n, 0.1, 0.3)
    sn = lambda: filt(noise(int(0.14 * SR)), lo=1500, hi=6000) * np.hanning(int(0.14 * SR))
    s['sniff'] = cat(sn(), silence(0.1), sn(), silence(0.08), sn() * 1.2)
    g = int(0.35 * SR)
    s['gulp'] = filt(np.sin(glide([320, 110], g)) + noise(g) * 0.2, hi=900) * env(g, 0.01, 0.35) + np.sin(2 * np.pi * 900 * secs(0.35)) * np.exp(-secs(0.35) * 60) * 0.3
    s['blink'] = np.sin(2 * np.pi * 2200 * secs(0.12)) * np.exp(-secs(0.12) * 40)
    chomp = np.zeros(int(1.8 * SR))
    for i in range(12):
        place(chomp, filt(noise(int(0.08 * SR)), lo=200, hi=2500) * env(int(0.08 * SR), 0.003, 0.08) * rng.uniform(0.6, 1), i * 0.13)
    place(chomp, s['gulp'], 1.5)
    s['gobble'] = chomp
    sl = sweep_noise(1.0, 400, 2200, 0.6) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * secs(1.0)))
    s['slurp'] = sl * adsr(len(sl), 0.05, 0.2)
    s['bonk'] = (np.sin(glide([720, 420], int(0.35 * SR))) + 0.4 * np.sin(glide([1500, 900], int(0.35 * SR)))) * env(int(0.35 * SR), 0.001, 0.3)
    s['whimper'] = voice([900, 760, 820, 650], 0.9, 'ee', vib=7, vib_depth=0.04, breath=0.15) * adsr(int(0.9 * SR), 0.05, 0.3)
    bb = np.zeros(int(2.2 * SR))
    tt = 0.0
    while tt < 2.0:
        m = int(0.08 * SR)
        place(bb, np.sin(glide([rng.uniform(300, 600), rng.uniform(900, 1400)], m)) * env(m, 0.003, 0.08) * 0.5, tt)
        tt += rng.uniform(0.05, 0.2)
    s['bubbles'] = bb
    s['duck_squeak'] = cat(squeak(0.12, 1200, 1500), silence(0.03), squeak(0.16, 1300, 1700))
    s['ghost_hum'] = reverb(cat(*[voice([f, f * 1.02], 0.4, 'oo', vib=4.5, vib_depth=0.03, breath=0.1) * adsr(int(0.4 * SR), 0.08, 0.1) for f in (330, 392, 349, 330)]), 1.6, 0.45)
    sp = int(0.8 * SR)
    s['splash'] = filt(noise(sp), lo=500, hi=9000) * env(sp, 0.003, 0.6) + cat(timp(90, 0.4), silence(0.4)) * 0.3
    sh = int(1.0 * SR)
    s['shrink'] = harm(glide([1300, 700, 300, 160], sh), [1, 0.4, 0.2]) * adsr(sh, 0.01, 0.15)
    s['gasp'] = filt(noise(int(0.35 * SR)), peaks=VOWELS['ah']) * adsr(int(0.35 * SR), 0.05, 0.1) + voice([500, 620], 0.35, 'ah', breath=0.6) * 0.3 * adsr(int(0.35 * SR), 0.05, 0.1)
    s['gasp_low'] = filt(noise(int(0.4 * SR)), peaks=VOWELS['oo']) * adsr(int(0.4 * SR), 0.05, 0.1) + voice([180, 230], 0.4, 'oo', breath=0.6) * 0.3 * adsr(int(0.4 * SR), 0.05, 0.1)
    s['bone_clatter'] = clicks(1.5, 14, 900, 2600, 90) * np.linspace(1, 0.4, int(1.5 * SR))
    s['towel_whoosh'] = sweep_noise(0.6, 400, 3000) * np.hanning(int(0.6 * SR))
    aww = sum(voice([300 + d, 330 + d, 220 + d], 1.4, 'ah', vib=5, vib_depth=0.01, breath=0.1) for d in (-30, -12, 0, 14, 35))
    s['aww'] = reverb(aww * adsr(len(aww), 0.15, 0.5) / 5, 1.5, 0.4)
    cr = filt(noise(int(1.0 * SR)), lo=800, hi=5000) * np.abs(np.sin(2 * np.pi * 5 * secs(1.0)) * np.sin(2 * np.pi * 1.3 * secs(1.0)))
    s['cloth_rustle'] = cr
    s['baby_giggle'] = cat(*[cat(voice([560 + i * 20, 640 + i * 20], 0.11, 'ee', breath=0.3) * env(int(0.11 * SR), 0.01, 0.11), silence(0.05)) for i in range(5)])
    s['spin'] = sweep_noise(1.2, 300, 4000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * secs(1.2))) * adsr(int(1.2 * SR), 0.1, 0.3)
    s['pop'] = np.sin(glide([1100, 500], int(0.12 * SR))) * env(int(0.12 * SR), 0.001, 0.12) + filt(noise(int(0.12 * SR)), lo=1500) * env(int(0.12 * SR), 0.001, 0.03)
    sw = int(1.4 * SR)
    s['slide_whistle'] = np.sin(glide([600, 1800, 1400, 500], sw) + 0.3 * np.sin(2 * np.pi * 6 * secs(1.4))) * adsr(sw, 0.05, 0.2) + filt(noise(sw), lo=1000, hi=4000) * 0.05
    zp = np.zeros(int(0.6 * SR))
    tt = 0.0
    i = 0
    while tt < 0.55:
        place(zp, np.sin(2 * np.pi * (1500 + i * 60) * secs(0.01)) * np.exp(-secs(0.01) * 400), tt)
        tt += 0.016
        i += 1
    s['zip_on'] = zp
    s['click'] = np.sin(2 * np.pi * 3000 * secs(0.02)) * np.exp(-secs(0.02) * 300)
    bi = int(1.0 * SR)
    s['big_inhale'] = filt(noise(bi), peaks=[(900, 300, 1.0), (1800, 400, 0.5)]) * np.linspace(0.1, 1, bi) * adsr(bi, 0.05, 0.08)
    notes = [(784, 0.8), (880, 0.6), (988, 0.6), (1175, 1.6), (1046, 0.7), (1318, 2.1)]
    op = cat(*[voice([f * 0.985, f, f * 1.01], d, 'ah', vib=6.5, vib_depth=0.045, breath=0.05) * adsr(int(d * SR), 0.06, 0.08) for f, d in notes])
    s['opera'] = reverb(op, 1.8, 0.4)
    s['howl_along'] = voice([300, 520, 600, 480], 1.0, 'oo', vib=5, vib_depth=0.02, breath=0.05) * adsr(int(1.0 * SR), 0.15, 0.3)
    s['rattle'] = clicks(0.8, 40, 2500, 5000, 150, 0.3)
    s['eye_twitch'] = cat(boing(900, 0.12, 0.3, 40), silence(0.06), boing(900, 0.12, 0.3, 40))
    s['pacifier_pop'] = s['pop'] * 1.0
    s['suck_squeak'] = cat(filt(noise(int(0.08 * SR)), lo=1500, hi=5000) * np.hanning(int(0.08 * SR)) * 0.5, squeak(0.1, 1300, 1800) * 0.5,
                           silence(0.12), filt(noise(int(0.08 * SR)), lo=1500, hi=5000) * np.hanning(int(0.08 * SR)) * 0.5)
    yw = np.zeros(int(3.2 * SR))
    for i, f in enumerate([140, 300, 220, 420]):
        place(yw, voice([f * 1.3, f * 1.5, f * 0.8], 0.9, 'ah', vib=4, vib_depth=0.015, breath=0.3) * adsr(int(0.9 * SR), 0.15, 0.4) * 0.8, i * 0.5)
    s['yawns'] = yw
    def snore_cycle(f=70, d=1.0, loud=1.0):
        inh = filt(noise(int(d * SR)), lo=200, hi=900) * np.hanning(int(d * SR)) * 0.4
        exh = filt(harm(glide([f, f * 0.9], int(d * SR)), [1 / (k + 1) for k in range(20)]), hi=700) * np.hanning(int(d * SR)) * 0.6
        return cat(inh, exh) * loud
    sn2 = np.zeros(int(4.0 * SR))
    place(sn2, snore_cycle(), 0)
    place(sn2, snore_cycle(), 2.0)
    s['snore'] = sn2
    s['big_snore'] = snore_cycle(55, 0.6, 1.4)
    s['baby_shh'] = filt(noise(int(0.9 * SR)), lo=2200, hi=7000, peaks=[(3500, 900, 1.0)]) * adsr(int(0.9 * SR), 0.06, 0.35)
    s['plush_squeak'] = filt(squeak(0.25, 700, 900), hi=1200) + timp(120, 0.25) * 0.3
    ec = np.zeros(int(2.5 * SR))
    for i, m in enumerate([79, 83, 86, 91]):
        place(ec, bell(midi(m), 2.0) * 0.5, i * 0.12)
    s['end_chime'] = ec
    return {k: norm(v, 0.9) for k, v in s.items()}


def main():
    ed = json.loads((ROOT / 'src' / 'edit.json').read_text())
    scenes, t = [], 0.0
    for sc in ed['scenes']:
        starts = [t]
        for c in sc['cuts']:
            starts.append(starts[-1] + c['dur'])
        scenes.append({**sc, 't0': t, 'dur': starts[-1] - t, 'cut_t': starts})
        t = starts[-1]
    total = t
    music = score(total, scenes)
    bank = sfx_bank()
    fx = np.zeros(int((total + 3) * SR))
    missing = set()
    for sc in scenes:
        for cue in sc['sfx']:
            snd = bank.get(cue['file'])
            if snd is None:
                missing.add(cue['file'])
                continue
            place(fx, snd, sc['cut_t'][cue['cut']] + cue['at'], cue.get('vol', 0.8))
    if missing:
        raise SystemExit(f'no synth for: {sorted(missing)}')
    fx = fx[: len(music)]
    mix = norm(music, 0.45) + fx * 0.55
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    d = int(0.012 * SR)
    right = mix * 0.85 + np.concatenate([np.zeros(d), norm(music, 0.45)[:-d]]) * 0.15
    stereo = norm(np.stack([mix, right], axis=1), 0.95)
    out = ROOT / 'public' / 'soundtrack.wav'
    out.parent.mkdir(exist_ok=True)
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype('<i2').tobytes())
    print(f'wrote {out.relative_to(ROOT)} ({total:.1f}s, {len(bank)} synthesized effects)')


if __name__ == '__main__':
    main()
