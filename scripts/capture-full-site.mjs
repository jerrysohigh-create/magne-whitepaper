import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root='docs/research/full-site', shots='docs/design-references/full-site';
await fs.mkdir(root,{recursive:true});await fs.mkdir(shots,{recursive:true});
const origin='https://web3.magne.ai';
const header=await fs.readFile('src/components/sites/web3-magne-ai-9982170f/root-8a5edab2/Header.tsx','utf8');
const queue=[...new Set(['/',...Array.from(header.matchAll(/https:\/\/web3\.magne\.ai([^"\s]*)/g),m=>m[1]||'/')])];
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];const seen=new Set();const assetURLs=new Set();
function key(route){return (route==='/'?'root':route.slice(1).replaceAll('/','--'))+'-'+crypto.createHash('sha256').update(route).digest('hex').slice(0,8)}
while(queue.length){
 const batch=queue.splice(0,3).filter(r=>!seen.has(r));batch.forEach(r=>seen.add(r));
 await Promise.all(batch.map(async route=>{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const k=key(route);
  page.on('response',r=>{if(/\.(css|woff2?|ttf|png|svg|webp|jpe?g|gif|mp4|pdf)(\?|$)/i.test(r.url())||r.url().includes('/_next/image?'))assetURLs.add(r.url())});
  try{
   const response=await page.goto(origin+route,{waitUntil:'networkidle',timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:900});
    const height=await page.evaluate(()=>document.documentElement.scrollHeight);
    for(let y=0;y<height;y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(60)}
    await page.evaluate(()=>{scrollTo(0,0);document.getAnimations().forEach(a=>a.pause())});
    await page.screenshot({path:`${shots}/${k}-${width}.png`,fullPage:true});
    const data=await page.evaluate(()=>({html:document.body.innerHTML,title:document.title,text:document.body.innerText,links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent,href:a.href})),controls:[...document.querySelectorAll('button,input,select,textarea,[role="tab"]')].map(e=>({tag:e.tagName,text:e.textContent,label:e.getAttribute('aria-label'),html:e.outerHTML})),stylesheets:[...document.styleSheets].map(s=>s.href).filter(Boolean),inlineStyles:[...document.querySelectorAll('style')].map(e=>e.textContent),images:[...document.images].map(e=>({src:e.currentSrc||e.src,alt:e.alt})),headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>e.textContent),bodyClass:document.body.className,overflow:document.documentElement.scrollWidth>innerWidth}));
    await fs.writeFile(`${root}/${k}-${width}.json`,JSON.stringify(data,null,2));
    data.stylesheets.forEach(u=>assetURLs.add(u));data.images.forEach(i=>assetURLs.add(i.src));
    for(const {href} of data.links){const u=new URL(href);if(u.origin===origin&&!/\.[a-z0-9]+$/i.test(u.pathname)&&!seen.has(u.pathname)&&!queue.includes(u.pathname))queue.push(u.pathname)}
    if(width===1440)results.push({route,key:k,status:response.status(),resolved:page.url(),title:data.title,headings:data.headings,controls:data.controls.map(e=>({tag:e.tag,text:e.text,label:e.label})),overflow:data.overflow});
   }
   console.log(route,response.status());
  }catch(e){results.push({route,key:k,error:e.message});console.log('ERROR',route,e.message)}finally{await page.close()}
 }));
 await fs.writeFile(`${root}/routes.json`,JSON.stringify(results,null,2));await fs.writeFile(`${root}/asset-urls.json`,JSON.stringify([...assetURLs],null,2));
 if(seen.size>120)throw Error('Unexpected route expansion; inspect before continuing');
}
await browser.close();console.log(`Captured ${results.length} routes, ${assetURLs.size} assets`);
