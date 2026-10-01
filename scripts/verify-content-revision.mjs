import {chromium} from 'playwright';
import fs from 'node:fs/promises';
await fs.mkdir('docs/audit-homepage/revised',{recursive:true});
const b=await chromium.launch({channel:'msedge',headless:true});
const results=[];
for(const width of [1440,768,390]) {
 const p=await b.newPage({viewport:{width,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await p.evaluate(async()=>{for(const i of document.images)i.loading='eager';await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));document.getAnimations().forEach(a=>{a.pause();a.currentTime=0;})});
 await p.screenshot({path:`docs/audit-homepage/revised/home-${width}.png`,fullPage:true});
 const text=await p.locator('body').innerText();await fs.writeFile('docs/audit-homepage/revised/current-text.txt',text);
 const forbidden=/400 milliseconds|0\.0025|48,000|800\+|1,000\+|Live data|of millions|regulatory compliance|thousands of nodes|Net carbon impact|full 5G|Hackathons|Energy Efficient/;
 if(forbidden.test(text)) throw new Error('Unreviewed claim remains');
 const state=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length}));
 if(state.width!==state.scrollWidth||state.brokenImages||errors.length)throw new Error(JSON.stringify({state,errors}));
 results.push({...state,errors,claimsRemoved:true});await p.close();
}
await fs.writeFile('docs/audit-homepage/revised/checks.json',JSON.stringify(results,null,2));console.log(results);await b.close();
