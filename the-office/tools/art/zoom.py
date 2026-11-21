import sys
from people import *
looks=[dict(skin=1, hair='#5a3a22', hairStyle='feather', top='suit', topColor='#6b4a2f', pants='#4a3a2c', acc=['tie','glasses'], tieColor='#c9a03a'),
 dict(skin=4, hair='#1e1612', hairStyle='afro', top='turtleneck', topColor='#c9a03a', pants='#3a3a40'),
 dict(skin=0, hair='#c98a3a', hairStyle='bob', top='cardigan', topColor='#7a8a3a', innerColor='#efe6d0', pants='#6b4a2f', acc=['earrings'])]
frames=[('stretch','S',2),('nod','S',1),('doze','S',4),('doze','S',6),('bow','S',2),('pet','S',1),('pet','E',1),('fidget','S',3),('fidget','E',4),('type','S',1),('run','E',0)]
frames0=[('idle','S',0),('idle','N',0),('walk','E',0),('walk','E',1),('walk','S',0),('type','S',1),('type','N',0),('type','E',1),('sleep','S',1),('celebrate','S',2),('facepalm','S',2),('talk','S',1),('run','E',0),('drink','S',1)]
Z=5
bg=Image.new('RGBA',(len(frames)*CW*Z,len(looks)*CH*Z),(246,245,241,255))
for j,l in enumerate(looks):
  for i,(a,d,f) in enumerate(frames):
    bg.alpha_composite(draw_person(l,a,d,f).im.resize((CW*Z,CH*Z),Image.NEAREST),(i*CW*Z,j*CH*Z))
bg.save('/tmp/zoom4.png')
