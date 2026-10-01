import fs from 'node:fs/promises';
import sharp from 'sharp';
import {chromium} from 'playwright';
const dir='docs/redesign-plan/qa-option-3';
const browser=await chromium.launch({channel:'msedge',headless:true});
const p=await browser.newPage();
const manifest=JSON.parse(await fs.readFile('src/content/whitepaper/manifest.json','utf8'));
for(const d of manifest.filter(d=>d.route.includes('tokenomics'))){
 await p.setContent(await fs.readFile('src/content/whitepaper/'+d.file,'utf8'));
 const toc=await p.locator('.token-toc a').evaluateAll(links=>links.map(a=>({id:a.hash.slice(1),title:a.textContent.trim(),level:'H2'})));
 if(toc.length)d.toc=toc;
}
await fs.writeFile('src/content/whitepaper/manifest.json',JSON.stringify(manifest,null,2));
for(const {width,height,name,crop} of [
 {width:1154,height:1032,name:'desktop',crop:{left:24,top:11,width:1154,height:1032}},
 {width:289,height:1032,name:'mobile',crop:{left:1199,top:11,width:289,height:1032}},
]){
 await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await p.screenshot({path:`${dir}/home-${name}-final.png`});
 const ref=await sharp('docs/redesign-plan/selected-option-3.png').extract(crop).toBuffer();
 const actual=await sharp(`${dir}/home-${name}-final.png`).resize(crop.width,crop.height,{fit:'contain',background:'#ffffff'}).toBuffer();
 await sharp({create:{width:crop.width*2+20,height:crop.height,channels:3,background:'#dfe2e6'}}).composite([{input:ref,left:0,top:0},{input:actual,left:crop.width+20,top:0}]).png().toFile(`${dir}/compare-${name}.png`);
}
await p.setViewportSize({width:1440,height:1024});await p.goto('http://127.0.0.1:4173/learning/tokenomics',{waitUntil:'networkidle'});await p.screenshot({path:`${dir}/tokenomics-final.png`});
await p.locator('#execution-snapshot').scrollIntoViewIfNeeded();await p.screenshot({path:`${dir}/tokenomics-execution-final.png`});
await browser.close();
console.log('Saved normalized source/implementation comparisons and updated chapter outlines.');
