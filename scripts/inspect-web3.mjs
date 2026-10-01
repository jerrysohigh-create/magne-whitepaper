import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const root = 'docs/research/web3';
await fs.mkdir(root,{recursive:true});
await fs.mkdir('docs/design-references/web3',{recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const responses=[];
page.on('response', r=>{if(/\.(css|woff2?|png|svg|webp|jpe?g|gif)(\?|$)/.test(r.url())) responses.push(r.url());});
await page.goto('https://web3.magne.ai',{waitUntil:'networkidle',timeout:60000});
await page.evaluate(()=>document.fonts.ready);
for(const width of [1440,768,390]){
 await page.setViewportSize({width,height:width===390?844:900});
 const height=await page.evaluate(()=>document.documentElement.scrollHeight);
 for(let y=0;y<height;y+=650){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(200);}
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`docs/design-references/web3/source-${width}.png`,fullPage:true});
 const data=await page.evaluate(()=>({title:document.title,html:document.body.innerHTML,links:[...document.querySelectorAll('a')].map(e=>({text:e.textContent,href:e.href})),assets:[...document.querySelectorAll('img,video,source,link')].map(e=>({tag:e.tagName,src:e.src||e.href,alt:e.alt})),styles:[...document.querySelectorAll('body,header,nav,main,section,footer,h1,h2,h3,p,a,button,img')].map(e=>{const s=getComputedStyle(e);return {tag:e.tagName,cls:e.className,text:e.textContent?.trim().slice(0,180),rect:e.getBoundingClientRect().toJSON(),style:Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','background','padding','margin','display','gap','gridTemplateColumns','border','borderRadius','maxWidth','position','height','width'].map(k=>[k,s[k]]))}}),css:[...document.styleSheets].map(s=>{try{return {href:s.href,text:[...s.cssRules].map(r=>r.cssText).join('\n')}}catch{return {href:s.href}}})}));
 await fs.writeFile(`${root}/source-${width}.json`,JSON.stringify(data,null,2));
}
await fs.writeFile(`${root}/network-assets.json`,JSON.stringify([...new Set(responses)],null,2));
console.log(await page.locator('body').innerText());
await browser.close();

