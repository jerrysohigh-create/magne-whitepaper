import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='docs/footer-reference/qa';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'msedge',headless:true});const c=await b.newContext();const p=await c.newPage();
const errors=[];const requests=[];const checks=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
const expected=JSON.parse(await fs.readFile('docs/footer-reference/en.json','utf8')).links.filter(l=>['GitHub','X','Telegram','YouTube','Discord'].includes(l.label));
try {
 for(const width of [320,390,768,1024,1440])for(const locale of ['en','tc']){
  await p.setViewportSize({width,height:900});const prefix=locale==='tc'?'/tc':'';
  for(const article of [false,true]){
   const route=prefix+(article?'/learning/tokenomics':'/');const r=await p.goto('http://127.0.0.1:4173'+route,{waitUntil:'networkidle'});assert.equal(r.status(),200);
   const footer=p.locator('#site-footer');await footer.scrollIntoViewIfNeeded();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' '+width);
   for(const link of expected){const a=footer.getByRole('link',{name:link.label,exact:true});assert.equal(await a.getAttribute('href'),link.href);assert(await a.isVisible());assert.equal(await a.getAttribute('target'),'_blank');}
   assert((await footer.innerText()).includes('© 2026 MAGNE.AI'));
   assert.equal(await footer.getByRole('link',{name:locale==='tc'?'隱私政策':'Privacy Policy',exact:true}).getAttribute('href'),'https://www.magne.ai/'+(locale==='en'?'en/':'')+'privacy-policy.html');
   if([390,1440].includes(width))await p.screenshot({path:`${out}/${locale}-${article?'article':'home'}-${width}.png`});
   checks.push({route,width,footer:true});
  }
  const trigger=p.getByRole('button',{name:locale==='tc'?'Cookie 說明':'Cookie information',exact:true});await trigger.click();const d=p.getByRole('dialog');assert(await d.isVisible());
  assert.equal(await d.evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'dialog overflow');
  await p.evaluate(()=>{localStorage.setItem('magne-whitepaper-language','tc');localStorage.setItem('unrelated-test-setting','retain');});
  await d.getByRole('button',{name:locale==='tc'?'清除語言記錄':'Clear language record',exact:true}).click();
  await p.waitForFunction(()=>localStorage.getItem('magne-whitepaper-language')===null);assert.equal(await p.evaluate(()=>localStorage.getItem('unrelated-test-setting')),'retain');
  assert((await d.getByRole('status').innerText()).includes(locale==='tc'?'已清除':'cleared'));
  if([320,390,1440].includes(width))await p.screenshot({path:`${out}/${locale}-cookie-${width}.png`});
  await p.keyboard.press('Escape');assert.equal(await d.count(),0);assert(await trigger.evaluate(e=>e===document.activeElement));
  await trigger.click();await p.getByRole('dialog').getByRole('button',{name:locale==='tc'?'完成':'Done',exact:true}).click();assert.equal(await p.getByRole('dialog').count(),0);
  // Blocked browser storage must not crash the control or claim success.
  await trigger.click();await p.evaluate(()=>{window.originalRemoveItem=Storage.prototype.removeItem;Storage.prototype.removeItem=function(){throw new DOMException('blocked','SecurityError');};});
  await p.getByRole('dialog').getByRole('button',{name:locale==='tc'?'清除語言記錄':'Clear language record',exact:true}).click();assert((await p.getByRole('dialog').getByRole('status').innerText()).includes(locale==='tc'?'無法存取':'unavailable'));await p.evaluate(()=>{Storage.prototype.removeItem=window.originalRemoveItem;});await p.keyboard.press('Escape');
 }
 // Cookie information must accurately describe the actual local frontend.
 assert.deepEqual(requests.filter(u=>/googletagmanager|google-analytics|cloudflareinsights|connect\.facebook|platform\.twitter/.test(u)),[]);
 assert.deepEqual(await c.cookies(),[]);
 await p.goto('http://127.0.0.1:4173/tc/');await p.locator('#site-footer').getByRole('link',{name:'修訂紀錄',exact:true}).click();await p.waitForURL('**/tc/learning/tokenomics-changelog');
 await p.locator('#site-footer').getByRole('link',{name:'v1.0 原版歸檔',exact:true}).click();await p.waitForURL('**/v1.0');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/checks.json',JSON.stringify({checks,interactions:['official social destinations','localized privacy links','cookie dialog open, Escape, focus return and Done','clear only the whitepaper language record','blocked storage feedback','no analytics requests or cookies','Chinese revision navigation and original archive'],errors},null,2));console.log(`Passed ${checks.length} bilingual footer viewport checks, 10 dialog flows and storage/network checks.`);
} finally {await b.close();}
