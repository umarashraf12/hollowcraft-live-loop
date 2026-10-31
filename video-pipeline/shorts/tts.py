# Character voices for the 3 Shorts. Hollow = channel narrator voice; Pip = pitched-up; VOID = pitched-down + echo.
import json
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import resample
k = Kokoro('audio/kokoro.onnx', 'audio/voices.bin'); SR = 24000
VOICE = {'H': ('am_michael', 1.05, 1.0), 'P': ('am_puck', 1.05, 1.22), 'V': ('am_onyx', .82, .78)}
def say(who, txt):
    v, sp, pitch = VOICE[who]
    s, _ = k.create(txt, voice=v, speed=sp, lang='en-us')
    idx = np.where(np.abs(s) > .01)[0]; s = s[max(idx[0] - 600, 0):idx[-1] + 1200].astype(np.float32)
    if pitch != 1: s = resample(s, int(len(s) / pitch)).astype(np.float32)
    if who == 'V':
        out = np.zeros(len(s) + int(.5 * SR), np.float32); out[:len(s)] += s
        for d, g in [(.11, .45), (.23, .28), (.37, .15)]: i = int(d * SR); out[i:i + len(s)] += s * g
        s = out * .8
    return s
SHORTS = {
 1: [(1.2, 'P', "Ha! Look at my RICH base!"), (4.4, 'P', "Gold walls. Diamond roof. Best base ever!"), (8.6, 'H', "Mine's just a dirt hut. With torches."),
     (11.8, 'P', "A dirt hut? Haha, you're so poor!"), (17.2, 'H', "Pip... it's getting dark."), (20.0, 'V', "Shiny... base..."),
     (22.8, 'P', "AAAH! My mansion!"), (26.4, 'P', "Hollow! Let me in!"), (29.9, 'V', "Light... no!"), (32.2, 'H', "Rich base. Zero torches."), (34.8, 'P', "Can I live here now?")],
 2: [(1.0, 'P', "My MAX security house! Nothing gets in!"), (4.6, 'H', "Is it VOID proof?"), (6.6, 'P', "Lava moat. Obsidian walls. Iron door. Totally!"),
     (13.6, 'V', "Open... the door..."), (16.0, 'P', "It floated over the lava?!"), (20.2, 'P', "Through the WALL?!"), (23.0, 'P', "HOLLOW! HELP!"),
     (25.1, 'V', "Nooo!"), (27.2, 'H', "One torch. That's all the security you need."), (31.0, 'P', "I spent all my diamonds on this...")],
 3: [(1.5, 'P', "Hollow, why is it so quiet?"), (4.4, 'H', "Relax. We have four torches."), (7.8, 'P', "Three torches."), (12.8, 'P', "Two... ONE?!"),
     (18.2, 'H', "Pip... don't move."), (20.4, 'P', "W-why?"), (22.0, 'V', "Found... you..."), (25.4, 'P', "WHAT WAS THAT?!"),
     (27.4, 'H', "Always carry a spare torch."), (31.2, 'V', "Part... two...")],
}
DUR = {1: 38.0, 2: 35.0, 3: 35.5}
meta = {}
for n, lines in SHORTS.items():
    total = np.zeros(int((DUR[n] + 1) * SR), np.float32); prev = 0; caps = []
    for want, who, txt in lines:
        s = say(who, txt); st = max(want, prev + .1); d = len(s) / SR
        i = int(st * SR); total[i:i + len(s)] += s; prev = st + (d - (.5 if who == 'V' else 0))
        caps.append([round(st, 2), round(st + d - (.5 if who == 'V' else 0), 2), who, txt]); print(n, f"{st:5.2f}-{st+d:5.2f}", who, txt, '<-- SHIFT' if st != want else '')
    sf.write(f'audio/vo{n}.wav', total[:int(DUR[n] * SR)], SR); meta[n] = caps
json.dump(meta, open('caps.json', 'w'), indent=0)
