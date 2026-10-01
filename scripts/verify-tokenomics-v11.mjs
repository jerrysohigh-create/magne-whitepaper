import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge'});const results=[];
const dir='docs/tokenomics-v11';await fs.mkdir(`${dir}/screenshots`,{recursive:true});
for(const width of [1440,768,390]){
 const p=await browser.newPage({viewport:{width,height:900}});
 for(const slug of ['tokenomics','tokenomics-v1-0','tokenomics-changelog','tokenomics-zh','tokenomics-announcement']){
  const response=await p.goto('http://127.0.0.1:4173/learning/'+slug,{waitUntil:'networkidle'});
  const state=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)}));
  if(response.status()!==200||state.overflow||state.brokenAnchors.length)throw Error(JSON.stringify({slug,width,...state}));
  results.push({slug,width,status:response.status(),...state});
  await p.screenshot({path:`${dir}/screenshots/${slug}-${width}.png`});
  if(slug==='tokenomics'){
   await p.locator('#execution-snapshot').evaluate(e=>e.scrollIntoView());
   await p.screenshot({path:`${dir}/screenshots/execution-${width}.png`});
   const text=await p.locator('.tokenomics-v11').innerText();
   for(const value of ['10,000,000,000','76,250,500','23,749,500','700,000,000','51,250,000','25,000,000','1,635,000','40,000,000','124,568,474'])if(!text.includes(value))throw Error('Missing '+value);
  }
 }
 await p.close();
}
await browser.close();
if(await fs.readFile('src/content/web3/learning/tokenomics-v1-0.html','utf8')!==await fs.readFile(`${dir}/before/tokenomics.html`,'utf8'))throw Error('Archive changed');
await fs.writeFile(`${dir}/browser-checks.json`,JSON.stringify(results,null,2));console.log('15 viewport/route checks passed; original archive exact.');
