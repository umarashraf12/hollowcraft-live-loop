# Builds audio/sfx.wav and audio/music.wav (48 kHz) for the full sky island video,
# driven by window.TIMELINE (dumped to timeline.json by dump_tl.js).
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
TL = json.load(open('timeline.json'))
SR = 48000; DUR = float(TL['TOTAL']); N = int(SR * DUR)
rng = np.random.default_rng(11)
sfx = np.zeros((N, 2), np.float32)
def noise(sec): return rng.standard_normal(int(SR * sec))
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

def hit():
    x = noise(.2); n = len(x); t = np.arange(n) / SR
    return lp(x, 2500) * env(n, .001, .04) * .9 + np.sin(2 * np.pi * (180 + 200 * np.exp(-t * 40)) * t) * np.exp(-t * 18) * .6
def swoosh(): return whoosh(.25, 900, 7000, rise=False) * 1.2
def pickup():
    n = int(.12 * SR); t = np.arange(n) / SR; f = 700 + 1800 * t / .12
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * .35
def gasp(): x = noise(.5); k = np.linspace(0, 1, len(x)); return bp(x, 500, 2500) * np.sin(np.pi * k) ** 2 * .45
def rocket(): x = noise(1.0); t = np.arange(len(x)) / SR; return (hp(x, 1500) * np.exp(-t * 2.5) * .6 + lp(x, 250) * env(len(x), .002, .08) * 1.2)
def ring_(): return mix(ding() * 1.2, sparkle() * .6)
def smash(): return mix(boom(1.0) * .9, crunch_pad())
def crunch_pad(): x = noise(1.8); return lp(x, 1800) * env(len(x), .001, .07) * 1.0
def explode(): return boom(1.6)
def debris():
    out = np.zeros(int(1.4 * SR))
    for _ in range(14):
        j = int(rng.uniform(0, 1.1) * SR); c = crunch()[:int(.25 * SR)] * rng.uniform(.2, .6); out[j:j + len(c)] += c[:len(out) - j]
    return out
def hiss(): x = noise(1.6); k = np.linspace(0, 1, len(x)); return hp(x, 2500) * k ** 1.5 * .5
def mix(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def ignite(): return mix(click(), whoosh(.6, 300, 2500, rise=False) * .9, hum(1.2) * .8)
def lava(): return lavapour()
def splash_(): return splash(1.0)
FX = {'thud': thud, 'ding': ding, 'pop': lambda: pop(rng.choice([880, 990, 1180])), 'crunch': crunch, 'pickup': pickup, 'sparkle': sparkle,
      'swoosh': swoosh, 'hit': hit, 'poof': poof, 'whoosh': lambda: whoosh(.5, 400, 5000), 'splash': splash_, 'slide': lambda: slide(2.5),
      'slide2': lambda: slide(1.5, rise=True), 'lava': lava, 'pour': pour, 'sizzle': sizzle, 'ignite': ignite, 'riser': lambda: riser(1.4),
      'boom': lambda: boom(1.0), 'hiss': hiss, 'explode': explode, 'debris': debris, 'rocket': rocket, 'ring': ring_, 'click': click,
      'step': step, 'gasp': gasp, 'whoosh7': lambda: whoosh(.7, 300, 4000), 'windburst': windburst, 'dive': lambda: whoosh(1.6, 400, 6000),
      'dive7': lambda: whoosh(2.4, 300, 5000), 'smash': smash, 'clank': clank}

def saw(f, n): t = np.arange(n) / SR; ph = np.cumsum(np.broadcast_to(f, (n,))) / SR; return 2 * (ph % 1) - 1
def groan():
    n = int(1.1 * SR); t = np.arange(n) / SR; f = 95 + 12 * np.sin(2 * np.pi * 5 * t) - 20 * t
    x = lp(saw(f, n), 700) * np.sin(np.pi * np.clip(t / 1.1, 0, 1)) ** .8 + bp(noise(1.1), 200, 900) * .25 * np.sin(np.pi * t / 1.1)
    return x * .7
def moo():
    n = int(1.2 * SR); t = np.arange(n) / SR; f = 150 - 40 * t / 1.2
    return lp(saw(f, n), 900) * np.sin(np.pi * t / 1.2) ** .6 * .6
def baa():
    n = int(.75 * SR); t = np.arange(n) / SR; f = 390 * (1 + .02 * np.sin(2 * np.pi * 6 * t))
    return bp(saw(f, n), 400, 2600) * (.6 + .4 * np.sin(2 * np.pi * 22 * t)) * np.sin(np.pi * t / .75) * .5
def roar():
    n = int(2.3 * SR); t = np.arange(n) / SR; e = np.minimum(1, t / .15) * np.exp(-np.maximum(0, t - .6) * 1.6)
    low = lp(saw(75 - 18 * t / 2.3, n) * (1 + .5 * np.sin(2 * np.pi * 28 * t)), 900); hiss_ = bp(noise(2.3), 900, 3500) * .5; scr = bp(saw(620 + 80 * np.sin(2 * np.pi * 3 * t), n), 900, 3000) * .25
    return (low * .9 + hiss_ + scr) * e
def flap(): x = noise(.45); return lp(x, 260) * env(len(x), .03, .12) * 1.4
def bowdraw(): x = noise(.5); k = np.linspace(0, 1, len(x)); return bp(x, 900, 2600) * k * .25
def bowshot():
    n = int(.25 * SR); t = np.arange(n) / SR
    return hp(noise(.25), 2500) * env(n, .001, .03) * .7 + np.sin(2 * np.pi * (300 + 900 * np.exp(-t * 30)) * t) * np.exp(-t * 25) * .3
FX.update({'groan': groan, 'moo': moo, 'baa': baa, 'roar': roar, 'flap': flap, 'bowdraw': bowdraw, 'bowshot': bowshot, 'bell': bell})

def gust(): x = noise(3.0); k = np.linspace(0, 1, len(x)); return bp(x, 200, 1400) * np.sin(np.pi * k) ** 1.5 * .5
def heartbeat():
    out = np.zeros(int(2.4 * SR))
    for b in range(3):
        for o, g in ((0, 1), (.18, .7)):
            n = int(.15 * SR); tq = np.arange(n) / SR; j = int((b * .75 + o) * SR); out[j:j + n] += np.sin(2 * np.pi * (55 + 30 * np.exp(-tq * 30)) * tq) * np.exp(-tq * 22) * g
    return out * .9
def chest():
    n = int(.5 * SR); tq = np.arange(n) / SR; creak = bp(saw(180 + 120 * tq / .5, n), 300, 1800) * np.exp(-tq * 4) * .3
    return creak + lp(noise(.5), 400) * env(n, .001, .05) * .8
def glassb():
    out = hp(noise(.5), 2500) * env(int(.5 * SR), .001, .08) * .7
    for _ in range(8):
        j = int(rng.uniform(0, .25) * SR); m = int(.06 * SR); f = rng.uniform(2500, 5000); out[j:j + m] += np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / (.01 * SR)) * .2
    return out
