export type Tone = 1|2|3|4;
export const tones:Tone[]=[1,2,3,4];
export const toneInfo={1:{name:'Level',arrow:'→',mark:'ˉ',cue:'Cruise high and steady.',color:'#a9a0ff'},2:{name:'Rising',arrow:'↗',mark:'ˊ',cue:'Climb from the middle to the top.',color:'#8cdda9'},3:{name:'Dipping',arrow:'∨',mark:'ˇ',cue:'Dip low, then come back up.',color:'#ffc678'},4:{name:'Falling',arrow:'↘',mark:'ˋ',cue:'Drop quickly from high to low.',color:'#ff93b0'}};
export const syllables=['ma','mi','li','lu','la','ba','pa','da','na','tu'];
export function pinyin(base:string,tone:Tone):string {const vowel=base.includes('a')?'a':base.includes('e')?'e':base.includes('ou')?'o':[...base].reverse().find(c=>'iouü'.includes(c));if(!vowel)return base;const marks:Record<string,string>={a:'āáǎà',e:'ēéěè',i:'īíǐì',o:'ōóǒò',u:'ūúǔù',ü:'ǖǘǚǜ'};return base.replace(vowel,marks[vowel][tone-1]);}
// Characters here are reading cues for the optional local Mandarin TTS voice.
// Rare/nonstandard combinations are deliberately not assigned invented vocabulary.
export const speechCues:Record<string,string>={ma1:'妈',ma2:'麻',ma3:'马',ma4:'骂',mi1:'眯',mi2:'迷',mi3:'米',mi4:'蜜',li2:'梨',li3:'里',li4:'力',lu1:'撸',lu2:'炉',lu3:'鲁',lu4:'路',la1:'拉',la3:'喇',la4:'辣',ba1:'八',ba2:'拔',ba3:'把',ba4:'爸',pa1:'趴',pa2:'爬',pa4:'怕',da1:'搭',da2:'答',da3:'打',da4:'大',na2:'拿',na3:'哪',na4:'那',tu1:'秃',tu2:'图',tu3:'土',tu4:'兔'};
export const words=[
{base:'ma',tone:1 as Tone,hanzi:'妈',meaning:'mom',emoji:'💛'},
{base:'ma',tone:3 as Tone,hanzi:'马',meaning:'horse',emoji:'🐴'},
{base:'mi',tone:3 as Tone,hanzi:'米',meaning:'rice',emoji:'🍚'},
{base:'mi',tone:4 as Tone,hanzi:'蜜',meaning:'honey',emoji:'🍯'},
{base:'li',tone:2 as Tone,hanzi:'梨',meaning:'pear',emoji:'🍐'},
{base:'li',tone:4 as Tone,hanzi:'力',meaning:'strength',emoji:'💪'},
{base:'lu',tone:4 as Tone,hanzi:'路',meaning:'road',emoji:'🛤️'},
{base:'la',tone:4 as Tone,hanzi:'辣',meaning:'spicy',emoji:'🌶️'},
{base:'ba',tone:1 as Tone,hanzi:'八',meaning:'eight',emoji:'8️⃣'},
{base:'ba',tone:4 as Tone,hanzi:'爸',meaning:'dad',emoji:'💙'},
{base:'pa',tone:2 as Tone,hanzi:'爬',meaning:'climb',emoji:'🧗'},
{base:'da',tone:4 as Tone,hanzi:'大',meaning:'big',emoji:'🐘'},
{base:'na',tone:2 as Tone,hanzi:'拿',meaning:'take / hold',emoji:'🤲'},
{base:'tu',tone:2 as Tone,hanzi:'图',meaning:'picture',emoji:'🖼️'},
{base:'tu',tone:3 as Tone,hanzi:'土',meaning:'soil',emoji:'🌱'},
{base:'tu',tone:4 as Tone,hanzi:'兔',meaning:'rabbit',emoji:'🐇'},
];
export type Question={id:string;kind:'listen'|'curve'|'mark'|'direction'|'bridge'|'meaning';base:string;tone:Tone;word?:typeof words[number]};
// 136 unique questions: 40 mark, 40 curve, 24 listening, 8 direction,
// 8 English-to-Pinyin bridges, and 16 vocabulary questions. Every form is deterministic.
export const questionBank:Question[]=[
...syllables.flatMap(base=>tones.flatMap(tone=>[{id:`mark-${base}${tone}`,kind:'mark' as const,base,tone},{id:`curve-${base}${tone}`,kind:'curve' as const,base,tone}])),
...['ma','mi','ba','da','tu','lu'].flatMap(base=>tones.map(tone=>({id:`listen-${base}${tone}`,kind:'listen' as const,base,tone}))),
...['ma','mi','li','tu'].flatMap(base=>([2,4] as Tone[]).map(tone=>({id:`direction-${base}${tone}`,kind:'direction' as const,base,tone}))),
...['li','mi','lu','la'].flatMap(base=>([2,4] as Tone[]).map(tone=>({id:`bridge-${base}${tone}`,kind:'bridge' as const,base,tone}))),
...words.map(word=>({id:`meaning-${word.base}${word.tone}`,kind:'meaning' as const,base:word.base,tone:word.tone,word}))];
export function shuffle<T>(a:T[],random= Math.random):T[]{return a.map(value=>({value,key:random()})).sort((a,b)=>a.key-b.key).map(x=>x.value);}
export function makeRound(difficulty:'easy'|'normal'|'challenge',seen:string[]=[],review:string[]=[]):Question[]{
 const count=difficulty==='easy'?5:difficulty==='normal'?8:10;
 const kinds:Question['kind'][]=difficulty==='easy'?['mark','curve','bridge','meaning']:['listen','curve','mark','direction','bridge','meaning'];
 const allowed=questionBank.filter(q=>kinds.includes(q.kind));
 const ordered=shuffle(allowed).sort((a,b)=>Number(seen.includes(a.id))-Number(seen.includes(b.id)));
 const chosen:Question[]=shuffle(allowed.filter(q=>review.includes(q.id)&&!seen.slice(-3).includes(q.id))).slice(0,2);
 for(const kind of kinds){if(chosen.length>=count)break;const q=ordered.find(q=>q.kind===kind&&!chosen.includes(q));if(q)chosen.push(q);}
 for(const q of ordered){if(chosen.length>=count)break;if(!chosen.includes(q))chosen.push(q);}
 return shuffle(chosen);
}
export const badges=['Voice Explorer','Accent Detective','Rising Star','Pinyin Detective','Tone Master'];
export const missions=[{name:'English Voice Remix',short:'Remix',description:'Give familiar words a new superpower.',icon:'✦',badge:badges[0]}, {name:'Voice Detective',short:'Detective',description:'Follow the secret sound trails.',icon:'⌕',badge:badges[1]}, {name:'Secret Pinyin',short:'The secret',description:'Discover what your voice can do.',icon:'✧',badge:badges[2]}, {name:'Pinyin Sound Lab',short:'Sound lab',description:'Mix, match, and collect new sounds.',icon:'⚗',badge:badges[3]}, {name:'Tone Master',short:'Final quest',description:'Put your detective powers to the test.',icon:'♛',badge:badges[4]}];
