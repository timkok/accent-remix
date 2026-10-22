import {useEffect,useRef,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import {Headphones,Volume2} from 'lucide-react';
import {playAudioSequence,stopAudio} from './audio';
import {makeWordRound,recordAttempt,shuffle,vocabulary,wordChoices} from './learning';
import type {Learning,VocabularyWord} from './learning';
import {Host} from './components';
type Challenge={kind:'word'|'same'|'order'|'match';target:VocabularyWord;files:string[];options:{id:string;label:string;emoji?:string}[];answer:string;reveal:string};
export function makeChallenges(learning:Learning,pool=vocabulary,count=5):Challenge[]{
 const targets=makeWordRound(learning,count,pool);
 return targets.map((target,i)=>{
  const peers=shuffle(pool.filter(w=>w.id!==target.id));
  const other=peers[0]??vocabulary.find(w=>w.id!==target.id)!;
  if(i%5===1){const same=Math.random()<.5;return {kind:'same',target,files:[target.file,same?target.file:other.file],options:[{id:'same',label:'Same word'},{id:'different',label:'Different words'}],answer:same?'same':'different',reveal:same?`${target.hanzi} · ${target.pinyin} · twice`:`${target.hanzi} · ${target.pinyin} / ${other.hanzi} · ${other.pinyin}`};}
  if(i%5===3&&peers.length>=2){
   const order=shuffle([target,...peers.slice(0,2)]);
   return {kind:'order',target,files:order.map(w=>w.file),options:shuffle(order).map(w=>({id:w.id,label:w.meaning,emoji:w.emoji})),answer:order.map(w=>w.id).join(','),reveal:order.map(w=>`${w.hanzi} (${w.pinyin})`).join(' → ')};
  }
  if(i%5===4){const pair=shuffle([target,other]);return {kind:'match',target,files:pair.map(w=>w.file),options:[{id:'0',label:'First recording'},{id:'1',label:'Second recording'}],answer:String(pair.indexOf(target)),reveal:`${target.hanzi} · ${target.pinyin} · ${target.meaning}`};}
  return {kind:'word',target,files:[target.file],options:wordChoices(target).map(w=>({id:w.id,label:w.meaning,emoji:w.emoji})),answer:target.id,reveal:`${target.hanzi} · ${target.pinyin} · ${target.meaning}`};
 });
}
export function WordQuiz({sound,learning,onLearningChange,wordIds,onDone,title='Listen & Guess!',count=5,practiceIds=[],orderOnly=false}:{sound:boolean;learning:Learning;onLearningChange:Dispatch<SetStateAction<Learning>>;wordIds?:string[];onDone?:()=>void;title?:string;count?:number;practiceIds?:string[];orderOnly?:boolean}){
 const buildRound=()=>{const pool=wordIds?vocabulary.filter(w=>wordIds.includes(w.id)):vocabulary;if(!orderOnly)return makeChallenges(learning,pool,count);const order=shuffle(pool).slice(0,6);if(order.length<2)return [];return [{kind:'order' as const,target:order[0],files:order.map(w=>w.file),options:shuffle(order).map(w=>({id:w.id,label:w.meaning,emoji:w.emoji})),answer:order.map(w=>w.id).join(','),reveal:order.map(w=>`${w.hanzi} (${w.pinyin})`).join(' → ')}];};
 const [round,setRound]=useState<Challenge[]>(buildRound);
 const [index,setIndex]=useState(0),[right,setRight]=useState(0),[done,setDone]=useState(false),[cycle,setCycle]=useState(0);
 if(!round.length)return <div className="panel"><p>Add a word to your train first.</p></div>;
 if(done)return <section className="activity narrow"><div className="finish celebration"><Host small/><h1>Sound secrets discovered!</h1><p>{right} / {round.length} first choices correct. Every new clue helps.</p><p>Practice and hints are kept separate from independent listening.</p>{onDone?<button className="btn primary" onClick={onDone}>Finish my adventure</button>:<button className="btn primary" onClick={()=>{setRound(buildRound());setIndex(0);setRight(0);setDone(false);setCycle(c=>c+1);}}>Another challenge</button>}</div></section>;
 return <section className="activity narrow word-quiz"><div className="section-heading"><div className="eyebrow">LISTENING CHALLENGE · FIRST CHOICES MATTER</div><h1>{title}</h1><p>Open the mystery sound box. What will you discover?</p></div><div className="round-status"><span>CLUE {index+1} / {round.length}</span><span>{right} solved</span></div><QuizCard key={`${cycle}-${index}`} q={round[index]} sound={sound} practiced={practiceIds.includes(round[index].target.id)||round.slice(0,index).some(q=>q.files.includes(round[index].target.file))} onAnswer={(response,hint)=>{const q=round[index];onLearningChange(p=>recordAttempt(p,{question:`word-${q.kind}-${q.target.id}`,skill:q.kind==='word'?'word-listening':'sound-comparison',expected:q.answer,response,hint,audioAvailable:true,audioPlayed:true,...(q.kind==='word'?{wordId:q.target.id}:{})}));if(response===q.answer)setRight(n=>n+1);}} onNext={()=>{stopAudio();if(index+1===round.length)setDone(true);else setIndex(n=>n+1);}}/>
 </section>;
}
function QuizCard({q,sound,practiced,onAnswer,onNext}:{q:Challenge;sound:boolean;practiced:boolean;onAnswer:(response:string,hint:boolean)=>void;onNext:()=>void}){
 const [heard,setHeard]=useState(false),[hint,setHint]=useState(practiced),[chosen,setChosen]=useState<string|null>(null),[order,setOrder]=useState<string[]>([]),[status,setStatus]=useState('Press Listen. The answer is hidden until you choose.');
 const answered=useRef(false),cancel=useRef<(()=>void)|undefined>(undefined);
 useEffect(()=>()=>cancel.current?.(),[]);
 function listen(){if(!sound)return;setHeard(false);setStatus('Playing the mystery recording…');cancel.current=playAudioSequence(q.files,{gapMs:500,onFinish:reason=>{setHeard(reason==='complete');setStatus(reason==='complete'?'Ready! Choose what you heard.':reason==='error'?'Audio unavailable. Reconnect once and try again.':'Playback stopped. Press Listen again.');}});}
 function answer(response:string){if(!heard||!sound)return;const first=!answered.current;answered.current=true;setChosen(response);if(first)onAnswer(response,hint);setStatus(response===q.answer?'You cracked the sound secret!':'A new discovery! Listen to the answer, then try saying it.');
  cancel.current=playAudioSequence(q.files,{gapMs:500});
 }
 const prompt=q.kind==='same'?'Do the two recordings say the same word?':q.kind==='order'?'Tap the meanings in the order you hear.':q.kind==='match'?`Which recording means “${q.target.meaning}”?`:'Which picture and meaning match the word?';
 return <><div className="play-card quiz-card"><Headphones size={40} aria-hidden="true"/><h2>{prompt}</h2><button className="btn primary large" aria-label="Listen to the mystery recording" disabled={!sound} onClick={listen}><Volume2 size={20}/>Listen{heard?' again':''}</button><p role="status">{!sound?'Turn sound on to hear this challenge.':status}</p>{chosen===null?<><button className="text-btn" disabled={!heard} onClick={()=>setHint(true)}>Reveal a hint · practice only</button>{hint&&<p className="callout">Practice clue: {q.reveal}. This answer will not count as independent listening.</p>}</>:<div className="quiz-feedback" role="status"><strong>{chosen===q.answer?'Great listening!':'Good try — here is the sound secret.'}</strong><p>{q.reveal}</p>{hint&&<small>Assisted practice · excluded from independent accuracy</small>}</div>}</div>
 <div className="answer-grid" aria-label="Listening answers">{q.options.map(o=><button className="meaning-answer" key={o.id} aria-label={o.label} disabled={!sound||!heard||chosen!==null||(q.kind==='order'&&order.includes(o.id))} onClick={()=>q.kind==='order'?setOrder(a=>[...a,o.id]):answer(o.id)}>{o.emoji&&<span className="answer-emoji" aria-hidden="true">{o.emoji}</span>}{o.label}</button>)}</div>
 {q.kind==='order'&&chosen===null&&<div className="panel"><p aria-live="polite">Your order: {order.map(id=>q.options.find(o=>o.id===id)!.label).join(' → ')||'Tap the cards above'}</p><div className="button-row"><button className="btn primary" disabled={!sound||!heard||order.length!==q.options.length} onClick={()=>answer(order.join(','))}>Check my order</button><button className="text-btn" onClick={()=>setOrder([])}>Start order again</button></div></div>}
 {q.kind==='order'&&chosen!==null&&chosen!==q.answer&&<button className="btn secondary" onClick={()=>{cancel.current?.();setChosen(null);setOrder([]);setHint(true);setHeard(false);setStatus('Listen again, then change your order. This correction is practice only.');}}>Try this order again · practice</button>}
 {chosen!==null&&<button className="btn primary" onClick={onNext}>Next discovery →</button>}
 <p className="microcopy">Listening recognition, not pronunciation grading. Hints turn this clue into practice.</p></>;
}