def rattle():
    out = np.zeros(int(.6 * SR))
    for k in range(7):
        j = int(k * .07 * SR + rng.uniform(0, .02) * SR); m = int(.04 * SR); out[j:j + m] += bp(noise(.04), 1500, 5000)[:m] * np.exp(-np.arange(m) / (.008 * SR)) * .8
    return out
def hurt():
    n = int(.35 * SR); tq = np.arange(n) / SR; f = 210 - 90 * tq / .35
    return bp(saw(f, n), 250, 2200) * np.sin(np.pi * np.clip(tq / .35, 0, 1)) ** .5 * .55 + np.pad(hit(), (0, n))[:n] * .6
FX.update({'wind': gust, 'heartbeat': heartbeat, 'chest': chest, 'glass': glassb, 'rattle': rattle, 'hurt': hurt, 'tick': tick})

SEGS = TL['segs']; ST = {s['kind']: s['start'] for s in SEGS}
def win(k, a, b): return (ST[k] + a, ST[k] + b)
NETHER = [win('g_nether', 40, 128)]; END = [win('g_dragon', 0, 110)]; CAVE = [win('g_ender', 112, 150)]
NIGHTS = [win('g_act1', 61, 83), win('g_farm', 75, 125), win('g_mob', 38.5, 61), win('g_ender', 0, 27)]
def mask(ws):
    m = np.zeros(N)
    for a, b in ws: m[int(a * SR):int(b * SR)] = 1
    return np.convolve(m, np.ones(9600) / 9600, mode='same')
mn, me, mc = mask(NETHER), mask(END), mask(CAVE); mw = np.clip(1 - mn - me - mc, 0, 1)
wnd = bp(rng.standard_normal(N), 120, 900) * .05 * (1 + .5 * np.sin(np.arange(N) / SR * .7)); neth = lp(rng.standard_normal(N), 160) * .16; endd = lp(rng.standard_normal(N), 110) * .12; cave = lp(rng.standard_normal(N), 180) * .08
for ch, shf in ((0, 0), (1, 1500)): sfx[:, ch] += np.roll(wnd, shf) * mw + np.roll(neth, shf) * mn + np.roll(endd, shf) * me + np.roll(cave, shf) * mc
for a, b in NETHER:
    for tt in np.arange(a + .5, b, 1.8): add(tt + rng.uniform(0, .8), pop(rng.uniform(140, 260)), .22, pan=rng.uniform(-.6, .6))
