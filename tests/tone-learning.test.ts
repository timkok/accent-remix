import {describe,it,expect} from 'vitest';
import {makeEarRound,pairPatterns,dueQuestion} from '../src/toneLearning';
import {freshLearning,recordAttempt,readLearning,renameTrain,saveTrain,wordSummary,vocabulary} from '../src/learning';
import {audioManifest} from '../src/audio';
import type {Evidence} from '../src/learning';
const evidence:Evidence={question:'pair-w28',skill:'tone-pair-listening',expected:'2-3',response:'2-3',hint:false,audioAvailable:true,audioPlayed:true,pair:'2-3'};
describe('spoken tone evidence',()=>{
 it('keeps written 3–3 separate from heard 2–3 and light syllables distinct',()=>{
  expect(pairPatterns.find(p=>p.wordId==='w28')).toMatchObject({written:[3,3],spoken:[2,3]});
  expect(pairPatterns.find(p=>p.wordId==='w07')).toMatchObject({written:[1,0],spoken:[1,0]});
  const q=makeEarRound(freshLearning(),'pair',[1,2,3,4],true,100).find(q=>q.id==='pair-w28')!;
  expect(q.answer).toBe('2-3');expect(q.reveal).toContain('Written: 3 → 3');expect(q.reveal).toContain('Heard: 2 → 3');
  expect(q.files).toEqual([vocabulary.find(w=>w.id==='w28')!.file]);
 });
 it('uses only existing recordings and unique spoken-pattern distractors',()=>{
  const allFiles=new Set([...Object.values(audioManifest).map(v=>v.file),...vocabulary.map(w=>w.file)]);
  for(const mode of ['tone','twins','pair','baseline'] as const)for(const q of makeEarRound(freshLearning(),mode,[2,3],true,100)){
   expect(q.files.every(f=>allFiles.has(f))).toBe(true);expect(q.options.some(o=>o.id===q.answer)).toBe(true);expect(new Set(q.options.map(o=>o.id)).size).toBe(q.options.length);
   if(mode==='twins')expect(q.files[0].replace(/[1-4]\.mp3$/,'')).toBe(q.files[1].replace(/[1-4]\.mp3$/,''));
  }
 });
 it('balances all four tones in an eight-clue ear check and rotates syllables next time',()=>{
  const p=freshLearning(),round=makeEarRound(p,'baseline');expect(round).toHaveLength(8);for(const tone of [1,2,3,4])expect(round.filter(q=>q.tone===tone)).toHaveLength(2);
  for(const q of round)p.attempts=recordAttempt(p,{...evidence,question:q.id,skill:q.skill,expected:q.answer,response:q.answer,tone:q.tone}).attempts;
  expect(makeEarRound(p,'baseline').map(q=>q.id).sort()).not.toEqual(round.map(q=>q.id).sort());
 });
 it('returns missed pairs now and delays independent successes without same-day inflation',()=>{
  let p=recordAttempt(freshLearning(),{...evidence,response:'3-3'},new Date('2026-10-21T12:00:00'));expect(dueQuestion(p,'pair-w28','2026-10-21')).toBe(true);
  for(let i=0;i<10;i++)p=recordAttempt(p,evidence,new Date('2026-10-21T12:00:00'));
  expect(dueQuestion(p,'pair-w28','2026-10-21')).toBe(false);expect(dueQuestion(p,'pair-w28','2026-10-22')).toBe(true);
  const restored=readLearning({getItem:()=>JSON.stringify(p)});expect(restored.attempts.at(-1)).toMatchObject({skill:'tone-pair-listening',pair:'2-3',independent:true});
 });
 it('does not call immediate same-day repeats delayed recognition',()=>{
  let p=freshLearning();const e={...evidence,skill:'word-listening' as const,wordId:'w21',expected:'w21',response:'w21'};
  for(let i=0;i<3;i++)p=recordAttempt(p,e,new Date('2026-10-21T12:00:00'));expect(wordSummary(p).recognized).toBe(0);
  p=recordAttempt(p,e,new Date('2026-10-22T12:00:00'));expect(wordSummary(p).recognized).toBe(1);
 });
 it('renames by stable id, rejects collisions and preserves order',()=>{
  let p=saveTrain(freshLearning(),'Food',['w21','w22']);p=saveTrain(p,'Play',['w30']);const id=p.savedTrains[0].id;
  expect(renameTrain(p,id,'Play')).toBe(p);p=renameTrain(p,id,'My food');expect(p.savedTrains[0]).toMatchObject({id,title:'My food',words:['w21','w22']});
 });
});
