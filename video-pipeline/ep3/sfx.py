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
# Nether rumble + lava pops during Nether/tunnel scenes
NETH = [(0, 5), (7.2, 14), (53.5, 97.3 + 41.1), (138.4, 150)]
rum = lp(rng.standard_normal(N), 160) * .16; mask = np.zeros(N)
for a, b in NETH: mask[int(a * SR):int(b * SR)] = 1
mask = np.convolve(mask, np.ones(4800) / 4800, mode='same')
sfx[:, 0] += rum * mask; sfx[:, 1] += np.roll(rum, 800) * mask
for a, b in NETH:
    for tt in np.arange(a + .3, b, 1.7): add(tt + rng.uniform(0, .8), pop(rng.uniform(140, 260)), .25, pan=rng.uniform(-.6, .6))
amb = lp(rng.standard_normal(N), 500) * .03; sfx[:, 0] += amb; sfx[:, 1] += np.roll(amb, 1200)
# HOOK
add(.1, hum(1.6), .9)
for k in range(5): add(.8 + k * .4, step(), .6)
add(5.61, scrape(), 1); add(5.61, click(), .8); add(5.65, whoosh(.5, 300, 3000, rise=False), .6); add(5.7, hum(1.5), 1)
add(8.0, boom(1.5), 1); add(8.05, poof(), .6)
add(9.8, slide(2.0), 1); add(9.8, whoosh(2.0, 1500, 6000), .5)
add(11.2, riser(.6), .7); add(11.8, boom(.6), .8)
for c in [14.0, 55.0, 97.0]: add(c - .35, whoosh(.4, 400, 5000), .8); add(c, boom(.35), .7); add(c + .05, pop(660), .7)
for c in [5.0, 7.2, 9.8, 18.6, 23.2, 35.4, 40.6, 45.8, 59.8, 64.6, 71.6, 76.2, 81.2, 87.6, 100.6, 105.4, 109.4, 113.4, 117.6, 122.6, 126.6, 131.0, 138.4]: add(c - .12, whoosh(.18, 800, 6000), .35)
# TRICK 1
for tt in np.arange(18.7, 23.2, 1 / 2.6): add(tt, tick(), .8); add(tt, clank(), .15)
add(19.0, pop(990), .5); add(20.6, buzz(), .8)
CAST = [(24.0, 27.5, 28.25, 32.0), (32.5, 33.3, 33.75, 34.6)] + [(b, b + .18, b + .3, b + .45) for b in [35.5 + .55 * k for k in range(8)]]
for i, (lv, wa, ob, sc) in enumerate(CAST):
    g = 1 if i < 2 else .55
    add(lv, lavapour(), g); add(wa, pour(), g * .9); add(ob, sizzle(), g); add(sc, gurgle(), g * .7)
