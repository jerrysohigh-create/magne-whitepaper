import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const routes=JSON.parse(await fs.readFile('src/content/web3/routes.json','utf8'));
const checks=JSON.parse(await fs.readFile('docs/research/full-site/browser-checks.json','utf8'));
const allowed=new Set(['/',...routes.map(r=>r.route)]);
const missing=[...new Set(checks.flatMap(r=>r.links||[]).filter(link=>link.startsWith('http://127.0.0.1:4173')).map(link=>new URL(link).pathname).filter(route=>!allowed.has(route)))];
if(missing.length)throw Error('Missing internal links: '+missing.join(','));
const files=routes.filter(r=>r.file);let contentBytes=0;
for(const {file} of files){const html=await fs.readFile(file,'utf8');contentBytes+=Buffer.byteLength(html);if(/<script\b|\son\w+=|https:\/\/web3\.magne\.ai/i.test(html))throw Error('Unexpected script or source dependency '+file)}
const b=await chromium.launch({channel:'msedge'});const p=await b.newPage();
const file='src/content/web3/help/contact.html',original=await fs.readFile(file,'utf8');
let editRefresh=false;
try{
 await fs.writeFile(file,original+'<!-- local-edit-check-20260929 -->');
 const res=await p.goto('http://127.0.0.1:4173/help/contact');
 editRefresh=(await res.text()).includes('<!-- local-edit-check-20260929 -->');
 if(!editRefresh)throw Error('Development refresh did not pick up content edit');
}finally{await fs.writeFile(file,original)}
const res=await p.goto('http://127.0.0.1:4173/no-such-local-page');if(res.status()!==404)throw Error('Unknown route is not 404');
await b.close();
const result={articleFiles:files.length,categoryRedirects:routes.filter(r=>r.redirect).length,contentBytes,allInternalLinksResolve:true,inlineScripts:false,sourceOriginAssetDependency:false,developmentEditsVisibleAfterRefresh:editRefresh,unknownRoute404:true};
await fs.writeFile('docs/research/full-site/content-checks.json',JSON.stringify(result,null,2));console.log(result);
