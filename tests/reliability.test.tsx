// @vitest-environment jsdom
import React from 'react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {playAudioSequence,stopAudio} from '../src/audio';
import type {AudioRecovery} from '../src/audio';
import {Recorder} from '../src/Recorder';
import {UpdateNotice} from '../src/UpdateNotice';
import {readProgress,freshProgress,STORAGE_KEY} from '../src/engine';
import {readLearning,freshLearning,LEARNING_KEY} from '../src/learning';
import {loadSession,persistSession} from '../src/persistence';
import App from '../src/App';
const players:any[]=[];
class Player{
 src='';currentTime=0;playbackRate=1;onended:any;onerror:any;ontimeupdate:any;onplaying:any;
 play=vi.fn().mockResolvedValue(undefined);pause=vi.fn();
 constructor(){players.push(this);}
}
beforeEach(()=>{localStorage.clear();players.length=0;window.scrollTo=vi.fn();vi.stubGlobal('Audio',Player);});
afterEach(()=>{cleanup();stopAudio();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
describe('recoverable media sequences',()=>{
 it('resumes the blocked second clip at the same position and completes exactly once',async()=>{
  vi.useFakeTimers();let pending:AudioRecovery|null=null;const handler=(e:Event)=>{pending=(e as CustomEvent).detail;};window.addEventListener('audio-recovery',handler);
  const finish=vi.fn(),step=vi.fn();playAudioSequence(['one.mp3','two.mp3'],{onFinish:finish,onStep:step,gapMs:500});
  const player=players[0];player.play.mockRejectedValueOnce(new DOMException('gesture','NotAllowedError'));
  player.onended();await vi.advanceTimersByTimeAsync(500);
  expect(finish).not.toHaveBeenCalled();expect(player.src).toContain('two.mp3');expect(pending).not.toBeNull();
  const before=player.src;(pending as unknown as AudioRecovery).resume();expect(player.src).toBe(before);player.onended();
  expect(finish).toHaveBeenCalledExactlyOnceWith('complete');expect(step.mock.calls).toEqual([[0],[1]]);expect(pending).toBeNull();window.removeEventListener('audio-recovery',handler);
 });
 it('makes stalled playback resumable without counting it complete; stop invalidates a stale resume',async()=>{
  vi.useFakeTimers();let pending:AudioRecovery|null=null;const handler=(e:Event)=>{pending=(e as CustomEvent).detail;};window.addEventListener('audio-recovery',handler);
  const finish=vi.fn();playAudioSequence(['one.mp3','two.mp3'],{onFinish:finish});const player=players[0];player.currentTime=.4;
  await vi.advanceTimersByTimeAsync(12000);expect(pending).not.toBeNull();expect(finish).not.toHaveBeenCalled();const resume=(pending as unknown as AudioRecovery).resume;
  stopAudio();resume();expect(player.play).toHaveBeenCalledTimes(1);expect(finish).toHaveBeenCalledExactlyOnceWith('cancelled');expect(pending).toBeNull();window.removeEventListener('audio-recovery',handler);
 });
 it('clears queued clips on page hide and ignores late ended callbacks',()=>{
  vi.useFakeTimers();const finish=vi.fn();playAudioSequence(['one.mp3','two.mp3'],{onFinish:finish,gapMs:2200});const player=players[0],ended=player.onended;
  ended();vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));vi.advanceTimersByTime(3000);ended();expect(player.play).toHaveBeenCalledTimes(1);expect(finish).toHaveBeenCalledExactlyOnceWith('cancelled');
 });
 it('exposes recovery in the game and does not unlock listening answers before completion',async()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Echo’s Listening Detective'}));fireEvent.click(screen.getByRole('button',{name:'Which tone?'}));
  vi.stubGlobal('Audio',class extends Player{constructor(){super();this.play.mockRejectedValueOnce(new DOMException('gesture','NotAllowedError'));}});
  fireEvent.click(screen.getByRole('button',{name:'Play mystery sound'}));
  const resume=await screen.findByRole('button',{name:'Tap to continue audio'});
  expect([...document.querySelectorAll<HTMLButtonElement>('.answer-grid button')].every(b=>b.disabled)).toBe(true);
  fireEvent.click(resume);expect([...document.querySelectorAll<HTMLButtonElement>('.answer-grid button')].every(b=>b.disabled)).toBe(true);
  act(()=>players.at(-1).onended());expect([...document.querySelectorAll<HTMLButtonElement>('.answer-grid button')].some(b=>!b.disabled)).toBe(true);

 });
});
function setupRecording(empty=false){
 const track=new EventTarget() as EventTarget&{stop:ReturnType<typeof vi.fn>};track.stop=vi.fn();const recorders:any[]=[];
 Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:vi.fn().mockResolvedValue({getTracks:()=>[track]})}});
 vi.stubGlobal('MediaRecorder',class{
  static isTypeSupported(type:string){return type==='audio/mp4';}
  state='inactive';mimeType='audio/mp4';ondataavailable:any;onstop:any;onerror:any;
  constructor(_s:any,public options?:{mimeType:string}){recorders.push(this);}
  start(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(empty?[]:['voice'],{type:this.mimeType})});this.onstop?.();}
 });
 Object.defineProperty(URL,'createObjectURL',{configurable:true,value:vi.fn(()=> 'blob:voice')});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:vi.fn()});
 return {track,recorders};
}
async function startRecording(){fireEvent.click(screen.getByRole('button',{name:'Start recording'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Stop recording'})).toBeTruthy());}
describe('mobile recorder cleanup',()=>{
 it('chooses supported MP4, requests permission only on click and discards an old example clip',async()=>{
  const {track,recorders}=setupRecording();const app=render(<Recorder enabled sound exampleFiles={['first.mp3']}/>);expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();await startRecording();expect(recorders[0].options.mimeType).toBe('audio/mp4');fireEvent.click(screen.getByRole('button',{name:'Stop recording'}));expect(track.stop).toHaveBeenCalled();
  app.rerender(<Recorder enabled sound exampleFiles={['second.mp3']}/>);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:voice');expect(screen.queryByRole('button',{name:'Listen to my voice'})).toBeNull();
 });
 it('rejects empty recordings without recording participation',async()=>{
  setupRecording(true);const practice=vi.fn();window.addEventListener('speaking-practice',practice);render(<Recorder enabled sound/>);await startRecording();fireEvent.click(screen.getByRole('button',{name:'Stop recording'}));expect(screen.getByText('No sound was captured. Try again.')).toBeTruthy();expect(practice).not.toHaveBeenCalled();expect(URL.createObjectURL).not.toHaveBeenCalled();window.removeEventListener('speaking-practice',practice);
 });
 it.each(['hide','disconnect'] as const)('releases the microphone and timers on %s',async cause=>{
  const {track}=setupRecording();render(<Recorder enabled sound/>);await startRecording();vi.useFakeTimers();
  act(()=>{if(cause==='hide'){vi.spyOn(document,'hidden','get').mockReturnValue(true);document.dispatchEvent(new Event('visibilitychange'));}else track.dispatchEvent(new Event('ended'));});
  expect(track.stop).toHaveBeenCalled();expect(screen.queryByRole('button',{name:'Stop recording'})).toBeNull();act(()=>vi.advanceTimersByTime(20000));expect(URL.createObjectURL).not.toHaveBeenCalled();
 });
 it('cancels a pending permission request and releases a late stream',async()=>{
  const {track}=setupRecording();let resolve!:(s:any)=>void;vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(()=>new Promise(r=>{resolve=r;}));render(<Recorder enabled sound/>);fireEvent.click(screen.getByRole('button',{name:'Start recording'}));fireEvent.click(screen.getByRole('button',{name:'Cancel microphone request'}));await act(async()=>resolve({getTracks:()=>[track]}));expect(track.stop).toHaveBeenCalled();expect(screen.queryByRole('button',{name:'Stop recording'})).toBeNull();
 });
 it('explains unavailable microphones without requesting a fake score',async()=>{
  setupRecording();vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new DOMException('absent','NotFoundError'));render(<Recorder enabled sound/>);fireEvent.click(screen.getByRole('button',{name:'Start recording'}));await screen.findByText('No microphone is available. Keep playing out loud!');
 });
});
describe('safe storage and explicit updates',()=>{
 it('preserves old settings, rewards, review and saved trains through serialization',()=>{
  const p={...freshProgress(),points:432,completed:[0,1],stars:3,review:['li2'],settings:{sound:false,microphone:false,difficulty:'easy' as const}};
  const l={...freshLearning(),savedTrains:[{id:'train',title:'Food',words:['w21','w22'],updatedAt:'2026-10-22'}]};expect(persistSession(p,l)).toBe(true);expect(loadSession()).toEqual({progress:p,learning:l,readFailed:false});
 });
 it('sanitizes corrupt legacy values without crashing the parent dashboard',()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,stars:{bad:1},bestStreak:'bad',recent:[null,{date:{bad:1},text:[]},'bad'],completed:[1,1,'2'],settings:{sound:'false',microphone:[]},attempts:{1:{total:'2',right:'1'}}}));
  const p=readProgress(localStorage);expect(p.stars).toBe(0);expect(p.completed).toEqual([1]);expect(p.recent).toEqual([]);expect(p.settings.sound).toBe(true);expect(p.attempts[1]).toEqual({total:0,right:0});render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Parent Base'}));expect(screen.getByRole('heading',{name:'Parent Base.'})).toBeTruthy();
 });
 it('handles malformed JSON and learning-store migration',()=>{
  localStorage.setItem(STORAGE_KEY,'{');localStorage.setItem(LEARNING_KEY,'{');expect(readProgress(localStorage)).toEqual(freshProgress());expect(readLearning(localStorage)).toEqual(freshLearning());
  localStorage.setItem(LEARNING_KEY,JSON.stringify({...freshLearning(),version:1,draft:['w22','invalid']}));expect(readLearning(localStorage).draft).toEqual(['w22']);
 });
 it('never overwrites unreadable history and restores it when reading is allowed again',()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...freshProgress(),points:777}));const getter=vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new DOMException('denied','SecurityError');});const writer=vi.spyOn(Storage.prototype,'setItem');render(<App/>);expect(writer).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Reload saved progress'})).toBeTruthy();getter.mockRestore();fireEvent.click(screen.getByRole('button',{name:'Reload saved progress'}));expect(screen.getByText('777')).toBeTruthy();
 });
 it('reports quota errors and retries without discarding in-memory progress',()=>{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...freshProgress(),points:123}));const write=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('full','QuotaExceededError');});render(<App/>);expect(screen.getByRole('button',{name:'Retry saving'})).toBeTruthy();write.mockRestore();fireEvent.click(screen.getByRole('button',{name:'Retry saving'}));expect(screen.queryByRole('button',{name:'Retry saving'})).toBeNull();expect(readProgress(localStorage).points).toBe(123);
 });
 it('activates an update only after explicit click and successful saving',()=>{
  const sw=new EventTarget();Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:sw});const save=vi.fn().mockReturnValue(false),leave=vi.fn(),postMessage=vi.fn();render(<UpdateNotice save={save} onLeave={leave}/>);
  act(()=>window.dispatchEvent(new CustomEvent('game-update-ready',{detail:{waiting:{postMessage}}})));expect(postMessage).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Save progress & update'}));expect(postMessage).not.toHaveBeenCalled();expect(leave).not.toHaveBeenCalled();expect(screen.getByText(/Progress could not be saved/)).toBeTruthy();
  save.mockReturnValue(true);fireEvent.click(screen.getByRole('button',{name:'Save progress & update'}));expect(leave).toHaveBeenCalledOnce();expect(postMessage).toHaveBeenCalledExactlyOnceWith({type:'ACTIVATE_UPDATE'});
 });
});
