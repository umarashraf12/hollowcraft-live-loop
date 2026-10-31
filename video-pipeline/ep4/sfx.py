# Builds sfx.wav and music.wav (48 kHz) synced to the scene timeline in render/scene.js.
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000; DUR = 150.0; N = int(SR * DUR)
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
amb = lp(rng.standard_normal(N), 600) * .025; sfx[:, 0] += amb; sfx[:, 1] += np.roll(amb, 1200)
for tt in np.arange(1.0, 150, 3.7):  # distant birds
    f0 = rng.uniform(2600, 3600); m = int(.12 * SR); x = np.sin(2 * np.pi * (f0 + 600 * np.sin(np.linspace(0, 6, m))) * np.arange(m) / SR) * np.hanning(m) * .05
    add(tt + rng.uniform(0, 1.5), x, 1, pan=rng.uniform(-.7, .7))
# HOOK
add(0.4, eerie(2.8), .8); add(3.27, sparkle(), 1); add(3.3, ding(), .6)
add(4.0, pop(880), .6); add(4.6, ching(), 1); add(5.0, ching(), .8)
add(6.7, pop(880), .6); add(7.8, sparkle(), 1)
for tt in np.arange(9.6, 11.8, .5): add(tt, click(), .6); add(tt + .05, pop(1600), .35)
add(11.4, riser(.6), .7); add(12.0, boom(.6), .8)
for c in [14.0, 56.0, 97.0]: add(c - .35, whoosh(.4, 400, 5000), .8); add(c, boom(.35), .7); add(c + .05, pop(660), .7)
for c in [4.0, 6.7, 9.4, 18.6, 22.4, 28.0, 34.0, 45.6, 60.2, 65.0, 82.6, 100.8, 104.4, 108.6, 113.8, 116.8, 122.4, 138.4]: add(c - .12, whoosh(.18, 800, 6000), .35)
# TRICK 1
add(19.4, pop(990), .5); add(23.0, whoosh(.45, 600, 4000), .6); add(23.45, glass(), 1); add(23.6, pop(880), .4)
add(25.0, click(), .9); add(26.2, eat(), 1); add(26.3, pop(1100), .4); add(26.3, eerie(5.3), 1)
add(29.6, whoosh(.4, 300, 3000, rise=False), .5); add(31.6, sparkle(), 1); add(31.6, ding(), .8)
add(34.1, pop(880), .6); add(36.6, ching(), 1); add(37.1, ching(), .9); add(37.8, pop(1320), .6)
add(41.6, pop(990), .5); add(41.7, sparkle(), .5)
add(46.2, growl(), .8); add(48.2, growl(), .9); add(49.6, thud(), 1); add(49.6, boom(.25), .5); add(50.2, eerie(1.2), .9); add(50.4, pop(990), .5)
# TRICK 2
add(61.5, thud(), 1); add(63.0, ding(), .5); add(63.2, pop(990), .5)
for a_, b_ in [(61.5, 67.6), (68.6, 71.4), (72.0, 73.4), (74.0, 75.4), (76.0, 999)]:
    if a_ > 62: add(a_, thud(), 1)
    if b_ < 900: add(b_, crunch(), .9); add(b_, chop(), .5)
for tt in [62.3, 69.4, 72.8, 74.8]: add(tt, buzz(), .7)
add(76.6, sparkle(), 1); add(76.7, ding(), .7); add(78.9, click(), 1); add(79.2, clank(), .8); add(79.25, ding(), .5)
for k in range(4): add(83.1 + k * .25, pop(880 + k * 110), .5)
add(89.6, pop(990), .5)
# TRICK 3
add(101.2, pop(990), .5); add(102.0, pop(880), .5); add(104.5, pop(880), .6)
for k in range(7): add(108.7 + k * .3, pop(700 + k * 90), .45)
add(111.3, ching(), .8)
for tt in [114.0, 114.2, 114.5, 114.7, 115.0, 115.2, 115.5, 115.7, 116.0, 116.2]: add(tt, chop(), .8)
add(117.0, pop(880), .6)
for k, tt in enumerate(np.arange(123.0, 135.0, 1 / 5.3)): add(tt, click(), .4); add(tt + .04, pop(1500 + (k % 4) * 120), .3)
add(135.0, ching(), 1); add(135.0, ding(), .7)
# OUTRO
add(138.6, pop(880), .7); add(140.4, pop(990), .6); add(143.0, pop(660), .7); add(144.15, click(), 1.2); add(144.3, bell(), 1); add(146.4, pop(880), .6)
add(148.8, boom(.5), .6)
sf.write('audio/sfx.wav', np.clip(sfx * .8, -1, 1), SR)
# music: C major, 116 BPM (C G Am F), bright marimba-like plucks
bpm = 116; beat = 60 / bpm; mus = np.zeros((N, 2), np.float32)
chords = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def tone(f, sec, kind='pluck'):
    n = int(sec * SR); t = np.arange(n) / SR
    if kind == 'pluck': return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 30)) * np.exp(-t * 9)
    if kind == 'bass': return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .01) * np.exp(-t * 2.6)
    if kind == 'pad': return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / .3) * np.minimum(1, (sec - t) / .3)
def madd(t0, x, g, pan=0):
    i = int(t0 * SR); x = x[:max(0, N - i)] * g
    mus[i:i + len(x), 0] += x * (1 - max(0, pan)); mus[i:i + len(x), 1] += x * (1 + min(0, pan))
for b in range(int(DUR / beat)):
    t0 = b * beat; ch = chords[(b // 4) % 4]
    if b % 4 == 0: [madd(t0, tone(mtof(m + 24), beat * 4, 'pad'), .026, pan=(-.3 + .3 * i)) for i, m in enumerate(ch)]
    madd(t0, tone(mtof(ch[0]), beat * .9, 'bass'), .2)
    for e in range(2):
        n = ch[[0, 1, 2, 1][(b * 2 + e) % 4]] + 24 + (12 if (b * 2 + e) % 8 == 7 else 0)
        madd(t0 + e * beat / 2, tone(mtof(n), beat * .6, 'pluck'), .085, pan=(.35 if e else -.35))
    if b % 2 == 0: n = int(.28 * SR); tt = np.arange(n) / SR; madd(t0, np.sin(2 * np.pi * (55 + 85 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 10), .28)
    else: madd(t0, bp(noise(.18), 1500, 6500) * env(int(.18 * SR), .001, .04), .1)
    for e in range(2): madd(t0 + e * beat / 2, hp(noise(.05), 7000) * env(int(.05 * SR), .001, .012), .045)
t = np.arange(N) / SR
mus *= (np.clip(t / 1.0, 0, 1) * np.clip((150 - t) / 2.0, 0, 1))[:, None]
sf.write('audio/music.wav', np.clip(mus, -1, 1), SR)
print('ok')