for a, b in NIGHTS:
    for tt in np.arange(a + .5, b, .6):
        n = int(.08 * SR); tq = np.arange(n) / SR; add(tt + rng.uniform(0, .3), np.sin(2 * np.pi * 4300 * tq) * (np.sin(2 * np.pi * 60 * tq) > 0) * np.exp(-tq * 30) * .05, 1, pan=rng.uniform(-.8, .8))
for s in SEGS:
    for t0, kind, g in s['ev']:
        if 0 <= t0 <= s['dur']: add(s['start'] + t0, FX[kind](), g * .85, pan=float(rng.uniform(-.15, .15)))
    if s['start'] > 0: add(s['start'] - .3, whoosh(.3, 400, 6000), .35)
sf.write('audio/sfx.wav', np.clip(sfx * .8, -1, 1), SR)
# music: D minor, 108 BPM (Dm Bb F C), heavier low end for the Nether
bpm = 116; beat = 60 / bpm; mus = np.zeros((N, 2), np.float32)
PROGS = [[[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 43, 47]], [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 50, 54]]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def tone(f, sec, kind='pluck'):
    n = int(sec * SR); t = np.arange(n) / SR
    if kind == 'pluck': return (np.sign(np.sin(2 * np.pi * f * t)) * .3 + np.sin(2 * np.pi * f * t) * .7) * np.exp(-t * 7)
    if kind == 'bass': return (np.sin(2 * np.pi * f * t) + .25 * np.sign(np.sin(2 * np.pi * f * t))) * np.minimum(1, t / .01) * np.exp(-t * 2.0)
    if kind == 'pad': return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2.003 * f * t)) * np.minimum(1, t / .4) * np.minimum(1, (sec - t) / .4)
def madd(t0, x, g, pan=0):
    i = int(t0 * SR); x = x[:max(0, N - i)] * g
    mus[i:i + len(x), 0] += x * (1 - max(0, pan)); mus[i:i + len(x), 1] += x * (1 + min(0, pan))
MOOD = {'g_hook': (.8, 2), 'g_act1': (.5, 2), 'g_farm': (.5, 2), 'g_mob': (.55, 0), 'g_nether': (.75, 1), 'g_ender': (.5, 0), 'g_dragon': (1.0, 1), 'g_final': (.6, 2), 'skytest': (.5, 2), 'hook': (1.0, 0), 'day1': (.55, 2), 'night1': (.15, 1), 'clip': (.7, 0), 'farm': (.55, 2), 'endportal': (.2, 1), 'dragon': (1.0, 1), 'tour': (.6, 2)}
def mood(t):
    if any(a <= t < b for a, b in NIGHTS): return (.2, 1)
    for s in SEGS:
        if t < s['start'] + s['dur']: return MOOD[s['kind']]
    return MOOD['tour']
for b in range(int(DUR / beat)):
    t0 = b * beat; e, sec = mood(t0); ch = PROGS[sec][(b // 4) % 4]
    if b % 4 == 0: [madd(t0, tone(mtof(m + 12), beat * 4, 'pad'), .034, pan=(-.3 + .3 * i)) for i, m in enumerate(ch)]
    madd(t0, tone(mtof(ch[0] - 12), beat * .9, 'bass'), .2 * max(.35, e))
    if b % 4 in (1, 3) and e > .4: madd(t0 + beat / 2, tone(mtof(ch[0] - 12), beat * .4, 'bass'), .12 * e)
    for e2 in range(2):
        n = ch[[0, 1, 2, 1][(b * 2 + e2) % 4]] + 12 + (12 if (b * 2 + e2) % 8 == 6 else 0)
        madd(t0 + e2 * beat / 2, tone(mtof(n), beat * .55, 'pluck'), .05 * max(.4, e), pan=(.35 if e2 else -.35))
    if e > .4:
        if b % 2 == 0: n = int(.32 * SR); tt = np.arange(n) / SR; madd(t0, np.sin(2 * np.pi * (45 + 95 * np.exp(-tt * 28)) * tt) * np.exp(-tt * 8), .36 * e)
        else: madd(t0, bp(noise(.22), 900, 5000) * env(int(.22 * SR), .001, .06), .14 * e)
        for e2 in range(2): madd(t0 + e2 * beat / 2, hp(noise(.05), 7000) * env(int(.05 * SR), .001, .012), .045 * e)
t = np.arange(N) / SR
mus *= (np.clip(t / 1.0, 0, 1) * np.clip((DUR - t) / 3.0, 0, 1))[:, None]
sf.write('audio/music.wav', np.clip(mus, -1, 1), SR)
print('ok')
