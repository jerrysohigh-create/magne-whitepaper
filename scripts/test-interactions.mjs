import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173')&&!r.url().startsWith('data:'))external.push(r.url());});
await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
const menus=[];
await page.getByRole('button',{name:'Open Menu'}).click();
for(const name of ['LEARNING','DEVELOPERS','SOLUTIONS','NETWORKS','HELP','COMMUNITY']){
 const button=page.locator('header button').filter({hasText:name});
 await button.click();assert.equal(await button.getAttribute('aria-expanded'),'true');
 assert.equal(await page.locator('header button[aria-expanded="true"]').count(),2);
 menus.push(name);
}
await page.keyboard.press('Escape');
assert.equal(await page.getByRole('button',{name:'Open Menu'}).getAttribute('aria-expanded'),'false');
await page.getByRole('link',{name:'RESOURCES',exact:true}).click();
await page.waitForFunction(()=>location.hash==='#card');
assert.ok(await page.evaluate(()=>scrollY>0));
const sizes=[];
for(const width of [390,768,1024,1440]){
 await page.setViewportSize({width,height:900});
 const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
 assert.equal(scrollWidth,width,`Overflow at ${width}`);sizes.push({width,scrollWidth});
}
await page.locator('.rfm-marquee-container').scrollIntoViewIfNeeded();
await page.mouse.move(0,0);
const moving=page.locator('.rfm-marquee').first();
const before=await moving.evaluate(e=>getComputedStyle(e).transform);
await page.waitForTimeout(150);
const after=await moving.evaluate(e=>getComputedStyle(e).transform);
assert.notEqual(before,after,'Gallery should animate');
await page.locator('.rfm-marquee-container').hover();
assert.equal(await moving.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');
await page.emulateMedia({reducedMotion:'reduce'});
assert.equal(await moving.evaluate(e=>getComputedStyle(e).animationDuration),'1e-05s');
assert.equal(errors.length,0);
assert.equal(external.length,0);
const result={passed:true,menus,resourcesAnchor:true,escape:true,sizes,galleryAnimation:true,hoverPause:true,reducedMotion:true,errors,externalRequests:external};
await fs.writeFile('docs/research/web3/interaction-checks.json',JSON.stringify(result,null,2));
console.log(result);
await browser.close();
