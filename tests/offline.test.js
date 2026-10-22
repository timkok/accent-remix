// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
// Tests the generated worker against an in-memory Cache API and failed network.
// Build is required: never silently skip offline verification.
describe('production offline worker',()=>{
 it('precaches assets, serves offline app navigation, and keeps foreign caches',async()=>{
 const handlers={};const store=new Map();let deleted=[];let claimed=false;let activated=false;
 const cache={addAll:async(urls)=>{for(const u of urls){expect(existsSync('dist/'+u.slice(2))).toBe(true);store.set(new URL(u,'https://example.com/game/').href,{url:u});}},match:async(req)=>store.get(typeof req==='string'?req:req.url||req.href)};
 const caches={open:async()=>cache,keys:async()=>['unrelated-cache','accent-remix-old','accent-remix-v22:https://example.com/other/:old','accent-remix-v22:https://example.com/game/:old'],delete:async(k)=>{deleted.push(k);return true;}};
 runInNewContext(readFileSync('dist/sw.js','utf8'),{self:{skipWaiting:()=>{activated=true;},location:{origin:'https://example.com'},registration:{scope:'https://example.com/game/'},clients:{claim:()=>{claimed=true;}},addEventListener:(n,f)=>{handlers[n]=f;}},caches,URL,Response,fetch:async()=>{throw Error('offline');}});
 let pending=Promise.resolve();handlers.install({waitUntil:(p)=>{pending=p;}});await pending;
 expect(store.size).toBeGreaterThan(3);expect(activated).toBe(false);handlers.message({data:{type:'OTHER'}});expect(activated).toBe(false);handlers.message({data:{type:'ACTIVATE_UPDATE'}});expect(activated).toBe(true);
 const manifest=JSON.parse(readFileSync('public/mandarin-audio.json','utf8'));
 expect(Object.keys(manifest.clips)).toHaveLength(38);
 const wholeWords=JSON.parse(readFileSync('public/word-audio.json','utf8')).words;expect(wholeWords).toHaveLength(48);expect(new Set(wholeWords.map(w=>w.id)).size).toBe(48);
 for(const clip of [...Object.values(manifest.clips),...wholeWords]){expect(createHash('sha256').update(readFileSync('dist/'+clip.file)).digest('hex')).toBe(clip.sha256);handlers.fetch({request:{method:'GET',url:'https://example.com/game/'+clip.file,mode:'cors'},respondWith:(p)=>{pending=p;}});expect(await pending).toEqual({url:'./'+clip.file});}
handlers.activate({waitUntil:(p)=>{pending=p;}});await pending;expect(deleted).toEqual(['accent-remix-v22:https://example.com/game/:old']);expect(claimed).toBe(true);
 handlers.fetch({request:{method:'GET',url:'https://example.com/game/',mode:'navigate'},respondWith:(p)=>{pending=p;}});expect(await pending).toEqual({url:'./index.html'});
 });
});

describe('scoped offline updates and Safari range requests',()=>{
 it('serves byte ranges and query navigation from one release, leaving other apps alone',async()=>{
  const handlers={};const body=new Uint8Array([0,1,2,3,4,5]);const network=()=>{throw Error('network must not be used');};
  const cache={match:async req=>String(req.url||req).includes('index.html')?new Response('cached-release'):new Response(body,{headers:{'Content-Type':'audio/mpeg'}})};
  runInNewContext(readFileSync('dist/sw.js','utf8'),{self:{registration:{scope:'https://example.com/game/'},addEventListener:(n,f)=>handlers[n]=f},caches:{open:async()=>cache},URL,Response,Headers,fetch:network});
  let pending;const respondWith=p=>pending=p;
  handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://example.com/game/?version=new'},respondWith});expect(await (await pending).text()).toBe('cached-release');
  handlers.fetch({request:new Request('https://example.com/game/audio.mp3',{headers:{Range:'bytes=1-3'}}),respondWith});let result=await pending;expect(result.status).toBe(206);expect(result.headers.get('Content-Range')).toBe('bytes 1-3/6');expect([...new Uint8Array(await result.arrayBuffer())]).toEqual([1,2,3]);
  handlers.fetch({request:new Request('https://example.com/game/audio.mp3',{headers:{Range:'bytes=-2'}}),respondWith});result=await pending;expect([...new Uint8Array(await result.arrayBuffer())]).toEqual([4,5]);
  handlers.fetch({request:new Request('https://example.com/game/audio.mp3',{headers:{Range:'bytes=99-'}}),respondWith});expect((await pending).status).toBe(416);
  pending=undefined;handlers.fetch({request:new Request('https://example.com/other/'),respondWith});expect(pending).toBeUndefined();
 });
 it('does not activate a partially installed cache when an audio download fails',async()=>{
  const handlers={};let activated=false;
  runInNewContext(readFileSync('dist/sw.js','utf8'),{self:{registration:{scope:'https://example.com/game/'},skipWaiting:()=>activated=true,addEventListener:(n,f)=>handlers[n]=f},caches:{open:async()=>({addAll:async()=>{throw Error('offline during install');}})},URL,Response,Headers});
  let installation;handlers.install({waitUntil:p=>installation=p});await expect(installation).rejects.toThrow('offline during install');expect(activated).toBe(false);
 });
});
