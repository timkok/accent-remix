// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
// Tests the generated worker against an in-memory Cache API and failed network.
// Run npm run build first locally. In CI this suite skips until a build exists.
describe.skipIf(!existsSync('dist/sw.js'))('production offline worker',()=>{
 it('precaches assets, serves offline app navigation, and keeps foreign caches',async()=>{
 const handlers={};const store=new Map();let deleted=[];let claimed=false;
 const cache={addAll:async(urls)=>{for(const u of urls){expect(existsSync('dist/'+u.slice(2))).toBe(true);store.set(new URL(u,'https://example.com/game/').href,{url:u});}},match:async(req)=>store.get(typeof req==='string'?req:req.url||req.href)};
 const caches={open:async()=>cache,keys:async()=>['unrelated-cache','accent-remix-old'],delete:async(k)=>{deleted.push(k);return true;}};
 runInNewContext(readFileSync('dist/sw.js','utf8'),{self:{location:{origin:'https://example.com'},registration:{scope:'https://example.com/game/'},clients:{claim:()=>{claimed=true;}},addEventListener:(n,f)=>{handlers[n]=f;}},caches,URL,Response,fetch:async()=>{throw Error('offline');}});
 let pending=Promise.resolve();handlers.install({waitUntil:(p)=>{pending=p;}});await pending;
 expect(store.size).toBeGreaterThan(3);
 const manifest=JSON.parse(readFileSync('public/mandarin-audio.json','utf8'));
 expect(Object.keys(manifest.clips)).toHaveLength(38);
 const wholeWords=JSON.parse(readFileSync('public/word-audio.json','utf8')).words;expect(wholeWords).toHaveLength(48);expect(new Set(wholeWords.map(w=>w.id)).size).toBe(48);
 for(const clip of [...Object.values(manifest.clips),...wholeWords]){expect(createHash('sha256').update(readFileSync('dist/'+clip.file)).digest('hex')).toBe(clip.sha256);handlers.fetch({request:{method:'GET',url:'https://example.com/game/'+clip.file,mode:'cors'},respondWith:(p)=>{pending=p;}});expect(await pending).toEqual({url:'./'+clip.file});}
handlers.activate({waitUntil:(p)=>{pending=p;}});await pending;expect(deleted).toEqual(['accent-remix-old']);expect(claimed).toBe(true);
 handlers.fetch({request:{method:'GET',url:'https://example.com/game/',mode:'navigate'},respondWith:(p)=>{pending=p;}});expect(await pending).toEqual({url:'./index.html'});
 });
});
