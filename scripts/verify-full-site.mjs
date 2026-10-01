import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const allRoutes=JSON.parse(await fs.readFile('docs/research/full-site/routes.json','utf8'));
const routes=process.argv.length>2?allRoutes.filter(r=>process.argv.slice(2).includes(r.route)):allRoutes;
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];const origin='http://127.0.0.1:4173';
await fs.mkdir('docs/design-references/full-site/local',{recursive:true});
for(let i=0;i<routes.length;i+=3){
 await Promise.all(routes.slice(i,i+3).map(async r=>{
  const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   const res=await page.goto(origin+r.route,{waitUntil:'networkidle',timeout:60000});
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('img').evaluateAll(async images=>{for(const image of images)image.loading='eager';await Promise.all(images.map(image=>image.decode().catch(()=>{})))});
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:900});
    const height=await page.evaluate(()=>document.documentElement.scrollHeight);
    for(let y=0;y<height;y+=750){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(25)}
    await page.evaluate(()=>{scrollTo(0,0);document.getAnimations().forEach(a=>a.pause())});
    await page.screenshot({path:`docs/design-references/full-site/local/${r.key}-${width}.png`,fullPage:true});
    const check=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src),sourceLinks:[...document.querySelectorAll('a')].filter(a=>a.href.startsWith('https://web3.magne.ai')).map(a=>a.href),links:[...document.querySelectorAll('a[href]')].map(a=>a.href),headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>e.textContent),remoteAssets:performance.getEntriesByType('resource').filter(e=>!e.name.startsWith(location.origin)&&!e.name.startsWith('data:')).map(e=>e.name)}));
    results.push({route:r.route,width,status:res.status(),...check,errors});
   }
   console.log('Checked',r.route);
  }catch(e){results.push({route:r.route,error:e.message});console.log('ERROR',r.route,e.message)}finally{await page.close()}
 }));
 const prior=process.argv.length>2?JSON.parse(await fs.readFile('docs/research/full-site/browser-checks.json','utf8')).filter(r=>!routes.some(route=>route.route===r.route)):[];
 await fs.writeFile('docs/research/full-site/browser-checks.json',JSON.stringify([...prior,...results],null,2));
}
await browser.close();const issues=results.filter(r=>r.error||r.status!==200||r.overflow||r.brokenImages?.length||r.sourceLinks?.length||r.errors?.length||r.remoteAssets?.length);
console.log(JSON.stringify({checks:results.length,issues},null,2));if(issues.length)process.exitCode=1;
