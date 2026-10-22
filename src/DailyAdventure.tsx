import {useRef,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import {Host,Recorder} from './components';
import {ToneLab} from './ToneLab';
import {WordQuiz} from './WordQuiz';
import {completeDaily,makeWordRound,vocabulary} from './learning';
import type {Learning} from './learning';
import {audioManifest,playAudioSequence,stopAudio} from './audio';
export function DailyAdventure({sound,microphone,learning,onLearningChange}:{sound:boolean;microphone:boolean;learning:Learning;onLearningChange:Dispatch<SetStateAction<Learning>>}){
 const [phase,setPhase]=useState(0),[word]=useState(()=>makeWordRound(learning,1,vocabulary.filter(w=>!learning.stats[w.id]&&!learning.discoveries.includes(w.id))).at(0)??makeWordRound(learning,1)[0]);
 const [review]=useState(()=>makeWordRound(learning,learning.goal===3?2:learning.goal===8?5:3,vocabulary.filter(w=>learning.stats[w.id])).map(w=>w.id));
 const [isNew]=useState(()=>!learning.stats[word.id]&&!learning.discoveries.includes(word.id));
 const completed=useRef(false);
 function next(){stopAudio();setPhase(p=>p===1&&!review.length?3:p+1);}
 const steps=['Warm up','Listen for tones','Revisit words','New word + optional voice','Mini challenge','Celebrate'];
 const trail=<div className="daily-steps" role="status">Step {phase+1-Number(!review.length&&phase>2)} of {review.length?6:5} · {steps[phase]}{phase<5&&<small>Next: {steps[phase===1&&!review.length?3:phase+1]}</small>}</div>;
 if(phase===1)return <>{trail}<ToneLab quick sound={sound} learning={learning} onLearningChange={onLearningChange} onDone={next}/></>;
 if(phase===2)return <>{trail}<WordQuiz sound={sound} learning={learning} onLearningChange={onLearningChange} wordIds={review.length?review:undefined} count={review.length||3} title={review.length?'Return to your sound discoveries.':'Meet your first mystery words.'} onDone={next}/></>;
 if(phase===4)return <>{trail}<WordQuiz sound={sound} learning={learning} onLearningChange={onLearningChange} wordIds={[word.id,...review.filter(id=>id!==word.id).slice(0,1)]} practiceIds={[word.id]} count={2} title="Your mini challenge." onDone={()=>{if(!completed.current){completed.current=true;onLearningChange(p=>completeDaily(p));}next();}}/></>;
 return <section className="activity narrow">{trail}<div className="section-heading"><div className="eyebrow">DAILY SOUND ADVENTURE · ABOUT {learning.goal} MINUTES</div><h1>{phase===0?'A little sound adventure.':phase===3?(isNew?'One new sound secret.':'A favorite sound secret.'):'You made a new discovery!'}</h1><p>Go at your own pace. A few minutes is enough.</p></div><div className={`play-card center ${phase===5?'celebration':''}`}><Host small/>
 {phase===0?<><h2>Warm up with a silly LI + MI!</h2><p>Say “limit” in English. Now play with LI + MI: make LI climb and MI slide.</p><button className="btn secondary" disabled={!sound} onClick={()=>playAudioSequence([audioManifest.li2.file,audioManifest.mi4.file])}>Hear the sound remix</button><p className="microcopy">A sound game, not the English pronunciation or a rule for an accent.</p><button className="btn primary" onClick={next}>Ready for a mystery →</button></>:phase===3?<><div className="whole-word">{word.emoji} {word.hanzi}</div><h2>{word.pinyin} · {word.meaning}</h2><p>{word.note||'A whole word has its own rhythm. Hear it, then copy it in one breath.'}</p><Recorder key={word.id} sound={sound} enabled={microphone} exampleFiles={[word.file]}/><p className="microcopy">Say it out loud or try recording. Both are optional. This new word counts as practice today.</p><button className="btn primary" onClick={()=>{onLearningChange(p=>({...p,discoveries:[...new Set([...p.discoveries,word.id])]}));next();}}>Try my mini challenge →</button></>:<><h2>✦ A sound explorer was here!</h2><p>You warmed up, listened, discovered and practiced. That is enough for today.</p><p>Missed words will return sooner. No lost points for taking a day off.</p></>}
 </div></section>;
}
