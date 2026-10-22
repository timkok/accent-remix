import {describe,it,expect} from 'vitest';
import {freshLearning,readLearning,saveLearning,recordAttempt,makeWordRound,wordChoices,skillSummary,localDay,saveTrain,recordSpeaking,completeDaily,LEARNING_KEY,vocabulary} from '../src/learning';
import type {Evidence} from '../src/learning';
import {makeChallenges} from '../src/WordQuiz';
const evidence=(overrides:Partial<Evidence>={}):Evidence=>({question:'word-word-w21',skill:'word-listening',expected:'w21',response:'w21',hint:false,audioAvailable:true,audioPlayed:true,wordId:'w21',...overrides});
const at=(day:string)=>new Date(day+'T12:00:00');
describe('learning evidence and safe local persistence',()=>{
 it('counts only completed, unhinted first-choice audio as independent',()=>{
  let p=freshLearning();for(const e of [evidence(),evidence({hint:true}),evidence({audioPlayed:false}),evidence({audioAvailable:false}),evidence({response:'w22'})])p=recordAttempt(p,e,at('2026-10-21'));
  expect(skillSummary(p,'word-listening')).toMatchObject({total:2,correct:1,assisted:3,accuracy:50});
  expect(p.attempts[1]).toMatchObject({expected:'w21',response:'w21',hint:true,independent:false,review:'soon'});
 });
 it('keeps visual questions, reading and Mandarin tone evidence separate',()=>{
  let p=freshLearning();p=recordAttempt(p,evidence({skill:'pitch-visual',audioPlayed:false,wordId:undefined}));p=recordAttempt(p,evidence({skill:'pinyin-marks',wordId:undefined}));p=recordAttempt(p,evidence({skill:'tone-listening',tone:2,wordId:undefined}));
  expect(skillSummary(p,'word-listening').total).toBe(0);expect(skillSummary(p,'tone-listening',2).total).toBe(1);expect(skillSummary(p,'pitch-visual').total).toBe(1);expect(Object.keys(p.stats)).toHaveLength(0);
 });
 it('reviews misses sooner, avoids same-day interval inflation, and prioritizes due words',()=>{
  let p=recordAttempt(freshLearning(),evidence(),at('2026-10-21'));
  for(let i=0;i<10;i++)p=recordAttempt(p,evidence(),at('2026-10-21'));
  expect(p.stats.w21.dueDate).toBe('2026-10-22');
  p=recordAttempt(p,evidence(),at('2026-10-22'));expect(p.stats.w21.dueDate).toBe('2026-10-24');
  p=recordAttempt(p,evidence({response:'w22'}),at('2026-10-22'));expect(p.stats.w21.dueDate).toBe('2026-10-22');
  const round=makeWordRound(p,5,vocabulary,'2026-10-22',()=>.3);expect(round[0].id).toBe('w21');expect(new Set(round.map(w=>w.id)).size).toBe(5);
 });
 it('uses local calendar days rather than UTC boundaries',()=>{const d=new Date(2026,9,21,23,59);expect(localDay(d)).toBe('2026-10-21');});
 it('sanitizes corrupt data and migrates V1 aggregates without inventing assessment events',()=>{
  const raw={version:1,draft:[],stats:{w21:{unassistedTotal:3,unassistedCorrect:99,intervalDays:99,dueDate:'2026-99-99'},unknown:{}},savedTrains:[{id:'x',title:'Food',words:['w21','unknown']},{id:'x',title:'Duplicate',words:['w22']}],attempts:[]};
  const p=readLearning({getItem:()=>JSON.stringify(raw)});expect(p.version).toBe(2);expect(p.draft).toEqual([]);expect(p.stats.w21.unassistedCorrect).toBe(3);expect(p.stats.w21.dueDate).toBe('');expect(p.savedTrains).toHaveLength(1);expect(p.attempts).toHaveLength(0);
  expect(readLearning({getItem:()=>'{bad'})).toEqual(freshLearning());expect(saveLearning({setItem:()=>{throw Error('quota');}},p)).toBe(false);
 });
 it('recomputes independent flags and rejects unknown event categories on read',()=>{
  const p=recordAttempt(freshLearning(),evidence({hint:true}));p.attempts[0].independent=true;
  const restored=readLearning({getItem:()=>JSON.stringify({...p,attempts:[...p.attempts,{skill:'bogus'}]})});expect(restored.attempts).toHaveLength(1);expect(restored.attempts[0].independent).toBe(false);
 });
 it('persists trains, replaces by name, bounds capacity without silently evicting favorites',()=>{
  let p=saveTrain(freshLearning(),'Snacks',['w21','w22']);p=saveTrain(p,'snacks',['w23']);expect(p.savedTrains).toHaveLength(1);expect(p.savedTrains[0].words).toEqual(['w23']);
  for(let i=0;i<15;i++)p=saveTrain(p,'train'+i,['w21']);expect(p.savedTrains).toHaveLength(12);expect(p.savedTrains[0].title).toBe('snacks');
  let serialized='';expect(saveLearning({setItem:(k,v)=>{expect(k).toBe(LEARNING_KEY);serialized=v;}},p)).toBe(true);expect(readLearning({getItem:()=>serialized}).savedTrains).toEqual(p.savedTrains);expect(serialized).not.toContain('blob:');
 });
 it('has four unique meaning answers without the happy/glad ambiguity',()=>{for(const word of vocabulary){const choices=wordChoices(word);expect(choices).toHaveLength(4);expect(new Set(choices.map(w=>w.meaning)).size).toBe(4);expect(choices.filter(w=>w.id===word.id)).toHaveLength(1);if(['happy','glad'].includes(word.meaning))expect(choices.filter(w=>['happy','glad'].includes(w.meaning))).toHaveLength(1);}});
 it('creates varied train challenges from its targets, never a natural sentence',()=>{const pool=vocabulary.slice(20,26);const round=makeChallenges(freshLearning(),pool,6);expect(round.map(q=>q.kind)).toEqual(['word','same','word','order','match','word']);for(const q of round){expect(pool).toContain(q.target);expect(q.options.some(o=>o.id===q.answer)||q.kind==='order').toBe(true);}expect(new Set(round[3].answer.split(',')).size).toBe(3);});
 it('tracks speaking participation and daily completions without inventing mastery',()=>{let p=freshLearning();p=recordSpeaking(p,'2026-10-21');p=completeDaily(p,'2026-10-21');expect(p.speaking[0].count).toBe(1);expect(p.daily[0].completed).toBe(1);expect(p.stats).toEqual({});expect(p.attempts).toHaveLength(0);});
});
