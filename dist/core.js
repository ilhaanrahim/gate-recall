/* Pure, dependency-free progress helpers. Also loadable by node for tests. */
(function(root){
'use strict';
const DAY=86400000;
function schedule(previous,rating,now=Date.now()){
 const old=previous||{},step=Math.max(0,Number(old.interval)||0);let interval;
 if(rating==='again')return {...old,rating,interval:0,due:now+600000,reviewed:now,reviews:(old.reviews||0)+1};
 if(rating==='hard')interval=Math.max(1,Math.round(step*1.3));
 else if(rating==='good')interval=step?Math.max(3,Math.round(step*2.2)):3;
 else if(rating==='easy')interval=step?Math.max(7,Math.round(step*3)):7;
 else throw Error('Unknown rating');
 interval=Math.min(interval,365);
 return {...old,rating,interval,due:now+interval*DAY,reviewed:now,reviews:(old.reviews||0)+1};
}
function grade(raw,input,type){
 const key=String(raw??'').trim(),value=String(input??'').trim();
 if(!value||!key||/^(N\/A|X|NA|None)$/i.test(key)||type==='Descriptive')return null;
 if(/^[A-E](\s*[;,]\s*[A-E])*$/.test(key)){
  const norm=s=>[...new Set(s.toUpperCase().split(/[;,\s]+/).filter(Boolean))].sort().join(';');
  return norm(key)===norm(value);
 }
 if(type!=='NAT')return null;
 const n=Number(value);if(!Number.isFinite(n))return null;
 const ranges=key.split(';').map(s=>s.trim());
 if(!ranges.every(s=>/^[-+]?\d*\.?\d+(?:\s*:\s*[-+]?\d*\.?\d+)?$/.test(s)))return null;
 return ranges.some(s=>{const a=s.split(':').map(Number);return a.length===1?Math.abs(n-a[0])<1e-9:n>=a[0]-1e-9&&n<=a[1]+1e-9});
}
function normalizeInitials(value){
 if(typeof value!=='string')return null;
 const initials=value.trim().toUpperCase();
 return [...initials].length>=1&&[...initials].length<=3&&/^[\p{L}\p{N}]+$/u.test(initials)?initials:null;
}
// Notes are attached to questions, so group existing records without copying them.
function questionNotesBySubject(questions,questionMap,topicMap,subjects){
 const groups=new Map(subjects.map(subject=>[subject,[]]));
 for(const [id,progress] of Object.entries(questions||{})){
  if(typeof progress?.note!=='string'||!progress.note.trim())continue;
  const question=questionMap.get(id),topic=question&&topicMap.get(question.subtopicId);
  if(topic&&groups.has(topic.subject))groups.get(topic.subject).push({question,note:progress.note,updated:progress.updated||0});
 }
 return [...groups].filter(([,notes])=>notes.length).map(([subject,notes])=>({subject,notes:notes.sort((a,b)=>b.updated-a.updated)}));
}
function safeProgress(input,questionIds,cardIds){
 if(!input||input.app!=='gate-recall'||input.version!==1||!input.state)throw Error('This is not a GATE Recall backup.');
 const out={questions:{},cards:{},sessions:[],settings:{},last:null};
 for(const [field,valid] of [['questions',questionIds],['cards',cardIds]]){
  for(const [id,obj] of Object.entries(input.state[field]||{})){
   if(!valid.has(id)||!obj||typeof obj!=='object')continue;
   const o={};
   for(const k of ['due','reviewed','interval','reviews','attempted','updated'])if(Number.isFinite(obj[k])&&obj[k]>=0)o[k]=obj[k];
   for(const k of ['note','draft','answer'])if(typeof obj[k]==='string')o[k]=obj[k].slice(0,k==='note'?10000:1000);
   if(['again','hard','good','easy'].includes(obj.rating))o.rating=obj.rating;
   if(['correct','wrong','attempted','unseen'].includes(obj.result))o.result=obj.result;
   if(typeof obj.star==='boolean')o.star=obj.star;
   if(typeof obj.flag==='boolean')o.flag=obj.flag;
   out[field][id]=o;
  }
 }
 if(Array.isArray(input.state.sessions))out.sessions=input.state.sessions.filter(s=>s&&typeof s.date==='string'&&/^\d{4}-\d\d-\d\d$/.test(s.date)&&Number.isFinite(s.count)).map(s=>({date:s.date,count:Math.max(0,Math.min(100000,s.count))})).slice(-1000);
 if(typeof input.state.last==='string'&&cardIds.has(input.state.last))out.last=input.state.last;
 if(typeof input.state.settings?.hideRecent==='boolean')out.settings.hideRecent=input.state.settings.hideRecent;
 const initials=normalizeInitials(input.state.settings?.initials);
 if(initials){out.settings.initials=initials;if(Number.isFinite(input.state.settings.initialsUpdated)&&input.state.settings.initialsUpdated>=0)out.settings.initialsUpdated=input.state.settings.initialsUpdated;}
 return out;
}
const api={schedule,grade,normalizeInitials,questionNotesBySubject,safeProgress,DAY};if(typeof module!=='undefined')module.exports=api;root.GateCore=api;
})(typeof window!=='undefined'?window:globalThis);
