import {useState} from 'react';
import {Play,Volume2,Square,Plus,Trash2,ArrowLeft,ArrowRight} from 'lucide-react';
import {Recorder} from './components';
import {playAudioSequence,stopAudio} from './audio';
import collection from '../public/word-audio.json';
const vocabulary=collection.words;
const groups=['All',...new Set(vocabulary.map(w=>w.group))];
const find=(id:string)=>vocabulary.find(w=>w.id===id)!;
const ids=(names:string[])=>names.map(name=>vocabulary.find(w=>w.hanzi===name)!.id);
const presets=[{name:'Snack time',words:ids(['苹果','香蕉','西瓜'])},{name:'Sports day',words:ids(['游泳','足球','跑步'])},{name:'Family hello',words:ids(['妈妈','爸爸','谢谢'])}];
export function WordTrain({sound,microphone}:{sound:boolean;microphone:boolean}){
 const [group,setGroup]=useState('All'),[query,setQuery]=useState(''),[selected,setSelected]=useState(ids(['苹果'])[0]);
 const [train,setTrain]=useState<string[]>(presets[0].words),[slow,setSlow]=useState(false),[echo,setEcho]=useState(false),[repeat,setRepeat]=useState(1);
 const [playing,setPlaying]=useState<string|null>(null),[position,setPosition]=useState<number|null>(null),[message,setMessage]=useState('Choose a word. Hear it. Build your train!');
 const current=find(selected);
 const normalize=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const visible=vocabulary.filter(w=>(group==='All'||w.group===group)&&normalize(w.hanzi+' '+w.pinyin+' '+w.meaning).includes(normalize(query)));
 function play(list:string[],inTrain=false,forceSlow=slow){
  if(!sound)return;
  const sequence=inTrain?Array.from({length:repeat},()=>list).flat():list;
  playAudioSequence(sequence.map(id=>find(id).file),{slow:forceSlow,gapMs:echo?2200:120,onStep:index=>{setPlaying(sequence[index]);setPosition(inTrain?index%list.length:null);setMessage(`Playing ${find(sequence[index]).hanzi} · ${index+1} of ${sequence.length}`);},onFinish:reason=>{setPlaying(null);setPosition(null);setMessage(reason==='complete'?'Your turn! Copy what you heard.':reason==='error'?'Could not play. Please try again.':'Playback stopped.');}});
 }
 function choose(id:string){stopAudio();setSelected(id);play([id]);}
 function changeTrain(next:string[]){stopAudio();setTrain(next);setMessage(next.length?'Train ready. Press Play my train.':'Add a word to start your train.');}
 function move(index:number,delta:number){const next=[...train];[next[index],next[index+delta]]=[next[index+delta],next[index]];changeTrain(next);}
 return <section className="activity word-train">
 <style>{`.word-train .train-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start}.word-train .word-picker{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:10px}.word-train .word-choice{border:1px solid var(--line);border-radius:14px;background:#24223b;color:inherit;padding:16px 9px;text-align:center;min-height:110px}.word-train .word-choice[aria-pressed=true]{border-color:#b9ef99;background:#b9ef9912}.word-train .word-choice strong,.word-train .word-choice span{display:block}.word-train .word-choice strong{font-size:24px;margin:5px}.word-train .word-choice span{font-size:13px;color:#c7b5f0}.word-train .word-choice small{font-size:11px;color:#b6afc6}.word-train .train-car{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--line);border-radius:12px;margin:10px 0}.word-train .train-car.is-playing{border-color:#b9ef99;background:#b9ef9917}.word-train .train-car .word-label{flex:1;min-width:0}.word-train .train-car strong{display:block;font-size:20px}.word-train .train-car small{font-size:11px}.word-train .train-car .icon-btn{width:32px;height:36px;min-width:32px}.word-train .word-search{width:100%;border:1px solid #ffffff30;border-radius:12px;padding:13px 16px;background:#24223b;color:inherit;margin:12px 0 20px}.word-train .word-settings{display:flex;flex-wrap:wrap;gap:14px;font-size:13px;margin:18px 0}.word-train .word-settings label{display:flex;gap:8px;align-items:center}.word-train select{color:inherit;background:#302940;border:1px solid #ffffff30;padding:6px;border-radius:8px}.word-train .bank-head{margin:36px 0 16px}.word-train .whole-word{font-size:48px;margin:12px 0}.word-train .whole-pinyin{font-size:24px;color:#cdb9ff;margin:8px}.word-train .source-notes{font-size:12px;line-height:1.8;margin-top:25px}.word-train .source-notes a{color:#cdb9ff;text-decoration:underline}.word-train .train-empty{padding:26px 10px;color:#b6afc6;text-align:center}.word-train .btn{white-space:normal}.word-train .train-tools{display:flex;gap:3px}@media(max-width:740px){.word-train .train-layout{grid-template-columns:1fr}.word-train .whole-word{font-size:40px}.word-train .train-car{gap:7px;padding:10px}.word-train .train-tools{gap:0}.word-train .word-choice{min-height:100px}}`}</style>
 <div className="section-heading"><div className="eyebrow">BONUS · 48 EVERYDAY WORDS</div><h1>All aboard the word train.</h1><p>Hear whole words. Put your favorites in a row. Press play!</p></div>
 <div className="train-layout">
  <div className="play-card center"><div className="eyebrow">YOUR WORD · {current.group.toUpperCase()}</div><div className="whole-word">{current.emoji} {current.hanzi}</div><div className="whole-pinyin">{current.pinyin}</div><p>{current.meaning}</p>
   <div className="button-row center"><button className="btn primary" disabled={!sound} onClick={()=>play([selected],false,false)}><Volume2 size={17}/>Hear whole word</button><button className="btn secondary" disabled={!sound} onClick={()=>play([selected],false,true)}>Hear word slowly</button></div>
   <div className="button-row center" style={{marginTop:14}}><button className="btn secondary" disabled={train.length>=6} onClick={()=>changeTrain([...train,selected])}><Plus size={17}/>Add to my train</button></div>
   <p className="microcopy">{current.note||'Listen to the complete word, then say it in one breath.'}</p>
  </div>
  <div className="panel"><div className="recorder-top"><strong>My word train</strong><span className="tiny-chip">{train.length} / 6 WORDS</span></div>
   {!train.length&&<p className="train-empty">Tap a word below, then Add to my train.</p>}
   {train.map((id,index)=><div className={`train-car ${position===index?'is-playing':''}`} key={`${index}-${id}`} aria-current={position===index?'step':undefined}><span>{find(id).emoji}</span><div className="word-label"><strong>{find(id).hanzi}</strong><small>{find(id).pinyin}</small></div><div className="train-tools"><button className="icon-btn" disabled={index===0} aria-label={`Move word ${index+1} left`} onClick={()=>move(index,-1)}><ArrowLeft size={15}/></button><button className="icon-btn" disabled={index===train.length-1} aria-label={`Move word ${index+1} right`} onClick={()=>move(index,1)}><ArrowRight size={15}/></button><button className="icon-btn" aria-label={`Remove word ${index+1}`} onClick={()=>changeTrain(train.filter((_,i)=>i!==index))}><Trash2 size={14}/></button></div></div>)}
   <div className="word-settings"><label><input type="checkbox" checked={slow} onChange={e=>{stopAudio();setSlow(e.target.checked);}}/>Slow train</label><label><input type="checkbox" checked={echo} onChange={e=>{stopAudio();setEcho(e.target.checked);}}/>Pause for my turn</label><label>Repeat<select value={repeat} onChange={e=>{stopAudio();setRepeat(Number(e.target.value));}}><option value={1}>1 time</option><option value={2}>2 times</option><option value={3}>3 times</option></select></label></div>
   <div className="button-row"><button className="btn primary" disabled={!sound||!train.length} onClick={()=>play(train,true)}><Play size={17}/>Play my train</button><button className="btn secondary" disabled={!playing} onClick={stopAudio}><Square size={16}/>Stop playback</button><button className="text-btn" disabled={!train.length} onClick={()=>changeTrain([])}>Clear train</button></div>
   <p className="microcopy">A listening list of complete words. Your train does not have to be a sentence.</p>
   <p role="status" className="feedback" style={{minHeight:24}}>{!sound?'Sound is off. Turn it on at the top.':message}</p>
   <div className="button-row">{presets.map(p=><button key={p.name} className="text-btn" onClick={()=>changeTrain(p.words)}>{p.name} ↗</button>)}</div>
  </div>
 </div>
 <Recorder enabled={microphone} sound={sound} onExample={()=>play([selected])}/>
 <div className="bank-head"><h2>Pick your next discovery.</h2><p className="microcopy">Tap a card to hear a real person say the whole word.</p></div>
 <div className="mode-row">{groups.map(g=><button className={g===group?'selected':''} aria-pressed={g===group} key={g} onClick={()=>setGroup(g)}>{g}</button>)}</div>
 <label className="microcopy" htmlFor="word-search">Find a word in English, Chinese or Pinyin</label><input id="word-search" className="word-search" placeholder="Try apple, 游泳 or xiongmao" value={query} onChange={e=>setQuery(e.target.value)}/>
 <div className="word-picker">{visible.map(w=><button key={w.id} className="word-choice" aria-pressed={selected===w.id} aria-label={`${w.meaning}: ${w.hanzi}, ${w.pinyin}`} onClick={()=>choose(w.id)}><span>{w.emoji}</span><strong>{w.hanzi}</strong><span>{w.pinyin}</span><small>{w.meaning}</small></button>)}</div>
 {!visible.length&&<p>No matching words in this group. Try All or a different spelling.</p>}
 <details className="source-notes"><summary>About these voices and tone marks</summary><p>These are complete word recordings, so light syllables and within-word tone changes come from the speaker. Written Pinyin keeps dictionary tones; a third tone before another third tone sounds rising. Light syllables have no tone mark.</p><p>Voice: Yue Tan · Shtooka Project / University of Caen. MP3 preparation: Hugo Lopez. Technical support: Nicolas Vion. <a href={collection.source} target="_blank" rel="noreferrer">Audio source</a> · <a href={collection.licenseUrl} target="_blank" rel="noreferrer">{collection.license}</a> · <a href={import.meta.env.BASE_URL+'word-audio.json'} target="_blank" rel="noreferrer">Full credits</a>. Selected MP3s are unchanged. Recordings are cached with the game for offline use.</p></details>
 </section>;
}
