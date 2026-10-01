import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root='docs/research/full-site', assetRoot='public/sites/web3-magne-ai-9982170f/shared/full-site';
await fs.mkdir(assetRoot,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext();
const map=JSON.parse(await fs.readFile(`${root}/asset-map.json`,'utf8').catch(()=>'{}'));
const pending=new Map();
async function download(url){
 if(!url||url.startsWith('data:'))return url;
 if(map[url])return map[url];if(pending.has(url))return pending.get(url);
 const work=(async()=>{
  const u=new URL(url), sourcePath=u.searchParams.get('url')||u.pathname;
  const name=crypto.createHash('sha256').update(url).digest('hex').slice(0,12)+'-'+(sourcePath.split('/').pop()||'asset').replace(/[^a-zA-Z0-9._-]/g,'_');
  const res=await context.request.get(url,{timeout:45000});if(!res.ok())throw Error(`${res.status()} ${url}`);
  let data=await res.body();
  if(sourcePath.endsWith('.css')){
   let css=data.toString();
   for(const match of [...css.matchAll(/url\(([^)]+)\)/g)]){
    const raw=match[1].replace(/^["']|["']$/g,'');if(raw.startsWith('data:'))continue;
    const local=await download(new URL(raw,url).href);css=css.split(match[0]).join(`url("${local}")`);
   }
   data=Buffer.from(css);
  }
  await fs.writeFile(`${assetRoot}/${name}`,data);map[url]=`/${assetRoot.slice(7)}/${name}`;return map[url];
 })();pending.set(url,work);return work;
}
const urls=JSON.parse(await fs.readFile(`${root}/asset-urls.json`,'utf8'));
for(let i=0;i<urls.length;i+=6)await Promise.all(urls.slice(i,i+6).map(download));
await fs.writeFile(`${root}/asset-map.json`,JSON.stringify(map,null,2));
console.log('Saved',Object.keys(map).length,'assets');
const routes=JSON.parse(await fs.readFile(`${root}/routes.json`,'utf8'));
const page=await context.newPage();const manifest=[];
for(const r of routes){
 if(r.error||r.status!==200)throw Error('Uncaptured route '+r.route);
 if(r.route==='/')continue;
 const resolved=new URL(r.resolved).pathname;
 if(resolved!==r.route){manifest.push({route:r.route,redirect:resolved});continue}
 const data=JSON.parse(await fs.readFile(`${root}/${r.key}-1440.json`,'utf8'));
 // Captured page is parsed without executing its original application scripts.
 await page.setContent(data.html.replace(/<script\b[\s\S]*?<\/script>/gi,''));
 for(const src of await page.locator('img').evaluateAll(es=>es.map(e=>e.getAttribute('src'))))await download(new URL(src,'https://web3.magne.ai').href);
 const content=await page.evaluate(({map})=>{
  document.querySelectorAll('script,header,footer,style,link,meta,next-route-announcer,[hidden]').forEach(e=>e.remove());
  for(const el of document.querySelectorAll('*'))for(const a of [...el.attributes])if(/^on/i.test(a.name))el.removeAttribute(a.name);
  for(const img of document.images){
   const raw=img.getAttribute('src');const url=new URL(raw,'https://web3.magne.ai').href;
   const src=map[url];if(!src)throw Error('Missing image '+url);img.src=src;img.removeAttribute('srcset');img.removeAttribute('sizes');
  }
  for(const a of document.querySelectorAll('a[href]')){
   const href=new URL(a.getAttribute('href'),'https://web3.magne.ai');
   if(href.origin==='https://web3.magne.ai'){a.setAttribute('href',href.pathname+href.search+href.hash);a.removeAttribute('target')}
   else if(a.target==='_blank')a.rel='noopener noreferrer';
  }
  // Mark the actual captured controls for the small local interaction controller.
  let chain=0;
  for(const button of document.querySelectorAll('button')){
   if(button.textContent.trim()==='Copy'){button.setAttribute('data-action','copy');button.setAttribute('type','button')}
   if(button.textContent.trim()==='Add to MetaMask'){button.setAttribute('data-action','add-network');button.setAttribute('data-chain',String(chain++));button.setAttribute('type','button')}
  }
  return document.body.innerHTML;
 },{map});
 const file=`src/content/web3${r.route}.html`;
 await fs.mkdir(path.dirname(file),{recursive:true});
 // Never overwrite user-edited content on a later capture.
 try{await fs.writeFile(file,content,{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e}
 manifest.push({route:r.route,file,title:r.headings[0]||r.title,source:r.resolved,sourceKey:r.key});
}
await fs.mkdir('src/content/web3',{recursive:true});
await fs.writeFile('src/content/web3/routes.json',JSON.stringify(manifest,null,2));
await fs.writeFile(`${root}/asset-map.json`,JSON.stringify(map,null,2));
const fontStyle=Object.entries(map).find(([url])=>url.includes('489b77acbf0a2a6d.css'));
if(!fontStyle)throw Error('Missing source math/font stylesheet');
await fs.writeFile('src/app/document-fonts.css',await fs.readFile('public'+fontStyle[1]));
await fs.writeFile(`${root}/output-plan.md`,'# Full-site output plan\n\nExtend existing D:/magne.ai/web3-clone in place. Preserve approved homepage changes. Reconstruct all discovered public same-origin routes. 33 distinct article pages plus existing home, and 6 category redirects. Each article is editable at src/content/web3/<category>/<slug>.html; all assets local under public/sites/web3-magne-ai-9982170f/shared/full-site. Shared Header and Footer retained; same-origin links become local. Archive source snapshots under docs/research/full-site. No production deployment, no source backend claimed.\n');
await browser.close();console.log('Prepared',manifest.length,'route entries');
