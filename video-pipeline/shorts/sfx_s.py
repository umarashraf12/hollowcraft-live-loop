# Builds sfx.wav and music.wav (48 kHz) synced to the scene timeline in render/scene.js.
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

import sys
SHORT = int(sys.argv[1]); SR = 48000; DUR = {1: 38.0, 2: 35.0, 3: 35.5}[SHORT]; N = int(SR * DUR)
rng = np.random.default_rng(7)
sfx = np.zeros((N, 2), np.float32)

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def env(n, a, d):  # attack/decay seconds, exponential decay
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4))
def add(t0, x, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(x) <= 0: return
    x = x[:N - i] * gain
    sfx[i:i + len(x), 0] += x * (1 - max(0, pan))
    sfx[i:i + len(x), 1] += x * (1 + min(0, pan))
def noise(sec): return rng.standard_normal(int(SR * sec))

def whoosh(sec, lo=300, hi=3000, rise=True):
    n = int(SR * sec); x = noise(sec)
    k = np.linspace(0, 1, n)
    a = lp(x, lo); b = lp(x, hi)
    mix = (a * (1 - k) + b * k) if rise else (b * (1 - k) + a * k)
    e = np.sin(np.pi * np.clip(k, 0, 1)) ** 1.5 if not rise else k ** 1.6 * (1 - np.clip((k - .92) / .08, 0, 1))
    return mix * e * .6
def splash(big=1.0):
    x = noise(1.2); y = bp(x, 400, 6000) * env(len(x), .005, .18) + lp(x, 900) * env(len(x), .01, .35) * .8
    drops = np.zeros_like(y)
    for _ in range(int(14 * big)):
        j = int(rng.uniform(.05, .9) * SR); f = rng.uniform(900, 2400); m = int(.05 * SR)
        drops[j:j + m] += np.sin(2 * np.pi * f * (1 + np.linspace(0, .6, m)) * np.arange(m) / SR) * np.exp(-np.arange(m) / (.012 * SR)) * .3
    return (y * .8 + drops) * big
def pour():
    x = noise(.35); return bp(x, 300, 2500) * env(len(x), .02, .12) * .6
def gurgle():
    out = np.zeros(int(.5 * SR))
    for k in range(6):
        j = int(k * .07 * SR); m = int(.06 * SR); f = 300 + k * 90
        out[j:j + m] += np.sin(2 * np.pi * f * (1 + np.linspace(0, 1, m)) * np.arange(m) / SR) * np.exp(-np.arange(m) / (.02 * SR)) * .5
    return out
def boom(big=1.0):
    n = int(1.8 * SR); t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    crack = hp(noise(1.8), 1200) * env(n, .001, .05) * .9
    rumble = lp(noise(1.8), 220) * env(n, .01, .6) * 1.4
    return (sub * 1.1 + crack + rumble) * big
def windburst():
    x = noise(.9); k = np.linspace(0, 1, len(x))
    y = bp(x, 200, 5000) * env(len(x), .003, .22)
    thump = np.sin(2 * np.pi * (90 + 120 * np.exp(-k * 12)) * k * .9) * np.exp(-k * 7) * .7
    return y * .9 + thump
def click():
    x = hp(noise(.03), 2000) * env(int(.03 * SR), .0005, .006); return x * .7
def pop(f=880):
    n = int(.18 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * (1 + 1.2 * np.exp(-t * 40)) * t) * np.exp(-t * 22) * .5
def ding():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1318.5 * t) + .5 * np.sin(2 * np.pi * 1975.5 * t) + .25 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 3.5) * .28
def buzz():
    n = int(.32 * SR); t = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * 110 * t)) * lp(np.ones(n), 50) * np.exp(-t * 4) * .12
def step():
    x = noise(.08); return lp(x, 700) * env(len(x), .002, .025) * .5
def beep(f=1400): n = int(.09 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * np.minimum(1, (n - np.arange(n)) / 400) * .22
def poof(): x = noise(.7); return bp(x, 200, 1800) * env(len(x), .02, .2) * .7
def riser(sec):
    n = int(sec * SR); k = np.linspace(0, 1, n); x = noise(sec)
    return (lp(x, 800) * (1 - k) + hp(x, 1500) * k) * k ** 2 * .5
def tape_stop():
    n = int(.6 * SR); t = np.arange(n) / SR
    f = 220 * np.exp(-t * 5); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) * .5 + lp(noise(.6), 120) * np.exp(-t * 4) * .7
