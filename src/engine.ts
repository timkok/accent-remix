import type {Tone} from './data';
export type Point={x:number;y:number};
export function contour(tone:Tone,x:number){return tone===1?.22:tone===2?.76-.56*x:tone===4?.2+.58*x:x<.5?.38+1.04*x:.9-1.12*(x-.5);}
export function drawingScore(points:Point[],tone:Tone):number{if(points.length<8)return 0;const ordered=points.filter((p,i)=>i===0||p.x>=points[i-1].x);if(ordered.length<points.length*.8)return 0;const min=Math.min(...points.map(p=>p.x)),max=Math.max(...points.map(p=>p.x));if(max-min<.65||points[points.length-1].x<=points[0].x)return 0;let total=0;for(let i=0;i<=20;i++){const x=.08+.84*i/20;const closest=ordered.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a);total+=Math.abs(closest.y-contour(tone,(x-.08)/.84));}return Math.max(0,Math.round(100-(total/21)*180));}
export const STORAGE_KEY='accent-remix-v1';
export type Progress={version:1;points:number;bestStreak:number;stars:number;completed:number[];seconds:number;attempts:Record<Tone,{right:number;total:number}>;recent:{date:string;text:string}[];seen:string[];review:string[];settings:{sound:boolean;microphone:boolean;difficulty:'easy'|'normal'|'challenge'}};
export const freshProgress=():Progress=>({version:1,points:0,bestStreak:0,stars:0,completed:[],seconds:0,attempts:{1:{right:0,total:0},2:{right:0,total:0},3:{right:0,total:0},4:{right:0,total:0}},recent:[],seen:[],review:[],settings:{sound:true,microphone:true,difficulty:'normal'}});
export function readProgress(storage:Pick<Storage,'getItem'>):Progress{
 try{
  const p=JSON.parse(storage.getItem(STORAGE_KEY)||'null'),d=freshProgress();
  if(p?.version!==1)return d;
  const count=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0?n:0;
  const strings=(v:unknown,n:number)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string').map(x=>x.slice(0,200)).slice(-n):[];
  return {...d,points:count(p.points),seconds:count(p.seconds),stars:count(p.stars),bestStreak:count(p.bestStreak),
   completed:Array.isArray(p.completed)?[...new Set<number>(p.completed.filter((n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<5))]:[],
   recent:Array.isArray(p.recent)?p.recent.filter((r:unknown)=>r&&typeof r==='object'&&typeof (r as {date:unknown}).date==='string'&&typeof (r as {text:unknown}).text==='string').slice(0,12).map((r:{date:string;text:string})=>({date:r.date.slice(0,40),text:r.text.slice(0,200)})):[],
   seen:strings(p.seen,200),review:strings(p.review,100),
   attempts:Object.fromEntries(([1,2,3,4] as Tone[]).map(t=>{const total=count(p.attempts?.[t]?.total);return [t,{total,right:Math.min(total,count(p.attempts?.[t]?.right))}];})) as Progress['attempts'],
   settings:{sound:typeof p.settings?.sound==='boolean'?p.settings.sound:d.settings.sound,microphone:typeof p.settings?.microphone==='boolean'?p.settings.microphone:d.settings.microphone,difficulty:['easy','normal','challenge'].includes(p.settings?.difficulty)?p.settings.difficulty:d.settings.difficulty}};
 }catch{return freshProgress();}
}
export function saveProgress(storage:Pick<Storage,'setItem'>,p:Progress){try{storage.setItem(STORAGE_KEY,JSON.stringify(p));return true;}catch{return false;}}
export function award(correct:boolean,streak:number){return correct?100+Math.min(streak,5)*20:0;}
export function recordAnswer(p:Progress,tone:Tone,correct:boolean,streak:number,id?:string):Progress{return {...p,points:p.points+award(correct,streak),bestStreak:Math.max(p.bestStreak,correct?streak+1:0),attempts:{...p.attempts,[tone]:{total:p.attempts[tone].total+1,right:p.attempts[tone].right+Number(correct)}},seen:id?[...p.seen.filter(x=>x!==id),id].slice(-50):p.seen,review:id?(correct?p.review.filter(x=>x!==id):[...new Set([...p.review,id])]):p.review};}
