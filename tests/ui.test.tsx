// @vitest-environment jsdom
import React from 'react';
import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,act} from '@testing-library/react';
import App from '../src/App';
import {playAudioSequence,stopAudio} from '../src/audio';
import {Recorder,ToneSlide} from '../src/components';
import {STORAGE_KEY,freshProgress,contour} from '../src/engine';
beforeEach(()=>{localStorage.clear();window.scrollTo=vi.fn();Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn()}});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
describe('playable journey',()=>{
 it('starts with English, completes remix, unlocks detective and saves progress',()=>{render(<App/>);expect(screen.queryByText('mā')).toBeNull();fireEvent.click(screen.getByRole('button',{name:/Start the challenge/}));expect(screen.getByRole('heading',{name:'Give your words a twist.'})).toBeTruthy();for(let i=0;i<3;i++){for(let j=0;j<3;j++)fireEvent.click(screen.getByRole('button',{name:/I did it!/}));fireEvent.click(screen.getByRole('button',{name:i<2?/Another word!/:/Finish my remix/}));}expect(screen.getByRole('heading',{name:'Voice Explorer'})).toBeTruthy();expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).completed).toContain(0);fireEvent.click(screen.getByRole('button',{name:'Next mission'}));expect(screen.getByRole('heading',{name:'Follow the sound trail.'})).toBeTruthy();});
 it('counts only the first detective attempt',()=>{const p=freshProgress();p.completed=[0];localStorage.setItem(STORAGE_KEY,JSON.stringify(p));render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Continue your adventure/}));fireEvent.click(screen.getByRole('button',{name:/MISSION 02/}));fireEvent.click(screen.getByRole('button',{name:'→ Level'}));fireEvent.click(screen.getByRole('button',{name:'↗ Rising'}));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).attempts[2]).toEqual({right:0,total:1});expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).points).toBe(0);});
 it('restores progress and changes parent settings',()=>{const p=freshProgress();p.completed=[0,1,2,3];p.points=900;localStorage.setItem(STORAGE_KEY,JSON.stringify(p));render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Parent Base'}));expect(screen.getAllByText('900').length).toBeGreaterThan(0);fireEvent.click(screen.getByLabelText('Allow recording button'));expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).settings.microphone).toBe(false);fireEvent.change(screen.getByLabelText('Challenge length'),{target:{value:'easy'}});expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).settings.difficulty).toBe('easy');});
 it('can finish a final quiz without a Mandarin voice',()=>{const p=freshProgress();p.completed=[0,1,2,3];p.settings.difficulty='easy';localStorage.setItem(STORAGE_KEY,JSON.stringify(p));render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Continue your adventure/}));fireEvent.click(screen.getByRole('button',{name:/MISSION 05/}));for(let i=0;i<5;i++){const answers=document.querySelectorAll('.answer-grid button');expect(answers.length).toBeGreaterThan(1);fireEvent.click(answers[0]);expect(document.querySelector('.quiz-feedback')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:i===4?'See my results':'Next clue'}));}expect(screen.getByRole('button',{name:'Play another round'})).toBeTruthy();});
});
describe('microphone privacy and errors',()=>{
 it('asks only after a click and handles permission denial',async()=>{const getUserMedia=vi.fn().mockRejectedValue(new DOMException('Denied','NotAllowedError'));Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia}});vi.stubGlobal('MediaRecorder',class {});render(<Recorder enabled sound/>);expect(getUserMedia).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Start recording'}));await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('permission was not granted'));expect(getUserMedia).toHaveBeenCalledTimes(1);});
 it('disables recording when parent has disabled it',()=>{render(<Recorder enabled={false} sound/>);expect((screen.getByRole('button',{name:'Start recording'}) as HTMLButtonElement).disabled).toBe(true);});
});

describe('Echo voice guidance',()=>{
 it('speaks after starting and advancing, replays, and respects mute',()=>{
  const speak=vi.fn();const cancel=vi.fn();
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{localService:true,lang:'en-US'}],speak,cancel,addEventListener:vi.fn(),removeEventListener:vi.fn()}});
  vi.stubGlobal('SpeechSynthesisUtterance',class {constructor(public text:string){}});
  render(<App/>);expect(speak).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:/Start the challenge/}));
  expect(speak.mock.lastCall![0].text).toContain('Say the word normally');
  expect(speak.mock.invocationCallOrder.at(-1)).toBeGreaterThan(cancel.mock.invocationCallOrder.at(-1)!);
  fireEvent.click(screen.getByRole('button',{name:'I did it!'}));
  expect(speak.mock.lastCall![0].text).toBe('Make the first sound go UP!');
  fireEvent.click(screen.getByRole('button',{name:'Hear Echo again'}));
  expect(speak.mock.lastCall![0].text).toBe('Make the first sound go UP!');
  fireEvent.click(screen.getByRole('button',{name:'Hear the everyday word'}));
  expect(speak.mock.lastCall![0].text).toBe('limit');
  fireEvent.click(screen.getByRole('button',{name:'Turn sound off'}));
  const count=speak.mock.calls.length;
  fireEvent.click(screen.getByRole('button',{name:'I did it!'}));
  expect(speak).toHaveBeenCalledTimes(count);
  expect((screen.getByRole('button',{name:'Hear Echo again'}) as HTMLButtonElement).disabled).toBe(true);
 });
 it('explains missing local speech instead of using an online voice',()=>{
  const speak=vi.fn();Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{localService:false,lang:'en-US'}],speak,cancel:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn()}});
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Start the challenge/}));
  expect(screen.getByText(/No local English voice is ready/)).toBeTruthy();expect(speak).not.toHaveBeenCalled();
 });
});