def bell():
    n = int(1.0 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1046.5 * t) + .6 * np.sin(2 * np.pi * 1568 * t)) * np.exp(-t * 4) * .22


def fwoosh():  # firework launch
    n = int(1.1 * SR); t = np.arange(n) / SR; x = noise(1.1)
    hiss = hp(x, 2500) * np.exp(-t * 2.2) * .5 + bp(x, 400, 2000) * np.exp(-t * 3) * .5
    pop_ = lp(noise(1.1), 300) * env(n, .001, .05) * 1.2
    return hiss + pop_
def clank():  # armor swap
    n = int(.6 * SR); t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(620, 9), (1180, 12), (1730, 15), (2460, 18)]) * .18
    return y + hp(noise(.6), 3000) * env(n, .001, .02) * .4
def crunch():  # stone break
    x = noise(.25); return (lp(x, 1400) * env(len(x), .002, .05) + bp(x, 150, 600) * env(len(x), .002, .08)) * .8
def tick():  # pickaxe hitting stone
    x = noise(.06); return bp(x, 800, 4000) * env(len(x), .0005, .012) * .6
def thud():  # placing wood
    x = noise(.18); n = len(x); t = np.arange(n) / SR
    return bp(x, 250, 1600) * env(n, .001, .03) * .8 + np.sin(2 * np.pi * 140 * t) * np.exp(-t * 40) * .4
def sparkle():
    out = np.zeros(int(1.2 * SR))
    for i, f in enumerate([1568, 1976, 2349, 3136]):
        j = int(i * .07 * SR); m = int(.6 * SR); tt = np.arange(m) / SR
        out[j:j + m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) * .18
    return out
amb = lp(rng.standard_normal(N), 500) * .04
sfx[:, 0] += amb; sfx[:, 1] += np.roll(amb, 1200)

def lavapour():
    n = int(.6 * SR); t = np.arange(n) / SR; x = noise(.6)
    out = lp(x, 500) * env(n, .01, .2) * .9
    for k in range(5):
        j = int((.05 + k * .09) * SR); m = int(.08 * SR); f = 120 + k * 30
        out[j:j + m] += np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / (.02 * SR)) * .5
    return out
def sizzle():
    x = noise(.9); return hp(x, 3000) * env(len(x), .005, .3) * .6
def hum(sec):
    n = int(sec * SR); t = np.arange(n) / SR
    w = 1 + .02 * np.sin(2 * np.pi * 3 * t)
    return (np.sin(2 * np.pi * 110 * w * t) + .7 * np.sin(2 * np.pi * 113 * w * t) + .4 * np.sin(2 * np.pi * 220 * t)) * np.minimum(1, t / .3) * np.minimum(1, (sec - t) / .4) * .12
def slide(sec, rise=False):
    n = int(sec * SR); k = np.linspace(0, 1, n); x = noise(sec)
    return bp(x, 700, 3500) * (np.minimum(1, k / .1) * np.minimum(1, (1 - k) / .1)) * (.5 + .5 * k if rise else 1) * .5
def scrape():
    x = noise(.25); return bp(x, 2000, 7000) * env(len(x), .002, .06) * .7

def glass():
    x = noise(.5); out = hp(x, 2500) * env(len(x), .001, .08) * .9
    for k in range(8):
        j = int(rng.uniform(.02, .35) * SR); m = int(.12 * SR); f = rng.uniform(2500, 5200)
        out[j:j + m] += np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / (.025 * SR)) * .22
    return out
def eat():
    out = np.zeros(int(.7 * SR))
    for k in range(3): j = int(k * .2 * SR); y = crunch()[:int(.15 * SR)] * .8; out[j:j + len(y)] += y
    return out
def eerie(sec):
    n = int(sec * SR); t = np.arange(n) / SR; f = 220 + 160 * t / sec
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)) * (.6 + .4 * np.sin(2 * np.pi * 7 * t)) * np.minimum(1, t / .3) * np.minimum(1, (sec - t) / .3) * .09
def ching():
    out = np.zeros(int(.8 * SR))
    for i, f in enumerate([2093, 2637, 3136]):
        j = int(i * .06 * SR); m = int(.5 * SR); tt = np.arange(m) / SR; out[j:j + m] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * .2
    return out
def growl():
    n = int(.9 * SR); t = np.arange(n) / SR; f = 90 + 20 * np.sin(2 * np.pi * 3 * t)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * lp(noise(.9), 600) * .0 + lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 500) * np.sin(np.pi * t / .9) * .25
