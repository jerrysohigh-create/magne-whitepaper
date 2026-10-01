import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='docs/gen1-optional-incentives';const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 for(const tc of [false,true])for(const width of [390,1440]){
  await p.setViewportSize({width,height:1000});await p.goto('about:blank');
  const response=await p.goto(`http://127.0.0.1:4173/${tc?'tc/':''}learning/tokenomics#gen1-incentive-calculator`,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  const box=p.locator('#gen1-incentive-calculator');const field=key=>box.locator(`[data-incentive-field="${key}"]`);const bonus=()=>box.locator('[data-incentive-result="bonus"]').innerText();
  assert.match(await bonus(),/50.00/);assert.match(await box.locator('[data-incentive-result="locked"]').innerText(),/1,000.00/);
  await box.locator('summary').click();assert.equal(await box.locator('tbody tr').count(),13);
  const last=await box.locator('tbody tr').last().innerText();assert.match(last,/\+12/);assert.match(last,/1,000.00/);
  await field('programRemaining').fill('0');assert.match(await bonus(),/0.00/);assert.match(await box.locator('[data-incentive-result="locked"]').innerText(),/^0.00/);
  await field('programRemaining').fill('17000000');await field('otherRequests').fill('0');assert.match(await bonus(),/200.00/);
  await box.locator('select').first().selectOption('stake');assert.match(await bonus(),/^0.00/);await box.locator('input[type=checkbox]').check();assert.match(await bonus(),/100.00/);
  await box.locator('select').first().selectOption('compare');await field('lockShare').fill('50');assert.match(await box.locator('[data-incentive-result="locked"]').innerText(),/^0.00/);
  await field('month').fill('37');assert.match(await bonus(),/^0.00/);await field('month').fill('3');
  await field('base').fill('');assert.equal(await box.locator('[data-incentive-result]').count(),0);await field('base').fill('1000');
  assert.ok(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1));
  await box.evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:`${out}/${tc?'tc':'en'}-${width}.png`});
  await box.locator('.gen1-results').evaluate(e=>e.scrollIntoView({block:'center'}));await p.screenshot({path:`${out}/${tc?'tc':'en'}-${width}-results.png`});
  const bad=await p.evaluate(()=>[...document.querySelectorAll('.wp-article a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(bad,[]);
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/checks.json',JSON.stringify({passed:true,errors,locales:['en','tc'],widths:[390,1440]}));console.log('PASS: bilingual responsive UI, proration, principal schedule, depleted reserve, staking eligibility, ties, inactive periods, invalid input and anchors.');
}finally{await b.close();}
