import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage();const out=[];
for(const path of ['/robots.txt','/sitemap.xml','/sitemap_index.xml','/solutions','/networks','/help','/community','/does-not-exist-route-audit']){try{const r=await p.goto('https://web3.magne.ai'+path,{waitUntil:'domcontentloaded',timeout:30000});out.push({path,status:r.status(),url:p.url(),text:(await p.locator('body').innerText()).slice(0,5000)});}catch(e){out.push({path,error:e.message})}}
await fs.writeFile('docs/research/full-site/route-audit-probes.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));await b.close();