def chop():
    x = noise(.2); n = len(x); t = np.arange(n) / SR
    return bp(x, 300, 2500) * env(n, .001, .04) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 30) * .4

def crackle(sec):
    n = int(sec * SR); out = np.zeros(n)
    for _ in range(int(sec * 14)):
        j = rng.integers(0, n - 2000); m = int(rng.uniform(.004, .02) * SR); out[j:j + m] += hp(rng.standard_normal(m), 2500) * np.exp(-np.arange(m) / (m / 3)) * rng.uniform(.2, .6)
    return out + lp(noise(sec), 400) * .05
def heartbeat():
    n = int(.5 * SR); t = np.arange(n) / SR; b = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 18)
    out = np.zeros(n); out[:] += b; j = int(.18 * SR); out[j:] += b[:n - j] * .7; return out * .9
def sting():
    n = int(1.6 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 110 * t) + np.sin(2 * np.pi * 116.5 * t) + .6 * np.sin(2 * np.pi * 233 * t) + .4 * np.sin(2 * np.pi * 349 * t)) * np.minimum(1, t / .05) * np.exp(-t * 1.6) * .14 + hp(noise(1.6), 3000) * np.exp(-t * 6) * .25
def fire():
    x = noise(.8); return bp(x, 300, 3000) * env(len(x), .02, .25) * .7
def creak():
    n = int(.7 * SR); t = np.arange(n) / SR; f = 300 + 120 * np.sin(2 * np.pi * 3 * t)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * bp(np.ones(n), 200, 2000) * 0 + lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 1500) * np.sin(np.pi * t / .7) * .12
amb = lp(rng.standard_normal(N), 600) * .02; sfx[:, 0] += amb; sfx[:, 1] += np.roll(amb, 1200)
if SHORT == 1:
    add(0.0, riser(.5), .4); add(.4, boom(.4), .5)
    for tt in [3.2, 5.0, 7.0]: add(tt, sparkle(), .6)
    for tt in [11.9, 12.3, 12.7, 13.1]: add(tt, step(), .5)
    add(14.4, whoosh(2.4, 2000, 200, rise=False), .5); add(14.6, eerie(2.6), .5)
    add(16.8, crackle(15.0), .5)
    add(19.5, boom(.5), .7); add(19.6, sting(), .9); add(22.7, glass(), 1.3); add(22.7, glass(), 1.0); add(22.7, boom(.45), .8)
    for k, tt in enumerate(np.arange(23.95, 27.0, .19)): add(tt, step(), .6, pan=(-.3 if k % 2 else .3))
    add(24.5, growl(), .7); add(27.5, growl(), .7); add(29.8, fire(), 1); add(29.85, whoosh(.6, 400, 4000, rise=False), .6)
    add(31.0, poof(), .9); add(31.0, sparkle(), .7); add(31.05, boom(.3), .5)
    add(33.2, ding(), .8); add(33.2, boom(.3), .5); add(36.0, pop(880), .7)
elif SHORT == 2:
    add(0.0, riser(.5), .4); add(.4, boom(.4), .5)
    for tt in np.arange(.5, 18, 1.1): add(tt + rng.uniform(0, .5), lavapour()[:int(.3 * SR)], .25, pan=rng.uniform(-.5, .5))
    for tt in [6.8, 7.8, 8.6]: add(tt, ding(), .5); add(tt, pop(990), .4)
    add(10.4, whoosh(2.0, 2000, 200, rise=False), .5); add(10.6, eerie(1.8), .4)
    add(12.4, boom(.5), .7); add(12.5, sting(), .8)
    for tt in [15.8, 19.6, 21.4]: add(tt, buzz(), 1.0); add(tt, boom(.2), .4)
    add(15.2, whoosh(2.4, 300, 2000), .4); add(18.6, eerie(1.6), .8); add(18.6, whoosh(1.6, 200, 1500), .5)
    add(23.6, creak(), 1); add(23.7, thud(), .7)
    add(24.9, fire(), 1.1); add(24.9, whoosh(.6, 400, 4000, rise=False), .7); add(24.95, ding(), .6); add(25.2, poof(), .9); add(25.25, sparkle(), .6)
    add(25.0, crackle(10.0), .45)
    add(27.8, boom(.3), .5); add(27.85, pop(1100), .6); add(33.0, pop(880), .7)