describe('recorded Mandarin pronunciation',()=>{
 it('plays the selected rising and falling syllables without a device Mandarin voice',async()=>{
  const players:{src:string;play:ReturnType<typeof vi.fn>;pause:ReturnType<typeof vi.fn>;playbackRate:number;preservesPitch:boolean}[]=[];
  vi.stubGlobal('Audio',class {play=vi.fn().mockResolvedValue(undefined);pause=vi.fn();playbackRate=1;preservesPitch=false;constructor(public src:string){players.push(this);}});
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Start the challenge/}));
  fireEvent.click(screen.getByRole('button',{name:'Hear first sound go up'}));
  await waitFor(()=>expect(screen.getByText(/Human Mandarin recording/)).toBeTruthy());
  expect(players.at(-1)!.src).toContain('/audio/mandarin/li2.mp3');
  expect(players.at(-1)!.playbackRate).toBe(.78);expect(players.at(-1)!.preservesPitch).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Fast'}));
  fireEvent.click(screen.getByRole('button',{name:'Hear second sound go down'}));
  expect(players.at(-1)!.src).toContain('/audio/mandarin/mi4.mp3');expect(players.at(-1)!.playbackRate).toBe(1);
  expect(players[0].pause).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'LULU'}));
  fireEvent.click(screen.getByRole('button',{name:'Hear first sound go up'}));
  expect(players.at(-1)!.src).toContain('/audio/mandarin/lu2.mp3');
  fireEvent.click(screen.getByRole('button',{name:'Turn sound off'}));
  expect(players.at(-1)!.pause).toHaveBeenCalled();expect((screen.getByRole('button',{name:'Hear first sound go up'}) as HTMLButtonElement).disabled).toBe(true);
 });
});

describe('connected pronunciation',()=>{
 it('plays both remix sounds in order and cancels a queued next clip on mute',()=>{
  vi.useFakeTimers();
  const players:any[]=[];vi.stubGlobal('Audio',class {src='';play=vi.fn().mockResolvedValue(undefined);pause=vi.fn();onended:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(){players.push(this);}});
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Start the challenge/}));
  fireEvent.click(screen.getByRole('button',{name:'Hear both sounds together'}));
  const player=players[0];expect(player.src).toContain('li2.mp3');
  act(()=>{player.onended();vi.advanceTimersByTime(80);});expect(player.src).toContain('mi4.mp3');expect(player.play).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button',{name:'Hear both sounds together'}));
  const second=players[1];act(()=>second.onended());
  fireEvent.click(screen.getByRole('button',{name:'Turn sound off'}));act(()=>vi.advanceTimersByTime(3000));
  expect(second.play).toHaveBeenCalledTimes(1);expect(second.pause).toHaveBeenCalled();expect(second.onended).toBeNull();
 });
 it('supports selecting whole words and a repeated train with echo gaps',()=>{
  vi.useFakeTimers();const players:any[]=[];
  vi.stubGlobal('Audio',class {src='';play=vi.fn().mockResolvedValue(undefined);pause=vi.fn();onended:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(){players.push(this);}});
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Build a word train'}));
  expect(screen.getByRole('heading',{name:'All aboard the word train.'})).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Find a word in English, Chinese or Pinyin'),{target:{value:'xiongmao'}});
  fireEvent.click(screen.getByRole('button',{name:/panda: 熊猫/}));expect(players.at(-1).src).toContain('w30.mp3');
  fireEvent.click(screen.getByRole('button',{name:'Clear train'}));fireEvent.click(screen.getByRole('button',{name:'Add to my train'}));
  fireEvent.click(screen.getByLabelText('Pause for my turn'));fireEvent.change(screen.getByLabelText('Repeat'),{target:{value:'2'}});
  fireEvent.click(screen.getByRole('button',{name:'Play my train'}));const train=players.at(-1);
  act(()=>{train.onended();vi.advanceTimersByTime(2199);});expect(train.play).toHaveBeenCalledTimes(1);
  act(()=>vi.advanceTimersByTime(1));expect(train.play).toHaveBeenCalledTimes(2);
  act(()=>train.onended());expect(screen.getByText('Your turn! Copy what you heard.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Play my train'}));const leaving=players.at(-1);fireEvent.click(screen.getByRole('button',{name:'Adventure map'}));expect(leaving.pause).toHaveBeenCalled();expect(leaving.onended).toBeNull();
 });
 it('stops a sequence on media failure and never advances to later clips',()=>{
  vi.useFakeTimers();let player:any;vi.stubGlobal('Audio',class {src='';play=vi.fn().mockResolvedValue(undefined);pause=vi.fn();onended:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(){player=this;}});
  const finish=vi.fn();playAudioSequence(['first.mp3','second.mp3'],{onFinish:finish});
  player.onerror();vi.runAllTimers();expect(player.play).toHaveBeenCalledTimes(1);expect(finish).toHaveBeenCalledWith('error');expect(player.onended).toBeNull();stopAudio();
 });
});
