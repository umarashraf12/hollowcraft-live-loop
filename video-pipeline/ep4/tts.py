import json
from kokoro_onnx import Kokoro; import soundfile as sf, numpy as np
k=Kokoro('audio/kokoro.onnx','audio/voices.bin')
L=[(0.4,"These three villager tricks will make you rich in Minecraft."),
(4.0,"Trades for one emerald. The book every player wants. And the easiest emeralds in the game."),
(10.0,"Number one is honestly broken."),
(14.3,"Trick number one: cure a zombie villager for massive discounts."),
(18.6,"Trap a zombie villager, and keep it out of the sun."),
(22.4,"Throw a splash potion of weakness at it."),
(25.4,"Then feed it a golden apple."),
(28.0,"It starts shaking. Give it a few minutes, and it turns back into a villager."),
(34.0,"Now check its trades."),
(36.2,"Prices drop like crazy. Some trades go all the way down to one emerald."),
(41.6,"And the villager remembers you, so the discount stays."),
(45.6,"Pro tip: on hard difficulty, zombies always turn villagers into zombie villagers, so you can make your own."),
(56.3,"Trick number two: get the mending book every time."),
(60.2,"Put a lectern next to a villager with no job, and it becomes a librarian."),
(65.0,"Check its trades. No mending? Break the lectern, and place it again."),
(70.2,"The villager forgets its job, and rolls brand new trades."),
(74.4,"Keep going until mending shows up."),
(77.6,"Then trade once, right away. That locks the trades forever."),
(82.6,"This works with any job block, as long as you haven't traded with that villager yet."),
(97.3,"Trick number three: the easiest emeralds in the game."),
(100.8,"Find a fletcher, the villager with a fletching table."),
(104.4,"They buy sticks. Thirty-two sticks for one emerald."),
(108.6,"Four logs make thirty-two sticks. So every four logs is an emerald."),
(113.8,"Chop a tree, craft sticks, and sell."),
(116.8,"Villagers restock their trades at their job block, up to twice a day."),
(122.4,"Here's a stack of logs, turned into emeralds in seconds."),
(138.6,"So, which villager trick are you trying first? Comment one, two, or three."),
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
