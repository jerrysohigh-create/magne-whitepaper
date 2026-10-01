import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const out='docs/tokenomics-navigation-20260930';
await fs.mkdir(out+'/screenshots',{recursive:true});
const source=JSON.parse(await fs.readFile(out+'/supply-source.json','utf8'));
const register=JSON.parse(await fs.readFile('src/content/whitepaper/allocation-addresses.json','utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
const errors=[];const checks=[];
page.on('pageerror',e=>errors.push(e.message));
for(const locale of ['en','tc']){
 const url=`http://127.0.0.1:4173/${locale==='tc'?'tc/':''}learning/tokenomics`;
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  const response=await page.goto(url,{waitUntil:'networkidle'});
  const data=await page.evaluate(()=>({
   groups:document.querySelectorAll('details.wp-allocation').length,
   open:document.querySelectorAll('details.wp-allocation[open]').length,
   nested:document.querySelectorAll('.wp-page-toc .wp-toc-nested').length,
   contract:document.querySelector('.wp-token-contract code').textContent,
   addresses:[...document.querySelectorAll('.wp-address-list code')].map(x=>x.textContent),
   missingLinks:[...document.querySelectorAll('.wp-page-toc a,.wp-allocation-subnav a')].map(a=>a.hash.slice(1)).filter(id=>!document.getElementById(id)),
   overflow:document.documentElement.scrollWidth>innerWidth+1,
   duplicateIDs:[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i),
  }));
  checks.push({locale,width,type:'layout',...data,ok:response.status()===200 && data.groups===10 && data.open===0 && data.nested===10 && data.contract===register.contract && JSON.stringify(data.addresses)===JSON.stringify(register.records.map(x=>x.address)) && !data.missingLinks.length&&!data.overflow&&!data.duplicateIDs.length});
  await page.locator('#allocation-1>summary').focus();await page.keyboard.press('Enter');
  checks.push({locale,width,type:'keyboard opens allocation',ok:await page.locator('#allocation-1').evaluate(e=>e.open)});
  await page.locator('[data-action="allocations-expand"]').click();
  checks.push({locale,width,type:'expand all',ok:await page.locator('.wp-allocation[open]').count()===10});
  await page.locator('[data-action="allocations-collapse"]').click();
  checks.push({locale,width,type:'collapse all',ok:await page.locator('.wp-allocation[open]').count()===0});
  if(width===390||width===1440){
   for(const [name,selector] of [['contract','.wp-token-contract'],['addresses','.wp-address-register'],['rules','.wp-allocation-sections']]){
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.locator(selector).screenshot({path:`${out}/screenshots/${locale}-${width}-${name}.png`});
   }
  }
  await page.locator('.wpf-allocations a[href="#market-makers"]').click();
  checks.push({locale,width,type:'chart opens allocation',ok:await page.locator('#market-makers').evaluate(e=>e.open)});
  await page.goto(url+'#section-7',{waitUntil:'networkidle'});
  checks.push({locale,width,type:'direct legacy subsection link opens parent',ok:await page.locator('#allocation-1').evaluate(e=>e.open) && await page.locator('#section-7').isVisible()});
  await page.locator('.wp-token-contract [data-action="copy-address"]').click();
  checks.push({locale,width,type:'contract clipboard',ok:await page.evaluate(()=>navigator.clipboard.readText())===register.contract});
  await page.locator('.wp-address-list [data-action="copy-address"]').nth(5).click();
  checks.push({locale,width,type:'reserve clipboard',ok:await page.evaluate(()=>navigator.clipboard.readText())===register.records[5].address});
  const print=await page.evaluate(()=>{const before=[...document.querySelectorAll('.wp-allocation')].map(x=>x.open);window.dispatchEvent(new Event('beforeprint'));const count=document.querySelectorAll('.wp-allocation[open]').length;window.dispatchEvent(new Event('afterprint'));return count===10&&JSON.stringify(before)===JSON.stringify([...document.querySelectorAll('.wp-allocation')].map(x=>x.open));});
  checks.push({locale,width,type:'print opens and restores all rules',ok:print});
  console.log(locale,width,'checked');
 }
 await page.goto(url+'#allocation-8',{waitUntil:'networkidle'});
 await page.locator('.wp-language a').filter({hasText:locale==='tc'?'EN':'繁體中文'}).click();
 await page.waitForLoadState('networkidle');
 checks.push({locale,type:'language switch preserves expanded category',ok:new URL(page.url()).hash==='#allocation-8'&&await page.locator('#allocation-8').evaluate(e=>e.open)});
}
for(const entry of register.records){checks.push({type:'address matches official source',category:entry.category,ok:source.data.wallets.some(w=>w.category===entry.category&&w.address===entry.address)});}
for(const [file,expected] of Object.entries(JSON.parse(await fs.readFile(out+'/content-hashes.json','utf8')))){
 const normalized=file.replaceAll('\\','/');
 const authorized=/^src\/content\/(whitepaper|whitepaper-tc)\/learning\/(mha|tokenomics)\.html$/.test(normalized);
 if(!authorized&&crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')!==expected)errors.push('Source changed: '+file);
 if(authorized){
  const locale=normalized.includes('whitepaper-tc')?'tc':'en';const name=normalized.split('/').at(-1).replace('.html','');
  const before=await fs.readFile(`${out}/before/${locale}-${name}.html.bak`,'utf8');const after=await fs.readFile(file,'utf8');
  const marker=name==='tokenomics'?'<h2 id="allocation-1"':'<div>';
  checks.push({type:'existing economic rules preserved',locale,name,ok:before.slice(before.indexOf(marker))===after.slice(after.indexOf(marker))});
  checks.push({type:'current BSC form and future migration disclosed',locale,name,ok:after.includes('BNB Smart Chain')&&after.includes('BSC')&&after.includes(locale==='tc'?'將另行公告':'announced separately')});
 }
}
await page.setViewportSize({width:1440,height:1000});
await page.goto('http://127.0.0.1:4173/tc/learning/tokenomics#allocation-rules',{waitUntil:'networkidle'});
await page.screenshot({path:out+'/screenshots/tc-rules-in-page.png'});
await page.locator('#allocation-2>summary').click();
await page.locator('#allocation-2').screenshot({path:out+'/screenshots/tc-staking-expanded.png'});
const report={checks,errors,passed:checks.every(x=>x.ok)&&!errors.length};
await fs.writeFile(out+'/checks.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:checks.length,passed:report.passed,failed:checks.filter(x=>!x.ok),errors},null,2));
await browser.close();if(!report.passed)process.exitCode=1;
