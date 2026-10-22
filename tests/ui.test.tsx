// @vitest-environment jsdom
import React from 'react';
import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import App from '../src/App';
import {Recorder,ToneSlide} from '../src/components';
import {STORAGE_KEY,freshProgress,contour} from '../src/engine';
beforeEach(()=>{localStorage.clear();window.scrollTo=vi.fn();Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn()}});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
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
