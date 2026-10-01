import {chromium} from 'playwright';
import fs from 'node:fs';
import crypto from 'node:crypto';
const browser=await chromium.launch({channel:'msedge',headless:true});
const routes=JSON.parse(fs.readFileSync('src/content/whitepaper/manifest.json','utf8')).map(d=>d.route);
const queue=['en','tc'].flatMap(lang=>routes.map(route=>({lang,route})));
const checks=[];
await Promise.all(Array.from({length:4},async()=>{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 while(queue.length){
  const item=queue.shift(),errors=[];const listen=e=>errors.push(e.message);page.on('pageerror',listen);
  const pathname=(item.lang==='tc'?'/tc':'')+item.route;
  const res=await page.goto('http://127.0.0.1:4173'+pathname,{waitUntil:'networkidle',timeout:45000});
  const data=await page.locator('article').evaluate(el=>({text:el.textContent,ids:[...el.querySelectorAll('[id]')].map(e=>e.id),links:[...el.querySelectorAll('a[href]')].map(e=>e.getAttribute('href')),heading:el.querySelector('h1').textContent}));
  const views=[];
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   views.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)});
  }
  const tocBad=await page.locator('.wp-toc a[href^="#"],.wp-mobile-toc a[href^="#"]').evaluateAll(links=>links.map(a=>a.hash.slice(1)).filter(id=>!document.getElementById(decodeURIComponent(id))));
  checks.push({...item,pathname,status:res.status(),...data,views,tocBad,errors});page.off('pageerror',listen);
 }
 await page.close();
}));
const map=new Map(checks.map(r=>[r.pathname,r]));
const issues=[];
for(const r of checks){
 if(r.status!==200||r.errors.length||r.views.some(v=>v.overflow)||r.tocBad.length||new Set(r.ids).size!==r.ids.length)issues.push({route:r.pathname,reason:'structural',status:r.status,errors:r.errors,views:r.views,tocBad:r.tocBad});
 for(const href of r.links){if(!href.startsWith('/')&&!href.startsWith('#'))continue;const u=new URL(href,'http://127.0.0.1:4173'+r.pathname);const target=map.get(u.pathname);if(target&&u.hash&&!target.ids.includes(decodeURIComponent(u.hash.slice(1))))issues.push({route:r.pathname,reason:'anchor',href});}
 if(/M Hash Layer2 PoW|不受惡意軟件攻擊|will not be lower than|MAGICAL_SEPOLIA_RPC_URL|4\.4\.1 0）/.test(r.text))issues.push({route:r.pathname,reason:'regressed-copy'});
}
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://127.0.0.1:4173/tc/learning/tokenomics');
await page.locator('input[type="search"]').fill('尚未轉帳');
await page.locator('.wp-search-results a').first().waitFor();
const searchHits=await page.locator('.wp-search-results a').count();
for(const [route,hash,name]of [['/learning/tokenomics','allocation-8','sale'],['/learning/milestone','mag1-delivery','delivery'],['/learning/incentives','section-5','commission'],['/developers/build-app','section-1','tutorial']]){
 await page.goto('http://127.0.0.1:4173/tc'+route+'#'+hash,{waitUntil:'networkidle'});
 await page.locator('#'+hash).scrollIntoViewIfNeeded();
 await page.screenshot({path:`docs/full-text-revision-20261002/${name}-desktop.png`});
 await page.setViewportSize({width:390,height:844});await page.locator('#'+hash).scrollIntoViewIfNeeded();
 await page.screenshot({path:`docs/full-text-revision-20261002/${name}-mobile.png`});await page.setViewportSize({width:1440,height:1000});
}
const downloads=[];
for(const name of ['contracts','app']){const res=await page.request.get('http://127.0.0.1:4173/whitepaper/examples/'+name+'.zip');downloads.push({name,status:res.status(),bytes:(await res.body()).length});if(res.status()!==200)issues.push({reason:'download',name});}
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const preserved=['gen1-model.ts','gen1-incentive-model.ts','Gen1Calculator.tsx','Gen1IncentiveCalculator.tsx'].map(file=>({file,unchanged:hash('src/components/whitepaper/'+file)===hash('docs/full-text-revision-20261002/before/src/components/whitepaper/'+file)}));
if(preserved.some(p=>!p.unchanged))issues.push({reason:'unexpected-calculator-change'});
const summary={pages:checks.length,viewportChecks:checks.length*2,issues,searchHits,downloads,preserved};
fs.writeFileSync('docs/full-text-revision-20261002/site-checks.json',JSON.stringify({summary,checks},null,2));
await browser.close();console.log(JSON.stringify(summary,null,2));if(issues.length)process.exitCode=1;
