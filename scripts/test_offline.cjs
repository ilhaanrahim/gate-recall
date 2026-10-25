'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const origin='https://example.test',base=origin+'/gate-recall/';
const handlers={},stores=new Map();let online=true;
const urlOf=x=>new URL(typeof x==='string'?x:x.url||x.href,base).href;
const cache={
 async open(name){if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {
  async addAll(paths){for(const path of paths)m.set(urlOf(path),new Response(path,{status:200}));},
  async match(req){return m.get(urlOf(req))?.clone();},
  async put(req,res){m.set(urlOf(req),res.clone());}
 };}
};
const context={self:{location:{origin,href:base+'sw.js'},addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:cache,URL,Request,Response,fetch:async req=>{if(!online)throw Error('offline');return new Response('network:'+urlOf(req));}};
vm.runInNewContext(fs.readFileSync(require.resolve('../dist/sw.js'),'utf8'),context);
function life(name){let result;handlers[name]({waitUntil:p=>result=p});return result;}
function get(path,headers={}){let result;handlers.fetch({request:new Request(new URL(path,base),{headers}),respondWith:p=>result=p});return result;}
(async()=>{
 await life('install');await life('activate');
 let r=await get('index.html');assert.match(await r.text(),/^network:/);
 const media=await cache.open('gate-recall-assets-v1');
 await media.put(base+'questions/test.webp',new Response('image bytes'));
 await media.put(base+'books/test.pdf',new Response('0123456789',{headers:{'Content-Type':'application/pdf'}}));
 online=false;
 r=await get('index.html');assert.equal(r.status,200);assert.match(await r.text(),/^network:/);
 r=await get('data/catalog.js');assert.equal(r.status,200);
 r=await get('questions/test.webp');assert.equal(await r.text(),'image bytes');
 r=await get('books/test.pdf',{Range:'bytes=2-5'});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),'bytes 2-5/10');assert.equal(await r.text(),'2345');
 r=await get('books/test.pdf',{Range:'bytes=8-'});assert.equal(r.status,206);assert.equal(await r.text(),'89');
 r=await get('books/test.pdf',{Range:'bytes=20-30'});assert.equal(r.status,416);
 r=await get('questions/not-downloaded.webp');assert.equal(r.status,503);
 assert.equal(await get('https://external.test/reference'),undefined);
 console.log('Offline checks passed: app shell, catalogue, images, PDF byte ranges, missing files and origin isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
