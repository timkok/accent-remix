import collection from '../public/word-audio.json';
import type {Tone} from './data';
export const LEARNING_KEY='accent-remix-learning-v1';
export const vocabulary=collection.words;
export type VocabularyWord=typeof vocabulary[number];
export type Skill='tone-listening'|'tone-pair-listening'|'tone-contrast'|'pitch-visual'|'pinyin-marks'|'word-listening'|'word-reading'|'sound-comparison'|'electronic-listening';
export type Attempt={id:string;question:string;skill:Skill;expected:string;response:string;correct:boolean;hint:boolean;audioAvailable:boolean;audioPlayed:boolean;independent:boolean;at:string;wordId?:string;tone?:Tone;pair?:string;review:'soon'|'later'};
export type Evidence=Omit<Attempt,'id'|'correct'|'independent'|'at'|'review'>;
export type SavedTrain={id:string;title:string;words:string[];updatedAt:string};
export type WordStat={unassistedTotal:number;unassistedCorrect:number;assistedTotal:number;assistedCorrect:number;intervalDays:number;lastSeen:string;dueDate:string};
export type Learning={version:2;activeSeconds:number;discoveries:string[];draft:string[];savedTrains:SavedTrain[];stats:Record<string,WordStat>;recent:string[];attempts:Attempt[];speaking:{day:string;count:number}[];daily:{day:string;completed:number}[];goal:number};
const validIds=new Set(vocabulary.map(w=>w.id));
const skills:Skill[]=['tone-listening','tone-pair-listening','tone-contrast','pitch-visual','pinyin-marks','word-listening','word-reading','sound-comparison','electronic-listening'];
export const DEFAULT_WORD_TRAIN=['w21','w22','w23'];
export const freshLearning=():Learning=>({version:2,activeSeconds:0,discoveries:[],draft:[...DEFAULT_WORD_TRAIN],savedTrains:[],stats:{},recent:[],attempts:[],speaking:[],daily:[],goal:5});
export const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const plusDays=(day:string,n:number)=>{const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+n);return localDay(d);};
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const count=(x:unknown,max=100000)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=max?x:0;
const text=(x:unknown,max=100)=>typeof x==='string'?x.slice(0,max):'';
const date=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&localDay(new Date(x+'T12:00:00'))===x?x:'';
export const cleanWords=(x:unknown,max=6)=>Array.isArray(x)?x.filter((v):v is string=>typeof v==='string'&&validIds.has(v)).slice(0,max):[];
export function readLearning(storage:Pick<Storage,'getItem'>):Learning{
 try{
  const raw:unknown=JSON.parse(storage.getItem(LEARNING_KEY)||'null');
  if(!object(raw)||(raw.version!==1&&raw.version!==2))return freshLearning();
  const result=freshLearning();result.activeSeconds=count(raw.activeSeconds,100000000);
  result.draft=Array.isArray(raw.draft)?cleanWords(raw.draft):result.draft;
  if(Array.isArray(raw.savedTrains))for(const value of raw.savedTrains.slice(-12)){
   if(!object(value))continue;
   const t={id:text(value.id,70),title:text(value.title,40).trim(),words:cleanWords(value.words),updatedAt:text(value.updatedAt,40)};
   if(t.id&&t.title&&t.words.length&&!result.savedTrains.some(v=>v.id===t.id))result.savedTrains.push(t);
  }
  if(object(raw.stats))for(const [id,s]of Object.entries(raw.stats)){
   if(!validIds.has(id)||!object(s))continue;
   const total=count(s.unassistedTotal),assisted=count(s.assistedTotal);
   result.stats[id]={unassistedTotal:total,unassistedCorrect:Math.min(total,count(s.unassistedCorrect)),assistedTotal:assisted,assistedCorrect:Math.min(assisted,count(s.assistedCorrect)),intervalDays:count(s.intervalDays,14),lastSeen:date(s.lastSeen),dueDate:date(s.dueDate)};
  }
  result.recent=cleanWords(raw.recent,20);result.discoveries=[...new Set(cleanWords(raw.discoveries,48))];
  // Old aggregate scores are preserved for review, never invented as new assessment evidence.
  if(Array.isArray(raw.attempts))for(const a of raw.attempts.slice(-1000)){
   if(!object(a)||!skills.includes(a.skill as Skill)||!date(text(a.at,10)))continue;
   const skill=a.skill as Skill,expected=text(a.expected),response=text(a.response),hint=a.hint===true,audioPlayed=a.audioPlayed===true,audioAvailable=a.audioAvailable===true;
   const correct=expected===response,independent=!hint&&(!isListening(skill)||(audioAvailable&&audioPlayed));
   result.attempts.push({id:text(a.id),question:text(a.question),skill,expected,response,hint,audioPlayed,audioAvailable,correct,independent,at:text(a.at,40),...(/^[0-4]-[0-4]$/.test(String(a.pair))?{pair:String(a.pair)}:{}),review:correct&&independent?'later':'soon',...(validIds.has(String(a.wordId))?{wordId:String(a.wordId)}:{}),...([1,2,3,4].includes(Number(a.tone))?{tone:Number(a.tone) as Tone}:{})});
  }
  for(const key of ['speaking','daily'] as const){
   const values=raw[key];if(!Array.isArray(values))continue;
   const merged=new Map<string,number>();
   for(const v of values.slice(-365))if(object(v)&&date(v.day))merged.set(String(v.day),count(key==='speaking'?v.count:v.completed,1000));
   if(key==='speaking')result.speaking=[...merged].map(([day,n])=>({day,count:n}));
   else result.daily=[...merged].map(([day,n])=>({day,completed:n}));
  }
  result.goal=[3,5,8].includes(Number(raw.goal))?Number(raw.goal):5;
  return result;
 }catch{return freshLearning();}
}
export function saveLearning(storage:Pick<Storage,'setItem'>,state:Learning){try{storage.setItem(LEARNING_KEY,JSON.stringify(state));return true;}catch{return false;}}
export const isListening=(skill:Skill)=>['tone-listening','tone-pair-listening','tone-contrast','word-listening','sound-comparison','electronic-listening'].includes(skill);
export function recordAttempt(state:Learning,e:Evidence,now=new Date()):Learning{
 const correct=e.expected===e.response,independent=!e.hint&&(!isListening(e.skill)||(e.audioAvailable&&e.audioPlayed));
 const at=now.toISOString();
 const entry:Attempt={...e,id:`${at}-${state.attempts.length}-${e.question}`,correct,independent,at,review:correct&&independent?'later':'soon'};
 let next={...state,attempts:[...state.attempts,entry].slice(-1000)};
 // Comparison/order tasks are not proof of knowing an individual word's meaning.
 if(e.skill==='word-listening'&&e.wordId&&validIds.has(e.wordId)){
  const old=state.stats[e.wordId]??{unassistedTotal:0,unassistedCorrect:0,assistedTotal:0,assistedCorrect:0,intervalDays:0,lastSeen:'',dueDate:''};
  const day=localDay(now);
  // Multiple correct clicks on one day cannot push a review weeks into the future.
  const intervalDays=correct&&independent?(old.lastSeen===day&&old.intervalDays>0?old.intervalDays:Math.min(14,Math.max(1,old.intervalDays*2))):0;
  const stat={unassistedTotal:old.unassistedTotal+Number(independent),unassistedCorrect:old.unassistedCorrect+Number(correct&&independent),assistedTotal:old.assistedTotal+Number(!independent),assistedCorrect:old.assistedCorrect+Number(correct&&!independent),lastSeen:day,dueDate:plusDays(day,intervalDays),intervalDays};
  next={...next,stats:{...state.stats,[e.wordId]:stat},recent:[e.wordId,...state.recent.filter(w=>w!==e.wordId)].slice(0,20)};
 }
 return next;
}
export function recordSpeaking(state:Learning,day=localDay()):Learning{
 const old=state.speaking.find(s=>s.day===day);
 return {...state,speaking:[...state.speaking.filter(s=>s.day!==day),{day,count:(old?.count??0)+1}].slice(-365)};
}
export function completeDaily(state:Learning,day=localDay()):Learning{
 const old=state.daily.find(s=>s.day===day);
 return {...state,daily:[...state.daily.filter(s=>s.day!==day),{day,completed:(old?.completed??0)+1}].slice(-365)};
}
export function shuffle<T>(values:T[],random:()=>number=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeWordRound(state:Learning,n=5,pool=vocabulary,day=localDay(),random:()=>number=Math.random){
 const rank=(w:VocabularyWord)=>!state.stats[w.id]?1:!state.stats[w.id].dueDate||state.stats[w.id].dueDate<=day?0:2;
 return shuffle(pool,random).sort((a,b)=>rank(a)-rank(b)||Number(state.recent.slice(0,3).includes(a.id))-Number(state.recent.slice(0,3).includes(b.id))).slice(0,Math.max(1,n));
}
export function wordChoices(target:VocabularyWord,random:()=>number=Math.random){
 const ambiguous=(w:VocabularyWord)=>['happy','glad'].includes(target.meaning)&&['happy','glad'].includes(w.meaning);
 const peers=shuffle(vocabulary.filter(w=>w.id!==target.id&&w.group===target.group&&!ambiguous(w)),random);
 const extras=shuffle(vocabulary.filter(w=>w.id!==target.id&&w.group!==target.group),random);
 return shuffle([target,...[...peers,...extras].filter((w,i,a)=>w.meaning!==target.meaning&&a.findIndex(x=>x.meaning===w.meaning)===i).slice(0,3)],random);
}
export function skillSummary(state:Learning,skill:Skill,tone?:Tone){
 const entries=state.attempts.filter(a=>a.skill===skill&&(!tone||a.tone===tone)),independent=entries.filter(a=>a.independent);
 const correct=independent.filter(a=>a.correct).length;
 return {total:independent.length,correct,assisted:entries.length-independent.length,accuracy:independent.length?Math.round(100*correct/independent.length):null};
}
export function wordSummary(state:Learning,day=localDay()){
 const entries=Object.entries(state.stats);
 return {practiced:entries.length,totalWords:vocabulary.length,recognized:entries.filter(([id,s])=>s.intervalDays>0&&new Set(state.attempts.filter(a=>a.wordId===id&&a.skill==='word-listening'&&a.correct&&a.independent).map(a=>localDay(new Date(a.at)))).size>=2).length,due:entries.filter(([,s])=>!s.dueDate||s.dueDate<=day).map(([id])=>vocabulary.find(w=>w.id===id)!),...skillSummary(state,'word-listening')};
}
export function saveTrain(state:Learning,title:string,words:string[]):Learning{
 const cleanTitle=title.trim().slice(0,40),clean=cleanWords(words);if(!cleanTitle||!clean.length)return state;
 const existing=state.savedTrains.find(t=>t.title.toLowerCase()===cleanTitle.toLowerCase());
 if(!existing&&state.savedTrains.length>=12)return state;
 const train={id:existing?.id??crypto.randomUUID(),title:cleanTitle,words:clean,updatedAt:new Date().toISOString()};
 return {...state,savedTrains:[...state.savedTrains.filter(t=>t.id!==train.id),train]};
}

export function renameTrain(state:Learning,id:string,title:string):Learning{
 const name=title.trim().slice(0,40);
 if(!name||state.savedTrains.some(t=>t.id!==id&&t.title.toLowerCase()===name.toLowerCase()))return state;
 return {...state,savedTrains:state.savedTrains.map(t=>t.id===id?{...t,title:name,updatedAt:new Date().toISOString()}:t)};
}
