(() => {
'use strict';
// ---------- 5x7 pixel font ----------
const G = {
A:".XXX.|X...X|X...X|XXXXX|X...X|X...X|X...X",B:"XXXX.|X...X|X...X|XXXX.|X...X|X...X|XXXX.",
C:".XXX.|X...X|X....|X....|X....|X...X|.XXX.",D:"XXXX.|X...X|X...X|X...X|X...X|X...X|XXXX.",
E:"XXXXX|X....|X....|XXXX.|X....|X....|XXXXX",F:"XXXXX|X....|X....|XXXX.|X....|X....|X....",
G:".XXX.|X...X|X....|X.XXX|X...X|X...X|.XXXX",H:"X...X|X...X|X...X|XXXXX|X...X|X...X|X...X",
I:"XXX|.X.|.X.|.X.|.X.|.X.|XXX",J:"..XXX|...X.|...X.|...X.|...X.|X..X.|.XX..",
K:"X...X|X..X.|X.X..|XX...|X.X..|X..X.|X...X",L:"X....|X....|X....|X....|X....|X....|XXXXX",
M:"X...X|XX.XX|X.X.X|X.X.X|X...X|X...X|X...X",N:"X...X|X...X|XX..X|X.X.X|X..XX|X...X|X...X",
O:".XXX.|X...X|X...X|X...X|X...X|X...X|.XXX.",P:"XXXX.|X...X|X...X|XXXX.|X....|X....|X....",
Q:".XXX.|X...X|X...X|X...X|X.X.X|X..X.|.XX.X",R:"XXXX.|X...X|X...X|XXXX.|X.X..|X..X.|X...X",
S:".XXXX|X....|X....|.XXX.|....X|....X|XXXX.",T:"XXXXX|..X..|..X..|..X..|..X..|..X..|..X..",
U:"X...X|X...X|X...X|X...X|X...X|X...X|.XXX.",V:"X...X|X...X|X...X|X...X|X...X|.X.X.|..X..",
W:"X...X|X...X|X...X|X.X.X|X.X.X|X.X.X|.X.X.",X:"X...X|X...X|.X.X.|..X..|.X.X.|X...X|X...X",
Y:"X...X|X...X|.X.X.|..X..|..X..|..X..|..X..",Z:"XXXXX|....X|...X.|..X..|.X...|X....|XXXXX",
0:".XXX.|X...X|X...X|X...X|X...X|X...X|.XXX.",1:".X.|XX.|.X.|.X.|.X.|.X.|XXX",
2:".XXX.|X...X|....X|...X.|..X..|.X...|XXXXX",3:"XXXXX|...X.|..X..|...X.|....X|X...X|.XXX.",
4:"X...X|X...X|X...X|XXXXX|....X|....X|....X",5:"XXXXX|X....|XXXX.|....X|....X|X...X|.XXX.",
6:"..XX.|.X...|X....|XXXX.|X...X|X...X|.XXX.",7:"XXXXX|....X|...X.|..X..|.X...|.X...|.X...",
8:".XXX.|X...X|X...X|.XXX.|X...X|X...X|.XXX.",9:".XXX.|X...X|X...X|.XXXX|....X|...X.|.XX..",
"!":"X|X|X|X|X|.|X","?":".XXX.|X...X|....X|...X.|..X..|.....|..X..",".":".|.|.|.|.|.|X",",":"..|..|..|..|.X|.X|X.",
"-":"...|...|...|XXX|...|...|...","+":".....|..X..|..X..|XXXXX|..X..|..X..|.....",":":".|X|.|.|.|X|.",
"'":"X|X|.|.|.|.|.","#":".X.X.|.X.X.|XXXXX|.X.X.|XXXXX|.X.X.|.X.X.","&":".XX..|X..X.|X.X..|.X...|X.X.X|X..X.|.XX.X",
"@":".XXX.|X...X|X.XXX|X.X.X|X.XXX|X....|.XXXX","/":"....X|...X.|...X.|..X..|.X...|.X...|X....",
"*":"X.X.X|.XXX.|XXXXX|.XXX.|X.X.X|.....|.....","=":".....|.....|XXXX|.....|XXXX|.....|.....".replace(/XXXX/g,"XXXXX"),
"(": ".X|X.|X.|X.|X.|X.|.X",")":"X.|.X|.X|.X|.X|.X|X.","$":"..X..|.XXXX|X.X..|.XXX.|..X.X|XXXX.|..X..",
"%":"XX..X|XX.X.|...X.|..X..|.X...|.X.XX|X..XX","_":".....|.....|.....|.....|.....|.....|XXXXX"
};
G["♥"]=G["*"];G["❤"]=G["*"];
G["♥"]=".....|.X.X.|XXXXX|XXXXX|.XXX.|..X..|.....";
G["\""]="X.X|X.X|...|...|...|...|...";
// the rest of printable ASCII, plus a few everyday extras
Object.assign(G,{";":"..|..|.X|..|.X|.X|X.","<":"...X|..X.|.X..|X...|.X..|..X.|...X",">":"X...|.X..|..X.|...X|..X.|.X..|X...",
"[":"XX|X.|X.|X.|X.|X.|XX","]":"XX|.X|.X|.X|.X|.X|XX","{":"..X|.X.|.X.|X..|.X.|.X.|..X","}":"X..|.X.|.X.|..X|.X.|.X.|X..",
"\\":"X....|.X...|.X...|..X..|...X.|...X.|....X","|":"X|X|X|X|X|X|X","^":"..X..|.X.X.|X...X|.....|.....|.....|.....",
"`":"X.|.X|..|..|..|..|..","~":".....|.....|.X...|X.X.X|...X.|.....|.....","£":"..XX.|.X..X|.X...|XXXX.|.X...|.X...|XXXXX",
"€":"..XXX|.X...|XXXX.|.X...|XXXX.|.X...|..XXX","°":".X.|X.X|.X.|...|...|...|..."});
// ---------- tiny pixel drawings (the mob forms these too). APPEND ONLY: their order is part of the link format ----------
// X = main colour, o = accent colour (people standing there wear that colour)
const DRAW=[
 ["heart","❤️ ❤ 💖 💗 💓 💕 💘 💝 😍 🥰 💞","#e74c3c","#ff8fa3",".XX.XX.|XXXXXXX|XXXXXXX|XXXXXXX|.XXXXX.|..XXX..|...X...",".XXX...XXX.|XoXXX.XXXXX|XXXXXXXXXXX|.XXXXXXXXX.|..XXXXXXX..|....XXX....|.....X....."],
 ["cake","🎂 🍰 🧁","#ff6b9d","#f1c40f",".o.o.o.|.X.X.X.|XXXXXXX|X.X.X.X|XXXXXXX|X.....X|XXXXXXX",".o...o...o.|.o...o...o.|XXXXXXXXXXX|XXXXXXXXXXX|ooooooooooo|XXXXXXXXXXX|XXXXXXXXXXX"],
 ["thumbs","👍","#f1c40f","#e67e22","...X...|..XX...|..XX...|XXXXXX.|oXXXXXX|oXXXXX.|oXXXX..",".....X.....|....XX.....|....XX.....|oo.XXXXXXX.|oo.XXXXXXXX|oo.XXXXXXX.|oo.XXXXXX.."],
 ["star","⭐ 🌟 ✨ ★ ☆ 💫","#f1c40f","#f39c12","...X...|...X...|XXXXXXX|.XXXXX.|..XXX..|.XX.XX.|XX...XX",".....X.....|....XXX....|XXXXXXXXXXX|.XXXXXXXXX.|..XXXXXXX..|.XXX...XXX.|XX.......XX"],
 ["smile","😊 🙂 😀 😃 😄 😁 ☺️ ☺ 😂 🤣 😆","#f1c40f","#2d2420",".XXXXX.|X.....X|X.o.o.X|X.....X|Xo...oX|X.ooo.X|.XXXXX.","...XXXXX...|.XXXXXXXXX.|XXXoXXXoXXX|XXXXXXXXXXX|XXoXXXXXoXX|.XXoooooXX.|...XXXXX..."],
 ["ring","💍 💎","#f1c40f","#4ca3dd","..ooo..|...o...|.XXXXX.|X.....X|X.....X|X.....X|.XXXXX.","...ooooo...|....ooo....|..XXXXXXX..|XX.......XX|X.........X|XX.......XX|..XXXXXXX.."],
 ["gift","🎁","#9b59b6","#f1c40f",".oo.oo.|...o...|XXXoXXX|X..o..X|XXXoXXX|X..o..X|XXXoXXX","..ooo.ooo..|....ooo....|XXXXXoXXXXX|ooooooooooo|XXXXXoXXXXX|XXXXXoXXXXX|XXXXXoXXXXX"],
 ["party","🎉 🎊 🥳","#ff8c42","#3a7bd5","....o.o|..o.o..|.XX..o.|.XXX...|XXXXX..|XXXX...|XX.....",".......o..o|....o.o....|..XX....o..|.XXXX..o...|.XXXXX....o|XXXXX......|XXX........"],
 ["tree","🎄 🌲","#2ecc71","#8b5a2b","...X...|..XXX..|.XXXXX.|..XXX..|.XXXXX.|XXXXXXX|...o...",".....X.....|...XXXXX...|....XXX....|..XXXXXXX..|...XXXXX...|XXXXXXXXXXX|....ooo...."],
 ["pumpkin","🎃","#e67e22","#2ecc71","...o...|.XXXXX.|XX.X.XX|XXXXXXX|XX...XX|XXXXXXX|.XXXXX.",".....oo....|.XXXXXXXXX.|XX..XXX..XX|XXXXXXXXXXX|XX.X.X.X.XX|.XX.....XX.|...XXXXX..."],
 ["ghost","👻","#f4f4f4","#2d2420",".XXXXX.|XXXXXXX|XoXXXoX|XXXXXXX|XXXXXXX|XXXXXXX|X.X.X.X","...XXXXX...|.XXXXXXXXX.|XXooXXXooXX|XXooXXXooXX|XXXXXXXXXXX|XXXXXXXXXXX|X.XX.X.XX.X"],
 ["sun","☀️ ☀ 🌞 🌤️","#f39c12","#f1c40f","X..o..X|.X.o.X.|..XXX..|ooXXXoo|..XXX..|.X.o.X.|X..o..X","o....o....o|...XXXXX...|..XXXXXXX..|ooXXXXXXXoo|..XXXXXXX..|...XXXXX...|o....o....o"],
 ["moon","🌙 🌛 🌜 🌝","#f1c40f","#f39c12","..XXX..|.XX....|XX.....|XX.....|XX.....|.XX....|..XXX..","....XXXX...|..XXXX.....|.XXXX......|.XXX.......|.XXXX......|..XXXX.....|....XXXX..."],
 ["ball","⚽ 🏀 🏈 ⚾","#f4f4f4","#2d2420",".XXXXX.|XXoXoXX|XooooXX|XXoooXX|XooooXX|XXoXoXX|.XXXXX.","...XXoXX...|.XXXXXXXXX.|XoXXoooXXoX|XXXXoooXXXX|XXXXXXXXXXX|.XoXXXXXoX.|...XXXXX..."],
 ["fire","🔥","#e74c3c","#f1c40f","...X...|..XX...|..XXX.X|.XXXXXX|XXXoXXX|XXoooXX|.XXXXX.",".....X.....|....XX...X.|...XXXX.XX.|.XXXXoXXXX.|XXXXoooXXXX|XXXoooooXXX|.XXXXXXXXX."],
 ["music","🎵 🎶","#3a7bd5","#2d2420","...XXXX|...X..X|...X..X|...X..X|.XXX.XX|XXXX.XX|.XX....","...XXXXXXXX|...X......X|...X......X|...X......X|.XXX....XXX|XXXX...XXXX|.XX.....XX."],
 ["crown","👑","#f1c40f","#e74c3c","X..X..X|XX.X.XX|XXXXXXX|XoXoXoX|XXXXXXX|.......|.......","...........|X....X....X|XX..XXX..XX|XXXXXXXXXXX|XoXXXoXXXoX|XXXXXXXXXXX|..........."],
 ["flower","🌸 🌹 🌷 🌼 🌺 💐","#ff6b9d","#2ecc71",".X.X.X.|XXXXXXX|.XXXXX.|XXXXXXX|.X.o.X.|...o...|..ooo..","....XXX....|.XX.XXX.XX.|.XXXX.XXXX.|..XXXXXXX..|.....o.....|..oo.o.....|.....o....."],
 ["snow","❄️ ❄ ☃️ ☃ ⛄","#4ca3dd","#f4f4f4","...X...|X..X..X|.X.X.X.|..XXX..|.X.X.X.|X..X..X|...X...",".....X.....|.X..XXX..X.|..X..X..X..|XXXXXXXXXXX|..X..X..X..|.X..XXX..X.|.....X....."],
 ["trophy","🏆 🥇","#f39c12","#8b5a2b","XXXXXXX|XXXXXXX|.XXXXX.|..XXX..|...X...|..ooo..|.ooooo.",".XXXXXXXXX.|X.XXXXXXX.X|.X.XXXXX.X.|...XXXXX...|.....X.....|....ooo....|..ooooooo.."],
];
//DRAWBITS
// generated by scripts/gen_drawings.py: mob-sized drawings, square on screen (huge: h=22x14, hh=24x14 under hats)
const DRAWBITS={h:["......................|.....XXX......XXX.....|...XXXXXXX..XXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|.XXXXXXXXXXXXXXXXXXXX.|.XXXXXXXXXXXXXXXXXXXX.|..XXXXXXXXXXXXXXXXXX..|....XXXXXXXXXXXXXX....|.....XXXXXXXXXXXX.....|......XXXXXXXXXX......|........XXXXXXX.......|.........XXXX.........|..........XX..........|......................","......................|.....oo...oo...oo.....|.....oo...oo...oo.....|.....o....oo....o.....|.....oo...oo...oo.....|.....oo...oo...oo.....|.....oo...oo...oo.....|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|..oooooooooooooooooo..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..","......................|..........XXX.........|.........XXXX.........|.........XXXXX........|........XXXXXX........|........XXXXXX........|..oooo.XXXXXXXXXXXX...|..oooooXXXXXXXXXXXXX..|..oooooXXXXXXXXXXXXX..|..oooooXXXXXXXXXXXXX..|..oooooXXXXXXXXXXXXX..|..oooooXXXXXXXXXXXXX..|..ooooo.XXXXXXXXXXXX..|..oooo...XXXXXXXXX....","......................|..........XX..........|..........XX..........|.........XXXX.........|........XXXXXX........|.XXXXXXXXXXXXXXXXXXXX.|..XXXXXXXXXXXXXXXXXX..|....XXXXXXXXXXXXXX....|......XXXXXXXXXX......|......XXXXXXXXXX......|.....XXXXXXXXXXXX.....|.....XXXX....XXXX.....|.....XX........XX.....|......................",".......XXXXXXXX.......|.....XXXXXXXXXXXXX....|...XXXXXXXXXXXXXXXX...|..XXXXXXXXXXXXXXXXXX..|.XXXXXoooXXXXXooXXXXX.|XXXXXXoooXXXXoooXXXXXX|XXXXXXXXXXXXXXXXXXXXXX|XXXXXXXXXXXXXXXXXXXXXX|XXXXXXXXXXXXXXXXXXXXXX|.XXXXXoooXXXXoooXXXXX.|..XXXXXXooooooXXXXXX..|...XXXXXXXXXXXXXXXX...|....XXXXXXXXXXXXXX....|.......XXXXXXXX.......","......................|......................|.....oooooooooooo.....|.....oooooooooooo.....|.......oooooooo.......|......XXXooooXXX......|....XXXXX....XXXXX....|...XXX..........XXX...|...XXX..........XXX...|...XX............XX...|...XXX..........XXX...|....XXX........XXX....|.....XXXXXXXXXXXX.....|.......XXXXXXXX.......","......................|.....o..........o.....|.....ooo......ooo.....|.....ooooo..ooooo.....|.XXXXXXXXXoooXXXXXXXX.|.XXXXXXXXXooXXXXXXXXX.|......................|..XXXXXXXXooXXXXXXXX..|..XXXXXXXXooXXXXXXXX..|..XXXXXXXXooXXXXXXXX..|..XXXXXXXXooXXXXXXXX..|..XXXXXXXXooXXXXXXXX..|..XXXXXXXXooXXXXXXXX..|..XXXXXXXXooXXXXXXXX..","......................|........ooo.ooo.......|.............oo.......|...................o..|..................ooo.|......XXX.............|......XXXX............|.....XXXXXXX...ooo....|.....XXXXXXXX...oo....|....XXXXXXXXXXX.......|...XXXXXXXXXX......oo.|...XXXXXX..........oo.|..XXX.................|......................","......................|..........XXX.........|........XXXXXX........|.......XXXXXXXX.......|......XXXXXXXXXX......|.......XXXXXXXX.......|......XXXXXXXXXX......|....XXXXXXXXXXXXXX....|......XXXXXXXXXX......|....XXXXXXXXXXXXXX....|...XXXXXXXXXXXXXXXX...|..XXXXXXXXXXXXXXXXXX..|.........oooo.........|.........oooo.........","......................|..........oo..........|..........oo..........|.......XXXoooXX.......|....XXXXXXXXXXXXXX....|..XXXXXXXXXXXXXXXXXX..|.XXXXX..XXXXXX..XXXXX.|.XXXX....XXXX....XXXX.|.XXXXXXXXXXXXXXXXXXXX.|.XXXXXXXXXXXXXXXXXXXX.|.XXXX...X....X...XXXX.|..XXXX..........XXXX..|....XXXXXXXXXXXXXX....|.......XXXXXXXX.......",".........XXXX.........|......XXXXXXXXXX......|....XXXXXXXXXXXXXX....|...XXXXXXXXXXXXXXXX...|..XXXXXXXXXXXXXXXXXX..|..XXXXoooXXXXoooXXXX..|..XXXXoooXXXXoooXXXX..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|...XX...XX..XX...XX...","..........oo..........|..........oo..........|...oo............oo...|....oo...XXXX...oo....|.......XXXXXXXXX......|......XXXXXXXXXXX.....|.....XXXXXXXXXXXX.....|ooo..XXXXXXXXXXXX..ooo|......XXXXXXXXXXX.....|......XXXXXXXXXX......|....oo..XXXXXX..oo....|...oo............oo...|..........oo..........|..........oo..........","......................|.....XXXX.............|...XXXXX..............|.XXXXXX...............|.XXXXXX...............|XXXXXXX...............|XXXXXXX...............|XXXXXXXX..............|XXXXXXXXX.............|.XXXXXXXXX............|.XXXXXXXXXXXXX...X....|...XXXXXXXXXXXXXX.....|....XXXXXXXXXXXX......|........XXX...........",".......XXXXXXXX.......|....ooooXXXXXXoooo....|...XooooXXXXXXooooo...|..XXooooXXXXXXooooXX..|.XXXXXXXXXooXXXXXXXXX.|XXXXXXXXooooooXXXXXXXX|XXXXXXXooooooooXXXXXXX|XoooXXXooooooooXXXoooX|oooooXXXooooooXXXooooo|.ooooXXXXXXXXXXXXoooo.|..XXXXXXXXXXXXXXXXXX..|...XXXXXXooooXXXXXX...|....XXXXXooooXXXXX....|.......XXooooXX.......","......................|..........XX..........|..........XXX.........|.........XXXXX........|.........XXXXXXXX.....|.....X..XXXXXXXXXX....|....XXXXXXXoXXXXXXX...|...XXXXXXXoooXXXXXX...|...XXXXXXooooXXXXXXX..|...XXXXXooooooXXXXXX..|...XXXXXooooooXXXXX...|....XXXXooooooXXXX....|.....XXXooooooXXX.....|.........XXXX.........","......................|..........XXXXXXXXX...|........XXXXXXXXXXX...|........XXXXXXX..XX...|........XX........X...|........XX........X...|........XX........X...|........XX........X...|........XX....XXXXX...|........XX..XXXXXXX...|...XXXXXXX.XXXXXXXX...|..XXXXXXXX..XXXXXX....|...XXXXXX.............|......................","......................|......................|..........XX..........|.........XXXX.........|.XX.....XXXXXX.....XX.|.XXXX..XXXXXXXX..XXXX.|.XXXXXXXXXXXXXXXXXXXX.|..XXXXXXXXXXXXXXXXXXX.|..XXXooXXXooXXXooXXX..|..XXXooXXXooXXXooXXX..|..XXXXXXXXXXXXXXXXXX..|...XXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXX..|...XXXXXXXXXXXXXXXXX..",".........XXXXX........|.......XXXXXXXX.......|....XXXXXXXXXXXXXX....|...XXXXXXXXXXXXXXXX...|...XXXXXX....XXXXXX...|...XXXXXX....XXXXXX...|....XXXXXX...XXXXX....|....XXXXXXXXXXXXXX....|.....XXXXXXXXXXXX.....|......XXXXXXXXXXX.....|..........ooooooooo...|..........ooooooooo...|..........oo..........|..........oo..........","..........XX..........|........XXXXXX........|..........XXX.........|..XXX.....XX.....XXX..|..XXXX....XX....XXXX..|..XXXXXXX.XX.XXXXXXXX.|........XXXXXX........|........XXXXXX........|..XX.XXXX.XX.XXXX.XX..|..XXXX....XX....XXXX..|..XXX.....XX.....XXXX.|....X.....XX..........|........XXXXXX........|..........XX..........","......................|..XXXXXXXXXXXXXXXXXX..|.XX.XXXXXXXXXXXXXXXXX.|XX..XXXXXXXXXXXXXX..XX|.XX.XXXXXXXXXXXXXX..X.|..XX.XXXXXXXXXXXX.XX..|......XXXXXXXXXX......|.......XXXXXXXX.......|..........XX..........|..........XX..........|..........XX..........|.....oooooooooooo.....|.....oooooooooooo.....|......oooooooooo......"],hh:["........................|.....XXXX.......XXX.....|...XXXXXXXX..XXXXXXXX...|..XXXXXXXXXXXXXXXXXXXX..|.XXXXXXXXXXXXXXXXXXXXXX.|..XXXXXXXXXXXXXXXXXXXXX.|..XXXXXXXXXXXXXXXXXXXX..|....XXXXXXXXXXXXXXXX....|.....XXXXXXXXXXXXXX.....|.......XXXXXXXXXX.......|........XXXXXXXX........|..........XXXX..........|...........XX...........|........................","........................|.....oo....oo....oo.....|.....oo....oo....oo.....|......o....oo....oo.....|.....ooo...oo....oo.....|.....ooo...oo....oo.....|.....ooo...oo....oo.....|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..oooooooooooooooooooo..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..","........................|...........XXXX.........|..........XXXXX.........|..........XXXXX.........|.........XXXXXX.........|.........XXXXXX.........|..ooooo.XXXXXXXXXXXXX...|..ooooo.XXXXXXXXXXXXXX..|..ooooo.XXXXXXXXXXXXXX..|..ooooo.XXXXXXXXXXXXX...|..ooooo.XXXXXXXXXXXXXX..|..ooooo.XXXXXXXXXXXXX...|..ooooo.XXXXXXXXXXXXX...|...oooo...XXXXXXXXXX....","........................|...........XX...........|...........XXX..........|..........XXXX..........|.........XXXXXX.........|.XXXXXXXXXXXXXXXXXXXXXX.|..XXXXXXXXXXXXXXXXXXXX..|.....XXXXXXXXXXXXXX.....|.......XXXXXXXXXXX......|......XXXXXXXXXXXX......|......XXXXXXXXXXXX......|......XXXX....XXXXX.....|.....XXX.........XX.....|........................","........XXXXXXXX........|.....XXXXXXXXXXXXXX.....|...XXXXXXXXXXXXXXXXXX...|..XXXXXXXXXXXXXXXXXXXX..|.XXXXXXooXXXXXXoooXXXXX.|.XXXXXooooXXXXXoooXXXXXX|XXXXXXXXXXXXXXXXXXXXXXXX|XXXXXXXXXXXXXXXXXXXXXXXX|XXXXXXXXXXXXXXXXXXXXXXXX|.XXXXXooooXXXXooooXXXXX.|..XXXXXXooooooooXXXXXX..|...XXXXXXXXXXXXXXXXXX...|.....XXXXXXXXXXXXXX.....|........XXXXXXXX........","........................|........................|......oooooooooooo......|.....oooooooooooooo.....|........ooooooooo.......|.......XXXooooXXX.......|.....XXXXX....XXXXX.....|....XXX..........XXX....|...XXX............XXX...|...XXX............XXX...|...XXX............XXX...|....XXXX........XXXX....|......XXXXXXXXXXXXX.....|........XXXXXXXX........","........................|......o..........oo.....|.....oooo......oooo.....|.....oooooo..oooooo.....|.XXXXXXXXXooooXXXXXXXXX.|.XXXXXXXXXooooXXXXXXXXX.|........................|..XXXXXXXXooooXXXXXXXX..|..XXXXXXXXooooXXXXXXXX..|..XXXXXXXXooooXXXXXXXX..|..XXXXXXXXooooXXXXXXXX..|..XXXXXXXXooooXXXXXXXX..|..XXXXXXXXooooXXXXXXXX..|..XXXXXXXXooooXXXXXXXX..","........................|.........ooo.ooo........|..............oo........|....................oo..|....................ooo.|.......XX...............|......XXXXX.............|......XXXXXXX....ooo....|.....XXXXXXXXXX..ooo....|....XXXXXXXXXXXX........|....XXXXXXXXXX......ooo.|...XXXXXXX...........oo.|..XXXX..................|........................","........................|..........XXXX..........|.........XXXXXX.........|.......XXXXXXXXXX.......|......XXXXXXXXXXXX......|........XXXXXXXX........|......XXXXXXXXXXXX......|.....XXXXXXXXXXXXXXX....|......XXXXXXXXXXXX......|.....XXXXXXXXXXXXXX.....|...XXXXXXXXXXXXXXXXXX...|..XXXXXXXXXXXXXXXXXXXX..|..........oooo..........|..........oooo..........","........................|...........ooo..........|...........ooo..........|........XXXoooXX........|.....XXXXXXXXXXXXXXX....|...XXXXXXXXXXXXXXXXXX...|..XXXX...XXXXXX...XXXXX.|.XXXX.....XXXX.....XXXX.|.XXXXXXXXXXXXXXXXXXXXXX.|.XXXXXXXXXXXXXXXXXXXXXX.|..XXXX..XX....XX..XXXXX.|...XXXX..........XXXX...|.....XXXXXXXXXXXXXXX....|........XXXXXXXX........","..........XXXX..........|......XXXXXXXXXXXX......|....XXXXXXXXXXXXXXXX....|...XXXXXXXXXXXXXXXXXX...|..XXXXXXXXXXXXXXXXXXXX..|..XXXXooooXXXXooooXXXX..|..XXXXooooXXXXXoooXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|..XXXXXXXXXXXXXXXXXXXX..|...XXX...XX...XX...XX...","...........oo...........|...........oo...........|...ooo.............oo...|.....oo..XXXXXX..oo.....|.......XXXXXXXXXX.......|......XXXXXXXXXXXX......|......XXXXXXXXXXXXX.....|oooo..XXXXXXXXXXXXX.oooo|......XXXXXXXXXXXX......|.......XXXXXXXXXX.......|.....oo..XXXXXX..oo.....|...ooo............ooo...|...........oo...........|...........oo...........","........................|.....XXXXX..............|...XXXXX................|..XXXXXX................|.XXXXXX.................|XXXXXXX.................|XXXXXXXX................|XXXXXXXX................|XXXXXXXXX...............|.XXXXXXXXXX.............|.XXXXXXXXXXXXXX....X....|...XXXXXXXXXXXXXXXX.....|.....XXXXXXXXXXXX.......|.........XXX............","........XXXXXXXX........|.....oooXXXXXXXXooo.....|...XoooooXXXXXXoooooX...|..XXoooooXXXXXXoooooXX..|.XXXXXXXXXXooXXXXXXXXXX.|.XXXXXXXXooooooXXXXXXXXX|XXXXXXXXoooooooooXXXXXXX|XXoooXXXooooooooXXXooooX|ooooooXXXooooooXXXoooooo|.ooooXXXXXXXXXXXXXXoooo.|..XXXXXXXXXXXXXXXXXXXX..|...XXXXXXXooooXXXXXXX...|.....XXXXooooooXXXX.....|........XXooooXX........","........................|...........XX...........|...........XXX..........|..........XXXXX.........|.........XXXXXXXXXX.....|.........XXXXXXXXXXX....|.....XXXXXXXoXXXXXXX....|....XXXXXXooooXXXXXXX...|...XXXXXXooooooXXXXXX...|...XXXXXXoooooooXXXXX...|....XXXXooooooooXXXXX...|....XXXXXoooooooXXXX....|.....XXXXooooooXXXX.....|..........XXXXX.........","........................|...........XXXXXXXXXX...|.........XXXXXXXXXXXX...|.........XXXXXXXX..XX...|.........XX........XX...|.........XX........XX...|.........XX........XX...|.........XX........XX...|.........XX....XXX.XX...|.........XX..XXXXXXXX...|...XXXXXXXX..XXXXXXXX...|..XXXXXXXXX..XXXXXXX....|...XXXXXXX..............|........................","........................|........................|...........XX...........|..........XXXX..........|.XX......XXXXXX......XX.|.XXXX...XXXXXXXX...XXXX.|..XXXXXXXXXXXXXXXXXXXXX.|..XXXXXXXXXXXXXXXXXXXX..|..XXXoooXXXooXXXXooXXX..|..XXXoooXXXooXXXXooXXX..|..XXXXXXXXXXXXXXXXXXXX..|...XXXXXXXXXXXXXXXXXX...|..XXXXXXXXXXXXXXXXXXXX..|...XXXXXXXXXXXXXXXXXX...",".........XXXXXX.........|........XXXXXXXX........|.....XXXXXXXXXXXXXXX....|...XXXXXXXXXXXXXXXXXX...|...XXXXXXX....XXXXXXX...|...XXXXXXX.....XXXXXX...|.....XXXXX....XXXXX.....|.....XXXXXXXXXXXXXX.....|.....XXXXXXXXXXXXXX.....|......XXXXXXXXXXXX......|...........ooooooooo....|...........ooooooooo....|...........oo...........|...........oo...........","...........XX...........|.........XXXXXX.........|....X.....XXXX.....X....|..XXXX.....XX.....XXXX..|..XXXXX....XX....XXXXX..|..XXXXXXXX.XX.XXXXXXXX..|........XXXXXXXX........|.........XXXXXXX........|..XXX.XXXX.XX.XXXXXXXX..|..XXXXX....XX....XXXXX..|..XXXX.....XX.....XXXX..|....X......XXX.....X....|.........XXXXXX.........|...........XX...........","........................|..XXXXXXXXXXXXXXXXXXXX..|.XX.XXXXXXXXXXXXXXXX.XX.|XX..XXXXXXXXXXXXXXXX..XX|.XX..XXXXXXXXXXXXXXX.XX.|..XX.XXXXXXXXXXXXXX.XX..|......XXXXXXXXXXXX......|........XXXXXXXX........|...........XXX..........|...........XX...........|..........oXXo..........|......oooooooooooo......|......oooooooooooo......|......oooooooooooo......"]};
///DRAWBITS
const DRAW_CH=DRAW.map((_,i)=>String.fromCharCode(0xE000+i));
const DRAW_EMOJI=new Map();
DRAW.forEach((d,i)=>{G[DRAW_CH[i]]=d[4];d[1].split(" ").forEach(e=>DRAW_EMOJI.set(e,DRAW_CH[i]));});
const DRAW_INFO=ch=>{const i=ch.charCodeAt(0)-0xE000;return i>=0&&i<DRAW.length?DRAW[i]:null;};
// how a drawing token shows in the text box: its first emoji
const toDisplay=t=>[...String(t)].map(c=>{const d=DRAW_INFO(c);return d?d[1].split(" ")[0]:c;}).join("");
const EMOJI_RE=new RegExp([...DRAW_EMOJI.keys()].sort((a,b)=>b.length-a.length).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"g");
// ---------- text ----------
const glyph = ch => (G[ch]||G["?"]).split("|");
const GW = ch => ch===" "?3:glyph(ch)[0].length;
// v1 alphabet (6-bit codes; never reorder: existing links depend on it) and the v2 superset (7-bit codes)
const ALPHA=" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.,'\"-+:#&@/*=()$%_♥";
const ALPHA2=ALPHA+";<>[]{}\\|^`~£€°"+DRAW_CH.join("");
const MAXLEN=32;
function sanitize(raw){
  let t=String(raw||"").replace(/[\u{1F3FB}-\u{1F3FF}]/gu,"").replace(EMOJI_RE,m=>DRAW_EMOJI.get(m)).normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  t=t.replace(/[\u2018\u2019\u201A\u2032\u00B4]/g,"'").replace(/[\u201C\u201D\u201E\u2033]/g,'"')
     .replace(/[\u2013\u2014\u2212]/g,"-").replace(/\u2026/g,"...")
     .replace(/(?:\u2665|\u2661|\u2763)\uFE0F?/g,"\u2665");
  t=t.toUpperCase();
  const out=[],dropped=new Set();
  for(const ch of t){
    if(/\s/.test(ch)){out.push(" ");continue;}
    if(ALPHA2.includes(ch))out.push(ch);
    else if(!/^[\uFE0F\uFE0E\u200D\u20E3]$/.test(ch)&&!/^\uD83C[\uDFFB-\uDFFF]$/.test(ch))dropped.add(ch);
  }
  return {text:out.join("").replace(/ {2,}/g," "),dropped:[...dropped]};
}
function cleanText(t){return sanitize(t).text.trim().slice(0,MAXLEN).trim();}
const lineW=s=>[...s].reduce((w,c,i)=>w+GW(c)+(i?1:0),0);
// Mob drawings use aspect-correct, size-native bitmaps. Text/UI keep their legacy grid.
function mobGlyph(c,huge,hats){
  const d=DRAW_INFO(c),n=c.charCodeAt(0)-0xE000;
  if(!d){const g=glyph(c);return huge?g.flatMap(r=>[...Array(2)].map(()=>[...r].map(v=>v+v).join(""))):g;}
  if(huge)return DRAWBITS[hats?"hh":"h"][n].split("|");
  const g=d[5].split("|");return hats?g.map(r=>r.slice(0,6)+r.slice(5)):g;
}
function rasterLines(lines,mob=null){
  const huge=!!(mob&&mob.huge),hats=!!(mob&&mob.hats),scale=huge?2:1;
  const get=c=>mob?mobGlyph(c,huge,hats):glyph(c);
  const width=c=>c===" "?3*scale:get(c)[0].length;
  const widths=lines.map(l=>[...l].reduce((w,c,i)=>w+width(c)+(i?scale:0),0)),maxW=Math.max(...widths),cells=[];
  lines.forEach((ln,li)=>{
    let x=Math.floor((maxW-widths[li])/2);const y0=li*9*scale;
    [...ln].forEach((c,i)=>{if(i)x+=scale;if(c===" "){x+=3*scale;return;}
      const g=get(c),d=DRAW_INFO(c);
      g.forEach((r,ry)=>[...r].forEach((v,rx)=>{if(v==="X"||v==="o")cells.push([x+rx,y0+ry,d?(v==="o"?d[3]:d[2]):null]);}));x+=g[0].length;
    });
  });
  return {cells,cols:maxW,rows:(lines.length*9-2)*scale};
}
// candidate line breaks: 1..3 balanced lines by words; long single words may be split
function lineOptions(t,maxLines){maxLines=maxLines||3;
  const opts=[[t]];const words=t.split(" ");
  const best=(n)=>{let bestL=null,bw=1e9;
    const rec=(start,k,acc)=>{
      if(k===1){const l=acc.concat([words.slice(start).join(" ")]);const w=Math.max(...l.map(lineW));if(w<bw){bw=w;bestL=l;}return;}
      for(let i=start+1;i<=words.length-k+1;i++)rec(i,k-1,acc.concat([words.slice(start,i).join(" ")]));};
    rec(0,n,[]);return bestL;};
  for(let n=2;n<=maxLines;n++)if(words.length>=n)opts.push(best(n));
  // a single long word (or very long words) can break mid-word as a last resort
  if(words.length===1&&t.length>=9){const chars=[...t.replace(/ /g,"")];
    for(let n=2;n<=3;n++){const k=Math.ceil(chars.length/n);const l=[];for(let i=0;i<chars.length;i+=k)l.push(chars.slice(i,i+k).join(""));
      // hyphenate the break so it still reads as one word (skip if the line already ends in punctuation)
      opts.push(l.map((x,j)=>j<l.length-1&&/[A-Z0-9]$/.test(x)&&/^[A-Z0-9]/.test(l[j+1])?x+"-":x));}}
  return opts.filter(Boolean).map(l=>l.map(s=>s.trim()).filter(s=>s.length));
}
// ---------- share codes: 6-bit pack -> salted XOR keystream -> base64url, 16-bit checksum ----------
const KEY=[0x6c,0x31,0x74,0x74,0x6c,0x65,0x2d,0x6d,0x33,0x6e,0x9e,0x42,0xd7,0x18,0xa5,0x5b];
const ks=(salt,i)=>(KEY[i%KEY.length]+salt*29+i*71+(i*i)%13)&255;
function fnv16(arr){let h=0x811c9dc5;for(const b of arr){h^=b;h=Math.imul(h,0x01000193)>>>0;}return (h^(h>>>16))&0xffff;}
function b64u(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function unb64u(str){if(!/^[A-Za-z0-9_-]+$/.test(str))throw 0;str=str.replace(/-/g,"+").replace(/_/g,"/");while(str.length%4)str+="=";const s=atob(str);return Array.from(s,c=>c.charCodeAt(0));}
// Share codes. v1: 6-bit text. v2: flags byte + 7-bit text (+ room for future fields). The version is
// told apart by a tagged checksum, so every old link keeps working and v1 stays the shortest form.
const CS_TAG={1:null,2:0x5d};
const csum=(v,salt,packed)=>fnv16(CS_TAG[v]==null?[salt,...packed]:[salt,CS_TAG[v],...packed]);
function seal(v,packed,salt){const cs=csum(v,salt,packed);const raw=[...packed,cs&255,cs>>8];return [salt^0xa7,...raw.map((b,i)=>b^ks(salt,i))];}
function open1(r){const salt=r[0]^0xa7;const raw=r.slice(1).map((b,i)=>b^ks(salt,i));const packed=raw.slice(0,-2);
  for(const v of [1,2]){const cs=csum(v,salt,packed);if((cs&255)===raw[raw.length-2]&&(cs>>8)===raw[raw.length-1])return {v,packed};}return null;}
function pack(vals,bitsPer){const out=[];let acc=0,bits=0;for(const v of vals){acc=(acc<<bitsPer)|v;bits+=bitsPer;while(bits>=8){bits-=8;out.push((acc>>bits)&255);}acc&=(1<<bits)-1;}
  if(bits>0)out.push((acc<<(8-bits))&255);return out;}
// A message: up to 4 scenes plus optional extras. Extras ride in v2's flags byte + TLV fields, so v1 links
// and simple v2 links keep decoding exactly as before, and unknown future fields are skipped, not fatal.
const THEMES=["default","birthday","christmas","halloween","wedding","stadium"];           // append only
const MOB_COLORS=["#e74c3c","#3a7bd5","#2ecc71","#f1c40f","#9b59b6","#ff6b9d","#2d2420","#f4f4f4","#ff8c42","#1abc9c"]; // append only
const BG_COLORS=["#f4f2ee","#fff6e8","#eaf4fb","#fbf1f3","#eef7ea","#1f2a44","#2a1f33","#3f7d3a","#2d2420","#ffe9a8"];   // append only
const SIZES=["small","medium","huge"];
const MAX_SCENES=4,MAX_TOTAL=80,MAX_FROM=16,SCENE_BREAK=127;
const T_FROM=1,T_THEME=2,T_MOB=3,T_BG=4,T_SIZE=5,T_AT=6;
function blankMsg(){return {scenes:[""],from:"",theme:"default",mob:-1,bg:-1,size:"medium",at:0};}
function normMsg(m){
  const o=Object.assign(blankMsg(),m||{});
  let total=0;
  o.scenes=(o.scenes||[]).map(cleanText).filter(Boolean).slice(0,MAX_SCENES).map(t=>{const k=[...t].slice(0,Math.max(0,MAX_TOTAL-total)).join("").trim();total+=[...k].length;return k;}).filter(Boolean);
  o.from=[...cleanText(o.from||"")].filter(c=>!DRAW_INFO(c)).slice(0,MAX_FROM).join("").trim();
  if(!THEMES.includes(o.theme))o.theme="default";
  if(!(o.mob>=0&&o.mob<MOB_COLORS.length))o.mob=-1;
  if(!(o.bg>=0&&o.bg<BG_COLORS.length))o.bg=-1;
  if(!SIZES.includes(o.size))o.size="medium";
  o.at=Math.max(0,Math.floor(+o.at||0));
  return o;
}
const isPlain=m=>m.scenes.length===1&&!m.from&&m.theme==="default"&&m.mob<0&&m.bg<0&&m.size==="medium"&&!m.at;
function encodePayload(input){
  const m=normMsg(input);if(!m.scenes.length)return "";
  const chars=[...m.scenes[0]];
  let v,packed;
  if(isPlain(m)&&chars.every(c=>ALPHA.includes(c))){v=1;packed=pack(chars.map(c=>ALPHA.indexOf(c)+1),6);}
  else{
    v=2;const vals=[];m.scenes.forEach((sc,i)=>{if(i)vals.push(SCENE_BREAK);for(const c of sc)vals.push(ALPHA2.indexOf(c)+1);});vals.push(0);
    const f=[];
    if(m.from)f.push(T_FROM,[...m.from].length,...[...m.from].map(c=>ALPHA2.indexOf(c)+1));
    if(m.theme!=="default")f.push(T_THEME,1,THEMES.indexOf(m.theme));
    if(m.mob>=0)f.push(T_MOB,1,m.mob);
    if(m.bg>=0)f.push(T_BG,1,m.bg);
    if(m.size!=="medium")f.push(T_SIZE,1,SIZES.indexOf(m.size));
    if(m.at){const t=Math.floor(m.at/60000);f.push(T_AT,4,(t>>>24)&255,(t>>>16)&255,(t>>>8)&255,t&255);}
    packed=[f.length?1:0,...pack(vals,7),...f];
  }
  for(let tries=0;tries<64;tries++){const salt=Math.random()*256|0;const r=seal(v,packed,salt);
    const o=open1(r);if(o&&o.v===v)return b64u(r);}  // re-salt in the 1-in-65536 case a v2 code would also pass as v1
  return b64u(seal(v,packed,0));
}
function decodePayload(code){
  try{const r=unb64u(String(code||""));if(r.length<3||r.length>128)return null;
    const o=open1(r);if(!o)return null;
    const m=blankMsg();let acc=0,bits=0,cur="",i=0;
    if(o.v===1){for(const b of o.packed){acc=((acc<<8)|b)&0xffff;bits+=8;while(bits>=6){bits-=6;const v=(acc>>bits)&63;if(v===0)break;if(v>ALPHA.length)return null;cur+=ALPHA[v-1];}}
      m.scenes=[cur];return m;}
    const flags=o.packed[0],p=o.packed;m.scenes=[];
    let done=false;
    for(i=1;i<p.length&&!done;i++){acc=((acc<<8)|p[i])&0xffff;bits+=8;
      while(bits>=7){bits-=7;const v=(acc>>bits)&127;
        if(v===0){done=true;break;}
        if(v===SCENE_BREAK){m.scenes.push(cur);cur="";continue;}
        if(v>ALPHA2.length)return null;cur+=ALPHA2[v-1];}}
    m.scenes.push(cur);
    if(flags&1)while(i+1<p.length){const t=p[i],n=p[i+1],d=p.slice(i+2,i+2+n);i+=2+n;if(d.length<n)break;
      if(t===T_FROM)m.from=d.map(x=>ALPHA2[x-1]||"").join("");
      else if(t===T_THEME)m.theme=THEMES[d[0]]||"default";
      else if(t===T_MOB)m.mob=d[0];
      else if(t===T_BG)m.bg=d[0];
      else if(t===T_SIZE)m.size=SIZES[d[0]]||"medium";
      else if(t===T_AT&&n===4)m.at=(((d[0]<<24)>>>0)+(d[1]<<16)+(d[2]<<8)+d[3])*60000;
      // unknown field types are skipped so older apps can still open newer links
    }
    const n=normMsg(m);return n.scenes.length?n:null;
  }catch(e){return null;}
}
const encodeMsg=t=>encodePayload({scenes:[t]});
function decodeMsg(code){const m=decodePayload(code);return m?m.scenes.join(" / "):null;}

// ---------- sprites ----------
const SW=12,SH=19;            // frame size incl. 1px outline (10x17 art: 3 spare rows above the head for hats)
const TOP=3;                  // art rows reserved for headwear
const SHB=SH-TOP;             // visible body height: heads sit SHB*S above the feet
const R=a=>a[Math.random()*a.length|0], rnd=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>v<a?a:v>b?b:v;
const SKINS=["#f7d7bd","#f0c39d","#e2a878","#c58a5c","#a1683f","#7a4b2c","#5b3720"];
const ZSKIN=["#8cc152","#7fb85c","#9ccc65","#a3c46b"];
const HAIRS=["#2a1c14","#4b2e1b","#6d4426","#9a5b2e","#d7a43e","#ecc76b","#b8382c","#e07a35","#efefe8","#77736e","#6b46c1","#2f6fd6","#1f1f1f","#d6458d"];
const SHIRTS=["#e74c3c","#3a7bd5","#2ecc71","#f1c40f","#9b59b6","#e67e22","#1abc9c","#ff6b9d","#34495e","#f4f4f4","#d35400","#16a085","#5d6dbe","#c0392b","#f39c12","#7f8c8d","#4ca3dd","#8e44ad"];
const PANTS=["#2c3e70","#3b4a5a","#24324a","#5b4636","#2d2d2d","#6b7a8f","#7a5230","#1f4e5f","#554466"];
const SHOES=["#2a2320","#4a3020","#f4f4f4","#8b2d1e","#222831"];
const HATS=["#e74c3c","#2f6fd6","#2ecc71","#f1c40f","#2a2a2a","#ff8c42","#8e44ad"];
const OUT="#2d2420";
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
  r=clamp(Math.round(r*f),0,255);g=clamp(Math.round(g*f),0,255);b=clamp(Math.round(b*f),0,255);
  return "#"+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function newLook(){
  const zombie=Math.random()<0.12;
  const L={skin:zombie?R(ZSKIN):R(SKINS),hair:R(HAIRS),shirt:R(SHIRTS),pants:R(PANTS),shoes:R(SHOES),
    hat:R(HATS),eye:"#1b1714",zombie,
    style:R(["short","short","short","long","long","buzz","cap","cap","mohawk","bun","bald","beanie","afro","pony"]),
    skirt:Math.random()<0.15,beard:Math.random()<0.1,stripe:Math.random()<0.2,blush:Math.random()<0.25};
  if(zombie){ if(Math.random()<.6)L.shirt=R(["#5f8f3a","#6aa84f","#4e7d36",L.shirt]); L.hair=R(["#3d5a26","#2a1c14","#6b46c1",L.hair]); L.blush=false;}
  return L;
}
// kinds: F,Fblink,FlookL,FlookR,Fwave1,Fwave2,Fcheer,FwalkA,FwalkB,Bidle,BwalkA,BwalkB,Sa,Sp,Sb
function frameGrid(L,kind){
  const g=Array.from({length:14+TOP},()=>Array(10).fill(null));
  const put=(r,c,v)=>{c+=1;r+=TOP;if(r>=0&&r<14+TOP&&c>=0&&c<10)g[r][c]=v;};
  const del=(r,c)=>{c+=1;r+=TOP;if(r>=0&&r<14+TOP&&c>=0&&c<10)g[r][c]=null;};
  const M={S:L.skin,s:shade(L.skin,.85),H:L.hair,h:shade(L.hair,.8),E:L.eye,T:L.shirt,t:shade(L.shirt,.82),P:L.pants,
    B:L.shoes,C:L.hat,c:shade(L.hat,.75),K:L.pants,W:"#ffffff",Q:"#f09a9a",Y:"#f1c40f",A:L.acc2||"#ffffff"};
  const row=(r,str)=>{[...str].forEach((ch,c)=>{if(ch!==".")put(r,c,M[ch]);});};
  const side=kind[0]==="S", back=kind[0]==="B", front=kind[0]==="F";
  const st=L.style;
  // ---- head
  row(1,"..SSSS..");row(2,".SSSSSS.");row(3,".SSSSSS.");row(4,".SSSSSS.");row(5,"..ssss..");
  if(side){put(4,7,M.S);}
  if(front){
    let e1=2,e2=5;
    if(kind==="FlookL"){e1=1;e2=4;} if(kind==="FlookR"){e1=3;e2=6;}
    if(kind==="Fblink"){put(3,e1,M.s);put(3,e2,M.s);} else {put(3,e1,M.E);put(3,e2,M.E);}
    if(L.blush&&kind!=="FlookL"&&kind!=="FlookR"){put(4,1,M.Q);put(4,6,M.Q);}
    if(kind==="Fcheer"){put(4,3,M.E);put(4,4,M.E);} // open mouth
  }
  if(side){put(3,6,M.E);}
  const hairTop=()=>{row(0,"..HHHH..");row(1,".HHHHHH.");};
  if(front){
    if(st==="short"){hairTop();put(2,1,M.H);put(2,6,M.H);put(1,5,M.h);}
    if(st==="long"){hairTop();for(let r=2;r<=6;r++){put(r,1,M.H);put(r,6,M.H);}put(2,2,M.H);put(6,1,M.h);put(6,6,M.h);}
    if(st==="pony"){hairTop();put(2,1,M.H);put(2,6,M.H);put(1,7,M.H);put(2,7,M.H);put(3,7,M.h);}
    if(st==="buzz"){row(1,".hhhhhh.");}
    if(st==="cap"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,"cccccccc");}
    if(st==="beanie"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".cccccc.");put(-1,3,M.W);}
    if(st==="mohawk"){row(0,"...HH...");put(1,3,M.H);put(1,4,M.H);}
    if(st==="bun"){row(0,"...HH...");row(1,".HHHHHH.");put(2,1,M.H);put(2,6,M.H);}
    if(st==="afro"){row(0,".HHHHHH.");row(1,"HHHHHHHH");put(2,0,M.H);put(2,7,M.H);put(3,0,M.h);put(3,7,M.h);put(2,1,M.H);put(2,6,M.H);}
    if(L.beard){row(5,"..HHHH..");put(4,1,M.H);put(4,6,M.H);}
  }else if(side){
    if(st==="short"){hairTop();put(2,1,M.H);put(2,2,M.H);put(3,1,M.H);}
    if(st==="long"){hairTop();for(let r=2;r<=6;r++){put(r,1,M.H);put(r,2,M.H);}put(6,1,M.h);}
    if(st==="pony"){hairTop();put(2,1,M.H);put(2,2,M.H);put(2,0,M.H);put(3,0,M.H);put(4,0,M.h);}
    if(st==="buzz"){row(1,".hhhhhh.");put(2,1,M.h);}
    if(st==="cap"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".HCCCCcc");put(2,8,M.c);}
    if(st==="beanie"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".cccccc.");put(-1,2,M.W);}
    if(st==="mohawk"){row(0,"..HHH...");put(1,2,M.H);put(1,3,M.H);}
    if(st==="bun"){row(0,".HH.....");row(1,".HHHHHH.");put(2,1,M.H);put(2,2,M.H);}
    if(st==="afro"){row(0,".HHHHH..");row(1,"HHHHHHH.");for(let r=2;r<=4;r++){put(r,0,M.H);put(r,1,M.H);}put(2,2,M.H);}
    if(L.beard){row(5,"..HHHH..");put(4,5,M.H);put(4,4,M.H);}
  }else{ // back
    const skinBack=(st==="bald"||st==="buzz"||st==="mohawk");
    if(!skinBack){row(1,".HHHHHH.");row(2,".HHHHHH.");row(3,".HHHHHH.");row(4,".hHHHHh.");row(0,"..HHHH..");}
    if(st==="long"){row(5,".HHHHHH.");row(6,".hHHHHh.");}
    if(st==="pony"){put(5,3,M.H);put(5,4,M.H);put(6,3,M.h);put(6,4,M.h);}
    if(st==="afro"){row(1,"HHHHHHHH");row(2,"HHHHHHHH");row(3,"hHHHHHHh");}
    if(st==="buzz")row(1,".hhhhhh.");
    if(st==="mohawk"){row(0,"...HH...");for(let r=1;r<=3;r++){put(r,3,M.H);put(r,4,M.H);}}
    if(st==="cap"||st==="beanie"){row(0,"..CCCC..");row(1,".CCCCCC.");row(2,".cccccc.");}
    if(st==="bun"){put(-1,3,M.H);put(-1,4,M.H);row(0,"..HHHH..");}
  }
  // ---- themed headwear (drawn over hair; uses the rows above the head)
  const acc=L.acc;
  if(acc==="party"){row(-3,"....Y...");row(-2,"...CA...");row(-1,"...ACC..");row(0,"..CACA..");}
  if(acc==="santa"){row(-2,".....WW.");row(-1,"...CCCW.");row(0,"..CCCCC.");row(1,".WWWWWW.");}
  if(acc==="witch"){row(-3,"....C...");row(-2,"...CC...");row(-1,"...CCC..");row(0,"..CAAC..");row(1,"CCCCCCCC");}
  if(acc==="ears"){row(-1,".C....C.");row(0,".CC..CC.");}
  if(acc==="horns"){row(-1,".A....A.");row(0,".AA..AA.");}
  if(acc==="tophat"){row(-3,"..CCCC..");row(-2,"..CCCC..");row(-1,"..AAAA..");row(0,".cccccc.");}
  if(acc==="veil"){row(0,"..WWWW..");row(1,".WWWWWW.");if(!side)for(let r=2;r<=8;r++){put(r,0,M.W);put(r,7,M.W);}else for(let r=2;r<=8;r++)put(r,0,M.W);}
  if(acc==="flowers"){row(0,"..AYAY..");put(1,1,M.A);put(1,6,M.Y);}
  if(acc==="foam"&&front&&(kind==="Fcheer"||kind.startsWith("Fwave"))){put(1,8,M.A);put(2,8,M.A);put(3,8,M.A);put(0,8,M.A);}
  // ---- body
  if(!side){
    row(6,".TTTTTT.");row(7,"TTTTTTTT");row(8,"TTTTTTTT");row(9,"STTTTTTS");
    if(L.stripe)row(8,"TttttttT");
    put(7,0,M.t);put(8,0,M.t);put(7,7,M.t);put(8,7,M.t);
    if(L.zombie&&front&&kind!=="Fcheer"&&!kind.startsWith("Fwave")){row(7,"STTTTTTS");row(9,".TTTTTT.");}
    if(kind==="Fwave1"||kind==="Fwave2"){del(8,7);del(9,7);put(7,7,M.t);
      if(kind==="Fwave1"){put(6,8,M.T);put(5,8,M.T);put(4,8,M.S);}
      else {put(6,8,M.T);put(5,8,M.T);put(4,9,M.S);put(5,9,M.T);del(5,8);put(6,8,M.T);put(5,9,M.T);}}
    if(kind==="Fcheer"){del(8,0);del(9,0);del(8,7);del(9,7);put(7,0,M.t);put(7,7,M.t);
      put(6,-1,M.T);put(5,-1,M.T);put(4,-1,M.S);put(6,8,M.T);put(5,8,M.T);put(4,8,M.S);}
    if(L.skirt){row(10,".KKKKKK.");row(11,"KKKKKKKK");}
    else {row(10,".PPPPPP.");row(11,".PP..PP.");}
    const lg=L.skirt?"S":"P";
    if(kind==="FwalkA"||kind==="BwalkA"){row(12,".BB.."+lg+lg+".");row(13,".....BB.");}
    else if(kind==="FwalkB"||kind==="BwalkB"){row(12,"."+lg+lg+"..BB.");row(13,".BB.....");}
    else {row(12,"."+lg+lg+".."+lg+lg+".");row(13,".BB..BB.");}
  }else{
    row(6,"..TTTT..");row(7,"..TTTT..");row(8,"..TTTT..");row(9,"..tTTT..");
    if(L.stripe)row(8,"..tttt..");
    if(L.zombie){row(7,"..TTTTSS");}
    else if(kind==="Sa"){put(8,6,M.S);put(7,5,M.t);}
    else if(kind==="Sb"){put(9,1,M.S);put(8,2,M.t);}
    else {put(9,3,M.S);}
    if(L.skirt){row(10,".KKKKK..");row(11,"KKKKKKK.");}
    else row(10,"..PPPP..");
    if(kind==="Sp"){ if(!L.skirt)row(11,"..PPP..."); row(12,L.skirt?"..SS....":"..PPP...");row(13,"..BBBB..");}
    else { if(!L.skirt)row(11,".PP..PP."); row(12,L.skirt?".S...S..":"PP....PP");row(13,"BB....BBB".slice(0,8));}
  }
  return g;
}
const KINDS=["F","Fblink","FlookL","FlookR","Fwave1","Fwave2","Fcheer","FwalkA","FwalkB","Bidle","BwalkA","BwalkB","Sa","Sp","Sb"];
const FR={}; // frame index lookup
KINDS.forEach((k,i)=>FR[k]=i);
["Sa","Sp","Sb"].forEach((k,i)=>FR["L"+k]=KINDS.length+i);
const RGB=new Map();
function rgbOf(c){let v=RGB.get(c);if(!v){const n=parseInt(c.slice(1),16);v=[n>>16,n>>8&255,n&255];RGB.set(c,v);}return v;}
function buildSheet(L){
  const list=KINDS.map(k=>[frameGrid(L,k),false]).concat(["Sa","Sp","Sb"].map(k=>[frameGrid(L,k),true]));
  const n=list.length,TW=SW*n;
  const cv=document.createElement("canvas");cv.width=TW;cv.height=SH;const x=cv.getContext("2d");
  const img=x.createImageData(TW,SH),d=img.data,out=rgbOf(OUT);
  const set=(px,py,c)=>{const o=(py*TW+px)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255;};
  list.forEach(([g,flip],fi)=>{
    const ox=fi*SW,Wd=10;
    const at=(r,c)=>{if(r<0||r>=14+TOP||c<0||c>=Wd)return null;return g[r][flip?Wd-1-c:c];};
    for(let r=-1;r<=14+TOP;r++)for(let c=-1;c<=Wd;c++){
      const v=at(r,c);
      if(v)set(ox+c+1,r+1,rgbOf(v));
      else if(at(r-1,c)||at(r+1,c)||at(r,c-1)||at(r,c+1))set(ox+c+1,r+1,out);
    }
  });
  x.putImageData(img,0,0);
  return cv;
}
function pixCanvas(rows,map){const h=rows.length,w=rows[0].length;const cv=document.createElement("canvas");cv.width=w;cv.height=h;
  const x=cv.getContext("2d");rows.forEach((r,y)=>[...r].forEach((ch,c)=>{if(map[ch]){x.fillStyle=map[ch];x.fillRect(c,y,1,1);}}));return cv;}
