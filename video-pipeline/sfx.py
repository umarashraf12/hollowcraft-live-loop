# Builds sfx.wav and music.wav (48 kHz) synced to the scene timeline in render/scene.js.
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000; DUR = 120.0; N = int(SR * DUR)
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

# --- ambience: soft wind bed
amb = lp(rng.standard_normal(N), 500) * .045
sfx[:, 0] += amb; sfx[:, 1] += np.roll(amb, 1200)

CL_PLACE, CL_LAND = .6 + (53 / 16) ** .5, .6 + (55 / 16) ** .5
# INTRO
add(3.4, whoosh(CL_LAND - .6, 200, 2500), .7)
add(2.8 + CL_PLACE, pour(), .8); add(2.8 + CL_LAND, splash(1.0), .9)
add(5.75, windburst(), .9); add(5.75, whoosh(1.0, 300, 2500, rise=False), .5)
add(7.05, whoosh(.8, 200, 3500), .8); add(7.85, boom(1.0), .9); add(8.4, poof(), .5)
add(9.0, riser(.6), .7); add(9.6, boom(.6), .8)
# cards / cuts
for c in [14.0, 58.0]: add(c - .35, whoosh(.4, 400, 5000), .8); add(c, boom(.35), .7); add(c + .05, pop(660), .7)
for c in [2.8, 5.6, 9.6, 17.4, 38.4, 50.8, 54.6, 61.2, 67.4, 81.0, 90.5, 100.0, 108.0]: add(c - .12, whoosh(.18, 800, 6000), .35)
# TRICK 1
for k in range(6): add(17.45 + k * .37, step(), .8, pan=(-.2 if k % 2 else .2))
add(19.4, whoosh(.9, 200, 2200), .7); add(20.3, tape_stop(), .9)
add(23.0, whoosh(9.8, 150, 2600), .85); add(23.6, click(), 1); add(32.42, pour(), .9); add(32.8, splash(1.4), 1.0); add(32.8, boom(.3), .6)
add(34.0, ding(), .9)
add(40.4, pop(990), .8); add(40.6, pop(1180), .6); add(42.4, buzz(), 1); add(43.2, buzz(), 1)
add(44.2, pour(), .7); add(44.6, splash(.8), .8); add(47.0, gurgle(), .9); add(46.9, click(), .6)
for k in range(5): add(47.7 + k * .37, step(), .6)
for base in [50.8, 54.6]:
    add(base + .6, whoosh(CL_LAND - .6, 200, 2500), .6); add(base + CL_PLACE, pour(), .7); add(base + CL_LAND, splash(1.0), .85); add(base + CL_LAND + .9, gurgle(), .6)
# TRICK 2
add(61.7, pop(880), .6); add(64.4, click(), .9); add(64.6, pop(990), .5); add(67.6, click(), 1)
add(69.0, whoosh(.3, 600, 4000), .5); add(69.3, windburst(), 1.0); add(69.3, whoosh(1.4, 400, 3000, rise=False), .7)
add(74.6, click(), 1); add(76.0, beep(), 1); add(76.25, beep(), 1); add(76.5, beep(1800), 1)
add(77.4, whoosh(2.9, 150, 4000), .95); add(80.3, boom(1.3), 1.0); add(80.85, poof(), .7)
rmap = lambda tm: 81 + (tm - 68.6) / (80.3 - 68.6) * 7
add(rmap(69.3), windburst(), .4); add(88.0, boom(.5), .5); add(88.1, ding(), .8); add(82.6, pop(990), .5)
add(92.0, windburst(), .9); add(93.2, windburst(), 1.0); add(93.2, whoosh(1.3, 400, 3000, rise=False), .6)
add(95.6, whoosh(2.0, 150, 4500), 1.0); add(97.6, boom(1.6), 1.0); add(98.15, poof(), .8)
add(100.4, pop(660), .7); add(100.8, pop(880), .6); add(101.3, pop(990), .6)
# OUTRO
add(108.6, pop(880), .7); add(111.0, pop(990), .6); add(113.0, pop(660), .7); add(114.15, click(), 1.2); add(114.3, bell(), 1); add(116.4, pop(880), .6)
add(118.8, boom(.5), .6)
sf.write('audio/sfx.wav', np.clip(sfx * .8, -1, 1), SR)

# --- music: original 4-chord loop, 112 BPM (A minor: Am F C G)
bpm = 112; beat = 60 / bpm; mus = np.zeros((N, 2), np.float32)
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def tone(f, sec, kind='pluck'):
    n = int(sec * SR); t = np.arange(n) / SR
    if kind == 'pluck': return (np.sign(np.sin(2 * np.pi * f * t)) * .25 + np.sin(2 * np.pi * f * t) * .75) * np.exp(-t * 7)
    if kind == 'bass': return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .01) * np.exp(-t * 2.2)
    if kind == 'pad': return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / .3) * np.minimum(1, (sec - t) / .3)
def madd(t0, x, g, pan=0):
    i = int(t0 * SR); x = x[:max(0, N - i)] * g
    mus[i:i + len(x), 0] += x * (1 - max(0, pan)); mus[i:i + len(x), 1] += x * (1 + min(0, pan))
nbeats = int(DUR / beat)
for b in range(nbeats):
    t0 = b * beat; bar = (b // 4) % 4; ch = chords[bar]
    if b % 4 == 0: [madd(t0, tone(mtof(m + 12), beat * 4, 'pad'), .035, pan=(-.3 + .3 * i)) for i, m in enumerate(ch)]
    madd(t0, tone(mtof(ch[0] - 24), beat * .95, 'bass'), .22)
    for e in range(2):  # 8th-note arpeggio
        n = ch[(b * 2 + e) % 3] + 12 + (12 if (b * 2 + e) % 6 == 5 else 0)
        madd(t0 + e * beat / 2, tone(mtof(n), beat * .6, 'pluck'), .06, pan=(.35 if e else -.35))
    if b % 2 == 0:  # kick
        n = int(.3 * SR); tt = np.arange(n) / SR; madd(t0, np.sin(2 * np.pi * (50 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9), .32)
    else:  # snare-ish
        madd(t0, bp(noise(.2), 1200, 6000) * env(int(.2 * SR), .001, .05), .12)
    for e in range(2): madd(t0 + e * beat / 2, hp(noise(.05), 7000) * env(int(.05 * SR), .001, .012), .05)
t = np.arange(N) / SR
g = np.ones(N)
g *= np.clip(t / 1.0, 0, 1)                                   # fade in
g *= 1 - .85 * np.clip((t - 20.3) / .1, 0, 1) * np.clip((23.0 - t) / .1, 0, 1)   # freeze-frame dropout
g *= np.clip((120 - t) / 2.0, 0, 1)                           # fade out
mus *= g[:, None]
sf.write('audio/music.wav', np.clip(mus, -1, 1), SR)
print('ok')
