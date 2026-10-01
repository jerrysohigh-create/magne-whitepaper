import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const root='docs/tokenomics-v11';
await fs.mkdir(`${root}/before`,{recursive:true});
const targets=['src/content/web3/learning/tokenomics.html','src/content/web3/routes.json','src/app/documents.css'];
for(const file of targets){const backup=`${root}/before/${file.split('/').pop()}`;try{await fs.copyFile(file,backup,1)}catch(e){if(e.code!=='EEXIST')throw e}}
const original=await fs.readFile(`${root}/before/tokenomics.html`,'utf8');
const en=await fs.readFile('D:/magne.ai/tokenomics-v1.1/replacement-en.html','utf8');
const zh=await fs.readFile('D:/magne.ai/tokenomics-v1.1/replacement-zh.html','utf8');
const browser=await chromium.launch({channel:'msedge'});const page=await browser.newPage();
await page.setContent(original);
const result=await page.evaluate(({en,zh})=>{
 const article=[...document.querySelectorAll('div.flex-1')].find(e=>e.querySelector('h1'));
 if(!article)throw Error('Missing source article');
 const draft=new DOMParser().parseFromString(en,'text/html').body;
 function section(body,name){const h=[...body.querySelectorAll('h1')].find(e=>e.textContent.trim()===name);if(!h)throw Error(name);const nodes=[h];let el=h.nextSibling;while(el&&el.nodeName!=='H1'&&!(el.nodeName==='H2'&&el.textContent==='Early Supporters and campaign clarification')){nodes.push(el);el=el.nextSibling}return nodes}
 const preserved={};for(const h of article.querySelectorAll(':scope > h1')){const name=h.textContent.trim();if(['Tokenomics','MAGNE.AI Tokenomics','Overview','Early Liquidity Market Makers','Exchange Campaigns'].includes(name))continue;let n=h.nextSibling,s='';while(n&&n.nodeName!=='H1'){s+=n.textContent;n=n.nextSibling}preserved[name]=s}
 for(const name of ['Early Liquidity Market Makers','Exchange Campaigns']){
  const old=section(article,name),replacement=section(draft,name);
  // Exchange draft also contains revision notes after its execution table; cut before them.
  const fragment=document.createDocumentFragment();replacement.forEach(n=>fragment.append(n.cloneNode(true)));
  old[0].before(fragment);old.forEach(n=>n.remove());
 }
 // The two replacements are bounded by their original top-level headings.
 for(const [name,text] of Object.entries(preserved)){const h=[...article.querySelectorAll(':scope > h1')].find(e=>e.textContent.trim()===name);let n=h.nextSibling,s='';while(n&&n.nodeName!=='H1'){s+=n.textContent;n=n.nextSibling}if(s!==text)throw Error('Unrelated section changed: '+name)}
 article.classList.add('tokenomics-v11');
 const top=[...article.querySelectorAll(':scope > h1')];top.filter(e=>['Tokenomics','MAGNE.AI Tokenomics'].includes(e.textContent.trim())).forEach(e=>e.remove());
 const overview=[...article.querySelectorAll(':scope > h1')].find(e=>e.textContent.trim()==='Overview');overview.id='allocation';
 const headings=[...article.querySelectorAll(':scope > h1')];
 headings.forEach((h,i)=>{h.id ||= 'allocation-'+i});
 const toc='<nav class="token-toc" aria-label="On this page"><strong>ON THIS PAGE</strong><div>'+headings.map(h=>`<a href="#${h.id}">${h.textContent.trim()}</a>`).join('')+'<a href="#execution-snapshot">Execution snapshot</a><a href="#campaign-notes">Campaign clarification</a></div></nav>';
 const intro=`<div class="token-version"><span>WHITEPAPER / TOKENOMICS</span><span>v1.1 · SEPTEMBER 2026 · REVIEW DRAFT</span></div><h1 class="token-title">MHA Tokenomics</h1><p class="token-lead">Allocation, release rules and post-TGE execution disclosures.</p><p>This update aligns the Exchange Campaigns and Early Liquidity Market Makers implementation rules with post-TGE execution and disclosed on-chain records. It does not change the total supply or any top-level allocation percentage.</p><div class="token-facts"><div><span>TOTAL SUPPLY</span><strong>10,000,000,000 MHA</strong></div><div><span>TGE · UTC</span><strong>17 Sep 2026 · 12:00</strong></div><div><span>ALLOCATION</span><strong>10 categories · unchanged</strong></div></div><nav class="token-version-links" aria-label="Tokenomics versions"><a href="/learning/tokenomics-changelog">Revision history</a><a href="/learning/tokenomics-v1-0">View v1.0 archive</a><a href="/learning/tokenomics-zh">中文修訂說明</a><a href="/learning/tokenomics-announcement">Update announcement</a></nav>${toc}`;
 article.insertAdjacentHTML('afterbegin',intro);
 const snap=[...article.querySelectorAll('h2')].find(e=>e.textContent==='Post-TGE execution disclosure');snap.id='execution-snapshot';
 const support=[...draft.querySelectorAll('h2')].find(e=>e.textContent==='Early Supporters and campaign clarification');
 let n=support,notes='';while(n&&n.nodeName!=='DIV'){notes+=n.outerHTML||n.textContent;n=n.nextSibling}
 article.insertAdjacentHTML('beforeend',`<section id="campaign-notes" class="token-notes">${notes}</section><footer class="token-footnote">Version 1.1 · Draft updated 29 September 2026. Balances are a dated snapshot, not live values. Latest: <a href="https://w3.magne.ai/mha-supply.html">Supply Evidence</a> / <a href="https://w3.magne.ai/api/v1/mha/supply">Supply API</a>. Publication pending review.</footer>`);
 const comparison=draft.querySelector('.table-wrap:last-of-type')?.outerHTML||'';
 const shell=article.parentElement.parentElement.parentElement;
 const full=document.body.innerHTML;
 function related(content,lang='en'){const copy=shell.cloneNode(true);const a=copy.querySelector('div.flex-1');a.className=article.className;a.setAttribute('lang',lang);a.innerHTML='<nav class="token-version-links"><a href="/learning/tokenomics">← Tokenomics v1.1</a><a href="/learning/tokenomics-v1-0">v1.0 archive</a></nav>'+content;return copy.outerHTML}
 const history=related('<h1>Revision history</h1><p>Version 1.1 · September 2026 · Review draft</p><p>Draft updated 29 September 2026. Only the two execution-rule sections have been replaced; all top-level allocations and other vesting rules are unchanged. The purpose is to align disclosed execution with post-TGE implementation.</p>'+comparison+'<h2>Version 1.0 archive</h2><p>The original publication date has not been established. The original page was captured on 29 September 2026 (Asia/Shanghai); v1.0 is the archive designation for this revision.</p><a href="/learning/tokenomics-v1-0">Read the original version</a>');
 const chinese=related('<h1>Tokenomics v1.1 · 中文修訂說明</h1><p>本頁為新增及替換章節的中文對照；未變更章節請參閱完整英文白皮書。</p>'+zh,'zh-Hant');
 const announcement=related('<h1>Tokenomics v1.1 update</h1><p>September 2026 · Announcement draft</p><p>This revision updates Exchange Campaigns and Early Liquidity Market Makers execution rules and adds dated post-TGE disclosures. The 10,000,000,000 MHA total supply and all top-level allocations remain unchanged.</p><p>本次更新僅調整兩個章節的執行規則及相關披露，不改變總供應量或一級分配。</p><p><a href="/learning/tokenomics">Read Tokenomics v1.1</a> · <a href="/learning/tokenomics-changelog">Revision history</a> · <a href="/learning/tokenomics-zh">中文修訂說明</a></p>');
 return {full,history,chinese,announcement,preserved:Object.keys(preserved)};
},{en,zh});
await browser.close();
await fs.writeFile(targets[0],result.full);
const pages=[['tokenomics-v1-0','Tokenomics v1.0 archive',original],['tokenomics-changelog','Tokenomics revision history',result.history],['tokenomics-zh','Tokenomics 中文修訂說明',result.chinese],['tokenomics-announcement','Tokenomics v1.1 update',result.announcement]];
const routes=JSON.parse(await fs.readFile(`${root}/before/routes.json`,'utf8'));
for(const [slug,title,html] of pages){const file=`src/content/web3/learning/${slug}.html`;await fs.writeFile(file,html);routes.push({route:`/learning/${slug}`,file,title})}
await fs.writeFile(targets[1],JSON.stringify(routes,null,2));
await fs.writeFile(`${root}/preservation-check.json`,JSON.stringify({unchangedSections:result.preserved,originalArchiveExact:true},null,2));
console.log(result.preserved);