// ---------- themes: palettes, headwear and ambience. Indexes live in THEMES (glyphs.js) ----------
const THEME_DEF={
  default:{bg:"#f4f2ee"},
  birthday:{bg:"#fff6e8",ambient:"confetti",shirts:["#ff6b9d","#f1c40f","#3a7bd5","#2ecc71","#9b59b6","#ff8c42"],
    dress:L=>{if(Math.random()<.68){L.acc="party";L.hat=R(["#e74c3c","#3a7bd5","#2ecc71","#9b59b6","#ff6b9d","#ff8c42"]);L.acc2="#ffffff";}}},
  christmas:{bg:"#1f2a44",dark:true,ambient:"snow",shirts:["#c0392b","#e74c3c","#27ae60","#2ecc71","#f4f4f4","#c0392b"],
    dress:L=>{if(Math.random()<.72){L.acc="santa";L.hat="#d63031";}else{L.style="beanie";L.hat=R(["#27ae60","#f4f4f4","#c0392b"]);}}},
  halloween:{bg:"#2a1f33",dark:true,ambient:"fireflies",shirts:["#e67e22","#2d2d2d","#8e44ad","#27ae60","#d35400","#4a235a"],
    dress:L=>{const r=Math.random();if(r<.34){L.acc="witch";L.hat="#2d2d2d";L.acc2="#8e44ad";}else if(r<.56){L.acc="ears";L.hat="#2d2d2d";}else if(r<.72){L.acc="horns";L.acc2="#e74c3c";}
      if(Math.random()<.2){L.zombie=true;L.skin=R(ZSKIN);}}},
  wedding:{bg:"#fbf1f3",ambient:"petals",celebrate:"hearts",shirts:["#f4f4f4","#2d2d2d","#f6c5cf","#f4f4f4","#2d2d2d","#b8c9e8"],
    dress:L=>{const r=Math.random();if(r<.3){L.acc="tophat";L.hat="#2d2d2d";L.acc2="#e2483d";L.shirt="#2d2d2d";}else if(r<.55){L.acc="veil";L.shirt="#f4f4f4";L.skirt=true;L.pants="#f4f4f4";}else if(r<.72){L.acc="flowers";L.acc2="#ff6b9d";}}},
  stadium:{bg:"#3f7d3a",dark:true,ambient:"flashes",wave:true,
    dress:(L,p)=>{const home=Math.random()<.5;L.shirt=home?"#e74c3c":"#3a7bd5";L.stripe=Math.random()<.5;L.hat=L.shirt;L.style=Math.random()<.4?"cap":L.style;
      if(Math.random()<.25){L.acc="foam";L.acc2="#f1c40f";}}},
};
function dressLook(L,theme,mob){
  const T=THEME_DEF[theme]||THEME_DEF.default;
  L.acc=null;L.acc2=null;
  if(T.shirts&&Math.random()<.85)L.shirt=R(T.shirts);
  if(T.dress)T.dress(L);
  if(L.acc&&L.acc!=="foam"&&["cap","beanie","mohawk","afro","bun","pony"].includes(L.style))L.style="short";
  if(mob>=0){const c=MOB_COLORS[mob];L.shirt=Math.random()<.8?c:shade(c,Math.random()<.5?.85:1.12);}
  return L;
}
const BUBBLE=pixCanvas([".XXXXX.","XWWRWWX","XWWRWWX","XWWRWWX","XWWWWWX","XWWRWWX",".XXXXX.","..XX...","..X...."],{X:OUT,W:"#fff",R:"#e2483d"});
const HEART=pixCanvas([".XX.XX.","XRRXRRX","XRRRRRX",".XRRRX.","..XRX..","...X..."],{X:OUT,R:"#ff5a7a"});
const SHADOW=pixCanvas(["..XXXXXX..","XXXXXXXXXX","..XXXXXX.."],{X:"rgba(70,52,36,0.16)"});
const SHADOW_S=pixCanvas(["..XXXX..","XXXXXXXX","..XXXX.."],{X:"rgba(70,52,36,0.10)"});
const CONF=["#e74c3c","#f1c40f","#2ecc71","#3a7bd5","#ff6b9d","#9b59b6","#ff8c42"];


