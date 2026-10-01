import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const base='docs/localization-tc';
const docs=JSON.parse(await fs.readFile(base+'/segments.json','utf8'));
const lines=(await fs.readFile(base+'/translations.tsv','utf8')).replace(/^\uFEFF/,'').trim().split(/\r?\n/);
const translations=new Map(lines.map(line=>{const i=line.indexOf('\t');if(i<1)throw Error('Invalid translation row');return[Number(line.slice(0,i)),line.slice(i+1)];}));
const normalize=s=>s.trim().replace(/\s+/g,' ');
const bySource=new Map(docs.flatMap(d=>d.units).filter(u=>translations.has(u.id)).map(u=>[normalize(u.html),translations.get(u.id)]));
const technicalIds=new Set([19,48,50,57,59,61,63,64,65,67,69,71,73,75,248,249,250,251,362,363,364,369,370,371,404,405,407,408,415,416,417,419,420,421,423,424,425,439,440,441,443,444,445,447,448,449,451,453,515,519,656,668,780,784,883,894,903,907,913,918,923,924,925,926,927,1076,1077,1080,1081,1103,1114,1126,1139,1286,1289,1305,1315,1339,1340,1350,1402,1403,1404,1405,1415]);
const b=await chromium.launch({channel:'msedge'});const p=await b.newPage();const manifest=[];const report=[];
try{
for(const doc of docs){
 const units=doc.units.map(u=>{const html=translations.get(u.id)??bySource.get(normalize(u.html))??((technicalIds.has(u.id)||/[\u3400-\u9fff]/.test(u.text))?u.html:null);if(html===null)throw Error('Untranslated unit '+u.id);return{local:u.local,html};});
 await p.setContent(await fs.readFile(base+'/templates/'+doc.file,'utf8'));
 const result=await p.evaluate(({units,route})=>{
  for(const u of units){const el=document.querySelector(`[data-tc-unit="${u.local}"]`);if(!el)throw Error('Missing unit '+u.local);el.innerHTML=u.html;}
  document.querySelectorAll('[data-tc-unit]').forEach(e=>e.removeAttribute('data-tc-unit'));
  // These three source fragments are prose accidentally rendered as math.
  // Preserve genuine equations and code; translate only these exact fragments.
  const proseMath = {
   'MHA” (e.g., 10 USDC/': 'MHA 對應 X 枚代幣」（例如 10 USDC/',
   'MHA, and a miner with 5% commission directs 1 ': 'MHA 支付 100 USDC，而佣金比例為 5% 的礦工導入價值 1 ',
   'USDC for ': 'USDC 換成 ',
  };
  document.querySelectorAll('.katex annotation').forEach(a=>{
   const entry=Object.entries(proseMath).find(([source])=>source.trim()===a.textContent.trim());
   if(entry)a.closest('.katex').replaceWith(document.createTextNode(entry[1]));
  });
  document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(/^\/(learning|developers|solutions|networks|help|community)(\/|$)/.test(h))a.setAttribute('href',h==='/learning/tokenomics-v1-0'?'/v1.0/learning/tokenomics':'/tc'+h);});
  document.querySelectorAll('button[data-action="copy"]').forEach(e=>e.textContent='複製');
  document.querySelectorAll('img').forEach(e=>{if(!e.alt||e.alt==='image.png'||e.alt==='MAGNE.AI documentation illustration')e.alt='MAGNE.AI 技術文件插圖';});
  document.querySelectorAll('[aria-label]').forEach(e=>{const map={'Tokenomics versions':'代幣經濟版本','On this page':'本頁目錄'};if(map[e.getAttribute('aria-label')])e.setAttribute('aria-label',map[e.getAttribute('aria-label')]);});
  const title=document.querySelector('h1')?.textContent.trim()||route;
  const major=[...document.querySelectorAll('.token-toc a')].map(a=>({id:a.hash.slice(1),title:a.textContent.trim(),level:'H2'}));
  const toc=major.length?major:[...document.querySelectorAll('h1,h2,h3')].slice(1).map(h=>({id:h.id,title:h.textContent.trim(),level:h.tagName}));
  return {title,toc,html:document.body.innerHTML,text:document.body.textContent.replace(/\s+/g,' ').trim()};
 },{units,route:doc.route});
 await fs.mkdir('src/content/whitepaper-tc/'+doc.file.split('/')[0],{recursive:true});
 await fs.writeFile('src/content/whitepaper-tc/'+doc.file,result.html);
 manifest.push({route:doc.route,file:doc.file,title:result.title,toc:result.toc,text:result.text});
 const source=await fs.readFile('src/content/whitepaper/'+doc.file,'utf8');
 report.push({route:doc.route,units:units.length,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),translationSha256:crypto.createHash('sha256').update(result.html).digest('hex')});
}
await fs.writeFile('src/content/whitepaper-tc/manifest.json',JSON.stringify(manifest,null,2));
await fs.writeFile('src/content/whitepaper-tc/search.json',JSON.stringify(manifest.map(({route,title,text})=>({route,title,text}))));
await fs.writeFile(base+'/coverage.json',JSON.stringify({documents:report,units:docs.flatMap(d=>d.units).length,untranslated:0,technicalIdentifiersRetained:technicalIds.size},null,2));
console.log(`Built ${manifest.length} Traditional Chinese documents; all translation units accounted for.`);
}finally{await b.close();}
