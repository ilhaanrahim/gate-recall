'use strict';
const CORE='gate-recall-core-v1',ASSETS='gate-recall-assets-v1';
const CORE_FILES=['./','./index.html','./style.css','./app.js','./core.js','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','./data/catalog.js','./data/assets.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CORE).then(c=>c.addAll(CORE_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 const u=new URL(e.request.url),isMedia=/\.(webp|pdf)$/.test(u.pathname);
 if(e.request.headers.has('range')){
  e.respondWith((async()=>{const cache=await caches.open(ASSETS),full=await cache.match(new Request(e.request.url));if(!full)return fetch(e.request);const buffer=await full.arrayBuffer(),m=/bytes=(\d+)-(\d*)/.exec(e.request.headers.get('range'));if(!m)return full;const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),buffer.byteLength-1):buffer.byteLength-1;if(start> end||start>=buffer.byteLength)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${buffer.byteLength}`}});return new Response(buffer.slice(start,end+1),{status:206,headers:{'Content-Type':full.headers.get('Content-Type')||'application/pdf','Content-Range':`bytes ${start}-${end}/${buffer.byteLength}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});})());return;
 }
 e.respondWith((async()=>{
  const cache=await caches.open(isMedia?ASSETS:CORE),old=await cache.match(e.request);
  if(isMedia&&old)return old;
  try{const res=await fetch(e.request);if(res.ok&&!res.redirected)await cache.put(e.request,res.clone());return res;}catch(error){if(old)return old;if(e.request.mode==='navigate')return (await cache.match(new URL('./index.html',self.location.href)))||new Response('Open GATE Recall once online to prepare offline mode.',{status:503});return new Response('This file has not been downloaded for offline use.',{status:503});}
 })());
});