// ---------- sound: tiny WebAudio synth, no files. Silent until the first tap, remembers mute ----------
const SND={ctx:null,on:false,muted:false,master:null,noise:null,lastStep:0,userAt:-99};
try{SND.muted=localStorage.getItem("pm_mute")==="1";}catch(_){}
function unlockAudio(){
  if(SND.ctx||CAPTURE||OG)return;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{const c=new AC(),m=c.createGain();m.gain.value=SND.muted?0:0.55;m.connect(c.destination);
    const len=c.sampleRate*0.5,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    SND.ctx=c;SND.master=m;SND.noise=b;SND.on=true;if(c.state==="suspended")c.resume();}catch(_){}
}
function setMuted(v){SND.muted=v;try{localStorage.setItem("pm_mute",v?"1":"0");}catch(_){}
  if(SND.master)SND.master.gain.setTargetAtTime(v?0:0.55,SND.ctx.currentTime,0.03);}
function tone(type,f0,f1,t0,dur,vol){const c=SND.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;
  o.frequency.setValueAtTime(f0,t0);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t0+dur);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(SND.master);o.start(t0);o.stop(t0+dur+0.02);}
function hiss(t0,dur,vol,freq,q){const c=SND.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=SND.noise;f.type="bandpass";f.frequency.value=freq;f.Q.value=q||1;
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  s.connect(f);f.connect(g);g.connect(SND.master);s.start(t0,Math.random()*0.3);s.stop(t0+dur+0.02);}
const audible=()=>SND.on&&!SND.muted&&!(APP==="home"&&!panelOpen&&now-SND.userAt>10);
function sfx(name){
  if(!audible())return;const t=SND.ctx.currentTime+0.01;
  const N=(n,i,d,v,ty)=>tone(ty||"square",440*Math.pow(2,(n-69)/12),0,t+i,d,v||0.08);
  if(name==="shout"){N(67,0,0.09);N(72,0.09,0.09);N(79,0.18,0.22,0.1);hiss(t,0.25,0.05,1800,2);}
  else if(name==="chime"){N(72,0,0.12,0.06,"triangle");N(76,0.08,0.12,0.06,"triangle");N(79,0.16,0.3,0.07,"triangle");}
  else if(name==="cheer"){[72,76,79,84].forEach((n,i)=>N(n,i*0.07,0.18,0.06,"triangle"));
    hiss(t+0.05,0.9,0.12,1400,0.7);for(let i=0;i<9;i++)tone("square",500+Math.random()*700,900+Math.random()*900,t+0.1+Math.random()*0.6,0.09,0.025);}
  else if(name==="scatter"){hiss(t,0.35,0.06,700,0.8);tone("square",520,180,t,0.18,0.04);}
  else if(name==="pop"){tone("square",660,1320,t,0.08,0.07);}
  else if(name==="love"){N(76,0,0.16,0.07,"triangle");N(84,0.14,0.32,0.07,"triangle");}
  else if(name==="haha"){for(let i=0;i<5;i++)tone("square",880-i*60,700-i*60,t+i*0.09,0.06,0.05);}
  else if(name==="wow"){tone("triangle",300,900,t,0.35,0.08);hiss(t+0.1,0.4,0.05,1600,1);}
  else if(name==="yay"){for(let i=0;i<8;i++)hiss(t+i*0.075+Math.random()*0.02,0.05,0.18,2200,1.5);N(79,0.6,0.25,0.06,"triangle");}
}
// footsteps: a soft tick per few running feet, capped so a big mob is a patter, not a roar
function steps(movers,dt){if(!audible())return;SND.lastStep-=dt;if(SND.lastStep>0)return;
  SND.lastStep=clamp(0.42/Math.sqrt(movers),0.055,0.35);
  hiss(SND.ctx.currentTime+0.005,0.035,clamp(0.02+movers*0.0006,0.02,0.07),900+Math.random()*700,1.2);}

