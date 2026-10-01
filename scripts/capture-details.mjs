import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('https://web3.magne.ai',{waitUntil:'networkidle'});
console.log(await page.evaluate(()=>[...document.body.children].map(e=>({tag:e.tagName,cls:e.className,children:[...e.children].slice(0,10).map(c=>({tag:c.tagName,cls:c.className,text:c.textContent.slice(0,70)}))})).filter(e=>!['SCRIPT','LINK','STYLE'].includes(e.tag))));
await page.evaluate(()=>document.getAnimations().forEach(a=>a.pause()));
const desktop=await page.evaluate(()=>({header:document.querySelector('header').outerHTML,main:document.querySelector('.min-h-screen').outerHTML,footer:document.querySelector('footer').outerHTML,bodyClass:document.body.className,inlineStyles:[...document.querySelectorAll('style')].map(e=>e.textContent)}));
await fs.writeFile('docs/research/web3/fragments.json',JSON.stringify(desktop,null,2));
const behaviors=[];
for(const locator of [page.getByRole('link',{name:'RESOURCES',exact:true}),page.getByRole('button',{name:'START BUILDING',exact:true}).first()]){
 await locator.hover();behaviors.push(await locator.evaluate(e=>({text:e.textContent,background:getComputedStyle(e).background,transform:getComputedStyle(e).transform})));
}
await page.getByRole('link',{name:'RESOURCES',exact:true}).click();
behaviors.push({resourcesURL:page.url(),scrollY:await page.evaluate(()=>scrollY)});
await page.screenshot({path:'docs/design-references/web3/source-resources.png'});
await page.setViewportSize({width:390,height:844});
await page.evaluate(()=>scrollTo(0,0));
await page.getByRole('button',{name:'Open Menu'}).click();
await page.screenshot({path:'docs/design-references/web3/source-menu.png'});
await fs.writeFile('docs/research/web3/menu.html',await page.locator('header').evaluate(e=>e.outerHTML));
behaviors.push({menu:await page.locator('header').innerText(),buttons:await page.getByRole('button').allTextContents()});
await fs.writeFile('docs/research/web3/behaviors.json',JSON.stringify(behaviors,null,2));
await browser.close();

