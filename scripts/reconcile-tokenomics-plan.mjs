import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const out='docs/tokenomics-plan-reconciliation-20260930';
await fs.mkdir(out+'/before',{recursive:true});
const hashes={};
for(const dir of ['whitepaper','whitepaper-tc','archive-v1'])for(const file of await fs.readdir('src/content/'+dir,{recursive:true})){
 if(!file.endsWith('.html'))continue;
 const name='src/content/'+dir+'/'+file;hashes[name]=crypto.createHash('sha256').update(await fs.readFile(name)).digest('hex');
}
await fs.writeFile(out+'/before-hashes.json',JSON.stringify(hashes,null,2));
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();
for(const locale of ['en','tc']){
 const tc=locale==='tc';const t=(en,zh)=>tc?zh:en;const prefix=tc?'/tc':'';
 const base='src/content/'+(tc?'whitepaper-tc':'whitepaper');
 const manifest=JSON.parse(await fs.readFile(base+'/manifest.json','utf8'));
 const footer=`<footer class="token-footnote">${t('Version 1.1 · Draft updated 30 September 2026. Publication pending review.','版本 1.1 · 草稿更新於 2026 年 9 月 30 日。尚待審核發布。')}</footer>`;
 for(const name of ['tokenomics','tokenomics-changelog','tokenomics-announcement','tokenomics-zh']){
  const file=base+'/learning/'+name+'.html';let html=await fs.readFile(file,'utf8');
  await fs.copyFile(file,`${out}/before/${locale}-${name}.html.bak`);
  if(name==='tokenomics'){
   html=html.replace(/<div class="token-version">[\s\S]*?<\/div>/,`<aside class="token-revision-notice"><strong>${t('Version 1.1 — September 2026','版本 1.1 —— 2026 年 9 月')}</strong><span>${t('Execution rules & disclosure update · Review draft','執行規則與資訊披露更新 · 審核稿')}</span></aside>`);
   html=html.replace('Draft updated 29 September 2026','Draft updated 30 September 2026').replace('草稿更新於 2026 年 9 月 29 日','草稿更新於 2026 年 9 月 30 日');
  }
  if(name==='tokenomics-changelog'){
   const scope=t(
    'Draft updated 30 September 2026. Economic-rule changes are limited to Exchange Campaigns and Early Liquidity Market Makers. This is an execution-rule and disclosure update, not a reallocation, an increase in supply or an ad hoc unlock. The 10,000,000,000 MHA supply, all ten top-level allocations and the other eight categories’ release rules remain unchanged.',
    '草稿更新於 2026 年 9 月 30 日。經濟規則變更僅涉及交易所活動及早期流動性做市商。本次屬執行規則與資訊披露更新，不屬重新分配、增發或臨時解鎖。10,000,000,000 MHA 總供應量、十項一級分配及其餘八項釋放規則維持不變。');
   html=html.replace(tc?/<p>草稿更新於[\s\S]*?<\/p>/:/<p>Draft updated[\s\S]*?<\/p>/,`<p>${scope}</p>`);
   const record=`<h2 id="revision-record">${t('Revision record','版本紀錄')}</h2><div class="table-wrap" tabindex="0" role="region" aria-label="${t('Version record','版本紀錄表')}"><table><thead><tr><th>${t('Version','版本')}</th><th>${t('Date / status','日期 / 狀態')}</th><th>${t('Scope','範圍')}</th></tr></thead><tbody><tr><td>1.0</td><td>${t('Original publication date unconfirmed; archived 29 September 2026','原發布日期待確認；2026 年 9 月 29 日歸檔')}</td><td>${t('Original tokenomics and release rules','原始代幣經濟及釋放規則')}</td></tr><tr><td>1.1</td><td>${t('September 2026; review draft updated 30 September','2026 年 9 月；審核稿於 9 月 30 日更新')}</td><td>${t('Two execution-rule updates and dated post-TGE disclosures','兩項執行規則更新及附日期的 TGE 後披露')}</td></tr></tbody></table></div><h2 id="disclosure-reading-updates">${t('Additional disclosures and reading updates','補充披露與閱讀方式更新')}</h2><ul><li>${t('Clarifies the current BSC token form and planned migration to MAGNE L1 and M Hash L2; detailed migration arrangements will be announced separately.','釐清 MHA 現階段的 BSC 代幣形態及向 MAGNE L1、M Hash L2 遷移的計劃；具體安排另行公告。')}</li><li>${t('Lists the token contract and ten project-disclosed BSC allocation reserve addresses, with source links.','列出代幣合約及十項由項目披露的 BSC 分配儲備地址，附來源連結。')}</li><li>${t('Adds bilingual code-drawn allocation figures, nested navigation and expandable rules; these presentation changes do not alter economic terms.','加入雙語程式繪製分配圖、二級目錄及可展開規則；呈現方式調整不改變經濟條款。')}</li></ul><p>${t('The execution snapshot remains 28 September 2026, 17:56:21 UTC, BSC block 124,568,474. The draft update date and address-register check date do not refresh that historical snapshot.','執行快照維持 2026 年 9 月 28 日 17:56:21 UTC、BSC 區塊 124,568,474。草稿更新日期及地址核對日期不代表歷史快照已更新。')}</p><p><a href="${prefix}/learning/tokenomics-announcement">${t('Read the announcement draft','閱讀公告草稿')}</a> · <a href="https://w3.magne.ai/mha-supply.html">${t('Latest supply disclosure','最新供應量披露')}</a></p>`;
   html=html.replace('<h2 id="section-1">',record+'<h2 id="section-1">')+footer;
  }
  if(name==='tokenomics-announcement'){
   html=`<nav class="token-version-links"><a href="${prefix}/learning/tokenomics">← ${t('Tokenomics v1.1','代幣經濟 v1.1')}</a><a href="/v1.0/learning/tokenomics">${t('v1.0 archive','v1.0 歸檔')}</a></nav><h1 id="section-0">${t('Tokenomics v1.1 update','代幣經濟 v1.1 更新')}</h1><p>${t('September 2026 · Announcement draft','2026 年 9 月 · 公告草稿')}</p><p>${t('This revision updates the execution rules for Exchange Campaigns and Early Liquidity Market Makers and adds dated post-TGE disclosures. It is not a reallocation, an increase in supply or an ad hoc unlock. The 10,000,000,000 MHA supply, all top-level allocations and the release rules of the other eight categories remain unchanged.','本次修訂更新交易所活動及早期流動性做市商的執行規則，並加入附日期的 TGE 後披露。本次不屬重新分配、增發或臨時解鎖。10,000,000,000 MHA 總供應量、所有一級分配及其餘八項釋放規則維持不變。')}</p><p>${t('At the disclosed snapshot — 28 September 2026, 17:56:21 UTC, BSC block 124,568,474 — Exchange Campaigns had outflows of 76,250,500 MHA and a remaining reserve of 23,749,500 MHA. The 25,000,000 MHA initial liquidity deployment came from Exchange Campaigns; the separate 700,000,000 MHA market-making reserve remained intact. Transfer purposes are project-provided classifications.','截至披露快照——2026 年 9 月 28 日 17:56:21 UTC、BSC 區塊 124,568,474——交易所活動分配已轉出 76,250,500 MHA，剩餘儲備為 23,749,500 MHA。25,000,000 MHA 初始流動性來自交易所活動分配；獨立的 700,000,000 MHA 做市儲備維持完整。轉帳用途依項目提供的分類披露。')}</p><p>${t('MHA currently exists as a token on BNB Smart Chain. Migration and integration into MAGNE L1 and M Hash L2 are planned; the method, schedule and holder instructions will be announced separately. The whitepaper also lists the current contract and ten disclosed reserve addresses.','MHA 現階段以 BNB Smart Chain 上的代幣形式存在。項目計劃向 MAGNE L1 及 M Hash L2 遷移與整合；方式、時間及持有人操作指引將另行公告。白皮書同時列出現行合約及十個披露儲備地址。')}</p><p><a href="${prefix}/learning/tokenomics">${t('Read Tokenomics v1.1','閱讀代幣經濟 v1.1')}</a> · <a href="${prefix}/learning/tokenomics-changelog">${t('Revision history and comparison','修訂紀錄與新舊對照')}</a> · <a href="https://w3.magne.ai/mha-supply.html">${t('Latest Supply Evidence','最新供應量披露')}</a> · <a href="https://w3.magne.ai/api/v1/mha/supply">Supply API</a></p>${footer}`;
  }
  if(name==='tokenomics-zh'){
   html=html.replace('<p>本頁為新增及替換章節的中文對照；未變更章節請參閱完整英文白皮書。</p>','<p>本頁為 Tokenomics v1.1 的中文修訂摘要，並非另一份獨立白皮書。完整正文提供<a href="/tc/learning/tokenomics">繁體中文版</a>及<a href="/learning/tokenomics">英文版</a>；修訂範圍與日期以<a href="'+prefix+'/learning/tokenomics-changelog">修訂紀錄</a>為準。</p>');
   html+=footer;
  }
  await fs.writeFile(file,html);
  await page.setContent(html);
  const data=await page.evaluate(()=>({text:document.body.textContent.replace(/\s+/g,' ').trim(),toc:[...document.querySelectorAll('h2,h3')].filter(h=>h.id).map(h=>({id:h.id,title:h.textContent.trim(),level:h.tagName}))}));
  const entry=manifest.find(d=>d.file==='learning/'+name+'.html');entry.text=data.text;
  if(name!=='tokenomics')entry.toc=data.toc;
 }
 await fs.writeFile(base+'/manifest.json',JSON.stringify(manifest,null,2));
 await fs.writeFile(base+'/search.json',JSON.stringify(manifest.map(({route,title,text})=>({route,title,text}))));
}
await browser.close();
console.log('Reconciled eight Tokenomics/revision documents; economic rule bodies retained.');
