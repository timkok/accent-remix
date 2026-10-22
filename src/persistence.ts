import {freshProgress,readProgress,saveProgress,STORAGE_KEY} from './engine';
import type {Progress} from './engine';
import {freshLearning,readLearning,saveLearning,LEARNING_KEY} from './learning';
import type {Learning} from './learning';
// Read both keys before writing anything. A temporarily denied read must never
// turn into a successful write of empty progress over the child's stored history.
export function loadSession(){
 try{
  const values=new Map([STORAGE_KEY,LEARNING_KEY].map(key=>[key,localStorage.getItem(key)]));
  const snapshot={getItem:(key:string)=>values.get(key)??null};
  return {progress:readProgress(snapshot),learning:readLearning(snapshot),readFailed:false};
 }catch{return {progress:freshProgress(),learning:freshLearning(),readFailed:true};}
}
export function persistSession(progress:Progress,learning:Learning){
 try{const a=saveProgress(localStorage,progress),b=saveLearning(localStorage,learning);return a&&b;}catch{return false;}
}
