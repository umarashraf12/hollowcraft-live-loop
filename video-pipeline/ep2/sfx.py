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
# HOOK
add(.7, fwoosh(), .9); add(.7, whoosh(1.9, 300, 3500, rise=False), .5)
tmv = lambda tm: 4.1 + (tm - 40.75) * .85
for tt in np.arange(4.12, 5.8, .266): add(tt, tick(), .7)
for tm in [41.2, 42.4]: add(tmv(tm), crunch(), 1); add(tmv(tm) + .4, pop(1200), .5)
for n in range(6, 11): add(5.8 + (n + .75 - 6) * .38, thud(), .8)
add(7.95, clank(), .9); add(7.95, whoosh(1.2, 200, 3500), .8)
HD_imp = 7.95 + ((34.3 - 11.1) / 16) ** .5
add(HD_imp, boom(1.1), 1); add(HD_imp + .55, poof(), .6)
add(10.0, riser(.6), .7); add(10.6, boom(.6), .8)
for c in [14.0, 56.0, 96.0]: add(c - .35, whoosh(.4, 400, 5000), .8); add(c, boom(.35), .7); add(c + .05, pop(660), .7)
for c in [4.1, 5.8, 7.7, 17.2, 26.2, 30.6, 33.6, 45.6, 52.3, 59.8, 65.0, 67.6, 71.2, 74.6, 86.6, 101.0, 103.8, 113.2, 124.4, 129.6, 135.0, 138.4]: add(c - .12, whoosh(.18, 800, 6000), .35)
# TRICK 1
for k, tt in enumerate(np.arange(17.3, 26.0, .24)): add(tt, step(), .45, pan=(-.2 if k % 2 else .2))
add(21.8, pop(990), .6); add(26.3, pop(880), .6); add(30.7, pop(990), .5); add(33.8, pop(880), .5)
for i in range(8):
    t1 = 30.95 + i * .34; add(t1, crunch(), .9); add(t1 - .17, tick(), .6)
for i in range(10):
    t1 = 33.9 + i * .48; add(t1, crunch(), .9); add(t1 - .24, tick(), .6); add(t1 - .12, tick(), .5)
add(38.25, sparkle(), 1); add(38.3, pop(1320), .6); add(40.0, pop(990), .5)
for tt in np.arange(40.6, 43.7, .31): add(tt, tick(), .6)
for i, t1 in enumerate([41.2, 42.4, 43.6]): add(t1, crunch(), 1); add(t1 + .5, pop(1000 + i * 220), .7)
add(45.9, riser(.4), .5); add(46.2, sparkle(), .6); add(46.6, pop(880), .5)
for k, tt in enumerate(np.arange(52.4, 56.2, .3)): add(tt, step(), .5)
# TRICK 2
add(60.6, whoosh(.5, 400, 3000, rise=False), .4); add(60.6, pop(880), .5); add(62.6, pop(990), .5)
for tt in [65.5, 66.3, 67.0]: add(tt, step(), .5)
add(67.8, ding(), .7); add(68.4, whoosh(.9, 2000, 200, rise=False), .5)
for tt in [71.375, 72.875]: add(tt, thud(), 1); add(tt - .5, step(), .4)
for n in range(2, 41):
    tt = 74.6 + (n + .75 - 2.7) * .4
    if tt > 74.6: add(tt, thud(), .85); add(tt - .2, step(), .35)
add(90.4, ding(), .8); add(93.2, whoosh(.3, 500, 3000), .4); add(93.8, step(), .7)
# TRICK 3
add(101.4, fwoosh(), 1); add(101.4, whoosh(2.2, 300, 3500, rise=False), .6)
add(104.2, click(), 1); add(104.8, clank(), 1); add(104.8, pop(990), .5); add(104.8, whoosh(7.7, 150, 4000), .9)
add(108.6, click(), 1); add(110.0, beep(), 1); add(110.25, beep(), 1); add(110.5, beep(1800), 1)
add(112.5, boom(1.3), 1); add(113.05, poof(), .7)
add(113.34, fwoosh(), .35); add(115.68, clank(), .4); add(121.0, boom(.5), .5)
for tt in [114.86, 115.96, 121.0]: add(tt, pop(990), .45)
add(117.6, pop(880), .6)
for L_, S_ in [(125.0, 126.6), (131.0, 132.6)]:
    imp = S_ + ((({125.0: 40, 131.0: 44}[L_]) + .3 - 11.1) / 16) ** .5
    add(L_, fwoosh(), .9); add(S_, clank(), .8); add(S_, whoosh(imp - S_, 200, 3500), .8); add(imp, boom(1.2), 1); add(imp + .55, poof(), .6)
# OUTRO
add(138.6, pop(880), .7); add(140.4, pop(990), .6); add(143.0, pop(660), .7); add(144.15, click(), 1.2); add(144.3, bell(), 1); add(146.4, pop(880), .6)
add(148.8, boom(.5), .6)
sf.write('ep2/audio/sfx.wav', np.clip(sfx * .8, -1, 1), SR)
# music: E minor, 118 BPM (Em C G D)
bpm = 118; beat = 60 / bpm; mus = np.zeros((N, 2), np.float32)
chords = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def tone(f, sec, kind='pluck'):
    n = int(sec * SR); t = np.arange(n) / SR
    if kind == 'pluck': return (np.sign(np.sin(2 * np.pi * f * t)) * .2 + np.sin(2 * np.pi * f * t) * .8) * np.exp(-t * 8)
    if kind == 'bass': return np.sin(2 * np.pi * f * t) * np.minimum(1, t / .01) * np.exp(-t * 2.4)
    if kind == 'pad': return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / .3) * np.minimum(1, (sec - t) / .3)
def madd(t0, x, g, pan=0):
    i = int(t0 * SR); x = x[:max(0, N - i)] * g
    mus[i:i + len(x), 0] += x * (1 - max(0, pan)); mus[i:i + len(x), 1] += x * (1 + min(0, pan))
for b in range(int(DUR / beat)):
    t0 = b * beat; ch = chords[(b // 4) % 4]
    if b % 4 == 0: [madd(t0, tone(mtof(m + 12), beat * 4, 'pad'), .032, pan=(-.3 + .3 * i)) for i, m in enumerate(ch)]
    madd(t0, tone(mtof(ch[0] - 12), beat * .9, 'bass'), .2)
    for e in range(2):
        n = ch[[0, 2, 1, 2][(b * 2 + e) % 4]] + 12 + (12 if (b * 2 + e) % 8 == 7 else 0)
        madd(t0 + e * beat / 2, tone(mtof(n), beat * .6, 'pluck'), .055, pan=(.35 if e else -.35))
    if b % 2 == 0: n = int(.3 * SR); tt = np.arange(n) / SR; madd(t0, np.sin(2 * np.pi * (50 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9), .32)
    else: madd(t0, bp(noise(.2), 1200, 6000) * env(int(.2 * SR), .001, .05), .12)
    for e in range(2): madd(t0 + e * beat / 2, hp(noise(.05), 7000) * env(int(.05 * SR), .001, .012), .05)
t = np.arange(N) / SR
g = np.clip(t / 1.0, 0, 1) * np.clip((150 - t) / 2.0, 0, 1)
mus *= g[:, None]
sf.write('ep2/audio/music.wav', np.clip(mus, -1, 1), SR)
print('ok')
