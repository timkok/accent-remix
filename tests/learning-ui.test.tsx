// @vitest-environment jsdom
import React,{useState} from 'react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import App from '../src/App';
import {WordQuiz} from '../src/WordQuiz';
import {Recorder} from '../src/Recorder';
import {freshLearning,LEARNING_KEY,vocabulary} from '../src/learning';
import {freshProgress,STORAGE_KEY} from '../src/engine';
import {playAudioSequence,stopAudio} from '../src/audio';
const players:any[]=[];
class AudioStub{src='';play=vi.fn().mockResolvedValue(undefined);pause=vi.fn();playbackRate=1;preservesPitch=false;onended:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(){players.push(this);}}
beforeEach(()=>{players.length=0;localStorage.clear();window.scrollTo=vi.fn();vi.stubGlobal('Audio',AudioStub);Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn()}});});
afterEach(()=>{cleanup();stopAudio();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
function Quiz(){const [p,setP]=useState(freshLearning);return <><WordQuiz sound learning={p} onLearningChange={setP}/><output data-testid="evidence">{JSON.stringify(p)}</output></>;}
const state=()=>JSON.parse(screen.getByTestId('evidence').textContent!);
const end=()=>act(()=>players.at(-1).onended?.());
const listen=()=>{fireEvent.click(screen.getByRole('button',{name:'Listen to the mystery recording'}));end();};
describe('honest listening assessment',()=>{
 it('hides answer text and accessibility clues, requires completion, and records only first choice',()=>{
  render(<Quiz/>);const answers=document.querySelectorAll<HTMLButtonElement>('.answer-grid button');expect([...answers].every(b=>b.disabled)).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Listen to the mystery recording'}));const word=vocabulary.find(w=>players.at(-1).src.endsWith(w.file))!;
  expect(document.body.textContent).not.toContain(word.hanzi);expect(document.body.textContent).not.toContain(word.pinyin);expect(document.querySelector(`[aria-label*="${word.pinyin}"]`)).toBeNull();expect([...answers].every(b=>b.disabled)).toBe(true);
  end();fireEvent.click(screen.getByRole('button',{name:word.meaning}));fireEvent.click(screen.getByRole('button',{name:word.meaning}));
  expect(state().attempts).toHaveLength(1);expect(state().attempts[0]).toMatchObject({correct:true,independent:true,audioPlayed:true});expect(document.body.textContent).toContain(word.hanzi);
 });
 it('hint-assisted correctness is excluded and a wrong answer replays native audio',()=>{
  render(<Quiz/>);listen();const word=vocabulary.find(w=>players.at(-1).src.endsWith(w.file))!;
  fireEvent.click(screen.getByRole('button',{name:/Reveal a hint/}));fireEvent.click(screen.getByRole('button',{name:word.meaning}));expect(state().attempts[0]).toMatchObject({hint:true,independent:false});expect(players).toHaveLength(2);
 });
 it('cannot earn a score after audio failure, cancellation or mute',()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Listen & Guess'}));fireEvent.click(screen.getByRole('button',{name:'Listen to the mystery recording'}));act(()=>players.at(-1).onerror());
  expect([...document.querySelectorAll<HTMLButtonElement>('.answer-grid button')].every(b=>b.disabled)).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Listen to the mystery recording'}));const stale=players.at(-1).onended;fireEvent.click(screen.getByRole('button',{name:'Turn sound off'}));act(()=>stale());expect([...document.querySelectorAll<HTMLButtonElement>('.answer-grid button')].every(b=>b.disabled)).toBe(true);
  expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).attempts).toHaveLength(0);
 });
 it('completes meaning, same/different, order and recording-match challenges with distinct evidence',()=>{
  vi.useFakeTimers();render(<Quiz/>);
  for(let i=0;i<5;i++){
   fireEvent.click(screen.getByRole('button',{name:'Listen to the mystery recording'}));
   const files:string[]=[];const clips=i===3?3:i===1||i===4?2:1;
   for(let j=0;j<clips;j++){files.push(players.at(-1).src);act(()=>{players.at(-1).onended?.();vi.advanceTimersByTime(500);});}
   const heard=files.map(file=>vocabulary.find(w=>file.endsWith(w.file))!);
   if(i===3){for(const w of heard)fireEvent.click(screen.getByRole('button',{name:w.meaning}));fireEvent.click(screen.getByRole('button',{name:'Check my order'}));}
   else if(i===1)fireEvent.click(screen.getByRole('button',{name:heard[0].id===heard[1].id?'Same word':'Different words'}));
   else if(i===4){const prompt=screen.getByRole('heading',{name:/Which recording means/}).textContent!;fireEvent.click(screen.getByRole('button',{name:prompt.includes('“'+heard[0].meaning+'”')?'First recording':'Second recording'}));}
   else fireEvent.click(screen.getByRole('button',{name:heard[0].meaning}));
   fireEvent.click(screen.getByRole('button',{name:'Next discovery →'}));
  }
  expect(state().attempts).toHaveLength(5);expect(state().attempts.every((a:any)=>a.correct)).toBe(true);expect(state().attempts[0].independent).toBe(true);expect(state().attempts.filter((a:any)=>a.skill==='word-listening')).toHaveLength(2);expect(state().attempts.filter((a:any)=>a.skill==='sound-comparison')).toHaveLength(3);expect(screen.getByRole('heading',{name:'Sound secrets discovered!'})).toBeTruthy();
 });
 it('keeps tone questions assisted after a visual clue has been shown then sound restored',()=>{
  const p=freshProgress();p.completed=[0,1,2,3];p.settings.difficulty='challenge';localStorage.setItem(STORAGE_KEY,JSON.stringify(p));render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Continue your adventure/}));fireEvent.click(screen.getByRole('button',{name:/MISSION 05/}));
  // Visit the randomized round until reaching an audio question; earlier answers retain their categories.
  for(let i=0;i<10;i++){
   const play=screen.queryByRole('button',{name:'Play Mandarin clue'});
   if(play){fireEvent.click(screen.getByRole('button',{name:'Turn sound off'}));fireEvent.click(screen.getByRole('button',{name:'Turn sound on'}));fireEvent.click(play);end();fireEvent.click(document.querySelector('.answer-grid button')!);const last=JSON.parse(localStorage.getItem(LEARNING_KEY)!).attempts.at(-1);expect(last.skill).toBe('tone-listening');expect(last.hint).toBe(true);expect(last.independent).toBe(false);return;}
   fireEvent.click(document.querySelector('.answer-grid button')!);fireEvent.click(screen.getByRole('button',{name:'Next clue'}));
  }
  throw Error('Round should include a listening question');
 });
});
describe('saved trains, daily practice, progress migration',()=>{
 it('retains drafts and named trains through navigation and a full app remount',()=>{
  const app=render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Build a word train'}));fireEvent.change(screen.getByLabelText('Name your own train'),{target:{value:'My snack train'}});fireEvent.click(screen.getByRole('button',{name:'Save my train'}));fireEvent.click(screen.getByRole('button',{name:'Clear train'}));
  app.unmount();render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Build a word train'}));expect(screen.getByText('0 / 6 WORDS')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Load My snack train'}));expect(screen.getByText('3 / 6 WORDS')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Challenge my train →'}));expect(screen.getByRole('heading',{name:'Challenge my train!'})).toBeTruthy();
 });
 it('preserves old points and badges and resets both stores only after confirmation',()=>{
  const p=freshProgress();p.points=432;p.completed=[0,1];localStorage.setItem(STORAGE_KEY,JSON.stringify(p));render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Parent Base'}));expect(screen.getAllByText('432').length).toBeGreaterThan(0);expect(screen.queryByText(/Most practice needed/)).toBeNull();expect(screen.getAllByText('Building a sample · 0/0 independent').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button',{name:'Reset progress on this device'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).points).toBe(432);fireEvent.click(screen.getByRole('button',{name:'Yes, reset progress'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).points).toBe(0);expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).attempts).toHaveLength(0);
 });
 it('can finish a self-paced daily adventure and records completion once',()=>{
  vi.useFakeTimers();render(<App/>);fireEvent.click(screen.getByRole('button',{name:'My daily sound adventure'}));fireEvent.click(screen.getByRole('button',{name:'Ready for a mystery →'}));
  for(let i=0;i<2;i++){fireEvent.click(screen.getByRole('button',{name:'Play mystery sound'}));end();fireEvent.click(document.querySelector('.answer-grid button')!);fireEvent.click(screen.getByRole('button',{name:'Next sound →'}));}fireEvent.click(screen.getByRole('button',{name:'Continue my adventure →'}));
  function finishQuiz(){for(let i=0;i<3;i++){const play=screen.queryByRole('button',{name:'Listen to the mystery recording'});if(!play)break;fireEvent.click(play);for(let j=0;j<3;j++)act(()=>{players.at(-1).onended?.();vi.advanceTimersByTime(600);});fireEvent.click(document.querySelector('.answer-grid button')!);fireEvent.click(screen.getByRole('button',{name:'Next discovery →'}));}}
  finishQuiz();fireEvent.click(screen.getByRole('button',{name:'Finish my adventure'}));expect(screen.getByRole('heading',{name:'One new sound secret.'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Try my mini challenge →'}));finishQuiz();fireEvent.click(screen.getByRole('button',{name:'Finish my adventure'}));expect(screen.getByRole('heading',{name:'You made a new discovery!'})).toBeTruthy();expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).daily[0].completed).toBe(1);expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).discoveries).toHaveLength(1);
 });
});

function recordingSetup(){
 const tracks={stop:vi.fn()},recorders:any[]=[];
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:vi.fn().mockResolvedValue({getTracks:()=>[tracks]})}});
 vi.stubGlobal('MediaRecorder',class {static isTypeSupported(){return true;}state='inactive';mimeType='audio/webm';ondataavailable:any;onstop:any;onerror:any;constructor(){recorders.push(this);}start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['voice'])});this.onstop?.();}});
 Object.defineProperty(URL,'createObjectURL',{configurable:true,value:vi.fn(()=> 'blob:local-voice')});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});
 return {tracks,recorders};
}
async function capture(){fireEvent.click(screen.getByRole('button',{name:'Start recording'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Stop recording'})).toBeTruthy());fireEvent.click(screen.getByRole('button',{name:'Stop recording'}));}
describe('private native-versus-child comparison',()=>{
 it('plays native then local blob at normal speed, and shared mute cancels the queued voice',async()=>{
  const {tracks}=recordingSetup();render(<Recorder enabled sound exampleFiles={['audio/words/w21.mp3']}/>);await capture();expect(tracks.stop).toHaveBeenCalled();
  vi.useFakeTimers();fireEvent.click(screen.getByRole('button',{name:'Compare: original + mine'}));const a=players.at(-1);expect(a.src).toContain('audio/words/w21.mp3');act(()=>{a.onended();vi.advanceTimersByTime(600);});expect(a.src).toBe('blob:local-voice');expect(a.playbackRate).toBe(1);end();
  fireEvent.click(screen.getByRole('button',{name:'Compare: original + mine'}));const b=players.at(-1);act(()=>b.onended());act(()=>stopAudio());act(()=>vi.advanceTimersByTime(900));expect(b.play).toHaveBeenCalledTimes(1);expect(b.onended).toBeNull();expect(JSON.stringify(localStorage)).not.toContain('blob:');
 });
 it('stops comparison when any other example starts and revokes blobs on unmount',async()=>{
  recordingSetup();const app=render(<Recorder enabled sound exampleFiles={['audio/words/w21.mp3']}/>);await capture();fireEvent.click(screen.getByRole('button',{name:'Listen to my voice'}));const mine=players.at(-1);act(()=>playAudioSequence(['audio/words/w22.mp3']));expect(mine.pause).toHaveBeenCalled();expect(mine.onended).toBeNull();app.unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-voice');
 });
 it('stops late permission streams after leaving the activity',async()=>{
  recordingSetup();let resolve!:(s:any)=>void;const stop=vi.fn();Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(r=>{resolve=r;})}});const app=render(<Recorder enabled sound/>);fireEvent.click(screen.getByRole('button',{name:'Start recording'}));app.unmount();await act(async()=>resolve({getTracks:()=>[{stop}]}));expect(stop).toHaveBeenCalled();
 });
 it('releases microphone if recorder construction throws and never counts practice',async()=>{
  const {tracks}=recordingSetup();vi.stubGlobal('MediaRecorder',class{static isTypeSupported(){return true;}constructor(){throw Error('unsupported');}});const practice=vi.fn();window.addEventListener('speaking-practice',practice);render(<Recorder enabled sound/>);fireEvent.click(screen.getByRole('button',{name:'Start recording'}));await waitFor(()=>expect(tracks.stop).toHaveBeenCalled());expect(practice).not.toHaveBeenCalled();window.removeEventListener('speaking-practice',practice);
 });
 it('stops recording at 15 seconds and disposes tracks when disabled',async()=>{
  const {tracks}=recordingSetup();vi.useFakeTimers();const app=render(<Recorder enabled sound/>);
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Start recording'}));});
  expect(screen.getByRole('button',{name:'Stop recording'})).toBeTruthy();act(()=>vi.advanceTimersByTime(15000));expect(screen.getByRole('button',{name:'Listen to my voice'})).toBeTruthy();expect(tracks.stop).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Listen to my voice'}));const a=players.at(-1);app.rerender(<Recorder enabled={false} sound/>);expect(a.pause).toHaveBeenCalled();expect(URL.revokeObjectURL).toHaveBeenCalled();expect(screen.queryByRole('button',{name:'Listen to my voice'})).toBeNull();
 });
 it('drops permission results that arrive after the page becomes hidden',async()=>{
  recordingSetup();let resolve!:(s:any)=>void;const stop=vi.fn();Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(r=>{resolve=r;})}});
  const hidden=vi.spyOn(document,'hidden','get').mockReturnValue(false);render(<Recorder enabled sound/>);fireEvent.click(screen.getByRole('button',{name:'Start recording'}));hidden.mockReturnValue(true);act(()=>document.dispatchEvent(new Event('visibilitychange')));await act(async()=>resolve({getTracks:()=>[{stop}]}));expect(stop).toHaveBeenCalled();expect(screen.queryByRole('button',{name:'Stop recording'})).toBeNull();
 });
 it('counts participation only after a nonempty clip',async()=>{
  recordingSetup();const practice=vi.fn();window.addEventListener('speaking-practice',practice);render(<Recorder enabled sound/>);fireEvent.click(screen.getByRole('button',{name:'Start recording'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Stop recording'})).toBeTruthy());expect(practice).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Stop recording'}));expect(practice).toHaveBeenCalledTimes(1);window.removeEventListener('speaking-practice',practice);
 });
});

