import {describe,it,expect} from 'vitest';
import {pinyin,questionBank,makeRound,tones,speechCues} from '../src/data';
import {drawingScore,contour,award,freshProgress,recordAnswer,saveProgress,readProgress} from '../src/engine';
describe('curated question data',()=>{
 it('contains 136 distinct valid questions',()=>{expect(questionBank).toHaveLength(136);expect(new Set(questionBank.map(q=>q.id)).size).toBe(136);for(const q of questionBank){expect(tones).toContain(q.tone);expect(pinyin(q.base,q.tone)).not.toBe(q.base);if(q.kind==='listen'||q.kind==='direction')expect(speechCues[q.base+q.tone]).toBeTruthy();}});
 it('places all tone marks correctly',()=>{const expected:Record<string,string[]>={ma:['mā','má','mǎ','mà'],mi:['mī','mí','mǐ','mì'],li:['lī','lí','lǐ','lì'],lu:['lū','lú','lǔ','lù'],la:['lā','lá','lǎ','là'],ba:['bā','bá','bǎ','bà'],pa:['pā','pá','pǎ','pà'],da:['dā','dá','dǎ','dà'],na:['nā','ná','nǎ','nà'],tu:['tū','tú','tǔ','tù']};for(const [s,values] of Object.entries(expected))expect(tones.map(t=>pinyin(s,t))).toEqual(values);});
 it.each([['easy',5],['normal',8],['challenge',10]] as const)('makes a unique %s round of %i', (level,count)=>{for(let i=0;i<20;i++){const round=makeRound(level);expect(round).toHaveLength(count);expect(new Set(round.map(q=>q.id)).size).toBe(count);}});
 it('avoids recent questions when other options exist',()=>{const seen=makeRound('normal').map(q=>q.id);expect(makeRound('normal',seen).some(q=>seen.includes(q.id))).toBe(false);});
 it('brings back an older missed question without immediate repetition',()=>{const review=['mark-mi3'];expect(makeRound('normal',['mark-mi3','a','b','c','d'],review).some(q=>q.id==='mark-mi3')).toBe(true);expect(makeRound('normal',['a','b','mark-mi3'],review).some(q=>q.id==='mark-mi3')).toBe(false);});
});
describe('scoring and persistence',()=>{
 it('awards capped streak points only for correct answers',()=>{expect(award(false,10)).toBe(0);expect(award(true,0)).toBe(100);expect(award(true,20)).toBe(200);});
 it('tracks attempts and removes mastered review items',()=>{const p=recordAnswer(freshProgress(),2,false,0,'mark-mi2');expect(p.attempts[2]).toEqual({right:0,total:1});expect(p.review).toEqual(['mark-mi2']);const fixed=recordAnswer(p,2,true,0,'mark-mi2');expect(fixed.review).toEqual([]);expect(fixed.attempts[2]).toEqual({right:1,total:2});});
 it('round-trips progress, gracefully handles corruption and quota errors',()=>{let value='';const store={getItem:()=>value,setItem:(_:string,v:string)=>{value=v;}};const p=recordAnswer(freshProgress(),4,true,2,'mark-ma4');expect(saveProgress(store,p)).toBe(true);expect(readProgress(store)).toEqual(p);value='broken';expect(readProgress(store)).toEqual(freshProgress());expect(saveProgress({setItem:()=>{throw Error('quota');}},p)).toBe(false);});
 it.each(tones)('recognizes a good tone %i drawing and rejects reverse/tiny lines',t=>{const pts=Array.from({length:61},(_,i)=>({x:.08+.84*i/60,y:contour(t,i/60)}));expect(drawingScore(pts,t)).toBeGreaterThanOrEqual(98);expect(drawingScore([...pts].reverse(),t)).toBe(0);expect(drawingScore(pts.slice(0,8),t)).toBe(0);});
 it('distinguishes rising and falling drawings',()=>{const rising=Array.from({length:51},(_,i)=>({x:.08+.84*i/50,y:contour(2,i/50)}));expect(drawingScore(rising,4)).toBeLessThan(55);});
});