// ---------- app state ----------
const $=id=>document.getElementById(id);
const cv=$("c"),ctx=cv.getContext("2d",{alpha:false});
const lost=$("lost"),root=document.documentElement;
const params=new URLSearchParams(location.search);
const CAPTURE=params.has("capture"),OG=params.has("og"),OGK=params.get("og")==="message"?"message":"landing";
const RM=!CAPTURE&&matchMedia("(prefers-reduced-motion: reduce)").matches;
let W=0,H=0,DPR=1,S=3,slots=[],people=[],parts=[],mode="wander",modeT=0,now=0,box=null,firstRun=true;
let text="PIXEL MOB",APP="home",sPhase="intro",appT=0,teaserT=0,replayIn=-1,endShown=false,celebrate="full",nextRipple=0,panelOpen=false,lastForm=0;
let dprCap=3,frameEMA=16.7,slowFrames=0;
const ptr={x:-1e9,y:-1e9,vx:0,vy:0,t:-9,down:null};
const REC=CAPTURE&&params.has("rec"),DEBUG=params.has("debug");
// the look of the mob: theme, colours and size come from the link (or the creator, live)
let THEME="default",MOBC=-1,BGC=-1,SIZE="medium",BG="#f4f2ee",DARK=false,CH=16,MSG=null;
let seq=null,nextText=null,replaySay=undefined,fidgetT=1,waveAt=9,pid=0;
// NO-COLLISION: two people overlap when their ground footprints (8 x 4 art pixels) intersect
const FX=8,FY=4;
let overlaps=0,maxOverlaps=0,overlapTotal=0;

// Routes (mirrors worker/index.js): /<code> share links, legacy /s/<code> and /#<code>, /new creator, / landing, else 404
const RESERVED=new Set(["new","create","make","s","api","stats","the-office","index","index.html","app"]);
const PATH=location.pathname.replace(/\/{2,}/g,"/").replace(/(.)\/+$/,"$1");
let LEGACY=false,CODE="";
function shareCode(){
  let m=PATH.match(/^\/s\/([A-Za-z0-9_-]{2,180})$/);if(m){LEGACY=true;return m[1];}
  m=PATH.match(/^\/([A-Za-z0-9_-]{4,180})$/);if(m&&!RESERVED.has(m[1].toLowerCase()))return m[1];
  if(PATH!=="/")return null;
  const h=location.hash.match(/^#(?:s[=\/])?([A-Za-z0-9_-]{2,180})$/);if(h&&!/^(create|make|new|how)$/i.test(h[1])){LEGACY=true;return h[1];}
  if(params.get("s")){LEGACY=true;return params.get("s");}
  return null;
}
const LANDING_WORDS=["PIXEL MOB","HI MUM!","HAPPY BDAY!","MARRY ME?","GG WP","PIXEL MOB","SEE YOU SOON","YOU ROCK"];
let wordIx=0;
(function route(){
  if(OG){APP="og";text=OGK==="landing"?"PIXEL MOB":"HELLO THERE";return;}
  const code=shareCode();
  if(code!==null){const m=decodePayload(code.trim());
    if(m){APP="surprise";MSG=m;CODE=code.trim();text=m.scenes[0];THEME=m.theme;MOBC=m.mob;BGC=m.bg;SIZE=m.size;
      if(LEGACY&&!CAPTURE)try{history.replaceState(null,"","/"+code.trim());}catch(_){}}
    else{APP="error";text="???";}
    return;}
  if(PATH==="/"||PATH==="/new"||PATH==="/create"){APP="home";text=cleanText(params.get("text")||"")||LANDING_WORDS[0];
    if(THEMES.includes(params.get("theme")))THEME=params.get("theme");if(SIZES.includes(params.get("size")))SIZE=params.get("size");return;}
  APP="lost";text="404";
})();
root.dataset.app=APP;
const HAT_THEMES=new Set(["birthday","christmas","halloween","wedding"]);
function lum(hex){const n=parseInt(hex.slice(1),16);return (0.2126*(n>>16)+0.7152*(n>>8&255)+0.0722*(n&255))/255;}
function applyLook(){BG=BGC>=0?BG_COLORS[BGC]:(THEME_DEF[THEME]||THEME_DEF.default).bg;DARK=lum(BG)<0.45;
  root.dataset.theme=THEME;root.classList.toggle("dark",DARK);
  const tc=document.querySelector('meta[name="theme-color"]');if(tc&&APP!=="home")tc.content=BG;}
applyLook();
const AUTO_APP=APP==="home"||APP==="lost";

// ---------- speech bubble (pixel font, cached per phrase, drawn at whole-pixel scales only) ----------
const INK="#2d2420",BUB={h:15},bubbleCache=new Map();
function bubbleImg(str){
  if(bubbleCache.has(str))return bubbleCache.get(str);
  const r=rasterLines([str]),w=r.cols+8,h=r.rows+7,c=document.createElement("canvas");c.width=w;c.height=h+1;
  const x=c.getContext("2d");
  x.fillStyle=INK;x.fillRect(1,0,w-2,h);x.fillRect(0,1,w,h-2);x.fillRect(2,h,w-3,1);
  x.fillStyle="#fffdf8";x.fillRect(2,1,w-4,h-2);x.fillRect(1,2,w-2,h-4);
  x.fillStyle=INK;r.cells.forEach(([cx,cy])=>x.fillRect(cx+4,cy+3,1,1));
  bubbleCache.set(str,c);BUB.h=c.height+4;return c;
}
// ---------- layout ----------
const saEl=$("sa");
const safe=()=>{const cs=getComputedStyle(saEl);return {t:parseFloat(cs.paddingTop)||0,b:parseFloat(cs.paddingBottom)||0};};
function panelTopCss(){const p=$("panel");const b=parseFloat(getComputedStyle(p).bottom)||0;return innerHeight-b-p.offsetHeight;}
function region(){
  const sa=safe();let top=Math.max((sa.t+18)*DPR,H*0.06);
  let bot;
  if(APP==="home"&&!OG){const hd=$("top");top=Math.max(top,(hd.offsetTop+hd.offsetHeight+6)*DPR);}
  if(panelOpen)bot=(panelTopCss()-16)*DPR;
  else if(APP==="home"){const hero=$("hero");bot=(hero.offsetTop-10)*DPR;}
  else if(APP==="lost")bot=H-(150+sa.b)*DPR;
  else if(APP==="og"&&OGK==="landing")bot=H*0.74;
  else if(APP==="og")bot=H;
  else bot=H-(108+sa.b)*DPR;
  if(bot-top<H*0.2)bot=Math.min(H,top+H*0.2);
  return {top,bot};
}
function computeLayout(){
  const {top,bot}=region(),rh=bot-top;
  const cap=Math.max(1,Math.round((APP==="surprise"?4:3)*DPR));
  const single=!text.includes(" ");
  let best=null;
  const PU=HAT_THEMES.has(THEME)?18:16; // rows get taller when everyone wears a hat, so hats never poke into the row above
  for(const lines of lineOptions(text,H>W*1.3?4:3)){
    const hats=HAT_THEMES.has(THEME),base=rasterLines(lines,{hats});
    // Native huge art, not a nearest-neighbour blow-up. Fall back as one unit at the mob cap.
    const large=SIZE==="huge"?rasterLines(lines,{hats,huge:true}):null;
    // huge only when it still fits at one art-pixel per device pixel (a slow device may have lowered DPR)
    const fits=x=>W*0.92/(x.cols*10)>=1&&rh*0.94/(x.rows*PU)>=1;
    const r=large&&large.cells.length<=760&&fits(large)?large:sizeCells(base);
    // narrow screens: let neighbours stand shoulder to shoulder (outlines touch) to win a bigger crowd
    const tight=W*0.92/(r.cols*11)<rh*0.94/(r.rows*PU);
    const cwU=tight?10:11;
    const sFit=Math.min(W*0.92/(r.cols*cwU),rh*0.94/(r.rows*PU));
    // integer art-pixels on 1x screens; on retina, half-steps stay crisp (nearest-neighbour) and fit phones better
    const s=DPR>=2?Math.max(1,Math.min(Math.floor(sFit*2)/2,cap)):Math.max(1,Math.min(Math.floor(sFit),cap));
    const eff=Math.min(sFit,cap);
    const score=eff*(1-0.1*(lines.length-1))*(single&&lines.length>1?0.85:1)+s*0.001;
    if(!best||score>best.score)best={r,s,score,cwU};
  }
  S=best.s;
  const r=best.r,cw=best.cwU*S,ch=PU*S,totW=r.cols*cw,totH=r.rows*ch;CH=ch;
  const ox=Math.round((W-totW)/2),oy=Math.round(top+(rh-totH)/2);
  slots=r.cells.map(([c,rr,tint])=>({x:Math.round(ox+c*cw+cw/2),y:Math.round(oy+rr*ch+ch),row:rr,tint:tint||null}));
  box={x:ox,y:oy,w:totW,h:totH,cx:ox+totW/2,cy:oy+totH/2,last:slots.reduce((m,s)=>Math.max(m,s.row),0)};
  // can someone walk straight down (or up) the column into this spot without brushing anyone?
  const half=FX*S;
  for(const a of slots){a.up=true;a.down=true;for(const b of slots){if(b===a||Math.abs(b.x-a.x)>=half)continue;if(b.row<a.row)a.up=false;else if(b.row>a.row)a.down=false;}}
  lost.style.top=((oy+totH)/DPR+20)+"px";
  cv.setAttribute("aria-label",APP==="surprise"&&(sPhase==="intro"||sPhase==="teaser")?"A mob of tiny pixel people wandering around":`A mob of tiny pixel people spelling “${toDisplay(text)}”`);
}
// mob size: small thins straight strokes (ends, corners and junctions stay), huge splits every pixel into four people
function sizeCells(r){
  if(SIZE==="small"){const has=new Set(r.cells.map(([x,y])=>x+","+y)),h=(x,y)=>has.has(x+","+y);
    return {cols:r.cols,rows:r.rows,cells:r.cells.filter(([x,y,tint])=>{if(tint)return true;const st=(h(x-1,y)&&h(x+1,y)&&!h(x,y-1)&&!h(x,y+1))||(h(x,y-1)&&h(x,y+1)&&!h(x-1,y)&&!h(x+1,y));return !st||((x+y)&1)===0;})};}

  return r;
}
function resize(){
  const oW=W||1,oH=H||1;
  DPR=CAPTURE&&+params.get("dpr")?+params.get("dpr"):Math.min(window.devicePixelRatio||1,dprCap);
  W=Math.round(innerWidth*DPR);H=Math.round(innerHeight*DPR);
  cv.width=W;cv.height=H;
  computeLayout();render();
  for(const p of people){p.x*=W/oW;p.y*=H/oH;p.tx*=W/oW;p.ty*=H/oH;if(p.path)p.path.forEach(w=>{w.x*=W/oW;w.y*=H/oH;});}
  syncCount();
  if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:"none"});
}
function relayout(){const oS=S;computeLayout();if(S!==oS)people.forEach(p=>{p.z=0;p.vz=0;});syncCount();if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:mode==="hold"?"none":celebrate});}

// ---------- crowd ----------
function spawn(fromEdge){
  const base=newLook(),L=dressLook(Object.assign({},base),THEME,MOBC),sheet=buildSheet(L);
  const p={id:++pid,base,look:L,sheet,baseSheet:sheet,sheets:{},x:0,y:0,vx:0,vy:0,z:0,vz:0,tx:0,ty:0,path:null,state:"walk",wait:0,dance:0,danceT:0,faceT:0,
    speedF:(L.zombie?rnd(0.55,0.75):rnd(0.8,1.25)),formF:(L.zombie?rnd(0.82,0.95):rnd(0.9,1.22)),dir:1,face:"S",dist:Math.random()*50,phase:Math.random()*10,
    slot:null,leaving:false,blinkT:rnd(1,4),blink:0,lookDir:0,lookT:rnd(1,4),act:null,emote:null,
    ox:0,oy:0,ovx:0,ovy:0,alertIn:-1,goIn:-1,quiet:false,hurry:false,turnAt:0,sx:0,sy:0};
  if(fromEdge){const e=Math.random(),m=SW*S*rnd(1,2.2);
    if(e<0.3){p.x=-m;p.y=H*rnd(0.12,0.95);}
    else if(e<0.6){p.x=W+m;p.y=H*rnd(0.12,0.95);}
    else if(e<0.8){p.x=W*rnd(0.05,0.95);p.y=-S*2;}
    else {p.x=W*rnd(0.05,0.95);p.y=H+SH*S+m;}
    p.dir=p.x<W/2?1:-1;}
  else{p.x=W*rnd(0.04,0.96);p.y=H*rnd(0.1,0.97);p.dir=Math.random()<.5?1:-1;}
  pickWander(p);
  return p;
}
// people standing on a drawing wear its colours
function sheetFor(p,tint){if(!tint)return p.baseSheet;return p.sheets[tint]||(p.sheets[tint]=buildSheet(Object.assign({},p.look,{shirt:tint,stripe:false})));}
function restyle(){applyLook();
  for(const p of people){p.look=dressLook(Object.assign({},p.base),THEME,MOBC);p.baseSheet=buildSheet(p.look);p.sheets={};
    p.sheet=p.state==="placed"&&p.slot?sheetFor(p,p.slot.tint):p.baseSheet;}}
function wanderBounds(){const m=SW*S;
  if(panelOpen){const r=region();return {x0:m,x1:W-m,y0:Math.max(SH*S+m*0.5,r.top),y1:Math.max(r.top+SH*S,r.bot)};}
  return {x0:m,x1:W-m,y0:SH*S+m*0.5,y1:H-m*0.6};}
