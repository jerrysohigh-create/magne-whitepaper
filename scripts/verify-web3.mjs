import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const dir='docs/design-references/web3';
const browser=await chromium.launch({channel:'msedge',headless:true});
const reports=[];
for(const width of [1440,768,390]){
 const height=width===390?844:900;
 for(const [name,url] of [['reference','https://web3.magne.ai'],['implementation','http://127.0.0.1:4173']]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url,{waitUntil:'networkidle',timeout:60000});
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{for(const image of document.images)image.loading='eager';await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
  await page.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=0;}));
  const total=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let y=0;y<total;y+=650){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(60);}
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:`${dir}/${name}-${width}.png`,fullPage:true});
  const measurements=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,images:[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src),headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>({text:e.textContent,box:e.getBoundingClientRect().toJSON(),font:getComputedStyle(e).fontFamily})),links:[...document.querySelectorAll('a')].map(e=>({text:e.textContent,href:e.href}))}));
  reports.push({name,width,errors,...measurements});
  if(width===390){
   await page.getByRole('button',{name:'Open Menu'}).click();
   await page.screenshot({path:`${dir}/${name}-menu.png`});
   await page.locator('header button').filter({hasText:'DEVELOPERS'}).click();
   await page.screenshot({path:`${dir}/${name}-developers.png`});
  }
  await page.close();
 }
 const a=await sharp(`${dir}/reference-${width}.png`).metadata(),b=await sharp(`${dir}/implementation-${width}.png`).metadata();
 await sharp({create:{width:Math.max(width,a.width)+Math.max(width,b.width),height:Math.max(a.height,b.height),channels:3,background:'#ffffff'}}).composite([{input:`${dir}/reference-${width}.png`,left:0,top:0},{input:`${dir}/implementation-${width}.png`,left:Math.max(width,a.width),top:0}]).png().toFile(`${dir}/comparison-${width}.png`);
}
await fs.writeFile('docs/research/web3/verification.json',JSON.stringify(reports,null,2));
console.log(reports.map(r=>({name:r.name,width:r.width,scrollWidth:r.scrollWidth,height:r.height,brokenImages:r.images.length,errors:r.errors})));
await browser.close();

