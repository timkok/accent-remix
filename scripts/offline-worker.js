// Build replaces these tokens; the cache namespace belongs to this exact app scope.
const PREFIX='accent-remix-v22:'+self.registration.scope+':';
const CACHE=PREFIX+'__BUILD_HASH__';
const FILES=__ASSET_LIST__;
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function rangeResponse(request,cached){
 const range=request.headers?.get('Range');
 if(!range)return cached;
 const match=/^bytes=(\d*)-(\d*)$/.exec(range);
 if(!match||(!match[1]&&!match[2]))return cached;
 const bytes=await cached.arrayBuffer(),size=bytes.byteLength;
 const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 const end=match[1]?(match[2]?Math.min(size-1,Number(match[2])):size-1):size-1;
 if(start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
 const headers=new Headers(cached.headers);headers.delete('Content-Encoding');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
 return new Response(bytes.slice(start,end+1),{status:206,headers});
}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith(caches.open(CACHE).then(async c=>{
  // Navigation queries must not mix new HTML from the network with an old cache.
  const cached=await c.match(e.request.mode==='navigate'?new URL('./index.html',self.registration.scope):e.request);
  if(cached)return rangeResponse(e.request,cached);
  try{return await fetch(e.request);}catch{return Response.error();}
 }));
});
