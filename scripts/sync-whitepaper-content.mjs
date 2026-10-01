// Refresh navigation and search after editing either v1.1 language. Never touches v1.0.
import fs from 'node:fs/promises';
import {parseHTML} from 'linkedom';
const requested=process.argv[2]??'both';
if(!['en','tc','both'].includes(requested))throw Error('Usage: node scripts/sync-whitepaper-content.mjs [en|tc|both]');
 for(const locale of requested==='both'?['en','tc']:[requested]){
 const base=locale==='tc'?'src/content/whitepaper-tc':'src/content/whitepaper';
 const manifest=JSON.parse(await fs.readFile(base+'/manifest.json','utf8'));
 for(const doc of manifest){
  const {document}=parseHTML('<!doctype html><html><body>'+await fs.readFile(base+'/'+doc.file,'utf8')+'</body></html>');
  const data=(()=>{
   document.querySelectorAll('h1,h2,h3').forEach((h,i)=>{if(!h.id)h.id='section-'+i;});
   const major=[...document.querySelectorAll('.token-toc a')].map(a=>({id:a.getAttribute('href').split('#')[1],title:a.textContent.trim(),level:'H2'}));
   const toc=major.length?major:[...document.querySelectorAll('h1,h2,h3')].slice(1).map(h=>({id:h.id,title:h.textContent.trim(),level:h.tagName}));
   return {html:document.body.innerHTML,title:document.querySelector('h1')?.textContent.trim(),toc,text:document.body.textContent.replace(/\s+/g,' ').trim()};
  })();
  doc.title=data.title||doc.title;doc.toc=data.toc;doc.text=data.text;
  await fs.writeFile(base+'/'+doc.file,data.html);
 }
 await fs.writeFile(base+'/manifest.json',JSON.stringify(manifest,null,2));
 await fs.writeFile(base+'/search.json',JSON.stringify(manifest.map(({route,title,text})=>({route,title,text}))));
 console.log('Refreshed '+manifest.length+' '+locale+' v1.1 documents; v1.0 archive untouched.');
 }
