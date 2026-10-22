import{execFileSync}from'node:child_process';
import{readdir,readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
async function walk(dir){let all=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+f.name;if(f.isDirectory())all.push(...await walk(p));else if(f.name!=='sw.js')all.push(p);}return all;}
// Download the original licensed sound set at build time, never from the child's browser.
// Pin both archive and individual MP3 hashes; a changed source fails the build.
const audio=JSON.parse(await readFile('public/mandarin-audio.json','utf8'));
execFileSync('python3',['-c',`
import hashlib,io,json,pathlib,tempfile,urllib.request,zipfile
import sys
sys.path.insert(0,'scripts')
from audio_download import download
m=json.loads(pathlib.Path('public/mandarin-audio.json').read_text())
cache=pathlib.Path(tempfile.gettempdir())/'accent-remix-audio';cache.mkdir(exist_ok=True)
archive=cache/(m['archiveSha256']+'.zip')
if not archive.exists():
    req=urllib.request.Request(m['archive'],headers={'User-Agent':'AccentRemix-EducationalAudio/1.0'})
    data=download(req,timeout=90)
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
// Whole-word recordings retain natural light syllables and within-word tone changes.
execFileSync('python3',['-c',`
import concurrent.futures,hashlib,json,pathlib,tempfile,urllib.request
import sys
sys.path.insert(0,'scripts')
from audio_download import download
m=json.loads(pathlib.Path('public/word-audio.json').read_text())
cache=pathlib.Path(tempfile.gettempdir())/'accent-remix-words';cache.mkdir(exist_ok=True)
def bundle(w):
    saved=cache/(w['sha256']+'.mp3')
    if saved.exists():data=saved.read_bytes()
    else:
        data=download(w['source'])
        assert hashlib.sha256(data).hexdigest()==w['sha256'],w['id']+' checksum mismatch'
        saved.write_bytes(data)
    assert hashlib.sha256(data).hexdigest()==w['sha256'],w['id']+' checksum mismatch'
    out=pathlib.Path('dist')/w['file'];out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(data)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(bundle,m['words']))
print('Bundled whole-word recordings:',len(m['words']))
`],{stdio:'inherit'});

const files=await walk('dist');const hash=createHash('sha256');for(const f of files)hash.update(f).update(await readFile(f));
const worker=await readFile('scripts/offline-worker.js','utf8');hash.update(worker);
const version=hash.digest('hex').slice(0,12),urls=files.map(p=>'./'+p.slice(5));
await writeFile('dist/sw.js',worker.replace('__BUILD_HASH__',version).replace('__ASSET_LIST__',JSON.stringify(urls)));
console.log('Offline cache built:',files.length,'assets');