add(26.8, pop(880), .6); add(28.25, sparkle(), .8); add(37.2, buzz(), .5); add(37.4, pop(990), .5)
add(41.5, scrape(), 1); add(41.5, click(), .8); add(41.55, whoosh(.6, 300, 3000, rise=False), .7); add(41.6, hum(4.2), 1.1); add(42.1, pop(1180), .6)
add(44.4, riser(1.4), .6); add(46.0, pop(880), .6); add(52.4, riser(1.1), .7); add(53.5, boom(.5), .6); add(53.55, hum(1.4), .8)
# TRICK 2
add(60.0, pop(880), .6)
for tt in np.arange(64.9, 71.3, .2): add(tt, crunch(), .55); add(tt + .1, tick(), .3)
add(67.4, pop(990), .5); add(72.4, thud(), 1)
for tt in [72.9, 73.3, 73.7, 74.1]: add(tt, step(), .6)
add(74.95, click(), 1); add(75.15, boom(1.7), 1); add(75.2, poof(), .8)
for tt in [76.5, 76.75, 77.0]: add(tt, pop(990), .45)
add(81.3, pop(880), .6); add(82.0, sizzle(), .4); add(83.5, pop(990), .6); add(84.1, ding(), .7)
add(87.8, pop(880), .6); add(88.4, pop(990), .6)
for k, tt in enumerate(np.arange(87.7, 96.0, .42)): add(tt, step(), .45, pan=(-.2 if k % 2 else .2))
# TRICK 3
add(100.8, pop(880), .6); add(102.5, ding(), .5)
for k in range(20): add(105.8 + k * .17, thud(), .6); add(105.8 + k * .17, tick(), .4)
add(109.9, whoosh(.8, 300, 3000), .7); add(109.9, slide(3.5, rise=True), 1.1)
add(113.6, pop(880), .6)
for tt in np.arange(113.5, 117.5, 3.2): add(tt, whoosh(1.2, 600, 5000, rise=False), .4)
add(117.8, pop(990), .5); add(118.8, pop(990), .5)
add(123.0, slide(3.6), 1.1); add(123.0, whoosh(3.0, 1500, 6000), .5); add(125.14, ding(), .9)
add(126.6, slide(4.4), .5)
add(131.0, slide(2.6), .7); add(134.4, step(), .7); add(135.2, step(), .7); add(135.6, ding(), .8); add(136.6, step(), .7)
# OUTRO
add(138.6, pop(880), .7); add(140.4, pop(990), .6); add(143.0, pop(660), .7); add(144.15, click(), 1.2); add(144.3, bell(), 1); add(146.4, pop(880), .6)
add(148.8, boom(.5), .6)
sf.write('audio/sfx.wav', np.clip(sfx * .8, -1, 1), SR)
# music: D minor, 108 BPM (Dm Bb F C), heavier low end for the Nether
bpm = 108; beat = 60 / bpm; mus = np.zeros((N, 2), np.float32)
chords = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def tone(f, sec, kind='pluck'):
    n = int(sec * SR); t = np.arange(n) / SR
    if kind == 'pluck': return (np.sign(np.sin(2 * np.pi * f * t)) * .3 + np.sin(2 * np.pi * f * t) * .7) * np.exp(-t * 7)
    if kind == 'bass': return (np.sin(2 * np.pi * f * t) + .25 * np.sign(np.sin(2 * np.pi * f * t))) * np.minimum(1, t / .01) * np.exp(-t * 2.0)
    if kind == 'pad': return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2.003 * f * t)) * np.minimum(1, t / .4) * np.minimum(1, (sec - t) / .4)
def madd(t0, x, g, pan=0):
    i = int(t0 * SR); x = x[:max(0, N - i)] * g
    mus[i:i + len(x), 0] += x * (1 - max(0, pan)); mus[i:i + len(x), 1] += x * (1 + min(0, pan))
for b in range(int(DUR / beat)):
    t0 = b * beat; ch = chords[(b // 4) % 4]
    if b % 4 == 0: [madd(t0, tone(mtof(m + 12), beat * 4, 'pad'), .034, pan=(-.3 + .3 * i)) for i, m in enumerate(ch)]
    madd(t0, tone(mtof(ch[0] - 12), beat * .9, 'bass'), .2)
    if b % 4 in (1, 3): madd(t0 + beat / 2, tone(mtof(ch[0] - 12), beat * .4, 'bass'), .12)
    for e in range(2):
        n = ch[[0, 1, 2, 1][(b * 2 + e) % 4]] + 12 + (12 if (b * 2 + e) % 8 == 6 else 0)
        madd(t0 + e * beat / 2, tone(mtof(n), beat * .55, 'pluck'), .05, pan=(.35 if e else -.35))
    if b % 2 == 0: n = int(.32 * SR); tt = np.arange(n) / SR; madd(t0, np.sin(2 * np.pi * (45 + 95 * np.exp(-tt * 28)) * tt) * np.exp(-tt * 8), .36)
    else: madd(t0, bp(noise(.22), 900, 5000) * env(int(.22 * SR), .001, .06), .14)
    for e in range(2): madd(t0 + e * beat / 2, hp(noise(.05), 7000) * env(int(.05 * SR), .001, .012), .045)
t = np.arange(N) / SR
mus *= (np.clip(t / 1.0, 0, 1) * np.clip((150 - t) / 2.0, 0, 1))[:, None]
sf.write('audio/music.wav', np.clip(mus, -1, 1), SR)
print('ok')