function pickWander(p){
  const b=wanderBounds();
  let bx=0,by=0,bs=-1;
  for(let k=0;k<4;k++){const cx=b.x0+Math.random()*(b.x1-b.x0),cy=b.y0+Math.random()*(b.y1-b.y0);
    let near=1e18;for(const q of people){if(q===p)continue;const d=(q.tx-cx)**2+((q.ty-cy)*1.4)**2;if(d<near)near=d;}
    if(near>bs){bs=near;bx=cx;by=cy;}}
  p.tx=bx;p.ty=by;p.state="walk";p.slot=null;p.path=null;p.hurry=false;p.sheet=p.baseSheet;
}
function syncCount(){
  const n=slots.length;let active=people.filter(p=>!p.leaving);
  while(active.length<n){const p=spawn(!(OG));people.push(p);active.push(p);}
  if(active.length>n)active.slice(n).forEach(p=>{p.leaving=true;p.slot=null;p.state="walk";p.alertIn=p.goIn=-1;p.act=null;p.sheet=p.baseSheet;
    p.tx=p.x<W/2?-SW*S*rnd(4,9):W+SW*S*rnd(4,9);p.ty=p.y+rnd(-1,1)*S*20;
    // leave along the gap between rows, never through people
    if(box&&p.y>box.y&&p.y<box.y+box.h+S*4){const ly=laneNear(p.y);p.ty=ly;p.path=[{x:p.x,y:ly}];}else p.path=null;});
}
function crossesRow(p,w){
  if(p.x<box.x-FX*S*0.5||p.x>box.x+box.w+FX*S*0.5)return false;
  const s=p.slot,y0=Math.min(p.y,w.y),y1=Math.max(p.y,w.y),m=S*0.6;
  if(w.x===p.tx&&w.y===p.ty||Math.abs(w.x-p.tx)<1){ // last leg: an empty column is fine
    if(p.y<p.ty&&s.up&&Math.abs(p.x-p.tx)<S*3)return false;if(p.y>p.ty&&s.down&&Math.abs(p.x-p.tx)<S*3)return false;}
  for(let r=0;r<=box.last;r++){const yr=box.y+CH*(r+1);if(y0<yr-FY*S-m&&y1>yr+m)return true;}
  return false;}
function laneNear(y){const k=Math.round((y-box.y-CH/2)/CH);return box.y+CH/2+clamp(k,-1,box.last+1)*CH;}
// Paths never cut through a row: people come in from above/below when their row is the outermost one,
// otherwise they run to the side of the message, along the gap above their row, then step down into place.
function routeTo(p,s){
  const lane=s.y-CH/2,top=box.y-CH*0.25,bot=box.y+box.h+CH*0.35;
  // straight down an empty column from above the message, or up one from below
  if(s.up&&p.y<top)return [{x:s.x,y:Math.min(top,p.y+S*4),tight:1}];
  if(s.down&&p.y>bot)return [{x:s.x,y:Math.max(bot,p.y-S*4),tight:1}];
  const L=box.x-S*9,R=box.x+box.w+S*9;
  const sx=Math.abs(p.x-L)+Math.abs(s.x-L)<=Math.abs(p.x-R)+Math.abs(s.x-R)?L:R;
  const pts=[];
  if(p.x>box.x-S*6&&p.x<box.x+box.w+S*6&&p.y>box.y&&p.y<box.y+box.h+S*4){const ly=laneNear(p.y);pts.push({x:p.x,y:ly},{x:sx,y:ly});}
  pts.push({x:sx,y:lane},{x:s.x,y:lane,tight:1});
  return pts;
}
function assign(dramatic){
  const act=people.filter(p=>!p.leaving);
  // smart slots: match people to spots in order along a slightly random direction (1-D optimal transport),
  // so paths hardly cross, then route every path around the rows
  const a=rnd(-0.45,0.45),c=Math.cos(a),sn=Math.sin(a),jit=Math.max(S*6,box.w*0.035);
  const ps=act.map(p=>({p,k:p.x*c+p.y*sn+rnd(-jit,jit)})).sort((u,v)=>u.k-v.k);
  const ss=slots.map(s=>({s,k:s.x*c+s.y*sn})).sort((u,v)=>u.k-v.k);
  let maxD=1;act.forEach(p=>{maxD=Math.max(maxD,Math.hypot(p.x-box.cx,p.y-box.cy));});
  ps.forEach(({p},i)=>{const s=ss[i].s;p.slot=s;p.tx=s.x;p.ty=s.y;p.hurry=false;p.sheet=p.baseSheet;p.dance=0;
    p.path=routeTo(p,s);
    if(dramatic){const dc=Math.hypot(p.x-box.cx,p.y-box.cy)/maxD;
      p.alertIn=0.08+dc*0.55+rnd(0,0.12);p.goIn=p.alertIn+rnd(0.3,1.0);p.quiet=false;}
    else {p.alertIn=rnd(0,0.18);p.goIn=p.alertIn+rnd(0.02,0.3);p.quiet=true;}
    p.state="pre";p.act=null;p.turnAt=0;
  });
}
// "MOB, ASSEMBLE!": one person near the middle stops and shouts, everyone turns to look, then they all run to random spots
let leader=null,bubble=null,lastAssemble=-99;
function pickLeader(act){
  const cx=W/2,cy=(region().top+region().bot)/2,minY=(SHB*S+BUB.h*bubbleScale()+S*6);let best=null,bd=1e18;
  for(const p of act){if(p.x<SW*S*2||p.x>W-SW*S*2||p.y<minY||p.y>H-S*4)continue;
    const d=(p.x-cx)**2+((p.y-cy)*1.3)**2;if(d<bd){bd=d;best=p;}}
  return best;
}
function form(o){
  mode="form";modeT=0;celebrate=o.celebrate||"full";lost.classList.remove("on");maxOverlaps=overlaps;
  const quickRepeat=now-lastAssemble<2.6;
  if(!o.assemble||quickRepeat){assign(!!o.dramatic&&!o.assemble);
    if(o.assemble)people.forEach(p=>{if(!p.leaving&&p.state!=="placed"){p.state="walk";p.run=true;}});
    bubble=null;leader=null;return;}
  assign(false);
  const act=people.filter(p=>!p.leaving),L=pickLeader(act);
  const beat=RM?0.5:0.95;lastAssemble=now;
  if(!L){act.forEach(p=>{p.state="walk";p.run=true;});return;}
  leader=L;bubble={t:-(RM?0.02:0.12),life:beat,say:o.say||"MOB, ASSEMBLE!"};
  act.forEach(p=>{p.act=null;p.emote=null;p.hurry=false;
    const d=Math.hypot(p.x-L.x,p.y-L.y)/Math.max(1,diag());
    p.state="freeze";p.turnIn=p===L?0:(RM?0:0.06+d*0.5+rnd(0,0.1));p.goIn=beat+(p===L?0.06:(RM?0:rnd(0,0.16)));p.run=true;});
  L.face="F";L.lookDir=0;L.vx*=0.2;L.vy*=0.2;hop(L,S*1.6);
  $("sr").textContent=bubble.say.charAt(0)+bubble.say.slice(1).toLowerCase();
  sfx("shout");
}
function bubbleScale(){return Math.max(1,Math.round(Math.max(S,2*DPR)));}
function scatter(gentle){
  mode="wander";modeT=0;lost.classList.remove("on");
  if(gentle||RM){people.forEach(p=>{if(!p.leaving){pickWander(p);p.act=null;p.dance=0;p.ox=p.oy=p.ovx=p.ovy=0;}});return;}
  sfx("scatter");
  const cx=box.cx,cy=box.cy;
  people.forEach(p=>{if(p.leaving)return;
    p.slot=null;p.path=null;p.alertIn=p.goIn=-1;p.hurry=false;p.sheet=p.baseSheet;p.dance=0;
    let dx=p.x-cx+rnd(-1,1)*S*20,dy=p.y-cy+rnd(-1,1)*S*20;const d=Math.hypot(dx,dy)||1;
    const sp=Math.max(S*120,diag()*0.5)*rnd(0.55,1.2);
    p.vx=dx/d*sp;p.vy=dy/d*sp*0.75;p.state="burst";p.wait=rnd(0.45,0.85);p.face="F";
    p.ox=p.oy=p.ovx=p.ovy=0;p.act=null;
    hop(p,S*rnd(2.5,5));
    dust(p.x,p.y);dust(p.x,p.y);
  });
}
const diag=()=>Math.hypot(W,H);
const GRAV=()=>S*520;
function hop(p,h){if(RM)return;if(p.z<=0.01)p.vz=Math.sqrt(2*GRAV()*h);}
function dust(x,y){if(RM||parts.length>900)return;parts.push({k:"dust",x:x+rnd(-3,3)*S,y:y,vx:rnd(-1,1)*S*14,vy:-rnd(2,8)*S,life:rnd(.35,.6),t:0});}
const THEME_CONF={christmas:["#e74c3c","#2ecc71","#ffffff","#f1c40f"],halloween:["#e67e22","#8e44ad","#2ecc71","#f1c40f"],
  wedding:["#ffffff","#f6c5cf","#f1c40f","#ff8fa3"],stadium:["#e74c3c","#3a7bd5","#f1c40f","#ffffff"]};
function confetti(x,y,n){if(RM)return;const pal=THEME_CONF[THEME]||CONF;for(let i=0;i<n&&parts.length<1400;i++)parts.push({k:"conf",x,y,vx:rnd(-1,1)*S*34,vy:-rnd(40,95)*S,life:rnd(1.1,1.9),t:0,c:R(pal)});}
function onFormed(){
  const act=people.filter(p=>!p.leaving);
  act.forEach(p=>{if(p.state!=="placed"&&p.slot){p.x=p.tx;p.y=p.ty;p.state="placed";p.vx=p.vy=0;}});
  act.forEach(p=>{if(p.slot)p.sheet=sheetFor(p,p.slot.tint);});
  lastForm=modeT;mode="hold";modeT=0;nextRipple=7;fidgetT=1.6;waveAt=THEME==="stadium"?3.2:rnd(9,12);
  if(celebrate==="none"){act.forEach(p=>{p.face="F";});return;}
  sfx(celebrate==="big"?"cheer":"chime");
  if(celebrate==="big"&&THEME==="wedding")act.forEach(p=>{if(Math.random()<.35)setTimeout(()=>{p.emote={k:"heart",t:0,life:1.2};},rnd(500,1600));});
  const spread=celebrate==="big"?1.0:0.75;
  act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);
    p.turnAt=0.12+fx*spread;
    p.act={k:"cheer",at:p.turnAt+0.32,dur:celebrate==="big"?0.7:0.55,conf:celebrate==="mini"?0:(celebrate==="big"?4:2),
      h:celebrate==="mini"?2.5:(celebrate==="big"?5.5:4)};});
}
function ripple(kind){const act=people.filter(p=>p.state==="placed");
  if(kind==="stadium"){act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);if(!p.act)p.act={k:"cheer",at:fx*1.1,dur:0.32,conf:0,h:1.4};});return;}
  act.forEach(p=>{const fx=(p.x-box.x)/Math.max(1,box.w);if(!p.act)p.act={k:kind,at:fx*0.8,dur:kind==="wave"?0.9:0.5,conf:0,h:kind==="hop"?2:0};});}
// after assembly the mob has a life of its own: little looks, shuffles and waves
function fidget(){const act=people.filter(p=>p.state==="placed"&&!p.act&&!p.dance);if(!act.length)return;
  const p=R(act),r=Math.random();
  if(r<.4){p.lookDir=Math.random()<.5?-1:1;p.lookT=rnd(0.5,1.2);}
  else if(r<.62){p.face="S";p.dir=Math.random()<.5?-1:1;p.faceT=rnd(0.5,1.1);}
  else if(r<.84)p.act={k:"wave",at:0,dur:rnd(0.6,1.1),conf:0,h:0};
  else hop(p,S*rnd(0.8,1.6));}
function dance(p){if(p.state==="placed"){p.dance=1.9;p.danceT=0.4;p.act=null;hop(p,S*3);}
  else{hop(p,S*2.6);p.emote={k:"!",t:0,life:.7};p.face="F";if(p.state==="idle")p.wait=Math.max(p.wait,1.2);}
  sfx("pop");}
function hitPerson(cx,cy){const X=cx*DPR,Y=cy*DPR,pad=S*3;let best=null;
  for(const p of people){if(p.leaving)continue;const x=p.x+p.ox,y=p.y+p.oy-p.z;
    if(X>x-SW*S/2-pad&&X<x+SW*S/2+pad&&Y>y-SHB*S-pad&&Y<y+pad&&(!best||p.y>best.y))best=p;}
  return best;}
// reactions from the person who received the mob
function react(kind){
  const act=people.filter(p=>!p.leaving&&p.state==="placed");if(!act.length)return;
  const fx=p=>(p.x-box.x)/Math.max(1,box.w);
  act.forEach(p=>{p.dance=0;p.act=null;
    if(kind==="love"){if(Math.random()<.55)setTimeout(()=>{p.emote={k:"heart",t:0,life:1.2};hop(p,S*1.4);},fx(p)*500+rnd(0,350));}
    else if(kind==="haha"){p.dance=rnd(0.9,1.3);p.danceT=rnd(0,0.3);}
    else if(kind==="wow"){p.act={k:"cheer",at:rnd(0,0.12),dur:0.5,conf:0,h:5};if(Math.random()<.4)p.emote={k:"!",t:0,life:.9};}
    else{p.act={k:"cheer",at:fx(p)*0.9,dur:0.45,conf:2,h:3.2};}
  });
  if(mode!=="hold"){mode="hold";modeT=0;}
  sfx(kind);
}

// ---------- surprise flow ----------
function showTeaser(){$("teaser").classList.add("on");}
function reveal(){
  if(APP!=="surprise"||(sPhase!=="intro"&&sPhase!=="teaser")||waiting())return;
  sPhase="reveal";$("teaser").classList.add("out");
  if(MSG&&MSG.scenes.length>1)seq={list:MSG.scenes.slice(),ix:0};
  computeLayout();
  form({assemble:true,celebrate:seqLast()?"big":"mini"});
  track("revealed");
  setTimeout(()=>{$("sr").textContent=`The mob spells: ${MSG?MSG.scenes.map(toDisplay).join(", then "):toDisplay(text)}`;},1400);
}
function showEnd(){endShown=true;$("endbar").classList.add("on");if(APP==="error")lost.classList.add("on");}
function replay(){if(seq){seq.ix=0;nextText=seq.list[0];}replaySay=undefined;scatter(false);replayIn=1.8;track("replay");}
// multi-scene: assemble, hold, scatter, regroup into the next scene with a new shout
function playSeq(list){seq={list:list.slice(),ix:0};nextText=list[0];replaySay=undefined;
  if(mode==="wander"&&!people.some(p=>p.slot)){replayIn=0.01;}else{scatter(false);replayIn=RM?0.8:1.3;}}
const seqLast=()=>!seq||seq.ix>=seq.list.length-1;
function nextScene(){seq.ix++;nextText=seq.list[seq.ix];const last=seqLast();
  replaySay=last&&seq.list.length>2?"FINALE!":(seq.ix===1?"NEXT!":"AND...");
  scatter(false);replayIn=RM?0.8:1.25;}

