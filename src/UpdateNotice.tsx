import {useEffect,useRef,useState} from 'react';
export function UpdateNotice({save,onLeave}:{save:()=>boolean;onLeave:()=>void}){
 const [ready,setReady]=useState(false),[status,setStatus]=useState(''),[updating,setUpdating]=useState(false);
 const registration=useRef<ServiceWorkerRegistration|null>(null),dispose=useRef(()=>{});
 useEffect(()=>{
  const notify=(e:Event)=>{registration.current=(e as CustomEvent<ServiceWorkerRegistration>).detail;setReady(Boolean(registration.current?.waiting));};
  window.addEventListener('game-update-ready',notify);
  return()=>{window.removeEventListener('game-update-ready',notify);dispose.current();};
 },[]);
 function update(){
  if(!save()){setStatus('Progress could not be saved. Free some browser storage, then try again. Your game stays open.');return;}
  const worker=registration.current?.waiting;
  if(!worker){setStatus('This update is no longer waiting. Reopen the game after finishing your practice.');return;}
  onLeave();setUpdating(true);setStatus('Progress saved. Loading the new adventure…');
  const changed=()=>{dispose.current();window.location.reload();};
  const timeout=setTimeout(()=>{dispose.current();setUpdating(false);setStatus('Update is taking longer than expected. Your progress is saved; try again when online.');},15000);
  dispose.current=()=>{clearTimeout(timeout);navigator.serviceWorker.removeEventListener('controllerchange',changed);};
  navigator.serviceWorker.addEventListener('controllerchange',changed);
  try{worker.postMessage({type:'ACTIVATE_UPDATE'});}catch{dispose.current();setUpdating(false);setStatus('Update could not start. Your progress is saved. Try again.');}
 }
 if(!ready)return null;
 return <div className="update-banner" role="status">{status||'A new update is ready. Finish your turn first; updating clears temporary recordings.'}<button className="btn secondary" disabled={updating} onClick={update}>{updating?'Updating…':'Save progress & update'}</button></div>;
}
