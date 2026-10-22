import {audioManifest} from './audio';
import {pinyin,tones} from './data';
import type {Tone} from './data';
import {localDay,shuffle,vocabulary} from './learning';
import type {Learning,Skill} from './learning';
export type PairPattern={wordId:string;written:[number,number];spoken:[number,number];note:string;advanced?:boolean};
// Curated standard connected-speech categories, not measurements of a child's voice.
// 0 means a light/neutral syllable; it has no fixed horizontal pitch contour.
export const pairPatterns:PairPattern[]=[
 {wordId:'w22',written:[1,1],spoken:[1,1],note:'Two high, level tones.'},
 {wordId:'w17',written:[1,2],spoken:[1,2],note:'Level, then rising.'},
 {wordId:'w27',written:[1,4],spoken:[1,4],note:'Level, then falling.'},
 {wordId:'w30',written:[2,1],spoken:[2,1],note:'Rising, then level.'},
 {wordId:'w34',written:[2,2],spoken:[2,2],note:'Two rising tones.'},
 {wordId:'w16',written:[2,4],spoken:[2,4],note:'Rising, then falling.'},
 {wordId:'w25',written:[4,1],spoken:[4,1],note:'Falling, then level.'},
 {wordId:'w01',written:[4,4],spoken:[4,4],note:'Two falling tones.'},
 {wordId:'w26',written:[3,4],spoken:[3,4],note:'The first third tone stays low. It does not need a full dip and rise.',advanced:true},
 {wordId:'w28',written:[3,3],spoken:[2,3],note:'Written 3–3. In connected speech the first third tone becomes rising: hear 2–3.',advanced:true},
 {wordId:'w31',written:[3,3],spoken:[2,3],note:'Written 3–3. The first tone sounds rising when these syllables join.',advanced:true},
 {wordId:'w07',written:[1,0],spoken:[1,0],note:'The second syllable is light and short. Its pitch depends on its neighbor.',advanced:true},
 {wordId:'w02',written:[4,0],spoken:[4,0],note:'A falling tone followed by a light syllable, not another full fourth tone.',advanced:true},
];
export const patternLabel=(p:number[])=>p.map(n=>n===0?'light':String(n)).join(' → ');
export type EarMode='tone'|'twins'|'pair'|'baseline';
export type EarQuestion={id:string;skill:Skill;files:string[];answer:string;options:{id:string;label:string}[];reveal:string;tone?:Tone;pair?:string};
const choices=tones.map(t=>({id:String(t),label:`Tone ${t} ${['','→','↗','∨','↘'][t]}`}));
export function dueQuestion(state:Learning,id:string,day=localDay()){
 const history=state.attempts.filter(a=>a.question===id),last=history.at(-1);
 if(!last)return false;
 if(!last.correct||!last.independent)return true;
 const successes=new Set(history.filter(a=>a.correct&&a.independent).map(a=>localDay(new Date(a.at)))).size;
 const due=new Date(last.at);due.setDate(due.getDate()+Math.min(14,2**Math.max(0,successes-1)));
 return localDay(due)<=day;
}
export function makeEarRound(state:Learning,mode:EarMode,focus:Tone[]=tones,advanced=false,count=6):EarQuestion[]{
 const bases=['ma','mi','ba','da','tu','lu'];
 let pool:EarQuestion[]=[];
 if(mode==='pair')pool=pairPatterns.filter(p=>advanced||!p.advanced).map(p=>{
  const w=vocabulary.find(w=>w.id===p.wordId)!;
  const answer=p.spoken.join('-');
  const patterns=[...new Set(pairPatterns.filter(x=>advanced||!x.advanced).map(x=>x.spoken.join('-')))];
  return {id:`pair-${w.id}`,skill:'tone-pair-listening',files:[w.file],answer,options:shuffle([answer,...shuffle(patterns.filter(x=>x!==answer)).slice(0,3)]).map(id=>({id,label:patternLabel(id.split('-').map(Number))})),pair:answer,reveal:`${w.hanzi} · ${w.pinyin} · ${w.meaning}. Written: ${patternLabel(p.written)}. Heard: ${patternLabel(p.spoken)}. ${p.note}`};
 });
 else if(mode==='twins')pool=bases.flatMap(base=>focus.flatMap(a=>focus.map(b=>({id:`twins-${base}-${a}-${b}`,skill:'tone-contrast' as Skill,files:[audioManifest[base+a].file,audioManifest[base+b].file],answer:a===b?'same':'different',options:[{id:'same',label:'Same tone'},{id:'different',label:'Different tones'}],pair:focus.join('-'),reveal:`${pinyin(base,a)} + ${pinyin(base,b)}: tone ${a}, then tone ${b}. The consonant and vowel stay the same.`}))));
 else if(mode==='baseline'){
  const offset=Math.floor(state.attempts.filter(a=>a.question.startsWith('baseline-')).length/8)%bases.length;
  return shuffle([...tones,...tones].map((tone,i)=>{const base=bases[(offset+i)%bases.length];return {id:`baseline-${base}${tone}`,skill:'tone-listening' as Skill,files:[audioManifest[base+tone].file],answer:String(tone),tone,options:choices,reveal:`${pinyin(base,tone)} · tone ${tone}`};}));
 }else pool=bases.flatMap(base=>focus.map(tone=>({id:`ear-${base}${tone}`,skill:'tone-listening' as Skill,files:[audioManifest[base+tone].file],answer:String(tone),tone,options:choices.filter(c=>focus.includes(Number(c.id) as Tone)),reveal:`${pinyin(base,tone)} · tone ${tone}`})));
 return shuffle(pool).sort((a,b)=>Number(dueQuestion(state,b.id))-Number(dueQuestion(state,a.id))).slice(0,count);
}
export function recommendedContrast(state:Learning):Tone[]{
 const independent=state.attempts.filter(a=>a.skill==='tone-listening'&&a.independent);
 const stats=tones.map(t=>({tone:t,attempts:independent.filter(a=>a.tone===t)})).filter(s=>s.attempts.length>=5);
 if(independent.length<20||stats.length<2)return [2,3];
 return stats.sort((a,b)=>a.attempts.filter(x=>x.correct).length/a.attempts.length-b.attempts.filter(x=>x.correct).length/b.attempts.length).slice(0,2).map(s=>s.tone);
}
