import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='docs/gen1-copy-20261001';await fs.mkdir(out,{recursive:true});
const tcPairs=[
 ['版本 1.1 —— 2026 年 9 月','版本 1.1 —— 2026 年 10 月審核稿'],
 ['版本 1.1 · 2026 年 9 月 · 審核稿','版本 1.1 · 2026 年 10 月 · 審核稿'],
 ['2026 年 9 月 · 公告草稿','2026 年 10 月 · 公告草稿'],
 ['版本 1.1——2026 年 9 月','版本 1.1——2026 年 10 月審核稿'],
 ['同比縮減','按比例縮減'],
 ['全額預算設備基準','全額預算對應設備數'],
 ['本版 GEN1 草案取代舊有按 ECU 權重分完當期預算、自願鎖定／質押加成及重複在線率扣減的設計','本版 GEN1 草案改採可用性與有效任務分開計酬，不沿用舊版按 ECU 權重分配全部當期預算、自願鎖定／質押加成及重複在線率扣減的設計'],
 ['40% 即時＋60% 分三個月等額解鎖，包含賺取當月','獎勵核定後 40% 可領取；其餘 60% 分三期等額解鎖，首期計入獎勵所屬月份'],
 ['Nₘ = 0 時預算與獎勵均為零。','Nₘ = 0 時，Cₘ、Pₘ 及當期新增獎勵均定義為零，不執行除以零的運算；既有獎勵仍依原解鎖時程處理。'],
 ['A 為經核驗可用時間佔完整結算月的比例。','A 為經核驗、符合服務要求且可接受任務的時間，佔完整結算月的比例；僅開機或連接網絡不等於通過可用性核驗。'],
 ['未使用的任務獎勵不為發完預算而重新分配。','未使用的任務預算不自動分配予其他設備。'],
 ['三個月線性解鎖包含賺取當月：每批獎勵當月釋放 60%（40% 即時＋首期 20%），其後兩個月各釋放 20%。','本模型以獎勵所屬月份為解鎖起算月：獎勵核定後，40% 可領取，其餘 60% 分三期、每期 20% 解鎖，首期計入同月。因此按月統計為首月 60%、次月 20%、第三月 20%。實際核定與領取日期須依啟用公告執行，不表示任務完成時即時轉帳。'],
 ['同一批固定 5,000、10,000 或 13,750 台同等 GEN1 設備','分別假設同一批固定 5,000 台、10,000 台或 13,750 台同等 GEN1 設備'],
 ['若 W = 0，則為 4,000 MHA。','若全期仍維持 A = 1、但 W = 0，則為 4,000 MHA。'],
 ['尾款釋放','剩餘獎勵解鎖'],['既有獎勵尾款','既有獎勵剩餘解鎖'],['M37–M38 尾款','M37–M38 剩餘獎勵解鎖'],
 ['M36 以前已賺取獎勵','截至 M36（含當月）已賺取獎勵'],
 ['以下兩行僅追蹤','以下兩行的新增賺取欄設為零，僅用於追蹤'],
 ['全期可用性與有效任務均達參考能力 100%','全期通過可用性核驗且有效任務量達到全月參考任務能力的 100%'],
 ['本次屬執行規則與資訊披露更新，不屬重新分配、增發或臨時解鎖。','本次包含 GEN1 獎勵規則草案、交易所執行規則及資訊披露更新，不改變代幣總供應量或一級分配比例。'],
 ['本次修訂更新交易所活動及早期流動性做市商的執行規則，並加入附日期的 TGE 後披露。','本次修訂新增 GEN1 獎勵機制草案，更新交易所活動及早期流動性做市商的執行規則，並加入附日期的 TGE 後披露。'],
];
const enPairs=[
 ['Version 1.1 — September 2026','Version 1.1 — October 2026 review draft'],
 ['Version 1.1 · September 2026 · Review draft','Version 1.1 · October 2026 · Review draft'],
 ['September 2026 · Announcement draft','October 2026 · Announcement draft'],
 ['40% immediate + 60% in three equal monthly installments, including the earning month','40% claimable after reward approval; 60% in three equal installments, the first assigned to the earning month'],
 ['When Nₘ = 0, both budget and reward are zero.','When Nₘ = 0, Cₘ, Pₘ and newly earned rewards are defined as zero without dividing by zero; previously earned batches retain their vesting schedule.'],
 ['A is verified availability as a fraction of the entire settlement month.','A is the fraction of the entire settlement month during which a device is verified to meet service requirements and be ready to accept tasks. Powering on or connecting to the internet alone does not qualify.'],
 ['The three-month linear portion includes the earning month: each earned batch releases 60% in that month (40% immediate + the first 20% installment), then 20% in each of the next two months.','Vesting is indexed to the month in which a reward is earned. After approval, 40% is claimable and the remaining 60% vests in three equal installments, with the first assigned to the same month. The monthly model therefore releases 60%, then 20%, then 20%. Actual approval and claim dates must follow the launch announcement; task completion does not imply an immediate transfer.'],
 ['with W = 0 it is 4,000 MHA.','with A = 1 and W = 0 throughout, it is 4,000 MHA.'],
 ['These two rows isolate vesting of rewards earned through M36.','The newly earned column is set to zero in these two rows solely to isolate vesting of rewards earned through M36, inclusive.'],
 ['This is an execution-rule and disclosure update, not a reallocation, an increase in supply or an ad hoc unlock.','This update includes a GEN1 reward proposal, exchange execution rules and disclosures, without changing total supply or top-level allocation percentages.'],
 ['This revision updates the execution rules for Exchange Campaigns and Early Liquidity Market Makers and adds dated post-TGE disclosures.','This revision adds a GEN1 reward proposal, updates the execution rules for Exchange Campaigns and Early Liquidity Market Makers and adds dated post-TGE disclosures.'],
 ['The 10,000,000,000 MHA supply, all ten top-level allocations and the seven categories outside Mining Nodes, Exchange Campaigns and Early Liquidity Market Makers retain their release rules.','The 10,000,000,000 MHA supply and all ten top-level allocations remain unchanged. Release rules for the seven categories outside Mining Nodes, Exchange Campaigns and Early Liquidity Market Makers are unchanged.'],
];
const report=[];
for(const locale of ['en','tc'])for(const name of ['tokenomics','tokenomics-changelog','tokenomics-announcement','tokenomics-zh']){
 const file=`src/content/${locale==='tc'?'whitepaper-tc':'whitepaper'}/learning/${name}.html`;
 const before=await fs.readFile(file,'utf8');await fs.writeFile(`${out}/${locale}-${name}.before.html`,before,{flag:'wx'});
 let html=before;const changes=[];
 for(const [from,to]of (locale==='tc'||name==='tokenomics-zh'?tcPairs:enPairs))if(html.includes(from)){html=html.replaceAll(from,to);changes.push(from);}
 if(name==='tokenomics')assert.deepEqual([...html.matchAll(/<tr data-gen1-month[\s\S]*?<\/tr>/g)].map(x=>x[0]),[...before.matchAll(/<tr data-gen1-month[\s\S]*?<\/tr>/g)].map(x=>x[0]));
 await fs.writeFile(file,html);report.push({file,changes});
}
await fs.writeFile(out+'/changes.json',JSON.stringify(report,null,2));
console.log('Reviewed 8 documents; monthly values unchanged.');
