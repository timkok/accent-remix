import{execFileSync}from'node:child_process';
import{readdir,readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
async function walk(dir){let all=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())all.push(...await walk(p));else if(f.name!=='sw.js')all.push(p);}return all;}
// Download the original licensed sound set at build time, never from the child's browser.
// Pin both archive and individual MP3 hashes; a changed source fails the build.
const audio=JSON.parse(await readFile('public/mandarin-audio.json','utf8'));
execFileSync('python3',['-c',`
import hashlib,io,json,pathlib,tempfile,urllib.request,zipfile
m=json.loads(pathlib.Path('public/mandarin-audio.json').read_text())
cache=pathlib.Path(tempfile.gettempdir())/'accent-remix-audio';cache.mkdir(exist_ok=True)
archive=cache/(m['archiveSha256']+'.zip')
if not archive.exists():
    req=urllib.request.Request(m['archive'],headers={'User-Agent':'AccentRemix-EducationalAudio/1.0'})
    with urllib.request.urlopen(req,timeout=90) as response:data=response.read()
    assert hashlib.sha256(data).hexdigest()==m['archiveSha256'],'Audio archive checksum changed'
    archive.write_bytes(data)
data=archive.read_bytes()
assert hashlib.sha256(data).hexdigest()==m['archiveSha256'],'Cached audio archive checksum mismatch'
with zipfile.ZipFile(io.BytesIO(data)) as z:
    for key,clip in m['clips'].items():
        data=z.read(key+'.mp3')
        assert hashlib.sha256(data).hexdigest()==clip['sha256'],key+' checksum mismatch'
        out=pathlib.Path('dist')/clip['file'];out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
`],{stdio:'inherit'});
console.log('Bundled original Mandarin recordings:',Object.keys(audio.clips).length);
const files=await walk('dist');const hash=createHash('sha256');for(const f of files)hash.update(await readFile(f));const name='accent-remix-'+hash.digest('hex').slice(0,12);const urls=files.map(p=>'./'+p.slice(5));
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(name)};const FILES=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('accent-remix-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request);if(cached)return cached;try{return await fetch(e.request)}catch(err){if(e.request.mode==='navigate')return(await c.match(new URL('./index.html',self.registration.scope)))||Response.error();return Response.error();}}));});`);console.log('Offline cache built:',files.length,'assets');