else:
    add(0.0, riser(.5), .4); add(.4, boom(.4), .5)
    add(.0, crackle(15.0), .55); add(24.0, crackle(6.2), .5)
    for tt in [7.0, 10.0, 12.0, 15.0]: add(tt, sizzle(), 1.0); add(tt, poof(), .3)
    add(15.0, boom(.3), .4)
    for tt in np.arange(15.6, 24.0, .85): add(tt, heartbeat(), .9)
    add(17.0, sting(), 1.0); add(21.9, growl(), .6)
    add(23.85, scrape(), 1); add(23.9, click(), .8); add(24.0, fire(), 1.1); add(24.0, boom(.35), .6); add(24.3, poof(), .9); add(24.35, sparkle(), .6)
    add(25.4, step(), .6); add(25.8, step(), .6)
    add(30.2, sizzle(), 1.0); for_tt = [30.8, 31.65, 32.5]
    for tt in for_tt: add(tt, heartbeat(), .9)
    add(30.6, sting(), 1.1); add(33.0, boom(.6), .9); add(33.3, sting(), .7)
sf.write(f'audio/sfx{SHORT}.wav', np.clip(sfx * .8, -1, 1), SR)
# --- music: playful bed + tense bed, crossfaded per story
t = np.arange(N) / SR
def bed(bpm, chords, kind):
    beat = 60 / bpm; m = np.zeros(N)
    mtof = lambda x: 440 * 2 ** ((x - 69) / 12)
    for b in range(int(DUR / beat) + 1):
        t0 = b * beat; ch = chords[(b // 4) % 4]; i0 = int(t0 * SR)
        def put(x, g):
            x = x[:max(0, N - i0)] * g; m[i0:i0 + len(x)] += x
        tt = np.arange(int(beat * SR)) / SR
        if kind == 'play':
            put(np.sin(2 * np.pi * mtof(ch[0]) * tt) * np.exp(-tt * 3), .2)
            for e in range(2):
                n = ch[[0, 1, 2, 1][(b * 2 + e) % 4]] + 24; x = (np.sin(2 * np.pi * mtof(n) * tt[:len(tt) // 2]) + .3 * np.sin(2 * np.pi * 4 * mtof(n) * tt[:len(tt) // 2]) * np.exp(-tt[:len(tt) // 2] * 30)) * np.exp(-tt[:len(tt) // 2] * 10)
                j = int(e * beat / 2 * SR); xx = np.zeros(len(tt)); xx[j:j + len(x)] = x[:len(tt) - j]; put(xx, .09)
            if b % 2 == 0: put(np.sin(2 * np.pi * (55 + 85 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 10), .26)
            else: put(bp(noise(beat), 1500, 6500) * env(len(tt), .001, .04), .09)
        else:
            if b % 4 == 0:
                L = int(beat * 4 * SR); T4 = np.arange(L) / SR; x = sum(np.sin(2 * np.pi * mtof(n) * T4) for n in ch) * np.minimum(1, T4 / .5) * np.minimum(1, (beat * 4 - T4) / .5)
                x = x[:max(0, N - i0)] * .045; m[i0:i0 + len(x)] += x
            put(np.sin(2 * np.pi * mtof(ch[0] - 12) * tt) * np.exp(-tt * 4), .22 if b % 2 == 0 else .12)
            if b % 2 == 1: put(hp(noise(beat), 6000) * env(len(tt), .001, .02), .05)
    return m
play = bed(124, [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]], 'play')
tense = bed(92, [[50, 53, 57], [49, 53, 56], [46, 50, 53], [45, 49, 52]], 'tense')
def win(a, b, f=.6): return np.clip((t - a) / f, 0, 1) * np.clip((b - t) / f, 0, 1)
if SHORT == 1: mp, mt = win(-1, 14.6) + win(32.0, 99), win(14.4, 32.2)
elif SHORT == 2: mp, mt = win(-1, 10.6) + win(26.0, 99), win(10.4, 26.2)
else: mp, mt = win(-1, 6.5, 1.5) * .7 + win(25.0, 30.2, .4) * .5, win(5.0, 15.0, 1.0) * .8 + win(30.6, 33.0, .3) * .9
mus = (play * mp + tense * mt) * np.clip(t / .5, 0, 1) * np.clip((DUR - t) / .8, 0, 1)
sf.write(f'audio/music{SHORT}.wav', np.stack([mus, mus], 1).astype(np.float32), SR)
print('ok', SHORT)
