import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:1440,height:900}});await fs.mkdir('docs/phone-selection',{recursive:true});
for(const name of ['phone','media-kit']) {await p.goto(`https://www.magne.ai/${name}.html`,{waitUntil:'networkidle'});const d=await p.evaluate(()=>({text:document.body.innerText,images:[...document.images].map(i=>({src:i.src,alt:i.alt,width:i.naturalWidth,height:i.naturalHeight})),links:[...document.querySelectorAll('a')].map(a=>({text:a.textContent,href:a.href}))}));await fs.writeFile(`docs/phone-selection/${name}.json`,JSON.stringify(d,null,2));console.log(name,JSON.stringify(d.images));}
await b.close();
