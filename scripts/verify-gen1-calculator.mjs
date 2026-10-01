import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='docs/gen1-calculator';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const tc of [false,true])for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});await page.goto('about:blank');
  await page.goto(`http://127.0.0.1:4173/${tc?'tc/':''}learning/tokenomics#gen1-calculator`,{waitUntil:'networkidle'});
  const calc=page.locator('#gen1-calculator');
  const released=()=>calc.locator('[data-gen1-result="released"]').innerText();
  assert.match(await released(),/20,000.00/);
  const inputs=calc.locator('.gen1-inputs input');
  await inputs.nth(0).fill('20000');assert.match(await released(),/13,750.00/);
  await inputs.nth(2).fill('50');assert.match(await released(),/8,250.00/);
  await inputs.nth(1).fill('20');assert.equal(await calc.locator('[data-gen1-result]').count(),0);assert.ok(await calc.locator('.gen1-error').isVisible());
  await inputs.nth(1).fill('100');await inputs.nth(2).fill('100');
  await inputs.nth(0).fill('');assert.equal(await calc.locator('[data-gen1-result]').count(),0);
  await inputs.nth(0).fill('13750');
  await calc.locator('select').nth(1).selectOption('36');assert.match(await released(),/23,818.18/);
  await calc.locator('select').nth(0).selectOption('monthly');
  await inputs.nth(0).fill('5000');await calc.locator('fieldset button').click();
  assert.equal(await calc.locator('.gen1-month-grid input').count(),36);
  assert.match(await released(),/23,818.18/);
  await calc.locator('.gen1-month-grid input').nth(35).fill('20000');assert.doesNotMatch(await released(),/23,818.18/);
  await calc.locator('.gen1-output summary').click();assert.equal(await calc.locator('tbody tr').count(),38);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.ok(!overflow);
  await calc.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${tc?'tc':'en'}-${width}-monthly.png`});
  await calc.locator('select').nth(0).selectOption('fixed');await inputs.nth(0).fill('13750');
  await calc.locator('select').nth(1).selectOption('24');
  await calc.locator('select').nth(2).selectOption('6');assert.match(await released(),/15,393.94/);
  assert.match(await calc.locator('tbody tr').first().innerText(),tc?/尚未加入/:/Not yet joined/);
  assert.match(await calc.locator('tbody tr').nth(5).innerText(),/727.27/);
  await calc.locator('select').nth(1).selectOption('36');await calc.locator('select').nth(2).selectOption('36');assert.match(await released(),/181.82/);
  await calc.locator('select').nth(1).selectOption('24');assert.equal(await calc.locator('select').nth(2).inputValue(),'24');assert.match(await released(),/363.64/);
  await calc.locator('select').nth(2).selectOption('6');
  await calc.locator('#gen1-calculator-title').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${tc?'tc':'en'}-${width}-fixed.png`});
 }
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/checks.json',JSON.stringify({passed:true,errors,widths:[390,1440],locales:['en','tc']}));
 console.log('PASS: both languages, desktop/mobile, fixed/monthly, 24/36, live results, invalid inputs, tail rows, M6/M36 joins, horizon clamp and overflow.');
}finally{await browser.close();}
