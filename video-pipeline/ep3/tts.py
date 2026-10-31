import json
from kokoro_onnx import Kokoro; import soundfile as sf, numpy as np
k=Kokoro('audio/kokoro.onnx','audio/voices.bin')
L=[(0.4,"These three Nether tricks will get you netherite faster than anyone on your server."),
(4.7,"A portal with no diamond pickaxe. A secret way to find ancient debris."),
(9.1,"And a road that's faster than flying."),
(14.3,"Trick number one: build a Nether portal without a diamond pickaxe."),
(18.6,"You can't mine obsidian without one, but you can make it right where you need it."),
(23.2,"Place a lava source where each frame block goes."),
(26.6,"Then pour water over it. Lava plus water turns into obsidian."),
(31.4,"Scoop the water back up, and move on to the next block."),
(35.4,"A basic frame needs just ten obsidian, because the corners are optional."),
(40.6,"Light the inside with flint and steel, and you're in."),
(45.8,"Pro tip: build a dirt mold first, so the lava stays exactly where you want it."),
(55.3,"Trick number two: find ancient debris, the ore that makes netherite."),
(59.8,"Go down to Y level fifteen. That's where ancient debris shows up the most."),
(64.6,"Dig a long tunnel, then use beds as explosives. In the Nether, beds blow up when you try to sleep."),
(71.6,"Place a bed at the end, step back, and right-click it."),
(75.2,"Boom!"),
(76.4,"Ancient debris is blast proof, so it's the last thing left standing."),
(81.2,"Smelt it into netherite scrap. Four scraps and four gold ingots make one netherite ingot."),
(87.6,"Wear armor and bring fire resistance. The blast hits you too, and lava is everywhere."),
(97.3,"Trick number three: the Nether highway."),
(100.6,"Every block you travel in the Nether equals eight blocks in the Overworld."),
(105.4,"So build your road down here, and cover it with blue ice."),
(109.4,"Put a boat on it, and you'll slide at over seventy blocks per second."),
(114.2,"That's faster than an elytra with rockets."),
(117.6,"Add walls and a ceiling, so ghasts and lava can't stop you."),
(122.6,"Here's a thousand blocks of Overworld travel, done in under two seconds."),
(138.6,"So, which Nether trick are you trying first? Comment one, two, or three."),
(143.2,"Subscribe to HollowCraft for new tricks every week..."),
(146.6,"and I'll see you in the next one.")]
SR=24000; total=np.zeros(int(151*SR),dtype=np.float32); prev=0; caps=[]
for want,txt in L:
    s,sr=k.create(txt,voice='am_michael',speed=1.1,lang='en-us')
    idx=np.where(np.abs(s)>0.01)[0]; s=s[max(idx[0]-600,0):idx[-1]+1200].astype(np.float32)
    st=max(want,prev+0.12); d=len(s)/SR; flag="  <-- SHIFT" if st!=want else ""
    i=int(st*SR); total[i:i+len(s)]+=s; prev=st+d
    caps.append([round(st,2),round(st+d,2),txt]); print(f"{st:6.2f}-{st+d:6.2f} {txt}{flag}")
sf.write('audio/vo.wav',total[:int(150*SR)],SR); json.dump(caps,open('caps.json','w'),indent=0)