// ---------- simulation ----------
function update(dt){
  modeT+=dt;appT+=dt;
  const auto=AUTO_APP&&!panelOpen;
  if(mode==="wander"&&auto&&modeT>(firstRun?3.4:4.0)){
    if(APP==="home"&&!firstRun&&!params.get("text")){wordIx=(wordIx+1)%LANDING_WORDS.length;text=LANDING_WORDS[wordIx];computeLayout();syncCount();}
    firstRun=false;form({assemble:true,celebrate:"full"});}
  if(replayIn>0){replayIn-=dt;if(replayIn<=0){replayIn=-1;
    if(nextText!==null){text=nextText;nextText=null;computeLayout();syncCount();}
    form({assemble:true,say:APP==="error"?"UMM...":replaySay,celebrate:seq?(seqLast()?"big":"mini"):(AUTO_APP?"full":"big")});replaySay=undefined;}}
  if(REC&&sPhase==="intro"&&appT>0.45){reveal();}
  if(APP==="surprise"&&sPhase==="intro"&&appT>2.2){sPhase="teaser";teaserT=0;showTeaser();}
  if(APP==="surprise"&&sPhase==="teaser"&&!waiting()){teaserT+=dt;if(teaserT>(RM?4:7.5))reveal();}
  if(APP==="error"&&sPhase==="intro"&&appT>1.1){sPhase="reveal";form({assemble:true,say:"UMM...",celebrate:"mini"});}
  if(mode==="form"){
    const act=people.filter(p=>!p.leaving);
    if(modeT>9)act.forEach(p=>{if(p.state!=="placed"){p.hurry=true;if(p.state==="pre"||p.state==="alert"||p.state==="freeze")p.state="walk";}});
    if(act.every(p=>p.state==="placed")||modeT>13)onFormed();
  }else if(mode==="hold"){
    if(APP==="lost"&&!panelOpen&&modeT>0.9)lost.classList.add("on");
    if(auto&&modeT>(APP==="home"?4.6:5.2))scatter(false);
    if(seq&&!seqLast()&&replayIn<0&&modeT>(RM?2.8:2.4))nextScene();
    if((APP==="surprise"||APP==="error")&&!endShown&&seqLast()&&replayIn<0&&modeT>(APP==="error"?0.8:2.2))showEnd();
    if(!auto&&modeT>nextRipple){nextRipple=modeT+rnd(6,8);ripple(Math.random()<.5?"wave":"hop");}
    if(!RM&&modeT>2){fidgetT-=dt;if(fidgetT<=0){fidgetT=rnd(0.12,0.4)*clamp(120/Math.max(20,slots.length),0.3,2);fidget();}
      if(!auto&&modeT>waveAt){waveAt=modeT+(THEME==="stadium"?rnd(5,7):rnd(12,16));ripple("stadium");}}
  }
  const diagv=diag();
  const wanderSp=Math.max(S*18,diagv*(firstRun&&mode==="wander"&&modeT<3?0.1:0.055))*(OG?0:1);
  const formSp=Math.max(S*60,diagv*0.24)*(RM?1.4:1);
  if(bubble){bubble.t+=dt;if(bubble.t>bubble.life+0.14){bubble=null;leader=null;}}
  const pr=S*26,ptrLive=(now-ptr.t)<1.5;
  // separation via a spatial grid (people never stack up)
  const rx=S*9,ry=S*5,cell=rx,grid=new Map();
  for(const a of people){a.sx=0;a.sy=0;
    const k=((a.x/cell|0)+512)*4096+((a.y/cell|0)+512);let b=grid.get(k);if(!b)grid.set(k,b=[]);b.push(a);}
  for(const a of people){if(a.state==="placed")continue;const gx=(a.x/cell|0)+512,gy=(a.y/cell|0)+512;
    for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){const b=grid.get((gx+ix)*4096+gy+iy);if(!b)continue;
      for(const o of b){if(o===a)continue;const dx=(a.x-o.x)/rx,dy=(a.y-o.y)/ry,e=dx*dx+dy*dy;
        if(e<1&&e>1e-6){const l=Math.sqrt(e),f=1-l;a.sx+=dx/l*f;a.sy+=dy/l*0.6*f;}}}}
  for(const p of people){
    p.blinkT-=dt;if(p.blinkT<0){p.blink=0.13;p.blinkT=rnd(1.8,5.5);if(Math.random()<.15)p.blinkT=0.25;}
    if(p.blink>0)p.blink-=dt;
    p.lookT-=dt;if(p.lookT<0){p.lookDir=Math.random()<.55?0:(Math.random()<.5?-1:1);p.lookT=rnd(0.8,3);}
    if(p.emote){p.emote.t+=dt;if(p.emote.t>p.emote.life)p.emote=null;}
    if(p.dance>0){p.dance-=dt;p.danceT-=dt;if(p.danceT<=0&&p.z===0){p.danceT=rnd(0.3,0.4);hop(p,S*rnd(1.6,3.2));if(Math.random()<.5)p.dir=-p.dir;}}
    if(p.faceT>0){p.faceT-=dt;if(p.faceT<=0&&p.state==="placed")p.face="F";}
    if(mode==="hold"){
      if(p.turnAt>0){p.turnAt-=dt;if(p.turnAt<=0){p.turnAt=0;p.face="F";p.lookDir=0;hop(p,S*1.2);}}
      if(p.act){const a=p.act;
        if(!a.on){a.at-=dt;if(a.at<=0){a.on=true;if(a.h)hop(p,S*a.h*rnd(0.85,1.15));if(a.conf)confetti(p.x,p.y-SHB*S,a.conf);
          if(a.k==="cheer"&&Math.random()<(celebrate==="big"?.5:.4))a.next={k:"wave",dur:rnd(0.9,1.6)};}}
        else{a.dur-=dt;if(a.dur<=0){const nx=a.next;p.act=nx?{k:"wave",on:true,dur:nx.dur,at:0}:null;
          if(!nx&&a.k==="cheer"&&Math.random()<(celebrate==="big"?.2:.12))p.emote={k:"heart",t:0,life:1.1};}}}
    }
    if(p.vz!==0||p.z>0){p.vz-=GRAV()*dt;p.z+=p.vz*dt;if(p.z<=0){if(p.vz<-S*30&&p.state==="placed")dust(p.x,p.y);p.z=0;p.vz=0;}}
    let px=0,py=0,pf=0;
    if(ptrLive){const dx=p.x-ptr.x,dy=(p.y-SHB*S*0.5)-ptr.y,d=Math.hypot(dx,dy);
      if(d<pr&&d>0.01){pf=1-d/pr;px=dx/d;py=dy/d;}}
    const st=p.state;
    if(st==="freeze"){
      p.goIn-=dt;const k=Math.exp(-dt*12);p.vx*=k;p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.turnIn>0){p.turnIn-=dt;if(p.turnIn<=0&&leader&&p!==leader){const dx=leader.x-p.x,dy=leader.y-p.y;
        if(Math.abs(dx)>Math.abs(dy)*0.8){p.face="S";p.dir=dx>0?1:-1;}else p.face=dy<0?"B":"F";p.lookDir=0;p.lookT=9;}}
      if(p===leader){p.face="F";p.lookDir=0;p.blink=0;}
      if(p.goIn<=0){p.state="walk";p.lookT=rnd(0.5,2);if(!RM){dust(p.x,p.y);if(Math.random()<.6)dust(p.x,p.y);hop(p,S*rnd(0.8,1.6));}}
      continue;}
    if(st==="pre"){
      p.alertIn-=dt;p.goIn-=dt;
      if(p.alertIn<=0&&p.quiet){p.state="walk";}
      else if(p.alertIn<=0){p.state="alert";p.vx*=0.2;p.vy*=0.2;p.emote={k:"!",t:0,life:0.85};hop(p,S*2.5);
        const dx=p.tx-p.x;p.face=Math.abs(dx)>S*4?"S":"F";p.dir=dx>=0?1:-1;}
      else moveToward(p,dt,wanderSp*0.8,false,true);
      continue;}
    if(st==="alert"){p.goIn-=dt;p.vx*=Math.exp(-dt*10);p.vy*=Math.exp(-dt*10);p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.goIn<=0)p.state="walk";continue;}
    if(st==="placed"){
      if(pf>0){p.ovx+=px*pf*S*1800*dt;p.ovy+=py*pf*S*1200*dt;p.lookDir=ptr.x<p.x?-1:1;p.lookT=0.6;
        if(pf>0.6&&Math.hypot(ptr.vx,ptr.vy)>W*0.6&&p.z===0)hop(p,S*2);}
      p.ovx+=(-p.ox*170-p.ovx*14)*dt;p.ovy+=(-p.oy*170-p.ovy*14)*dt;
      p.ox=clamp(p.ox+p.ovx*dt,-S*1.2,S*1.2);p.oy=clamp(p.oy+p.ovy*dt,-S,S);
      continue;}
    if(st==="burst"){p.wait-=dt;const k=Math.exp(-dt*3.2);p.vx*=k;p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;p.dist+=Math.hypot(p.vx,p.vy)*dt;
      if(Math.abs(p.vx)>Math.abs(p.vy)*0.6){p.face="S";p.dir=p.vx>0?1:-1;}else p.face=p.vy<0?"B":"F";
      p.x=clamp(p.x,-SW*S,W+SW*S);p.y=clamp(p.y,SH*S,H-S*2);
      if(p.wait<=0)pickWander(p);continue;}
    if(st==="idle"){p.wait-=dt;
      if(pf>0.15&&!OG){p.state="walk";p.tx=clamp(p.x+px*S*40,SW*S,W-SW*S);p.ty=clamp(p.y+py*S*30,SH*S*1.5,H-S*6);p.path=null;
        if(Math.random()<.3)p.emote={k:"!",t:0,life:.6};hop(p,S*2);}
      p.x+=p.sx*S*20*dt;p.y+=p.sy*S*20*dt;
      if(p.wait<=0&&mode==="wander"&&!OG)pickWander(p);
      continue;}
    const sp=(p.slot||p.leaving)?formSp*(p.leaving?1.2:1)*(p.run?1.3:1):wanderSp;
    if(pf>0&&!p.slot){p.vx+=px*pf*S*500*dt;p.vy+=py*pf*S*400*dt;}
    moveToward(p,dt,sp,!!p.slot,false);
  }
  people=people.filter(p=>!(p.leaving&&(p.x<-SW*S*3||p.x>W+SW*S*3||p.y<-SH*S*2||p.y>H+SH*S*2)));
  separate();
  ambient(dt);
  if(SND.on){let mv=0;for(const p of people)if(p.state==="walk"&&Math.hypot(p.vx,p.vy)>S*20)mv++;if(mv)steps(mv,dt);}
  for(const q of parts){q.t+=dt;if(q.k==="conf"){q.vy+=S*160*dt;q.vx*=Math.exp(-dt*1.5);q.vy*=Math.exp(-dt*1.2);}
    else{q.vy*=Math.exp(-dt*4);q.vx*=Math.exp(-dt*4);}q.x+=q.vx*dt;q.y+=q.vy*dt;}
  if(parts.length)parts=parts.filter(q=>q.t<q.life);
}
// NO-COLLISION: after every simulation step, push apart any two people whose footprints intersect.
// People already standing in the message never move; two walkers share the push.
// who gives way: people standing in the message never move; someone stepping into their spot is nearly immovable
const finalStep=p=>p.slot&&p.state==="walk"&&!(p.path&&p.path.length)&&Math.abs(p.x-p.tx)<S*3&&Math.abs(p.y-p.ty)<CH*0.62;
const pushW=p=>p.state==="placed"?0:finalStep(p)?0.08:1;
function separate(){
  const fx=FX*S,fy=FY*S,cell=fx,grid=new Map(),key=(x,y)=>((x/cell|0)+512)*4096+((y/cell|0)+512);
  const pass=(fix,it)=>{let n=0;grid.clear();
    for(const a of people){const k=key(a.x,a.y);let b=grid.get(k);if(!b)grid.set(k,b=[]);b.push(a);}
    for(const a of people){const gx=(a.x/cell|0)+512,gy=(a.y/cell|0)+512;
      for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){const b=grid.get((gx+ix)*4096+gy+iy);if(!b)continue;
        for(const o of b){if(o.id<=a.id)continue;const dx=a.x-o.x,dy=a.y-o.y,ax=Math.abs(dx),ay=Math.abs(dy);
          if(ax>=fx-0.01||ay>=fy-0.01)continue;
          if(!fix){if(ax<fx-S*0.25&&ay<fy-S*0.25)n++;continue;}
          const wa=pushW(a),wb=pushW(o);if(!wa&&!wb)continue;n++;const am=wa>0,om=wb>0;
          let mx=0,my=0;const px=fx-ax+0.02,py=fy-ay+0.02;
          // two walkers sidestep (push across their relative motion, so they pass instead of shoving head-on);
          // a walker against someone standing takes the least-penetration way out.
          // If a tight knot doesn't settle in 8 rounds, try the other axis for some pairs.
          let horiz=px<py*1.15;
          if(am&&om){const rx=a.vx-o.vx,ry=a.vy-o.vy;if(rx*rx+ry*ry>S*S*400)horiz=Math.abs(ry)>Math.abs(rx);}
          if(horiz!==(it>=8&&((a.id+o.id+it)&1)===1))mx=(dx>0||(dx===0&&a.id&1)?1:-1)*px;else my=(dy>0||(dy===0&&a.id&1)?1:-1)*py;
          const ka=wa/(wa+wb);a.x+=mx*ka;a.y+=my*ka;o.x-=mx*(1-ka);o.y-=my*(1-ka);}}}
    return n;};
  // keep relaxing until nobody overlaps (dense crowds need a few rounds; it converges fast)
  for(let i=0;i<40&&pass(true,i);i++);
  // On a drastic scale change (e.g. 200 tiny letters -> a few huge drawings), a dense knot can be
  // infeasible to relax locally. Pack remaining walkers into the nearest free footprint, outside-in.
  // This is a safety projection, not a hidden counter reset: the counter below measures actual positions.
  if(pass(false)){
    const fixed=people.filter(p=>p.state==="placed"),walkers=people.filter(p=>p.state!=="placed");
    const free=(x,y)=>!fixed.some(q=>Math.abs(x-q.x)<fx&&Math.abs(y-q.y)<fy);
    for(const p of walkers){if(!free(p.x,p.y)){const x=p.x,y=p.y;let found=false;
      for(let ring=1;!found;ring++)for(let k=0;k<ring*8;k++){const a=k/(ring*8)*Math.PI*2,nx=x+Math.cos(a)*ring*fx/2,ny=y+Math.sin(a)*ring*fy/2;
        if(free(nx,ny)){p.x=nx;p.y=ny;found=true;break;}}}fixed.push(p);}
  }
  overlaps=pass(false);if(overlaps>maxOverlaps)maxOverlaps=overlaps;overlapTotal+=overlaps;
}
function moveToward(p,dt,maxSp,toSlot,pre){
  // while "pre", people keep wandering toward their old wander target
  let gx=p.tx,gy=p.ty;
  if(pre){gx=p.x+p.vx;gy=p.y+p.vy;}
  let tightW=null;
  while(p.path&&p.path.length&&!pre){const w=p.path[0];const dd=Math.hypot(w.x-p.x,w.y-p.y);
    if(dd<S*(w.tight?1.6:7)){p.path.shift();continue;}gx=w.x;gy=w.y;if(w.tight)tightW=dd;break;}
  let routed=!!(p.path&&p.path.length);
  // shoved off the lane? never cut through a row to get back: re-plan from here
  if(toSlot&&!pre&&p.slot&&box&&now>(p.replanAt||0)&&crossesRow(p,routed?p.path[0]:{x:p.tx,y:p.ty})){
    p.replanAt=now+0.35;p.path=routeTo(p,p.slot);routed=p.path.length>0;
    if(routed){gx=p.path[0].x;gy=p.path[0].y;}}
  const dx=gx-p.x,dy=gy-p.y,d=Math.hypot(dx,dy);
  const dT=Math.hypot(p.tx-p.x,p.ty-p.y);
  let sp=maxSp*(toSlot?p.formF:p.speedF);
  if(!routed&&!pre)sp*=clamp(dT/(S*(toSlot?16:10)),toSlot?0.12:0.25,1);
  if(tightW!==null)sp*=clamp(tightW/(S*14),0.3,1);
  else if(routed&&toSlot)sp*=1.2; // the long way round is run a little faster
  let dvx=d>0?dx/d*sp:0,dvy=d>0?dy/d*sp:0;
  const sepW=p.hurry?0:(toSlot?clamp((dT-S*10)/(S*30),0,1):1);
  if(p.hurry){dvx*=1.6;dvy*=1.6;}
  dvx+=p.sx*S*55*sepW;dvy+=p.sy*S*55*sepW;
  const acc=1-Math.exp(-dt*((toSlot&&dT<S*20)||tightW!==null?14:6));
  p.vx+=(dvx-p.vx)*acc;p.vy+=(dvy-p.vy)*acc;
  if(p.look.zombie)p.vy+=Math.sin(now*6+p.phase)*S*60*dt;
  p.x+=p.vx*dt;p.y+=p.vy*dt;const v=Math.hypot(p.vx,p.vy);p.dist+=v*dt;
  if(v>S*2){if(Math.abs(p.vx)>Math.abs(p.vy)*0.55){p.face="S";p.dir=p.vx>0?1:-1;}else p.face=p.vy<0?"B":"F";}
  if(pre)return;
  if(toSlot&&dT<S*0.9&&!routed){
    p.x=p.tx;p.y=p.ty;p.vx=p.vy=0;p.hurry=false;p.run=false;p.state="placed";if(p.face==="B"&&Math.random()<.5)p.face="S";
    p.sheet=sheetFor(p,p.slot.tint);
    if(celebrate==="none")p.face="F";
    p.ox=p.oy=0;p.ovx=0;p.ovy=S*20;hop(p,S*2.2);p.lookDir=0;
  }else if(!toSlot&&!p.leaving&&dT<S*2&&p.state==="walk"){
    p.state="idle";p.wait=rnd(0.5,2.6);p.vx=p.vy=0;if(Math.random()<.45)p.face="F";
  }
}
// ---------- render ----------
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=BG;ctx.fillRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
  drawBackdrop();
  const dw=SW*S,dh=SH*S;
  const order=people.slice().sort((a,b)=>(a.y+a.oy)-(b.y+b.oy));
  for(const p of order){const sx=Math.round(p.x+p.ox),sy=Math.round(p.y+p.oy);
    const sh=p.z>S*2?SHADOW_S:SHADOW;ctx.drawImage(sh,Math.round(sx-sh.width*S/2),Math.round(sy-S*1.5),sh.width*S,sh.height*S);}
  for(const q of parts)if(q.k==="dust"){const a=1-q.t/q.life;ctx.fillStyle=`rgba(150,135,115,${(0.35*a).toFixed(3)})`;
    const sz=Math.max(1,Math.round(S*(1+a)));ctx.fillRect(Math.round(q.x),Math.round(q.y),sz,sz);}
  for(const p of order){
    const moving=(p.state==="walk"||p.state==="burst"||(p.state==="pre"&&Math.hypot(p.vx,p.vy)>S*3));
    let f=FR.F,bob=0;
    if(moving){
      const ph=Math.floor(p.dist/(S*(p.run?2.1:2.6)))%4;
      if(p.face==="S"){const k=["Sa","Sp","Sb","Sp"][ph];f=p.dir>0?FR[k]:FR["L"+k];}
      else if(p.face==="B")f=ph<2?FR.BwalkA:FR.BwalkB;
      else f=ph<2?FR.FwalkA:FR.FwalkB;
      bob=(ph===1||ph===3)?-S:0;
    }else{
      const a=p.act&&p.act.on?p.act.k:null;
      if(p.dance>0){const k=Math.floor(p.dance*7.5)%4;f=[FR.Fcheer,FR.Fwave1,FR.Fcheer,FR.Fwave2][k];}
      else if(a==="cheer")f=FR.Fcheer;
      else if(a==="wave")f=(Math.floor(now*7+p.phase)%2)?FR.Fwave1:FR.Fwave2;
      else if(p.face==="S")f=p.dir>0?FR.Sp:FR.LSp;
      else if(p.face==="B")f=FR.Bidle;
      else if(p.blink>0)f=FR.Fblink;
      else if(p.lookDir<0)f=FR.FlookL;else if(p.lookDir>0)f=FR.FlookR;
      if(p.state==="placed"&&!a&&!RM&&!(p.dance>0)){const k=Math.sin(now*2.6+p.phase*1.7);bob=k>0.8?-S:0;}
    }
    const x=Math.round(p.x+p.ox-dw/2),y=Math.round(p.y+p.oy-dh+bob-p.z);
    ctx.drawImage(p.sheet,f*SW,0,SW,SH,x,y,dw,dh);
    if(p.emote){const e=p.emote,tt=e.t;
      if(!(tt>e.life-0.15&&Math.floor(tt*20)%2)){
        const pop=tt<0.08?2*S:tt<0.16?-S:0,im=e.k==="heart"?HEART:BUBBLE;
        ctx.drawImage(im,Math.round(p.x+p.ox-S),Math.round(y-im.height*S+pop-S-(e.k==="heart"?Math.round(tt*8)*S:0)),im.width*S,im.height*S);}}
  }
  drawAmbient(true);
  if(bubble&&leader&&bubble.t>=0)drawBubble();
  if(DEBUG)drawDebug();
  for(const q of parts)if(q.k==="conf"){const a=1-q.t/q.life;if(a<0.25&&Math.floor(q.t*18)%2)continue;
    ctx.fillStyle=q.c;const flip=Math.floor(q.t*10+q.x)%2;
    ctx.fillRect(Math.round(q.x),Math.round(q.y),S*(flip?2:1),S*(flip?1:2));}
}
function drawBubble(){
  const b=bubble,t=b.t,end=b.life;let k=bubbleScale(),dy=0;
  if(!RM){ if(t<0.05)k=Math.max(1,k-2);else if(t<0.11)k=k+1;
    if(t>=0.11&&t<0.19)dy=-2;else if(t>=0.19&&t<0.27)dy=-1;else if(t>=0.27&&t<0.33)dy=1;
    if(t>end)k=Math.max(1,k-1);if(t>end+0.07)return;}
  else if(t>end)return;
  const im=bubbleImg(b.say),bw=im.width*k,bh=im.height*k,head=leader.y+leader.oy-leader.z-SHB*S;
  const tx=Math.round(leader.x+leader.ox);
  let x=Math.round(tx-bw/2);x=clamp(x,Math.round(8*DPR),Math.round(W-8*DPR-bw));
  const y=Math.round(head-bh-3*k-S+dy*k);
  ctx.drawImage(im,x,y,bw,bh);
  // tail: points at the leader even when the bubble is nudged off-centre by the screen edge
  const tcx=clamp(tx,x+4*k,x+bw-5*k),ty=y+bh-2*k;
  for(let r=0;r<4;r++){const half=3-r;const x0=tcx-half*k-Math.floor(k/2),wpx=(half*2+1)*k;
    ctx.fillStyle=INK;ctx.fillRect(x0,ty+r*k,wpx,k);if(half>0){ctx.fillStyle="#fffdf8";ctx.fillRect(x0+k,ty+r*k,wpx-2*k,k);}}
}
// ---------- theme ambience: snow, confetti, petals, fireflies, camera flashes ----------
let amb=[];
function waiting(){return !!(MSG&&MSG.at&&Date.now()<MSG.at&&!REC);}
function newAmb(k,anywhere){const q={k,t:0,x:Math.random()*W,y:anywhere?Math.random()*H:-S*3,ph:Math.random()*7,v:rnd(0.6,1.4)};
  if(k==="confetti")q.c=R(THEME_CONF[THEME]||CONF);else if(k==="petals")q.c=R(["#f6c5cf","#ff8fa3","#ffffff"]);
  if(k==="fireflies"){q.y=Math.random()*H;}if(k==="flashes"){q.y=Math.random()*H*0.5;q.t=-rnd(0,3);}
  return q;}
function ambient(dt){const T=THEME_DEF[THEME],k=T&&T.ambient;
  if(!k||RM||OG){if(amb.length)amb=[];return;}
  if(amb.length&&amb[0].k!==k)amb=[];
  const n=Math.round(clamp(W*H/(S*S*1500),18,80)*(k==="flashes"?0.3:k==="fireflies"?0.45:1));
  while(amb.length<n)amb.push(newAmb(k,true));if(amb.length>n)amb.length=n;
  for(let i=0;i<amb.length;i++){const q=amb[i];q.t+=dt;
    if(k==="fireflies"){q.x+=Math.sin(q.t*0.7+q.ph)*S*6*dt;q.y+=Math.cos(q.t*0.5+q.ph*2)*S*5*dt;}
    else if(k==="flashes"){if(q.t>0.22)amb[i]=newAmb(k,true);}
    else{const fall=k==="snow"?12:k==="petals"?9:16;q.y+=S*fall*q.v*dt;q.x+=(Math.sin(q.t*1.3+q.ph)*S*7+(k==="petals"?S*6:0))*dt;
      if(q.y>H+S*3||q.x>W+S*4)amb[i]=newAmb(k,false);}}
}
function drawBackdrop(){
  if(THEME==="stadium"&&BGC<0){ctx.fillStyle="rgba(255,255,255,0.045)";const b=Math.max(8,Math.round(S*26));for(let y=0;y<H;y+=b*2)ctx.fillRect(0,y,W,b);}
  drawAmbient(false);}
function drawAmbient(front){if(!amb.length)return;const k=amb[0].k,fr=k==="snow"||k==="confetti"||k==="petals";if(fr!==front)return;
  for(const q of amb){
    if(k==="snow"){ctx.fillStyle=q.v>1.1?"#ffffff":"rgba(255,255,255,0.7)";const z=q.v>1.1?S*2:S;ctx.fillRect(Math.round(q.x),Math.round(q.y),z,z);}
    else if(k==="confetti"||k==="petals"){ctx.fillStyle=q.c;const f=Math.floor(q.t*4+q.ph)%2;ctx.fillRect(Math.round(q.x),Math.round(q.y),S*(f?2:1),S*(f?1:2));}
    else if(k==="fireflies"){const a=0.5+0.5*Math.sin(q.t*3+q.ph*3);if(a<0.25)continue;ctx.fillStyle=`rgba(232,255,138,${a.toFixed(2)})`;ctx.fillRect(Math.round(q.x),Math.round(q.y),S,S);}
    else if(k==="flashes"&&q.t>0){ctx.fillStyle="rgba(255,255,255,0.85)";const x=Math.round(q.x),y=Math.round(q.y);ctx.fillRect(x-S,y,S*3,S);ctx.fillRect(x,y-S,S,S*3);}
  }}
