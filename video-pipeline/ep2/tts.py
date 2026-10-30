import json
from kokoro_onnx import Kokoro; import soundfile as sf, numpy as np
k=Kokoro('audio/kokoro.onnx','audio/voices.bin')
L=[(0.4,"These three Minecraft tricks are searched by millions of players."),
(4.0,"One finds diamonds fast. One gets you across any gap."),
(7.4,"And the last one is the deadliest move in the game right now."),
(14.3,"Trick number one: find diamonds fast."),
(17.2,"Forget wandering through caves. Go down to Y level minus fifty-eight."),
(21.8,"Press F3 to check your height. On Bedrock, turn on show coordinates."),
(26.2,"Diamonds are most common down here, and you're just above the bedrock."),
(30.6,"Now dig a long tunnel, two blocks high."),
(33.6,"Then branch off every three blocks, so you can see every ore in the walls."),
(38.6,"There it is!"),
(40.0,"Mine it with a Fortune Three pickaxe, and one ore can drop up to four diamonds."),
(45.6,"Strip mining beats caving, because most diamonds are hidden inside solid rock, not on cave walls."),
(56.3,"Trick number two: bridge across any gap without falling."),
(59.8,"Turn around, so you're facing away from the gap, and look down at the edge of your block."),
(65.0,"Hold sneak, and walk backwards."),
(67.6,"Sneaking stops you right at the edge, so you can't fall off."),
(71.2,"Place a block, step back, and repeat."),
(74.6,"Once you've got the rhythm, tap sneak just before the edge. That's speed bridging."),
(80.8,"Bed Wars players use this to cross the map in seconds."),
(86.6,"Master this one first. It's the base for every faster bridging style."),
(96.3,"Trick number three: the elytra mace. Top PvP players use this every fight."),
(101.0,"Boost straight up with a firework rocket."),
(103.8,"Now swap your elytra for a chestplate in mid-air."),
(107.0,"You stop gliding and start falling, and that fall powers up your mace."),
(111.0,"Aim at your target, and smash!"),
(113.6,"From high enough, it's basically a one-shot."),
(117.6,"Pro tip: keep the chestplate on your hotbar, and right-click it to swap instantly."),
(124.6,"Here it is at real speed."),
(138.6,"So, which trick are you trying first? Comment one, two, or three."),
(143.0,"Subscribe to HollowCraft for new tricks every week..."),
(146.4,"and I'll see you in the next one.")]
SR=24000; total=np.zeros(int(151*SR),dtype=np.float32); prev=0; caps=[]
for want,txt in L:
    s,sr=k.create(txt,voice='am_michael',speed=1.1,lang='en-us')
    idx=np.where(np.abs(s)>0.01)[0]; s=s[max(idx[0]-600,0):idx[-1]+1200].astype(np.float32)
    st=max(want,prev+0.12); d=len(s)/SR
    flag = "  <-- SHIFT" if st!=want else ""
    i=int(st*SR); total[i:i+len(s)]+=s; prev=st+d
    caps.append([round(st,2),round(st+d,2),txt]); print(f"{st:6.2f}-{st+d:6.2f} {txt}{flag}")
sf.write('audio/vo.wav',total[:int(150*SR)],SR); json.dump(caps,open('caps.json','w'),indent=0)
