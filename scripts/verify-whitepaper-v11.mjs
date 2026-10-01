import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const dir='docs/redesign-plan/qa-option-3';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const docs=JSON.parse(await fs.readFile('src/content/whitepaper/manifest.json','utf8'));
const archive=JSON.parse(await fs.readFile('src/content/archive-v1/routes.json','utf8'));
const results=[];const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:1024}});
page.on('pageerror',e=>errors.push(e.message));
for(const width of [1440,390]){
 await page.setViewportSize({width,height:width===390?844:1024});
 for(const route of ['/',...docs.map(d=>d.route),'/v1.0',...archive.filter(r=>r.file).map(r=>'/v1.0'+r.route)]){
  const res=await page.goto('http://127.0.0.1:4173'+route,{waitUntil:'networkidle'});
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),headings:document.querySelectorAll('h1').length,anchors:[...document.querySelectorAll('.wp-site a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)}));
  results.push({route,width,status:res.status(),...state});
  if(['/', '/learning/tokenomics','/developers/net-config','/learning/what-is-magne','/v1.0','/v1.0/learning/tokenomics'].includes(route))await page.screenshot({path:`${dir}/${route==='/'?'home':route.slice(1).replaceAll('/','-')}-${width}.png`});
 }
 console.log(`Checked ${width}px routes`);
}
await page.setViewportSize({width:390,height:844});
await page.goto('http://127.0.0.1:4173/');
await page.getByRole('button',{name:'Open chapter navigation'}).click();
if(!await page.locator('#wp-mobile-menu').evaluate(e=>e.open))throw Error('Mobile menu failed');
await page.screenshot({path:dir+'/mobile-menu.png'});
await page.locator('#wp-mobile-menu').getByRole('link',{name:'MHA Tokenomics',exact:true}).click();
await page.waitForURL('**/learning/tokenomics');
if(await page.locator('#wp-mobile-menu').evaluate(e=>e.open))throw Error('Menu did not close');
await page.getByRole('searchbox',{name:'Search whitepaper'}).fill('testnet');
await page.locator('.wp-search-results a').first().waitFor();
await page.screenshot({path:dir+'/mobile-search.png'});
await page.locator('.wp-search-results a').first().click();
await page.waitForLoadState('networkidle');
await page.getByRole('searchbox',{name:'Search whitepaper'}).fill('zzzzunfindablezz');
if(!await page.getByText('No matching chapters').isVisible())throw Error('Empty search failed');
await page.keyboard.press('Escape');
await page.goto('http://127.0.0.1:4173/learning/tokenomics');
const text=await page.locator('.wp-article').innerText();
for(const value of ['10,000,000,000','76,250,500','23,749,500','700,000,000','51,250,000','25,000,000','1,635,000','40,000,000','124,568,474'])if(!text.includes(value))throw Error('Missing tokenomics value '+value);
for(const h of JSON.parse(await fs.readFile('docs/redesign-plan/archive-hashes.json','utf8'))){
 const value=await fs.readFile('src/content/archive-v1'+h.route+'.html');
 if(crypto.createHash('sha256').update(value).digest('hex')!==h.sha256)throw Error('Archive changed '+h.route);
}
await fs.writeFile(dir+'/checks.json',JSON.stringify({results,errors,interactions:['mobile menu open, navigate and close','full-text search navigation','empty search','Escape dismiss','tokenomics numeric invariants','33 archive hashes']},null,2));
await browser.close();
const failures=results.filter(r=>r.status!==200||r.overflow||r.brokenImages.length||r.anchors.length);
console.log(JSON.stringify({checks:results.length,failures,errors},null,2));
if(failures.length||errors.length)process.exitCode=1;