function drawDebug(){
  ctx.strokeStyle="rgba(231,76,60,0.6)";ctx.lineWidth=1;
  for(const p of people)ctx.strokeRect(Math.round(p.x-FX*S/2)+0.5,Math.round(p.y-FY*S/2)+0.5,FX*S,FY*S);
  const r=rasterLines([`OVERLAPS ${overlaps} MAX ${maxOverlaps}`]),k=Math.max(1,Math.round(2*DPR));
  ctx.fillStyle="rgba(255,253,248,0.9)";ctx.fillRect(6*DPR,6*DPR,(r.cols+4)*k,(r.rows+4)*k);
  ctx.fillStyle=overlaps?"#e74c3c":"#1e8449";r.cells.forEach(([x,y])=>ctx.fillRect(6*DPR+(x+2)*k,6*DPR+(y+2)*k,k,k));}
// ---------- loop ----------
let last=performance.now(),cost=0;
function frame(t){
  if(CAPTURE)return;
  const t0=performance.now();
  let dt=(t-last)/1000;last=t;
  // adaptive quality: if the device can't keep up, drop canvas resolution a notch
  if(dt>0&&dt<0.25){frameEMA=frameEMA*0.95+dt*1000*0.05;
    if(frameEMA>24&&DPR>1.5){if(++slowFrames>90){slowFrames=0;dprCap=Math.max(1.5,DPR-0.75);frameEMA=16.7;resize();}}else slowFrames=0;}
  if(dt>0.1)dt=0.1;
  const steps=Math.max(1,Math.ceil(dt/0.0167)),h=dt/steps;
  for(let i=0;i<steps;i++){now+=h;update(h);}
  render();cost=cost*0.95+(performance.now()-t0)*0.05;
  requestAnimationFrame(frame);
}

// ---------- save the reveal as a GIF or video, made entirely on this device ----------
// A hidden same-origin copy of the page (?capture=1&rec=1) renders the reveal frame by frame at story size (9:16).
function gifEncoder(w,h){
  const parts=[],pal=new Map(),cols=[],near=new Map();
  const seed=["#f4f2ee","#2d2420","#fffdf8","#ffffff","#000000",...CONF,...Object.values(THEME_CONF).flat(),...BG_COLORS,...MOB_COLORS];
  const add=n=>{if(!pal.has(n)&&cols.length<256){pal.set(n,cols.length);cols.push(n);}};
  seed.forEach(h=>add(parseInt(h.slice(1),16)));
  const index=n=>{let i=pal.get(n);if(i!==undefined)return i;if(cols.length<256){add(n);return cols.length-1;}
    i=near.get(n);if(i!==undefined)return i;let bd=1e9;const r=n>>16,g=n>>8&255,b=n&255;
    for(let j=0;j<cols.length;j++){const c=cols[j],d=(r-(c>>16))**2*2+(g-(c>>8&255))**2*4+(b-(c&255))**2*3;if(d<bd){bd=d;i=j;}}
    near.set(n,i);return i;};
  const u16=v=>[v&255,v>>8&255];
  const frames=[];
  return {
    add(rgba,delayCs){const px=new Uint8Array(w*h);let last=-1,li=0;
      for(let i=0,j=0;i<px.length;i++,j+=4){const n=(rgba[j]<<16)|(rgba[j+1]<<8)|rgba[j+2];if(n!==last){last=n;li=index(n);}px[i]=li;}
      frames.push([lzw(px,8),delayCs]);},
    blob(){const p=new Uint8Array(768);cols.forEach((c,i)=>{p[i*3]=c>>16;p[i*3+1]=c>>8&255;p[i*3+2]=c&255;});
      parts.push(new Uint8Array([71,73,70,56,57,97,...u16(w),...u16(h),0xF7,0,0]),p,
        new Uint8Array([0x21,0xFF,11,...[..."NETSCAPE2.0"].map(c=>c.charCodeAt(0)),3,1,0,0,0]));
      for(const [data,d] of frames){parts.push(new Uint8Array([0x21,0xF9,4,0,...u16(d),0,0,0x2C,0,0,0,0,...u16(w),...u16(h),0,8]));
        for(let i=0;i<data.length;i+=255){const n=Math.min(255,data.length-i);const b=new Uint8Array(n+1);b[0]=n;b.set(data.subarray(i,i+n),1);parts.push(b);}
        parts.push(new Uint8Array([0]));}
      parts.push(new Uint8Array([0x3B]));return new Blob(parts,{type:"image/gif"});}
  };
}
function lzw(ix,min){
  const clear=1<<min,eoi=clear+1,out=new Uint8Array(ix.length*2+64);let o=0,cur=0,bits=0,size=min+1,next=eoi+1;const dict=new Map();
  const emit=c=>{cur|=c<<bits;bits+=size;while(bits>=8){out[o++]=cur&255;cur>>>=8;bits-=8;}};
  emit(clear);let prefix=ix[0];
  for(let i=1;i<ix.length;i++){const k=ix[i],key=(prefix<<8)|k,v=dict.get(key);
    if(v!==undefined){prefix=v;continue;}
    emit(prefix);
    if(next===4096){emit(clear);dict.clear();size=min+1;next=eoi+1;}
    else{if(next>=(1<<size))size++;dict.set(key,next++);}
    prefix=k;}
  emit(prefix);emit(eoi);if(bits>0)out[o++]=cur&255;
  return out.subarray(0,o);
}
function watermark(x,w,h,k){
  const r=rasterLines(["PIXELMOB.IO"]),pw=(r.cols+8)*k,ph=(r.rows+6)*k,px=Math.round((w-pw)/2),py=Math.round(h-ph-14*k);
  x.fillStyle="rgba(45,36,32,0.78)";x.fillRect(px+k,py,pw-2*k,ph);x.fillRect(px,py+k,pw,ph-2*k);
  x.fillStyle="#fffdf8";r.cells.forEach(([cx,cy])=>x.fillRect(px+(cx+4)*k,py+(cy+3)*k,k,k));
}
async function recorderFrame(dpr){
  const f=document.createElement("iframe");
  f.src=`/${CODE}?capture=1&rec=1&dpr=${dpr}`;f.title="Recording";f.tabIndex=-1;f.setAttribute("aria-hidden","true");
  f.style.cssText="position:fixed;left:-10000px;top:0;width:360px;height:640px;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(f);
  const t0=Date.now();
  while(!(f.contentWindow&&f.contentWindow.__crowd&&f.contentWindow.__crowd.count)){if(Date.now()-t0>8000){f.remove();throw new Error("timeout");}await new Promise(r=>setTimeout(r,60));}
  return f;
}
let capturing=false;
async function saveMob(fmt,onProgress){
  if(capturing||!CODE)return;capturing=true;
  const isGif=fmt==="gif",dpr=isGif?1:1.5,w=360*dpr,h=640*dpr,k=Math.max(1,Math.round(1.5*dpr));
  let f;
  try{
    f=await recorderFrame(dpr);
    const C=f.contentWindow.__crowd,src=f.contentWindow.document.getElementById("c");
    const out=document.createElement("canvas");out.width=w;out.height=h;const x=out.getContext("2d",{willReadFrequently:isGif});x.imageSmoothingEnabled=false;
    const draw=()=>{x.drawImage(src,0,0,w,h);watermark(x,w,h,k);};
    const MAX=26000;let t=0,tail=-1;
    let blob,ext;
    if(isGif){
      const enc=gifEncoder(w,h),dtMs=80;
      while(t<MAX){C.step(dtMs);t+=dtMs;draw();enc.add(x.getImageData(0,0,w,h).data,dtMs/10);
        if(tail<0&&C.done)tail=t+1600;if(tail>0&&t>=tail)break;
        onProgress(Math.min(0.97,t/(C.estimate||9000)));if((t/dtMs)%3===0)await new Promise(r=>setTimeout(r,0));}
      blob=enc.blob();ext="gif";
    }else{
      const types=["video/mp4;codecs=avc1.42E01E","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
      const mime=window.MediaRecorder&&types.find(m=>MediaRecorder.isTypeSupported(m));
      if(!mime||!out.captureStream)throw new Error("novideo");
      const stream=out.captureStream(30),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5e6}),chunks=[];
      rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
      const stopped=new Promise(r=>{rec.onstop=r;});
      draw();rec.start(250);
      await new Promise(res=>{let last=performance.now();
        const tick=n=>{const dt=Math.min(100,n-last);last=n;C.step(dt);t+=dt;draw();onProgress(Math.min(0.97,t/(C.estimate||9000)));
          if(tail<0&&C.done)tail=t+1600;if((tail>0&&t>=tail)||t>MAX){res();return;}requestAnimationFrame(tick);};
        requestAnimationFrame(tick);});
      rec.stop();await stopped;stream.getTracks().forEach(s=>s.stop());
      ext=mime.includes("mp4")?"mp4":"webm";blob=new Blob(chunks,{type:mime.split(";")[0]});
    }
    onProgress(1);
    await deliver(blob,`pixelmob-${CODE.slice(0,8)}.${ext}`);
    track("download",ext);
    return ext;
  }finally{capturing=false;if(f)f.remove();}
}
async function deliver(blob,name){
  const file=new File([blob],name,{type:blob.type});
  if(matchMedia("(pointer:coarse)").matches&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:"Pixel Mob"});return;}catch(e){if(e&&e.name==="AbortError")return;}}
  const a=document.createElement("a"),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),30000);
}

// ---------- pixel text (our own 5x7 font, crisp at any DPR) ----------
function pixelText(el,str,scale,color){
  const lines=str.split("\n"),rs=lines.map(l=>rasterLines([l]));
  const w=Math.max(...rs.map(r=>r.cols)),h=lines.length*9-2;
  const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle=color;
  rs.forEach((r,li)=>{const off=Math.floor((w-r.cols)/2);r.cells.forEach(([cx,cy])=>x.fillRect(cx+off,cy+li*9,1,1));});
  c.style.width=w*scale+"px";c.style.height=h*scale+"px";c.setAttribute("aria-hidden","true");
  el.replaceChildren(c);
}
// fits pixel text to the screen width (never bigger than maxScale)
function pixelFit(el,str,maxScale,color,room){const cols=Math.max(...str.split("\n").map(l=>rasterLines([l]).cols));
  pixelText(el,str,clamp(Math.floor((room||innerWidth-72)/cols),2,maxScale),color);}
// ---------- UI ----------
const panel=$("panel"),msg=$("msg"),noteEl=$("note"),linkEl=$("link"),copyBtn=$("copyBtn"),shareBtn=$("shareBtn"),prevBtn=$("prevBtn");
const fromEl=$("from"),atEl=$("at"),scenesEl=$("scenes"),addBtn=$("addScene");
const NOTE_DEFAULT=noteEl.textContent;
let curLink="",typeT=0,noteT=0,lastFocus=null,focusIn=msg,tplOn=-1;
const ORIGIN=/(^|\.)pixelmob\.io$/.test(location.hostname)?"https://pixelmob.io":(location.origin&&location.origin!=="null"?location.origin:"https://pixelmob.io");
// anonymous usage counts: an event name and an optional fixed detail (never the message, name or code); the server adds the country
function track(e,d){if(CAPTURE||OG||!navigator.sendBeacon)return;try{navigator.sendBeacon("/api/event",JSON.stringify(d?{e,p:APP,d}:{e,p:APP}));}catch(_){}}
const draft={from:"",theme:THEME,mob:MOBC,bg:BGC,size:SIZE,at:0};
const sceneEls=()=>[...scenesEl.querySelectorAll(".msg")];
const draftMsg=()=>Object.assign({},draft,{scenes:sceneEls().map(x=>cleanText(x.value)).filter(Boolean)});
const createdFor=new Set();
function trackCreated(){const k=curLink;if(!k||createdFor.has(k))return;createdFor.add(k);track("created");}
function toast(t){const el=$("toast");el.textContent=t;el.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("on"),2100);}
function setNote(t,warn){noteEl.textContent=t;noteEl.classList.toggle("warn",!!warn);clearTimeout(noteT);
  if(warn)noteT=setTimeout(()=>{noteEl.textContent=NOTE_DEFAULT;noteEl.classList.remove("warn");},3400);}
function updateLink(){
  const m=draftMsg(),has=m.scenes.length>0;
  copyBtn.disabled=!has;shareBtn.disabled=!has;prevBtn.setAttribute("aria-disabled",String(!has));
  addBtn.disabled=sceneEls().length>=MAX_SCENES;
  if(!has){curLink="";linkEl.textContent="Type something to get your link";linkEl.classList.add("empty");prevBtn.removeAttribute("href");return;}
  curLink=ORIGIN+"/"+encodePayload(m);
  linkEl.textContent=curLink.replace(/^https?:\/\//,"");linkEl.classList.remove("empty");prevBtn.href=curLink;
  summarize();
}
function summarize(){const b=[];if(draft.theme!=="default")b.push(draft.theme[0].toUpperCase()+draft.theme.slice(1));
  if(draft.from)b.push("From "+draft.from);if(draft.mob>=0||draft.bg>=0)b.push("Colours");if(draft.size!=="medium")b.push(draft.size[0].toUpperCase()+draft.size.slice(1));
  if(draft.at)b.push("Countdown");$("moreSum").textContent=b.join(" · ");}
function bump(el){el.classList.add("bump");setTimeout(()=>el.classList.remove("bump"),300);}
function onInput(e){
  if(e&&e.isComposing)return;
  const el=e&&e.target&&e.target.classList&&e.target.classList.contains("msg")?e.target:msg;
  const raw=el.value,{text:t,dropped}=sanitize(raw),cnt=el.parentNode.querySelector(".count");
  let tok=[...t.replace(/^ +/,"")];
  if(tok.length>MAXLEN){tok=tok.slice(0,MAXLEN);setNote(`That's the limit: ${MAXLEN} characters a scene`,true);bump(cnt);}
  const others=sceneEls().filter(x=>x!==el).reduce((n,x)=>n+[...cleanText(x.value)].length,0);
  if(tok.length+others>MAX_TOTAL){tok=tok.slice(0,Math.max(0,MAX_TOTAL-others));setNote(`That's the limit: ${MAX_TOTAL} characters across all scenes`,true);bump(cnt);}
  const v=toDisplay(tok.join(""));
  if(v!==raw){const atEnd=(el.selectionStart||0)>=raw.length;const pos=Math.min(v.length,el.selectionStart||0);el.value=v;
    try{el.setSelectionRange(atEnd?v.length:pos,atEnd?v.length:pos);}catch(_){}}
  if(dropped.length)setNote(`The mob can't make ${dropped.slice(0,3).join(" ")} yet, so they skipped it. Try ❤️ 🎂 ⭐ 🎉`,true);
  const n=[...cleanText(v)].length;cnt.textContent=`${n}/${MAXLEN}`;cnt.classList.toggle("near",n>=MAXLEN-4);
  if(!dropped.length&&!noteEl.classList.contains("warn"))noteEl.textContent=n>18?"Tip: shorter scenes mean bigger little people":NOTE_DEFAULT;
  if(e&&e.isTrusted)tplOn=-1,markTpl();
  updateLink();
  clearTimeout(typeT);typeT=setTimeout(()=>applyTyped(el),RM?150:380);
}
function applyTyped(el){
  updateLink();
  const t=cleanText((el||msg).value);
  if(!t){if(!draftMsg().scenes.length&&mode!=="wander")scatter(true);return;}
  seq=null;nextText=null;
  if(t===text&&(mode==="hold"||mode==="form"))return;
  text=t;computeLayout();syncCount();form({assemble:true,celebrate:"mini"});
}
function addScene(val,focus){
  const els=sceneEls();if(els.length>=MAX_SCENES)return null;
  const d=document.createElement("div");d.className="scene";const i=els.length,uid=++addScene.n;
  d.innerHTML=`<label class="sr" for="msg_${uid}">Scene ${i+1}</label><div class="field"><span class="sn" aria-hidden="true">${i+1}</span><input id="msg_${uid}" class="msg" type="text" maxlength="140" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done" placeholder="${["","AND THEN…","ONE MORE…","THE BIG FINISH"][i]}"><span class="count">0/${MAXLEN}</span><button class="rm" type="button" aria-label="Remove scene ${i+1}">✕</button></div>`;
  scenesEl.appendChild(d);const inp=d.querySelector("input");wireScene(inp);
  d.querySelector(".rm").addEventListener("click",()=>{d.remove();renumber();updateLink();focusIn=msg;const m=draftMsg();if(m.scenes.length>1)playSeq(m.scenes);else applyTyped(msg);});
  if(val){inp.value=val;onInput({target:inp});}
  if(focus)inp.focus({preventScroll:true});
  updateLink();return inp;
}
addScene.n=0;
function renumber(){scenesEl.querySelectorAll(".scene").forEach((d,i)=>{d.querySelector(".sn").textContent=i+1;});}
function wireScene(inp){inp.addEventListener("input",onInput);inp.addEventListener("compositionend",onInput);
  inp.addEventListener("focus",()=>{focusIn=inp;const t=cleanText(inp.value);if(t&&t!==text)applyTyped(inp);});
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(typeT);const m=draftMsg();
    if(m.scenes.length>1)playSeq(m.scenes);else applyTyped(inp);if(curLink)copyLink();}});}
// ---------- templates, drawings and options ----------
const TPLS=[
  {k:"🎂 Birthday",scenes:["HAPPY BIRTHDAY!","🎂🎉"],theme:"birthday"},
  {k:"💌 Ask them out",scenes:["WILL YOU GO OUT WITH ME?","❤️"],bg:3},
  {k:"🏆 Congrats",scenes:["CONGRATS!","🏆"],theme:"stadium"},
  {k:"🥺 Miss you",scenes:["MISS YOU","❤️"],bg:2},
  {k:"🙏 Thank you",scenes:["THANK YOU!","⭐"]},
  {k:"💍 Marry me",scenes:["MARRY ME?","💍"],theme:"wedding"},
  {k:"🎄 Merry Xmas",scenes:["MERRY XMAS!","🎄"],theme:"christmas"},
  {k:"🎃 Boo",scenes:["BOO!","👻🎃"],theme:"halloween"},
  {k:"🍀 Good luck",scenes:["GOOD LUCK!","⭐"]},
  {k:"🌸 Get well",scenes:["GET WELL SOON","🌸"]},
  {k:"⚽ GG",scenes:["GG!","⚽🔥"],theme:"stadium"},
];
const EMOJI_BAR=["❤️","🎂","🎉","⭐","😊","👍","💍","🎁","🔥","🌸","🎄","🎃","👻","👑","🏆","⚽","🎵","☀️","🌙","❄️"];
const THEME_UI=[["default","Classic"],["birthday","🎂 Birthday"],["christmas","🎄 Xmas"],["halloween","🎃 Halloween"],["wedding","💍 Wedding"],["stadium","🏟️ Stadium"]];
const SIZE_UI=[["small","Small"],["medium","Medium"],["huge","Huge"]];
function markTpl(){$("tpls").querySelectorAll("button").forEach((b,i)=>b.setAttribute("aria-pressed",String(i===tplOn)));}
function setScenes(list){sceneEls().slice(1).forEach(x=>x.closest(".scene").remove());msg.value="";onInput({target:msg});
  list.forEach((t,i)=>{if(i===0){msg.value=t;onInput({target:msg});}else addScene(t);});}
function useTemplate(i){const t=TPLS[i];tplOn=i;markTpl();
  setLook({theme:t.theme||"default",bg:t.bg!==undefined?t.bg:-1,mob:-1},true);
  setScenes(t.scenes);clearTimeout(typeT);updateLink();
  const m=draftMsg();if(m.scenes.length>1)playSeq(m.scenes);else applyTyped(msg);}
function seg(el,items,get,set){el.replaceChildren(...items.map(([v,l])=>{const b=document.createElement("button");b.type="button";b.setAttribute("role","radio");b.textContent=l;b.dataset.v=v;
  b.addEventListener("click",()=>{set(v);mark();});return b;}));const mark=()=>el.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.v===String(get()))));mark();return mark;}
function swatches(el,list,get,set,label){const items=[[-1,"Auto"],...list.map((c,i)=>[i,c])];
  el.replaceChildren(...items.map(([i,c])=>{const b=document.createElement("button");b.type="button";b.setAttribute("role","radio");b.dataset.v=i;
    if(i<0){b.textContent="A";b.setAttribute("aria-label",label+": automatic");}else{b.style.background=c;b.setAttribute("aria-label",label+" colour "+(i+1));}
    b.addEventListener("click",()=>{set(i);mark();});return b;}));
  const mark=()=>el.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(+b.dataset.v===get())));mark();return mark;}
