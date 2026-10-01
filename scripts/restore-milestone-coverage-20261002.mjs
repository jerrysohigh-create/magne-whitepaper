import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/milestone-coverage-20261002';await fs.mkdir(out,{recursive:true});
const old='/v1.0/learning/milestone';
const compliance='https://www.magne.ai/en/compliance.html';
const progress='https://www.magne.ai/en/progress.html';
const security=[
 ['2023-12-12',['UTEE · CC EAL2+','UTEE · CC EAL2+'],['Original disclosure · controlled evidence','原披露 · 證據受控'],['Trusted execution environment evaluation; not a whole-phone certificate.','可信執行環境評估，不是整機認證。'],[[old,'v1.0'],[compliance,'MAG1 · Compliance']]],
 ['2024-05-28',['HyperSeed N60 · CC EAL6+','HyperSeed N60 · CC EAL6+'],['Original disclosure · controlled evidence','原披露 · 證據受控'],['Secure-component reference; the evaluated part and configuration require the certificate mapping.','安全元件認證參考；受評元件及配置須核對證書對應關係。'],[[old,'v1.0'],[compliance,'MAG1 · Compliance']]],
 ['2025-09-05',['HyperSeed 72B · CC EAL6+','HyperSeed 72B · CC EAL6+'],['Original disclosure · controlled evidence','原披露 · 證據受控'],['Secure-element reference used in the NFC recovery architecture.','NFC 恢復架構所引用的安全元件認證。'],[[old,'v1.0'],[compliance,'MAG1 · Compliance']]],
];
const hardware=[
 ['2025-09-09',['Manufacturing supply-chain access started','製造供應鏈導入啟動'],['Company disclosure','公司披露'],['Stage record; not a shipment milestone.','階段記錄，不等同出貨。'],[[progress,'MAGNE.AI · Progress']]],
 ['2025-09-15',['Trial-production and manufacturing cooperation started','試產製造合作啟動'],['Company disclosure','公司披露'],['Supporting records remain under controlled due diligence.','支持文件仍採受控盡職調查查閱。'],[[progress,'MAGNE.AI · Progress']]],
 ['2025-09-20',['Widevine L1 approval record','Widevine L1 批准記錄'],['Original date · verification pending','原披露日期 · 待核對'],['The old whitepaper gives this date; the current compliance index includes Widevine materials. Approval date and build scope require the original record; do not substitute the later GMS chronology date.','舊白皮書列此日期；現行合規索引有 Widevine 資料。批准日期及版本範圍須核對原記錄，不直接套用後來的 GMS 時間軸日期。'],[[old,'v1.0'],[compliance,'MAG1 · Compliance']]],
 ['2025-09-30',['PRE EVT technical-development stage started','PRE EVT 技術開發階段啟動'],['Company disclosure','公司披露'],['Development start is separate from P0 acceptance.','技術開發啟動與 P0 驗收分開記錄。'],[[progress,'MAGNE.AI · Progress']]],
 ['2025-12-19',['OEM / ODM production-contract record','OEM／ODM 生產合約記錄'],['Historical disclosure · reconciliation pending','歷史披露 · 待對齊'],['Restored from v1.0. Its relationship to the September cooperation stages requires controlled records; no contract terms or newly verified signing claim are disclosed.','按 v1.0 恢復。與 9 月合作階段的關係須以受控文件對齊；不披露合約條款，也不列作本次已重新核驗簽署。'],[[old,'v1.0'],[progress,'MAGNE.AI · Progress']]],
];
const network=[
 ['2025-10-20',['Testnet faucet / gas provision','測試網水龍頭／Gas 供應'],['Original date · testnet only','原披露日期 · 僅限測試網'],['The v1.0 date is retained as a historical record, not a live endpoint-availability test or mainnet service claim.','保留 v1.0 日期作歷史記錄；不代表本次已測試端點即時可用性或主網服務。'],[[old,'v1.0'],['https://w3.magne.ai/network.html','W3 · Network']]],
 ['2025-10-22',['Developer documentation v1','開發者文件 v1'],['Original disclosure','原披露'],['RPC, network settings and tools were recorded in v1.0; first-publication timestamp still requires the source history.','v1.0 記錄 RPC、網絡設定與工具文件；首次發布時間戳仍須核對來源歷史。'],[[old,'v1.0'],['https://w3.magne.ai/network.html','W3 · Network']]],
];
await fs.writeFile(out+'/restored-records.json',JSON.stringify({reviewed:'2026-10-02',security,hardware,network,notes:['EAL dates restored as prior project disclosures, not independently verified certificate issue dates.','Expired production/mainnet plans remain pending; obsolete pre-TGE preparation items are not reinstated as current milestones.']},null,2));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{const page=await browser.newPage();for(const tc of [false,true]){
 const base=`src/content/${tc?'whitepaper-tc':'whitepaper'}`;const path=base+'/learning/milestone.html';let html=await fs.readFile(path,'utf8');
 await fs.writeFile(`${out}/${tc?'tc':'en'}-before.html`,html,{flag:'wx'});
 const t=(en,zh)=>tc?zh:en;const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');const pair=x=>esc(x[tc?1:0]);
 const rows=data=>data.map(([date,title,status,note,links])=>`<tr><th scope="row">${date}</th><td><strong>${pair(title)}</strong><p>${pair(note)}</p></td><td>${pair(status)}<p>${links.map(([href,label])=>`<a href="${esc(href)}">${esc(label)}</a>`).join(' · ')}</p></td></tr>`).join('');
 const title=t('Component security · certification history','元件安全 · 認證歷史');
 const intro=t('Dates below come from the original whitepaper’s OEM/ODM-mapped disclosures. Current official pages retain the EAL references but keep certificate originals under controlled review. These exact days are not independently reverified issue dates. Certificate identity, holder, evaluated version, scope and augmented assurance components require the originals; this is not whole-device EAL certification.','以下日期來自原白皮書對應 OEM／ODM 的披露；現行官網保留 EAL 參考資料，證書原件採受控查閱。本次未獨立核驗具體簽發日；證書編號、持有人、受評版本、範圍與「+」增強項須以原件核對，不延伸為整機同等 EAL 認證。');
 const block=`<h2 id="security-certifications">${title}</h2><p>${intro}</p><div class="table-wrap" role="region" tabindex="0" aria-label="${title}"><table><caption>${title}</caption><thead><tr><th scope="col">${t('Originally disclosed date','原披露日期')}</th><th scope="col">${t('Component / scope','元件／範圍')}</th><th scope="col">${t('Evidence / source','證據／來源')}</th></tr></thead><tbody>${rows(security)}</tbody></table></div>`;
 html=html.replace('<h2 id="section-1">',block+'<h2 id="section-1">');
 html=html.replace('<a href="#section-1">',`<a href="#security-certifications">${t('Component security','元件安全')}</a><a href="#section-1">`);
 const appendix=t('The three EAL records are restored above with their original disclosed dates. Widevine L1, OEM/ODM, faucet and developer-document dates are also preserved with their evidence limits. P0 development and acceptance are separate milestones; historical 2024–2025 joint-R&D windows are not treated as the later P0 acceptance date. Old pre-TGE DD, liquidity coordination and readiness items remain historical preparation, not new completed events.','三項 EAL 記錄已於上方按原披露日期恢復；Widevine L1、OEM／ODM、水龍頭及開發文件日期亦保留並標明證據範圍。P0 開發與驗收分開記錄；舊稿 2024–2025 聯合研發期間不視為後來 P0 驗收日期。舊版 TGE 前盡調、流動性協調及準備清單仍屬歷史籌備，不重新列作新增已完成事件。');
 html=html.replace('<h2 id="date-notes">',`<p>${appendix}</p><h2 id="date-notes">`);
 html=html.replaceAll('1 October 2026','2 October 2026').replaceAll('2026 年 10 月 1 日','2026 年 10 月 2 日');
 await page.setContent(html);
 await page.evaluate(({hardware,network})=>{
  for(const [id,newRows] of [['section-1',hardware],['section-2',network]]){
   const body=document.getElementById(id).nextElementSibling.querySelector('tbody');body.insertAdjacentHTML('beforeend',newRows);
   [...body.rows].sort((a,b)=>a.cells[0].textContent.localeCompare(b.cells[0].textContent)).forEach(row=>body.append(row));
  }
 },{hardware:rows(hardware),network:rows(network)});
 const data=await page.evaluate(()=>({html:document.body.innerHTML,title:document.querySelector('h1').textContent.trim(),toc:[...document.querySelectorAll('h2,h3')].map(h=>({id:h.id,title:h.textContent.trim(),level:h.tagName})),text:document.body.textContent.replace(/\s+/g,' ').trim()}));
 await fs.writeFile(path,data.html);
 const manifest=JSON.parse(await fs.readFile(base+'/manifest.json','utf8'));Object.assign(manifest.find(d=>d.route==='/learning/milestone'),{title:data.title,toc:data.toc,text:data.text});await fs.writeFile(base+'/manifest.json',JSON.stringify(manifest,null,2));
 const search=JSON.parse(await fs.readFile(base+'/search.json','utf8'));Object.assign(search.find(d=>d.route==='/learning/milestone'),{title:data.title,text:data.text});await fs.writeFile(base+'/search.json',JSON.stringify(search));
} }finally{await browser.close();}
console.log('Restored 10 records across both locales, including 3 EAL dates; navigation and search refreshed.');