describe('tone detective and editable trains',()=>{
 it('requires completed audio, hides the answer, and latches hints across mute',()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Echo’s Listening Detective'}));fireEvent.click(screen.getByRole('button',{name:'Which tone?'}));
  expect([...document.querySelectorAll<HTMLButtonElement>('.answer-grid button')].every(b=>b.disabled)).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Play mystery sound'}));const file=players.at(-1).src;end();const tone=file.match(/([1-4])\.mp3$/)![1];
  fireEvent.click(screen.getByRole('button',{name:/Reveal sound secret/}));fireEvent.click(screen.getByRole('button',{name:'Turn sound off'}));fireEvent.click(screen.getByRole('button',{name:'Turn sound on'}));fireEvent.click(screen.getByRole('button',{name:new RegExp(`Tone ${tone}`)}));
  const last=JSON.parse(localStorage.getItem(LEARNING_KEY)!).attempts.at(-1);expect(last).toMatchObject({correct:true,hint:true,independent:false,skill:'tone-listening'});
 });
 it('waits for both same-syllable clips and keeps comparison separate from recognition',()=>{
  vi.useFakeTimers();render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Echo’s Listening Detective'}));fireEvent.click(screen.getByRole('button',{name:'Sound Twins · same syllable'}));fireEvent.click(screen.getByRole('button',{name:'Play mystery sound'}));
  const first=players.at(-1).src;end();expect((screen.getByRole('button',{name:'Same tone'}) as HTMLButtonElement).disabled).toBe(true);act(()=>vi.advanceTimersByTime(550));const second=players.at(-1).src;end();fireEvent.click(screen.getByRole('button',{name:first===second?'Same tone':'Different tones'}));
  expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).attempts.at(-1)).toMatchObject({skill:'tone-contrast',correct:true,independent:true});
 });
 it('renames, reorders, reloads and deletes a saved train with confirmation',()=>{
  const app=render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Build a word train'}));fireEvent.click(screen.getByRole('button',{name:'Move word 1 right'}));fireEvent.click(screen.getByRole('button',{name:'Save my train'}));fireEvent.click(screen.getByRole('button',{name:'Rename My word train'}));fireEvent.change(screen.getByLabelText('New train name'),{target:{value:'Snack express'}});fireEvent.click(screen.getByRole('button',{name:'Save name'}));
  app.unmount();render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Build a word train'}));fireEvent.click(screen.getByRole('button',{name:'Load Snack express'}));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).draft).toEqual(['w22','w21','w23']);
  fireEvent.click(screen.getByRole('button',{name:'Delete saved train Snack express'}));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).savedTrains).toHaveLength(1);fireEvent.click(screen.getByRole('button',{name:'Confirm delete'}));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).savedTrains).toHaveLength(0);
 });
 it('rebuilds two words from a mystery order without a premature score',()=>{
  vi.useFakeTimers();render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Build a word train'}));fireEvent.click(screen.getByRole('button',{name:'Remove word 3'}));fireEvent.click(screen.getByRole('button',{name:'Rebuild my train'}));fireEvent.click(screen.getByRole('button',{name:'Listen to the mystery recording'}));
  const heard=[];for(let i=0;i<2;i++){heard.push(vocabulary.find(w=>players.at(-1).src.endsWith(w.file))!);end();act(()=>vi.advanceTimersByTime(500));}
  for(const word of heard)fireEvent.click(screen.getByRole('button',{name:word.meaning}));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).attempts).toHaveLength(0);fireEvent.click(screen.getByRole('button',{name:'Check my order'}));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).attempts.at(-1)).toMatchObject({correct:true,skill:'sound-comparison'});
 });
 it('does not accrue active practice for an idle or hidden page',()=>{
  vi.useFakeTimers();const hidden=vi.spyOn(document,'hidden','get').mockReturnValue(false);render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Build a word train'}));act(()=>vi.advanceTimersByTime(60000));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).activeSeconds).toBe(0);
  fireEvent.pointerDown(screen.getByRole('button',{name:'Play my train'}));act(()=>vi.advanceTimersByTime(10000));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).activeSeconds).toBe(10);hidden.mockReturnValue(true);fireEvent(document,new Event('visibilitychange'));act(()=>vi.advanceTimersByTime(60000));expect(JSON.parse(localStorage.getItem(LEARNING_KEY)!).activeSeconds).toBe(10);
 });
});
