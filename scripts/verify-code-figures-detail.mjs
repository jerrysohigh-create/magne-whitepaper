import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const output='docs/code-figures-20260930';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
const errors=[]; const checks=[];
page.on('pageerror',e=>errors.push(e.message));
for(const locale of ['en','tc']) for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:1000});
  for(const route of ['learning/tokenomics','learning/mha','solutions/hardware','networks/explorer']) {
    await page.goto(`http://127.0.0.1:4173/${locale==='tc'?'tc/':''}${route}`,{waitUntil:'networkidle'});
    const data=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      figureOverflow:[...document.querySelectorAll('.wpf,.wpf-token,.wpf-product')].some(e=>e.scrollWidth>e.clientWidth+2),
      nestedCaptions:document.querySelectorAll('figure div figcaption').length,
      allocation:[...document.querySelectorAll('.wpf-allocations li')].map(e=>({percent:Number(e.querySelector('strong').textContent.replace('%','')),amount:Number(e.querySelector('small').textContent.replace(/[^0-9]/g,'')),bar:Number(e.querySelector('svg rect:last-child').getAttribute('width'))/Number(e.querySelector('svg').getAttribute('viewBox').split(' ')[2])})),
      table:[...document.querySelectorAll('table')].find(e=>e.querySelectorAll('tbody tr').length===10)?.querySelector('tbody')?.innerText ?? '',
    }));
    const chartOK=!data.allocation.length || (data.allocation.reduce((s,a)=>s+a.percent,0)===100 && data.allocation.reduce((s,a)=>s+a.amount,0)===10_000_000_000 && data.allocation.every(a=>data.table.includes(a.amount.toLocaleString('en-US')) && data.table.includes(a.percent+'%') && Math.abs(a.bar-a.percent/100)<0.0001));
    checks.push({locale,width,route,ok:!data.overflow&&!data.figureOverflow&&!data.nestedCaptions&&chartOK,...data});
    if(width===390||width===1440) {
      for(const selector of route==='solutions/hardware'?['[data-figure="device-roles"]','[data-figure="secure-signing"]','[data-figure="secure-element"]','[data-figure="tee"]']:route==='learning/tokenomics'?['[data-figure="allocation"]']:route==='learning/mha'?['.wpf-token']:['[data-figure="explorer-1"]']) {
        const target=page.locator(selector).first();await target.scrollIntoViewIfNeeded();
        const name=await target.getAttribute('data-figure')??'token';
        await target.screenshot({path:`${output}/screenshots/${locale}-${name}-${width}-final.png`});
      }
    }
  }
  console.log(locale,width,'passed',checks.slice(-4).every(x=>x.ok));
}
await page.setViewportSize({width:1440,height:1000});
await page.goto('http://127.0.0.1:4173/tc/solutions/hardware',{waitUntil:'networkidle'});
await page.locator('[data-figure="tee"]').scrollIntoViewIfNeeded();
await page.screenshot({path:output+'/screenshots/tc-hardware-in-page.png'});
const report={checks,errors,passed:checks.every(x=>x.ok)&&!errors.length};
await fs.writeFile(output+'/detail-checks.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:checks.length,errors,passed:report.passed}));
await browser.close();if(!report.passed)process.exitCode=1;
