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
 function next(){stopAudio();setPhase(p=>p+1);}
 if(phase===1)return <ToneLab quick sound={sound} learning={learning} onLearningChange={onLearningChange} onDone={next}/>;
 if(phase===2)return <WordQuiz sound={sound} learning={learning} onLearningChange={onLearningChange} wordIds={review.length?review:undefined} count={review.length||3} title={review.length?'Return to your sound discoveries.':'Meet your first mystery words.'} onDone={next}/>;
 if(phase===4)return <WordQuiz sound={sound} learning={learning} onLearningChange={onLearningChange} wordIds={[word.id,...review.filter(id=>id!==word.id).slice(0,1)]} practiceIds={[word.id]} count={2} title="Your mini challenge." onDone={()=>{if(!completed.current){completed.current=true;onLearningChange(p=>completeDaily(p));}next();}}/>;
 return <section className="activity narrow"><div className="section-heading"><div className="eyebrow">DAILY SOUND ADVENTURE · ABOUT {learning.goal} MINUTES</div><h1>{phase===0?'A little sound adventure.':phase===3?(isNew?'One new sound secret.':'A favorite sound secret.'):'You made a new discovery!'}</h1><p>Go at your own pace. No streak to keep. Come back whenever you like.</p></div><div className={`play-card center ${phase===5?'celebration':''}`}><Host small/>
 {phase===0?<><h2>Warm up with a silly LI + MI!</h2><p>Make the first sound climb, then let the next one slide.</p><button className="btn secondary" disabled={!sound} onClick={()=>playAudioSequence([audioManifest.li2.file,audioManifest.mi4.file])}>Hear the sound remix</button><p className="microcopy">Next: revisit your sounds, uncover one new word, and solve a mini challenge.</p><button className="btn primary" onClick={next}>Ready for a mystery →</button></>:phase===3?<><div className="whole-word">{word.emoji} {word.hanzi}</div><h2>{word.pinyin} · {word.meaning}</h2><p>{word.note||'A whole word has its own rhythm. Hear it, then copy it in one breath.'}</p><Recorder key={word.id} sound={sound} enabled={microphone} exampleFiles={[word.file]}/><p className="microcopy">This is practice. A challenge on this new word will be labeled assisted today.</p><button className="btn primary" onClick={()=>{onLearningChange(p=>({...p,discoveries:[...new Set([...p.discoveries,word.id])]}));next();}}>Try my mini challenge →</button></>:<><h2>✦ A sound explorer was here!</h2><p>You warmed up, listened, discovered and practiced. That is enough for today.</p><p>Missed words will return sooner. No lost points for taking a day off.</p></>}
 </div></section>;
}
