import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='docs/gen1-release-20261001';
const record=JSON.parse(await fs.readFile(out+'/calculation-checks.json','utf8'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(hash(await fs.readFile('src/content/archive-v1/learning/tokenomics.html')),record.archiveHash);
const b=await chromium.launch({channel:'msedge',headless:true});
const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
const checks=[];
try{
 for(const locale of ['en','tc']){
  const base='src/content/'+(locale==='tc'?'whitepaper-tc':'whitepaper');
  const after=await fs.readFile(base+'/learning/tokenomics.html','utf8');
  const before=await fs.readFile(`${out}/before/${locale}-tokenomics.html`,'utf8');
  const unchanged=x=>x.slice(x.indexOf('<h2 id="allocation-2"'),x.indexOf('<h2 id="execution-snapshot"'));
  assert.equal(unchanged(after),unchanged(before));
  for(const name of ['tokenomics','tokenomics-changelog','tokenomics-announcement','tokenomics-zh']){
   const h=await fs.readFile(`${base}/learning/${name}.html`,'utf8');
   await p.setContent(h);
   const d=await p.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return {ids,text:document.body.textContent,rows:[...document.querySelectorAll('[data-gen1-month]')].map(r=>[...r.children].slice(1).map(c=>Number(c.textContent.replaceAll(',',''))))};});
   assert.equal(new Set(d.ids).size,d.ids.length,`${locale}/${name} duplicate IDs`);
   assert.ok(d.text.includes('13,750'));assert.ok(!/other eight|其餘八/.test(d.text));
   if(name==='tokenomics'){
    assert.equal(d.rows.length,38);
    let earned=0,paid=0;const nums=[];
    for(let i=0;i<38;i++){
     // Independent exact integer units: every earning is an integer / 33 MHA.
     const n=i===0?8000:i===1?24000:i<12?40000:i<24?20000:i<36?10000:0;nums.push(n);earned+=n;
     const release=3*n+(nums[i-1]??0)+(nums[i-2]??0);paid+=release;
     const expected=[n/33,release/165,earned/33,paid/165,(5*earned-paid)/165];
     expected.forEach((v,j)=>assert.ok(Math.abs(d.rows[i][j]-v)<=.00501,`${locale} month ${i+1} col ${j}`));
    }
   }
  }
  for(const width of [390,1440]){
   await p.setViewportSize({width,height:1000});
   const url=`http://127.0.0.1:4173/${locale==='tc'?'tc/':''}learning/tokenomics#section-9`;
   await p.goto('about:blank');
   const response=await p.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);
   await p.locator('#section-9').scrollIntoViewIfNeeded();
   const state=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,open:document.querySelector('#allocation-1').open,rows:document.querySelectorAll('[data-gen1-month]').length,broken:[...document.querySelectorAll('.wp-allocation-subnav a')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)}));
   assert.ok(!state.overflow&&state.open&&state.rows===38&&!state.broken.length,JSON.stringify(state));
   await p.screenshot({path:`${out}/${locale}-${width}-intro.png`});
   await p.locator('#gen1-year-2').scrollIntoViewIfNeeded();
   await p.screenshot({path:`${out}/${locale}-${width}-table.png`});
   const wrap=p.locator('[data-gen1-month="13"]').locator('..').locator('..').locator('..');
   if(width===390){await wrap.evaluate(e=>{e.scrollLeft=e.scrollWidth;});assert.ok(await p.locator('[data-gen1-month="24"]').count());}
   checks.push({locale,width,...state});
  }
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(out+'/browser-checks.json',JSON.stringify({passed:true,checks,errors,archiveUnchanged:true,otherNineAllocationRulesUnchanged:true},null,2));
 console.log('PASS: 76 monthly rows verified with independent integer arithmetic; both languages at 390/1440; archive and nine other allocation rules preserved.');
}finally{await b.close();}
