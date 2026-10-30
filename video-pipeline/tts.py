import json
from kokoro_onnx import Kokoro; import soundfile as sf, numpy as np
k=Kokoro('kokoro.onnx','voices.bin')
# (desired start sec, text)
L=[(0.4,"These two Minecraft tricks feel illegal."),
(3.0,"One saves you from any fall..."),
(5.3,"and the other turns a fall into the strongest hit in the game."),
(9.6,"Stick around, because trick number two is insane!"),
(14.4,"Trick number one: the water bucket clutch."),
(17.6,"You slip off a cliff. Normally, that's game over."),
(21.4,"But watch this."),
(23.4,"Keep a water bucket in your hotbar."),
(26.3,"As you fall, look straight down..."),
(28.9,"and right before you hit the ground, place the water."),
(33.0,"Boom!"),
(34.2,"Water cancels all fall damage, so you land with full health."),
(38.6,"The key is timing."),
(40.4,"Place it about two blocks above the ground. Not earlier, not later."),
(45.6,"Then instantly scoop the water back up, so you're ready for the next drop."),
(51.0,"Pros practice this in creative mode until it's pure muscle memory."),
(58.4,"Trick number two: the wind charge mace smash."),
(61.6,"Mace damage grows the farther you fall."),
(64.4,"So instead of looking for a cliff... make your own."),
(67.6,"Throw a wind charge straight at your feet,"),
(70.4,"and it launches you high into the air."),
(74.4,"Now switch to the mace, aim at your target,"),
(77.4,"and smash on the way down."),
(80.4,"One hit!"),
(82.6,"The higher you go, the harder you hit."),
(85.8,"And here's the best part: when you land the smash, you take no fall damage at all."),
(91.6,"Chain two wind charges back to back, and you can one-shot almost anything."),
(108.6,"So, which trick are you trying first?"),
(111.0,"Tell me in the comments."),
(113.0,"Subscribe to HollowCraft for new tricks every week..."),
(116.4,"and I'll see you in the next one.")]
SR=24000; total=np.zeros(int(121*SR),dtype=np.float32); prev=0; caps=[]
for want,txt in L:
    s,sr=k.create(txt,voice='am_michael',speed=1.1,lang='en-us'); assert sr==SR
    idx=np.where(np.abs(s)>0.01)[0]; s=s[max(idx[0]-600,0):idx[-1]+1200].astype(np.float32)
    st=max(want,prev+0.12); d=len(s)/SR
    if st!=want: print(f"SHIFT {want}->{st:.2f}: {txt}")
    i=int(st*SR); total[i:i+len(s)]+=s; prev=st+d
    caps.append([round(st,2),round(st+d,2),txt])
    print(f"{st:6.2f}-{st+d:6.2f} {txt}")
sf.write('vo.wav',total,SR); json.dump(caps,open('caps.json','w'),indent=0)
