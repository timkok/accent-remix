import {contour} from './engine';
import {speechCues} from './data';
import recordedAudio from '../public/mandarin-audio.json';
export const audioCredits=recordedAudio;
import type {Tone} from './data';
let context:AudioContext|undefined;
let active:HTMLAudioElement|undefined;
let generation=0;
let finishSequence:((reason:'complete'|'cancelled'|'error')=>void)|undefined;
let oscillators:OscillatorNode[]=[];
export const audioManifest:Record<string,{file:string;source:string;license:string;speaker:string}>=Object.fromEntries(Object.entries(recordedAudio.clips).map(([id,clip])=>[id,{file:clip.file,source:recordedAudio.source,license:recordedAudio.license,speaker:recordedAudio.credit}]));
export function stopAudio(){generation++;finishSequence?.('cancelled');active?.pause();active=undefined;if('speechSynthesis'in window)window.speechSynthesis.cancel();oscillators.forEach(o=>{try{o.stop();}catch{/* already finished */}});oscillators=[];}
export function localVoice(lang:'en'|'zh'){return 'speechSynthesis'in window?window.speechSynthesis.getVoices().find(v=>v.localService&&(lang==='zh'?/^zh[-_](CN|TW|SG|Hans|Hant)/i.test(v.lang):/^en/i.test(v.lang))):undefined;}
export function speakEnglish(text:string,sound=true){
 if(!sound)return;
 stopAudio();
 const report=(detail:string)=>window.dispatchEvent(new CustomEvent('audio-error',{detail}));
 const v=localVoice('en');
 if(!v){report('No local English voice is ready. Tap Hear Echo again, or ask a parent to install an English device voice. All instructions are also shown on screen.');return;}
 const u=new SpeechSynthesisUtterance(text);u.voice=v;u.lang=v.lang;u.rate=.95;
 const token=generation;
 u.onerror=()=>{if(token===generation)report('Echo could not speak. Tap the replay button to try again.');};
 try{window.speechSynthesis.speak(u);}catch{report('Echo could not speak. Tap the replay button to try again.');}
}
export async function pitchSound(tone:Tone,slow=false,fun=false,onComplete?:()=>void){stopAudio();const token=generation;context??=new AudioContext();await context.resume();if(token!==generation)return;const duration=slow?1.7:1;const now=context.currentTime;const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=fun?'triangle':'sine';for(let i=0;i<=40;i++)oscillator.frequency.linearRampToValueAtTime(180+260*(1-contour(tone,i/40)),now+duration*i/40);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.16,now+.06);gain.gain.setValueAtTime(.16,now+duration-.1);gain.gain.linearRampToValueAtTime(0,now+duration);oscillator.connect(gain).connect(context.destination);oscillators.push(oscillator);oscillator.onended=()=>{if(token===generation)onComplete?.();oscillators=oscillators.filter(o=>o!==oscillator);};oscillator.start();oscillator.stop(now+duration+.02);}
export async function playMandarin(base:string,tone:Tone,slow=false):Promise<string>{stopAudio();const id=base+tone,entry=audioManifest[id];if(entry){const player=new Audio(import.meta.env.BASE_URL+entry.file);active=player;player.playbackRate=slow?.78:1;player.preservesPitch=true;const token=generation;player.onerror=()=>{if(token===generation)window.dispatchEvent(new CustomEvent('audio-error',{detail:'The recording could not load. Reconnect once to cache it, then try again.'}));};try{await player.play();return token===generation?'Human Mandarin recording • Chinese-Lessons.com'+(slow?' • slow playback':''):'';}catch{return token===generation?'The recording could not play. Tap again, or reconnect once to download it.':'';}}const cue=speechCues[id];if(!cue)return 'Sound-shape practice only: no verified everyday Mandarin reading for this combination.';const voice=localVoice('zh');if(!voice)return 'No local Mandarin voice found. The visual challenges still work. A parent can add a Mandarin voice in device settings.';const u=new SpeechSynthesisUtterance(cue);u.voice=voice;u.lang=voice.lang;u.rate=slow?.65:.85;u.pitch=1;const token=generation;u.onerror=()=>{if(token===generation)window.dispatchEvent(new CustomEvent('audio-error',{detail:'Mandarin TTS could not play. Use the visual clue or try again.'}));};window.speechSynthesis.speak(u);return 'Temporary Mandarin browser TTS • device voice, not a verified recording';}
export function chime(correct:boolean,sound:boolean){if(sound)void pitchSound(correct?2:3,false,true).catch(()=>{});}

// Keep one media element and the current clip when Safari needs a fresh gesture.
export type AudioRecovery={message:string;resume:()=>void};
const recovery=(detail:AudioRecovery|null)=>window.dispatchEvent(new CustomEvent('audio-recovery',{detail}));
export function playAudioSequence(files:string[],options:{slow?:boolean;gapMs?:number;rates?:number[];onStep?:(index:number)=>void;onFinish?:(reason:'complete'|'cancelled'|'error')=>void}={}){
 stopAudio();
 if(!files.length){options.onFinish?.('complete');return ()=>{};}
 const token=generation,player=new Audio();
 let index=0,finished=false,blocked=false,attempt=0;
 let timer:ReturnType<typeof setTimeout>|undefined,watchdog:ReturnType<typeof setTimeout>|undefined;
 active=player;player.preservesPitch=true;
 const live=()=>token===generation&&!finished;
 const finish=(reason:'complete'|'cancelled'|'error')=>{
  if(finished)return;finished=true;attempt++;clearTimeout(timer);clearTimeout(watchdog);
  player.onended=null;player.onerror=null;player.ontimeupdate=null;player.onplaying=null;
  player.pause();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',cancel);
  if(active===player)active=undefined;if(finishSequence===finish)finishSequence=undefined;
  recovery(null);options.onFinish?.(reason);
 };
 const cancel=()=>finish('cancelled');
 const hidden=()=>{if(document.hidden)cancel();};
 const offerResume=()=>{
  if(!live()||blocked)return;blocked=true;attempt++;clearTimeout(watchdog);player.pause();
  recovery({message:`Playback paused at clip ${index+1} of ${files.length}. Tap to continue from here.`,resume:()=>{if(!live()||!blocked)return;blocked=false;recovery(null);start();}});
 };
 const arm=()=>{clearTimeout(watchdog);if(live()&&!blocked)watchdog=setTimeout(offerResume,12000);};
 const fail=(error?:unknown)=>{
  if(!live())return;
  if((error as {name?:string})?.name==='NotAllowedError'||(error as {name?:string})?.name==='AbortError'){offerResume();return;}
  finish('error');window.dispatchEvent(new CustomEvent('audio-error',{detail:'A recording could not load. Reconnect once, then tap Play to retry.'}));
 };
 const start=()=>{
  if(!live())return;const request=++attempt;arm();
  try{void player.play().catch(error=>{if(request===attempt)fail(error);});}catch(error){fail(error);}
 };
 const next=()=>{
  if(!live())return;
  player.src=files[index].startsWith('blob:')?files[index]:import.meta.env.BASE_URL+files[index];
  player.playbackRate=options.rates?.[index]??(options.slow?.78:1);
  options.onStep?.(index);start();
 };
 finishSequence=finish;
 player.onerror=()=>fail();player.ontimeupdate=arm;player.onplaying=arm;
 player.onended=()=>{
  if(!live()||blocked)return;attempt++;clearTimeout(watchdog);index++;
  if(index===files.length){finish('complete');return;}
  timer=setTimeout(next,options.gapMs??120);
 };
 document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',cancel);
 next();return cancel;
}
