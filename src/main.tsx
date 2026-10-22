import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if('serviceWorker' in navigator && import.meta.env.PROD)window.addEventListener('load',()=>{
 navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(reg=>{
  const notify=()=>window.dispatchEvent(new CustomEvent('game-update-ready',{detail:reg}));
  if(reg.waiting)notify();
  reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)notify();});});
  void reg.update().catch(()=>{});
 }).catch(()=>{});
});
