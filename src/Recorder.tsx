import {useEffect,useRef,useState} from 'react';
import {Mic,Play,Square,Volume2,X} from 'lucide-react';
import {playAudioSequence,stopAudio} from './audio';
export function Recorder({enabled,sound,onExample,exampleFiles=[]}:{enabled:boolean;sound:boolean;onExample?:()=>void;exampleFiles?:string[]}){
 const [state,setState]=useState<'idle'|'asking'|'recording'|'ready'>('idle');
 const [url,setUrl]=useState(''),[playing,setPlaying]=useState(false),[message,setMessage]=useState('Your voice stays on this device.');
 const media=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),clip=useRef('');
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),mounted=useRef(true),session=useRef(0),cancel=useRef<(()=>void)|undefined>(undefined);
 function cleanup(){
  session.current++;clearTimeout(timer.current);cancel.current?.();cancel.current=undefined;
  const r=media.current;if(r){r.ondataavailable=null;r.onstop=null;r.onerror=null;if(r.state==='recording'){try{r.stop();}catch{/* Still release tracks if the device already stopped. */}}}media.current=null;
  stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
  if(clip.current)URL.revokeObjectURL(clip.current);clip.current='';
 }
 useEffect(()=>{
  mounted.current=true;
  const leave=()=>{cleanup();setUrl('');setState('idle');};
  const hidden=()=>{if(document.hidden){cancel.current?.();if(media.current?.state==='recording')media.current.stop();else if(!stream.current){session.current++;setState(clip.current?'ready':'idle');}}};
  window.addEventListener('pagehide',leave);document.addEventListener('visibilitychange',hidden);
  return()=>{mounted.current=false;cleanup();window.removeEventListener('pagehide',leave);document.removeEventListener('visibilitychange',hidden);};
 },[]);
 useEffect(()=>{if(!enabled){cleanup();setUrl('');setState('idle');}},[enabled]);
 useEffect(()=>{if(!sound)cancel.current?.();},[sound]);
 async function start(){
  if(!enabled||state==='asking'||state==='recording')return;
  stopAudio();cleanup();setUrl('');
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setState('idle');setMessage('Recording is unavailable here. You can still say the sounds out loud!');return;}
  const token=session.current;setState('asking');setMessage('Waiting for microphone permission…');
  try{
   const s=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!mounted.current||token!==session.current){s.getTracks().forEach(t=>t.stop());return;}
   stream.current=s;
   const type=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
   const r=new MediaRecorder(s,type?{mimeType:type}:undefined);media.current=r;const chunks:BlobPart[]=[];
   r.ondataavailable=e=>{if(e.data.size&&session.current===token)chunks.push(e.data);};
   r.onstop=()=>{
    s.getTracks().forEach(t=>t.stop());if(stream.current===s)stream.current=null;
    if(!mounted.current||session.current!==token)return;
    clearTimeout(timer.current);
    const blob=new Blob(chunks,{type:r.mimeType});
    if(!blob.size){setState('idle');setMessage('No sound was captured. Try again.');return;}
    clip.current=URL.createObjectURL(blob);setUrl(clip.current);setState('ready');setMessage('Nice experiment! Compare the original, then your voice. No voice score.');
    window.dispatchEvent(new Event('speaking-practice'));
   };
   r.onerror=()=>{if(!mounted.current||token!==session.current)return;cleanup();setState('idle');setMessage('Recording stopped. Try again when your microphone is available.');};
   r.start();setState('recording');setMessage('Recording… up to 15 seconds.');
   timer.current=setTimeout(()=>{if(r.state==='recording')r.stop();},15000);
  }catch(error){
   if(!mounted.current||token!==session.current)return;
   cleanup();setState('idle');setMessage((error as DOMException).name==='NotAllowedError'?'Microphone permission was not granted. Keep playing without it, or allow it in browser settings.':'No microphone is available. Keep playing out loud!');
  }
 }
 function playback(mode:'native'|'slow'|'mine'|'compare'){
  if(!sound||state==='recording'||state==='asking')return;
  const files=mode==='mine'?[url]:mode==='compare'?[...exampleFiles,url]:exampleFiles;
  if(!files.length||files.some(f=>!f))return;
  cancel.current=playAudioSequence(files,{gapMs:600,rates:files.map((_,i)=>mode==='slow'&&i<exampleFiles.length?.78:1),onStep:index=>{if(mounted.current){setPlaying(true);setMessage(mode==='mine'||(mode==='compare'&&index===exampleFiles.length)?'Playing your voice…':'Playing the original recording…');}},onFinish:reason=>{if(mounted.current){setPlaying(false);setMessage(reason==='complete'?'Your turn! Try again whenever you like.':reason==='error'?'Could not play. Please try again.':'Playback stopped.');}}});
 }
 const busy=state==='asking'||state==='recording';
 return <div className="recorder"><div className="recorder-top"><span className={`record-dot ${state==='recording'?'live':''}`}/><strong>Your voice studio</strong><span className="tiny-chip">PRIVATE</span></div><p className="microcopy">LISTEN → RECORD → COMPARE → TRY AGAIN</p><p role="status">{enabled?message:'Recording is turned off in Parent Base. You can still speak out loud.'}</p><div className="button-row">
 {state==='recording'?<button className="btn coral" onClick={()=>media.current?.stop()}><Square size={16}/>Stop recording</button>:<button className="btn secondary" disabled={!enabled||state==='asking'} onClick={start}><Mic size={16}/>{state==='asking'?'Waiting for permission…':url?'Record again':'Start recording'}</button>}
 {url&&<><button className="btn secondary" disabled={!sound||busy} onClick={()=>playback('mine')}><Play size={16}/>Listen to my voice</button>{exampleFiles.length>0&&<button className="btn primary" disabled={!sound||busy} onClick={()=>playback('compare')}><Play size={16}/>Compare: original + mine</button>}<button className="icon-btn" aria-label="Delete recording" onClick={()=>{cleanup();setUrl('');setState('idle');setMessage('Recording deleted. Try a new sound!');}}><X size={18}/></button></>}
 {exampleFiles.length>0?<><button className="text-btn" disabled={!sound||busy} onClick={()=>playback('native')}><Volume2 size={16}/>Listen to the example</button><button className="text-btn" disabled={!sound||busy} onClick={()=>playback('slow')}>Slow example</button></>:onExample&&<button className="text-btn" disabled={!sound||busy} onClick={onExample}><Volume2 size={16}/>Listen to the example</button>}
 {playing&&<button className="btn secondary" onClick={()=>cancel.current?.()}><Square size={16}/>Stop comparison</button>}
 </div><small>Temporary clips disappear when you leave this activity or change the sound. Nothing is uploaded.</small></div>;
}
