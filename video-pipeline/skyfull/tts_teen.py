# Narration (Kokoro am_michael) for the 100 days video, timed from segs.json -> audio/vo_raw.wav + caps.json
import json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro('/home/user/hc-work/audio/kokoro.onnx', '/home/user/hc-work/audio/voices.bin')
J = json.load(open('segs.json')); SR = 24000; TOT = J['total']
total = np.zeros(int((TOT + 2) * SR), np.float32); caps = []; prev = 0
for s in J['segs']:
    for off, txt in s['lines']:
        a, _ = k.create(txt, voice='am_eric', speed=1.12, lang='en-us')
        idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(idx[0] - 600, 0):idx[-1] + 1200].astype(np.float32)
        want = s['start'] + off; st = max(want, prev + .15); d = len(a) / SR
        end_seg = s['start'] + s['dur']; flag = '  <-- SHIFT %.2f' % (st - want) if st - want > .05 else ''
        if st + d > end_seg: flag += '  !! OVER SEGMENT END by %.2f' % (st + d - end_seg)
        i = int(st * SR); total[i:i + len(a)] += a; prev = st + d
        caps.append([round(st, 2), round(st + d, 2), txt]); print(f'{st:7.2f}-{st + d:7.2f} {txt[:60]}{flag}')
sf.write('audio/vo_raw.wav', total[:int(TOT * SR)], SR); json.dump(caps, open('caps.json', 'w'), indent=0)
