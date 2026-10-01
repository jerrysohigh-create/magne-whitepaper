import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='docs/gen1-section-layout';const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 for(const tc of [false,true])for(const width of [390,1440]){
  await p.setViewportSize({width,height:1000});await p.goto('about:blank');
  const root=`http://127.0.0.1:4173/${tc?'tc/':''}learning/tokenomics`;
  await p.goto(root+'#gen1-incentive-calculator',{waitUntil:'networkidle'});
  await p.locator('#gen1-incentive-calculator').waitFor({state:'visible'});
  const state=await p.evaluate(()=>{
   const ids=['gen1-reading-guide','gen1-calculator','section-9','gen1-optional-incentives','gen1-incentive-calculator','gen1-technical-details'];
   const els=ids.map(id=>document.getElementById(id));
   return {inside:els.every(e=>e?.closest('#allocation-1')),order:els.every((e,i)=>!i||Boolean(els[i-1].compareDocumentPosition(e)&Node.DOCUMENT_POSITION_FOLLOWING)),unique:['gen1-calculator','gen1-incentive-calculator'].every(id=>document.querySelectorAll('#'+id).length===1),overflow:document.documentElement.scrollWidth>innerWidth+1,open:document.querySelector('#allocation-1').open,broken:[...document.querySelectorAll('.wp-article a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)};
  });
  assert.ok(state.inside&&state.order&&state.unique&&state.open&&!state.overflow);assert.deepEqual(state.broken,[]);
  await p.locator('#gen1-optional-incentives').evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:`${out}/${tc?'tc':'en'}-${width}-incentives.png`});
  await p.locator('#allocation-1 > summary').click();assert.ok(!await p.locator('#gen1-calculator').isVisible());
  await p.goto(root+'#gen1-calculator');await p.locator('#gen1-calculator').waitFor({state:'visible'});
  await p.locator('#gen1-calculator .gen1-inputs input').first().fill('20000');assert.match(await p.locator('[data-gen1-result="released"]').innerText(),/13,750.00/);
  await p.locator('#allocation-1 > summary').click();await p.locator('#allocation-1 > summary').click();assert.equal(await p.locator('#gen1-calculator .gen1-inputs input').first().inputValue(),'20000');
  await p.goto(root+'#gen1-year-2');assert.ok(await p.locator('#gen1-year-2').isVisible());
  await p.locator('#section-9').evaluate(e=>e.closest('details.gen1-reading-details').open=false);
  await p.goto(root+'#gen1-year-3');assert.ok(await p.locator('#gen1-year-3').isVisible());
  await p.goto(root+'#section-6');assert.ok(await p.locator('#section-6').isVisible());
  const print=await p.evaluate(()=>{const nodes=[...document.querySelectorAll('details.gen1-reading-details')];const before=nodes.map(e=>e.open);dispatchEvent(new Event('beforeprint'));const expanded=nodes.every(e=>e.open);dispatchEvent(new Event('afterprint'));return expanded&&nodes.every((e,i)=>e.open===before[i]);});assert.ok(print);
  await p.goto(root+'#allocation-2');assert.ok(await p.locator('#allocation-2 a[href="#gen1-optional-incentives"]').isVisible());await p.locator('#allocation-2 a[href="#gen1-optional-incentives"]').click();assert.ok(await p.locator('#gen1-optional-incentives').isVisible());
  await p.goto(root+'#gen1-calculator');await p.locator('#gen1-calculator').evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:`${out}/${tc?'tc':'en'}-${width}-base.png`});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/checks.json',JSON.stringify({passed:true,errors}));console.log('PASS: calculator placement/order, nested anchors, retained input, print restoration, staking cross-link, responsive layouts and bilingual routes.');
}finally{await b.close();}