let marks=[];
// live look changes for the mob behind the creator
function setLook(o,quiet){const oT=THEME,oS=SIZE;
  if(o.theme!==undefined){draft.theme=o.theme;THEME=o.theme;}
  if(o.mob!==undefined){draft.mob=o.mob;MOBC=o.mob;}
  if(o.bg!==undefined){draft.bg=o.bg;BGC=o.bg;}
  if(o.size!==undefined){draft.size=o.size;SIZE=o.size;}
  restyle();marks.forEach(m=>m());updateLink();
  if(!quiet&&(THEME!==oT||SIZE!==oS)){computeLayout();syncCount();if(mode==="form"||mode==="hold")form({dramatic:false,celebrate:"mini"});}
  else if(!quiet&&mode==="hold")ripple("hop");}
function buildCreator(){
  $("tpls").replaceChildren(...TPLS.map((t,i)=>{const b=document.createElement("button");b.type="button";b.textContent=t.k;b.setAttribute("aria-pressed","false");b.addEventListener("click",()=>useTemplate(i));return b;}));
  $("emojis").replaceChildren(...EMOJI_BAR.map(e=>{const b=document.createElement("button");b.type="button";b.textContent=e;b.setAttribute("aria-label","Add "+DRAW[DRAW_EMOJI.get(e).charCodeAt(0)-0xE000][0]);
    b.addEventListener("pointerdown",ev=>ev.preventDefault());
    b.addEventListener("click",()=>{const el=focusIn&&focusIn.isConnected?focusIn:msg;const st=el.selectionStart??el.value.length,en=el.selectionEnd??st;
      el.setRangeText(e,st,en,"end");onInput({target:el});if(!matchMedia("(pointer:coarse)").matches)el.focus({preventScroll:true});});return b;}));
  marks=[seg($("themes"),THEME_UI,()=>draft.theme,v=>setLook({theme:v})),
    swatches($("mobSw"),MOB_COLORS,()=>draft.mob,v=>setLook({mob:v}),"Mob"),
    swatches($("bgSw"),BG_COLORS,()=>draft.bg,v=>setLook({bg:v}),"Background"),
    seg($("sizes"),SIZE_UI,()=>draft.size,v=>setLook({size:v}))];
  wireScene(msg);
  addBtn.addEventListener("click",()=>{addScene("",true);});
  fromEl.addEventListener("input",()=>{const t=[...cleanText(fromEl.value)].filter(c=>!DRAW_INFO(c)).slice(0,MAX_FROM).join("");draft.from=t.trim();
    const v=toDisplay(t);if(fromEl.value.toUpperCase()!==v)fromEl.value=v;updateLink();});
  atEl.min=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
  atEl.addEventListener("change",()=>{const v=atEl.value?new Date(atEl.value).getTime():0;
    if(v&&v<Date.now()+60000){setNote("Pick a time in the future for the countdown",true);atEl.value="";draft.at=0;}else draft.at=v||0;
    $("atClear").hidden=!draft.at;updateLink();if(draft.at)toast("Countdown set. They can open it "+fmtWhen(draft.at));});
  $("atClear").addEventListener("click",()=>{atEl.value="";draft.at=0;$("atClear").hidden=true;updateLink();});
}
const fmtWhen=t=>new Date(t).toLocaleString(undefined,{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
const homeLook={theme:THEME,mob:MOBC,bg:BGC,size:SIZE};
function openPanel(prefill){
  if(panelOpen)return;lastFocus=document.activeElement;panelOpen=true;
  root.classList.add("panel-open");panel.setAttribute("aria-hidden","false");panel.inert=false;
  lost.classList.remove("on");replayIn=-1;seq=null;nextText=null;
  if(prefill){setLook(prefill.look||{theme:"default",mob:-1,bg:-1,size:"medium"},true);setScenes(prefill.scenes);}
  else setLook({theme:draft.theme,mob:draft.mob,bg:draft.bg,size:draft.size},true);
  if(APP==="home"&&!CAPTURE&&PATH!=="/new")try{history.replaceState(null,"","/new");}catch(_){}
  if(APP==="home")scrollTo({top:0,behavior:RM?"auto":"smooth"});
  requestAnimationFrame(()=>{relayout();if(prefill)applyTyped(msg);});
  setTimeout(()=>{if(!matchMedia("(pointer:coarse)").matches||panel.dataset.autofocus)msg.focus({preventScroll:true});},60);
  updateLink();
}
function closePanel(){
  if(!panelOpen)return;panelOpen=false;
  root.classList.remove("panel-open");panel.setAttribute("aria-hidden","true");panel.inert=true;document.activeElement&&document.activeElement.blur&&document.activeElement.blur();
  if(APP==="home"&&!CAPTURE&&location.pathname!=="/")try{history.replaceState(null,"","/");}catch(_){}
  seq=null;nextText=null;
  if(APP==="home"){THEME=homeLook.theme;MOBC=homeLook.mob;BGC=homeLook.bg;SIZE=homeLook.size;restyle();computeLayout();syncCount();if(mode!=="wander")modeT=Math.min(modeT,1.5);}
  else if(APP==="surprise"&&sPhase!=="intro"&&sPhase!=="teaser"){THEME=MSG.theme;MOBC=MSG.mob;BGC=MSG.bg;SIZE=MSG.size;restyle();
    if(MSG.scenes.length>1)seq={list:MSG.scenes.slice(),ix:MSG.scenes.length-1};
    text=MSG.scenes[MSG.scenes.length-1];computeLayout();syncCount();form({dramatic:false,celebrate:"mini"});}
  requestAnimationFrame(()=>relayout());
  if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});
}
async function copyLink(){
  if(!curLink)return;let ok=false;
  try{await navigator.clipboard.writeText(curLink);ok=true;}catch(_){
    const ta=document.createElement("textarea");ta.value=curLink;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;top:0;left:0;opacity:0;font-size:16px";
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);try{ok=document.execCommand("copy");}catch(_){}ta.remove();}
  if(ok){copyBtn.classList.add("done");copyBtn.querySelector("span").textContent="Copied!";toast(draft.at?"Copied. The countdown starts now ⏳":"Copied. Your mob is ready to send 👀");trackCreated();
    clearTimeout(copyLink.t);copyLink.t=setTimeout(()=>{copyBtn.classList.remove("done");copyBtn.querySelector("span").textContent="Copy link";},1600);
    if(mode==="hold")ripple("hop");}
  else{toast("Couldn't copy automatically. Press and hold the link to copy it");const r=document.createRange();r.selectNodeContents(linkEl);const s=getSelection();s.removeAllRanges();s.addRange(r);}
}
async function shareLink(){
  if(!curLink)return;
  try{await navigator.share({title:"Someone sent you a Pixel Mob 👀",text:"I made you a tiny mob. Tap to reveal 👀",url:curLink});track("share_native");trackCreated();}
  catch(e){if(e&&e.name!=="AbortError")copyLink();}
}
if(navigator.share&&matchMedia("(pointer:coarse)").matches)shareBtn.hidden=false;
buildCreator();
copyBtn.addEventListener("click",copyLink);
shareBtn.addEventListener("click",shareLink);
prevBtn.addEventListener("click",e=>{if(!curLink)e.preventDefault();});
$("pclose").addEventListener("click",closePanel);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panelOpen)closePanel();});
document.querySelectorAll("[data-open-panel]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();if(APP==="surprise"||APP==="error")track("make_your_own_click");openPanel();}));
$("reveal").addEventListener("click",e=>{e.stopPropagation();reveal();});
$("replay").addEventListener("click",e=>{e.stopPropagation();replay();});
$("home").addEventListener("click",e=>{e.stopPropagation();
  location.href=APP==="error"?"/new":"/";});
// ---------- receiver: reactions, reply, save ----------
const REPLY={love:"AWW ❤️",haha:"HAHA 😊",wow:"WOW!",yay:"YOU'RE THE BEST ⭐"};
let reacted=null;
$("reacts").querySelectorAll("button").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const k=b.dataset.r;
  react(k);if(reacted!==k)track("reaction",k);reacted=k;
  $("reacts").querySelectorAll("button").forEach(x=>x.classList.toggle("picked",x===b));
  $("replyBtn").hidden=false;$("makeBtn").hidden=true;}));
$("replyBtn").addEventListener("click",e=>{e.stopPropagation();track("reply");
  const name=MSG&&MSG.from,sc=[];if(name)sc.push(toDisplay(`HI ${name}!`).slice(0,MAXLEN));sc.push(REPLY[reacted||"love"]);
  openPanel({scenes:sc,look:{theme:MSG?MSG.theme:"default",mob:-1,bg:-1,size:"medium"}});});
const saveMenu=$("saveMenu"),saveBtn=$("saveBtn");
saveBtn.addEventListener("click",e=>{e.stopPropagation();saveMenu.hidden=!saveMenu.hidden;saveBtn.setAttribute("aria-expanded",String(!saveMenu.hidden));});
saveMenu.querySelectorAll("button").forEach(b=>b.addEventListener("click",async e=>{e.stopPropagation();if(capturing)return;
  const prog=$("saveProg");saveMenu.querySelectorAll("button").forEach(x=>x.disabled=true);prog.textContent="0%";
  toast(b.dataset.fmt==="gif"?"Making your GIF… keep this tab open":"Recording your video… about 10 seconds");
  try{const ext=await saveMob(b.dataset.fmt,f=>{prog.textContent=Math.round(f*100)+"%";});if(ext)toast(`Saved your mob as ${ext.toUpperCase()} 🎉`);}
  catch(err){toast(err&&err.message==="novideo"?"Video isn't supported in this browser. Try GIF":"Couldn't save that one. Please try again");}
  finally{prog.textContent="";saveMenu.querySelectorAll("button").forEach(x=>x.disabled=false);saveMenu.hidden=true;saveBtn.setAttribute("aria-expanded","false");}}));
if(APP==="error"){$("reacts").remove();saveBtn.remove();}
if(!(window.MediaRecorder&&HTMLCanvasElement.prototype.captureStream))saveMenu.querySelector('[data-fmt="video"]').remove();
// ---------- sound toggle ----------
const sndBtn=$("sndBtn");
function markSnd(){sndBtn.setAttribute("aria-pressed",String(SND.muted));sndBtn.setAttribute("aria-label",SND.muted?"Turn sound on":"Mute sound");sndBtn.firstChild.textContent=SND.muted?"🔇":"🔊";}
sndBtn.addEventListener("click",e=>{e.stopPropagation();unlockAudio();setMuted(!SND.muted);markSnd();if(!SND.muted)sfx("pop");});
markSnd();
addEventListener("pointerdown",()=>{unlockAudio();SND.userAt=now;},true);
addEventListener("keydown",()=>{unlockAudio();SND.userAt=now;},true);
// ---------- teaser: who it's from, and the countdown ----------
function teaserTitle(){const name=MSG&&MSG.from,narrow=innerWidth<520,el=$("teaserTitle");
  const t=name?(([...name].length<=7&&!narrow)?`${name} SENT YOU\nA PIXEL MOB`:`${name}\nSENT YOU A\nPIXEL MOB`):(narrow?"SOMEONE SENT\nYOU A MESSAGE":"SOMEONE SENT YOU\nA MESSAGE");
  pixelFit(el,t,4,INK,Math.min(innerWidth-80,560));el.setAttribute("aria-label",name?`${toDisplay(name)} sent you a Pixel Mob`:"Someone sent you a message");}
let cdLast="";
function tickCountdown(){if(!(MSG&&MSG.at)||REC)return;const left=MSG.at-Date.now(),cd=$("countdown"),btn=$("reveal");
  if(left>0){cd.hidden=false;const s=Math.ceil(left/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),ss=s%60,z=n=>String(n).padStart(2,"0");
    const str=(d?d+"D ":"")+`${z(h)}:${z(m)}:${z(ss)}`;if(str!==cdLast){cdLast=str;pixelFit($("cdArt"),str,4,"#e2483d",Math.min(innerWidth-80,420));$("cdArt").setAttribute("aria-label",`Opens in ${d?d+" days ":""}${h} hours ${m} minutes`);}
    btn.disabled=true;btn.textContent="Not yet ⏳";$("teaserSub").textContent=`Your mob opens ${fmtWhen(MSG.at)}. Come back then!`;
    setTimeout(tickCountdown,250);return;}
  if(cdLast!=="done"){cdLast="done";pixelFit($("cdArt"),"IT'S TIME!",4,"#e2483d",Math.min(innerWidth-80,420));$("countdown").querySelector(".cl").textContent="READY";
    btn.disabled=false;btn.textContent="Open it 🎉";$("teaserSub").textContent="The wait is over.";people.forEach(p=>hop(p,S*rnd(1.5,3)));sfx("chime");}}
// iOS keyboard: keep the panel sitting just above it
if(window.visualViewport){const vv=visualViewport;let vt;
  const onVV=()=>{const kb=Math.max(0,innerHeight-(vv.height+vv.offsetTop));panel.style.setProperty("--kb",kb+"px");
    clearTimeout(vt);vt=setTimeout(()=>{if(panelOpen)relayout();},160);};
  vv.addEventListener("resize",onVV);vv.addEventListener("scroll",onVV);}
// ---------- input on the crowd ----------
function setPtr(e){const nx=e.clientX*DPR,ny=e.clientY*DPR;const dtt=Math.max(0.016,now-ptr.t);
  if(now-ptr.t<0.2){ptr.vx=(nx-ptr.x)/dtt;ptr.vy=(ny-ptr.y)/dtt;}else{ptr.vx=ptr.vy=0;}
  ptr.x=nx;ptr.y=ny;ptr.t=now;}
cv.addEventListener("pointermove",setPtr);
cv.addEventListener("pointerdown",e=>{setPtr(e);ptr.down={x:e.clientX,y:e.clientY};});
cv.addEventListener("pointerup",e=>{const d=ptr.down;ptr.down=null;if(e.pointerType!=="mouse")ptr.t=now-1.2;
  if(!d||Math.hypot(e.clientX-d.x,e.clientY-d.y)>=12)return;
  if(panelOpen&&matchMedia("(pointer:coarse)").matches){msg.blur();return;}
  if(APP==="surprise"&&(sPhase==="intro"||sPhase==="teaser")){reveal();return;}
  if(APP==="og")return;
  const hp=hitPerson(e.clientX,e.clientY);if(hp){dance(hp);return;}
  if(mode==="wander"&&replayIn<0)form({assemble:true,celebrate:AUTO_APP?"full":"big"});
  else if(mode==="hold"){if(AUTO_APP&&!panelOpen)scatter(false);else replay();}
});
cv.addEventListener("pointerleave",()=>{ptr.t=-9;});
cv.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();if(APP==="surprise"&&sPhase!=="reveal")reveal();else if(mode==="hold")replay();else form({assemble:true,celebrate:"full"});}});
addEventListener("hashchange",()=>{if(PATH==="/"&&/^#(?:s[=\/])?[A-Za-z0-9_-]{6,180}$/.test(location.hash)&&!/^#(how|new|create|make)$/i.test(location.hash))location.reload();});
let rz;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{resize();if(APP==="surprise")teaserTitle();},120);});
// ---------- boot ----------
const ICON_LOOK={skin:"#f0c39d",hair:"#2a1c14",shirt:"#e74c3c",pants:"#2c3e70",shoes:"#2a2320",hat:"#2f6fd6",eye:"#1b1714",
  zombie:false,style:"cap",skirt:false,beard:false,stripe:false,blush:true};
if(REC)root.classList.add("rec");
teaserTitle();tickCountdown();
pixelText($("ptitleArt"),"MAKE A MOB MESSAGE",2,INK);
if(OGK==="message")pixelText($("ogTitle"),"SOMEONE SENT YOU\nA MESSAGE",5,INK);
else{$("ogcard").classList.add("landing");$("ogTitle").remove();$("ogcard").querySelector("img").remove();$("ogEyebrow").textContent="TINY PEOPLE. BIG FEELINGS.";$("ogSub").textContent="Turn any message into a crowd · pixelmob.io";}
if(APP==="lost"){lost.querySelector("p").textContent="This page wandered off with the mob.";$("home").textContent="Back to Pixel Mob";}
if(APP==="error"){lost.querySelector("p").textContent="Hmm… this link got scrambled on the way.";$("home").textContent="Make a new message";}
bubbleImg("MOB, ASSEMBLE!");
panel.inert=true;
resize();
if(APP!=="og")people.forEach(p=>{p.state="walk";});
if(OG){people.forEach(p=>{p.state="idle";p.wait=99;p.face=R(["F","F","S","S","B"]);p.dir=Math.random()<.5?1:-1;});}
if(APP==="home"&&(PATH==="/new"||PATH==="/create"||params.has("create")||location.hash==="#create"))setTimeout(openPanel,CAPTURE?0:700);
if(APP==="surprise")track("opened");
requestAnimationFrame(()=>root.classList.add("ready"));
window.__crowd={get overlaps(){return overlaps},get maxOverlaps(){return maxOverlaps},get overlapTotal(){return overlapTotal},
  get done(){return APP==="surprise"&&sPhase==="reveal"&&seqLast()&&mode==="hold"&&replayIn<0&&modeT>2.2},get estimate(){return 900+(MSG?MSG.scenes.length:1)*5600},
  get theme(){return THEME},get size(){return SIZE},get scene(){return seq?seq.ix:0},get msg(){return MSG},react,setLook,playSeq,useTemplate,addScene,save:fmt=>saveMob(fmt,()=>{}),
  people:()=>people.map(p=>({x:p.x/DPR,y:p.y/DPR,state:p.state,dance:p.dance>0})),
  stuck:()=>people.filter(p=>p.slot&&p.state!=="placed").map(p=>({id:p.id,x:Math.round(p.x),y:Math.round(p.y),tx:p.tx,ty:p.ty,st:p.state,path:(p.path||[]).map(w=>[Math.round(w.x),Math.round(w.y),w.tight|0]),v:Math.round(Math.hypot(p.vx,p.vy)),S,CH,box:[box.x,box.y,box.w,box.h]})),
  near:(id)=>{const a=people.find(p=>p.id===id);if(!a)return null;return people.filter(p=>p!==a&&Math.abs(p.x-a.x)<S*14&&Math.abs(p.y-a.y)<S*10).map(p=>({id:p.id,x:Math.round(p.x),y:Math.round(p.y),st:p.state,tx:p.tx,ty:p.ty,vx:Math.round(p.vx),vy:Math.round(p.vy)})).concat([{self:1,x:a.x,y:a.y,vx:a.vx,vy:a.vy,sx:a.sx,sy:a.sy,hurry:a.hurry,slot:a.slot&&[a.slot.x,a.slot.y,a.slot.up,a.slot.down]}]);},
  pairs:()=>{const o=[];for(const a of people)for(const b of people){if(b.id<=a.id)continue;if(Math.abs(a.x-b.x)<FX*S-S*0.25&&Math.abs(a.y-b.y)<FY*S-S*0.25)o.push([a.state,b.state,a.leaving,b.leaving,Math.round(a.x),Math.round(a.y)]);}return o;},tap:(x,y)=>{const p=hitPerson(x,y);if(p)dance(p);return !!p;},
  get mode(){return mode},get app(){return APP},get phase(){return sPhase},get text(){return text},get count(){return people.length},
  get slots(){return slots.length},get cost(){return cost},get lastForm(){return lastForm},get link(){return curLink},get dpr(){return DPR},get layout(){return {x:box.x,w:box.w,y:box.y,h:box.h,S,W,H};},get states(){const m={};people.forEach(p=>{const k=p.state+(p.leaving?'-leaving':'');m[k]=(m[k]||0)+1;});return m;},
  form:()=>form({assemble:true,celebrate:"full"}),get bubble(){return bubble?{t:bubble.t,say:bubble.say,leader:!!leader}:null},scatter:()=>scatter(false),reveal,openPanel,closePanel,decode:decodeMsg,encode:encodeMsg,
  step:(ms)=>{const n=Math.max(1,Math.round(ms/16.67));for(let i=0;i<n;i++){now+=ms/1000/n;update(ms/1000/n);}render();},
  poke:(x,y)=>{ptr.x=x*DPR;ptr.y=y*DPR;ptr.t=now;ptr.vx=W;ptr.vy=0;},
  icon:(size,bg)=>{const sh=buildSheet(ICON_LOOK),c=document.createElement("canvas");c.width=c.height=size;const x=c.getContext("2d");x.imageSmoothingEnabled=false;
    if(bg){x.fillStyle=bg;x.fillRect(0,0,size,size);}
    const sc=Math.max(1,Math.floor(size*(bg?0.72:1)/16)),w=12*sc,h=16*sc;
    x.drawImage(sh,0,0,12,16,Math.round((size-w)/2),Math.round((size-h)/2),w,h);return c.toDataURL("image/png");}};
requestAnimationFrame(frame);
})();
