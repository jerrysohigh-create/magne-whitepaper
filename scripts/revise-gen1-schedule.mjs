import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const out='docs/gen1-release-20261001';
await fs.mkdir(out+'/before',{recursive:true});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const baseline=13750;
const earned=Array.from({length:38},(_,i)=>i>=36?0:200000000/2**Math.floor(i/12)/12*(i===0?.2:i===1?.6:1)/baseline);
let cumulativeEarned=0,cumulativeReleased=0;
const rows=earned.map((e,i)=>{const release=.6*e+.2*(earned[i-1]??0)+.2*(earned[i-2]??0);cumulativeEarned+=e;cumulativeReleased+=release;return {month:i+1,earned:e,released:release,cumulativeEarned,cumulativeReleased,locked:Math.max(0,cumulativeEarned-cumulativeReleased)};});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
near(rows[23].cumulativeReleased,20000);near(rows[35].cumulativeEarned,330000000/baseline);near(rows[37].locked,0);
for(const r of rows)near(r.cumulativeEarned,r.cumulativeReleased+r.locked);
for(const n of [5000,10000,13750,20000]){
 const total=earned.slice(0,36).reduce((a,b)=>a+b,0)*baseline*Math.min(1,n/baseline);
 near(total/n,330000000/Math.max(n,baseline));
 assert.ok(total<=330000000+1e-5);
}
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function mining(tc){
 const t=(en,zh)=>tc?zh:en;
 const table=(start,end,label)=>`<div class="table-wrap" tabindex="0" role="region" aria-label="${label}"><table><caption>${label} · ${t('MHA per device','每台 MHA')}</caption><thead><tr>${t(['Month','Earned','Released / claimable','Cumulative earned','Cumulative released','Still locked'],['月份','當月賺取','當月釋放／可領取','累計賺取','累計釋放','期末待解鎖']).map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.slice(start-1,end).map(r=>`<tr data-gen1-month="${r.month}"><th scope="row">M${r.month}</th>${[r.earned,r.released,r.cumulativeEarned,r.cumulativeReleased,r.locked].map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 return `<h2 id="allocation-1">${t('Mining Nodes','挖礦節點')}</h2>
<p>${t('Mining Nodes retain 3,000,000,000 MHA (30% of total supply). This section proposes a GEN1 device reward mechanism for verified availability and useful work. It does not establish that phone mining, settlement contracts or MAGNE mainnet are live.','挖礦節點維持 3,000,000,000 MHA（總供應量的 30%）。本節提出按可核驗可用性與有效工作負載結算的 GEN1 裝置獎勵機制，不代表手機挖礦、結算合約或 MAGNE 主網已上線。')}</p>
<h2 id="section-3">${t('1. Scope and proposal status','1. 適用範圍與草案狀態')}</h2>
<p>${t('Review draft updated 1 October 2026. The full-budget device baseline is set to 13,750. The 20% availability / 80% useful-work split remains proposed; benchmark capacity, eligibility tests, settlement implementation and the effective date must be disclosed before launch. No effective date is assigned by this draft.','審核稿更新於 2026 年 10 月 1 日。全額預算設備基準定為 13,750 台。20% 可用性／80% 有效任務的比例仍屬擬議方案；參考任務能力、資格檢測、結算實作及生效日期須在啟用前披露。本草案不設定生效日期。')}</p>
<p>${t('The model applies to MAGNE.AI Phone GEN1. Other hardware sub-pools remain unactivated proposals. This GEN1 design replaces the old pool-exhausting ECU allocation, optional locking/staking multipliers and repeated uptime deductions within this draft. It does not retroactively alter earned rewards or existing rights.','模型適用於 MAGNE.AI Phone GEN1，其他硬件子池保留待定。本版 GEN1 草案取代舊有按 ECU 權重分完當期預算、自願鎖定／質押加成及重複在線率扣減的設計，不追溯改動已賺取獎勵或既有權利。')}</p>
<h2 id="section-4">${t('2. Budget parameters','2. 預算參數')}</h2>
<div class="table-wrap" tabindex="0" role="region" aria-label="${t('GEN1 parameters','GEN1 參數')}"><table><thead><tr><th scope="col">${t('Parameter','參數')}</th><th scope="col">${t('Value','設定')}</th></tr></thead><tbody>
<tr><td>${t('GEN1 sub-pool ceiling','GEN1 子池上限')}</td><td>400,000,000 MHA</td></tr>
<tr><td>${t('Annual budget, years 1 / 2 / 3','第 1／2／3 年年度預算')}</td><td>200,000,000 / 100,000,000 / 50,000,000 MHA</td></tr>
<tr><td>${t('Full-budget device baseline','全額預算設備基準')}</td><td>13,750</td></tr>
<tr><td>${t('Initial ramp','啟動平滑係數')}</td><td>M1: 20% · M2: 60% · M3–M36: 100%</td></tr>
<tr><td>${t('Monthly earned-reward ceiling per device','單台每月賺取上限')}</td><td>10,000 MHA</td></tr>
<tr><td>${t('Proposed availability / work split','擬議可用性／有效任務比例')}</td><td>20% / 80%</td></tr>
<tr><td>${t('Vesting of each earned batch','每批獎勵解鎖')}</td><td>${t('40% immediate + 60% in three equal monthly installments, including the earning month','40% 即時＋60% 分三個月等額解鎖，包含賺取當月')}</td></tr>
</tbody></table></div>
<p>${t('Annual budgets are ceilings, not amounts that must be distributed. The ramp applies once at program start, not at each anniversary. Before device scaling and work adjustment, months 1–12 / 13–24 / 25–36 allow 180,000,000 / 100,000,000 / 50,000,000 MHA respectively: 330,000,000 MHA in total. Unused budget stays undistributed in the mining reserve; it is not automatically owed, carried forward or redistributed. Later deployment requires a disclosed decision within the original ceilings.','年度預算為上限，並非必須發完的金額。平滑係數僅於計劃啟動時適用一次，不在每年重新啟動。在設備縮放與任務調整前，第 1–12／13–24／25–36 月的預算分別為 180,000,000／100,000,000／50,000,000 MHA，合計 330,000,000 MHA。未使用預算保留於挖礦儲備，不自動形成應付獎勵、結轉補發或重新分配；日後動用須另行披露並受原有上限約束。')}</p>
<h2 id="section-5">${t('3. Calculation and release','3. 計算與釋放')}</h2>
<h3 id="section-6">${t('3.1 Device-scaled budget','3.1 隨設備規模調整預算')}</h3>
<p><code>Bₘ = (200,000,000 × 0.5^(y−1) / 12) × rampₘ</code><br><code>Cₘ = min(Bₘ × min(1, Nₘ / 13,750), Nₘ × 10,000)</code><br><code>Pₘ = Cₘ / Nₘ</code></p>
<p>${t('y is the program year. Nₘ counts unique admitted, eligible GEN1 devices for the settlement period, not sales, shipments or wallet addresses. When Nₘ = 0, both budget and reward are zero. Below 13,750 devices, the total budget scales down proportionally; at or above it, the budget stops growing and the per-device reference amount falls as participation increases. 13,750 is a budget baseline, not a sales target or device admission cap.','y 為獎勵計劃年度。Nₘ 為當期已准入、通過資格核驗且去重的 GEN1 設備數，不等同銷量、出貨量或錢包數。Nₘ = 0 時預算與獎勵均為零。設備不足 13,750 台時，總預算同比縮減；達到基準後預算不再隨設備數增加，單台參考金額隨參與設備增加而下降。13,750 台是預算基準，不是銷售目標或准入數量上限。')}</p>
<h3 id="section-7">${t('3.2 Availability and validated work','3.2 可用性與有效任務')}</h3>
<p><code>Eᵢ,ₘ = Pₘ × (0.20 × Aᵢ,ₘ + 0.80 × Wᵢ,ₘ)</code></p>
<p>${t('A is verified availability as a fraction of the entire settlement month. W is accepted, quality-adjusted useful work divided by the published full-month GEN1 reference capacity. Both range from 0 to 1, and W ≤ A. Completing every assigned task does not establish W = 1 when demand is low. No accepted tasks means W = 0. An eligible device with A = 1 and W = 0 can earn only the proposed 20% availability component. Invalid, duplicate or self-generated workload is excluded. Unused work rewards are not redistributed to exhaust the pool.','A 為經核驗可用時間佔完整結算月的比例。W 為通過驗收及品質調整的有效任務量，除以已公布的 GEN1 全月參考任務能力。兩者均介於 0 與 1，且 W ≤ A。需求不足時，即使完成全部獲派任務，也不等於 W = 1。沒有通過驗收的任務，W 即為 0；A = 1、W = 0 的合資格設備最多獲得擬議的 20% 可用性獎勵。無效、重複或自造任務不計入，未使用的任務獎勵不為發完預算而重新分配。')}</p>
<p>${t('For changing cohorts, admission and departure times must be recorded in settlement subperiods. Availability and reference capacity use the same time denominator. Vesting is tracked for each device and earned batch; historical rewards must not be divided by the current device count.','設備中途加入或退出時，須按結算子期間記錄資格起止時間；可用性與參考任務能力採用一致的時間分母。解鎖須按每台設備及每批已賺取獎勵記帳，不得用當前設備數重新攤分歷史獎勵。')}</p>
<h3 id="section-8">${t('3.3 Earned versus released','3.3 賺取與釋放的區別')}</h3>
<p>${t('The three-month linear portion includes the earning month: each earned batch releases 60% in that month (40% immediate + the first 20% installment), then 20% in each of the next two months.','三個月線性解鎖包含賺取當月：每批獎勵當月釋放 60%（40% 即時＋首期 20%），其後兩個月各釋放 20%。')}</p>
<p><code>Lᵢ,ₘ = 0.60 × Eᵢ,ₘ + 0.20 × Eᵢ,ₘ₋₁ + 0.20 × Eᵢ,ₘ₋₂</code></p>
<p>${t('Released means scheduled to become claimable after settlement, not a verified transfer to a wallet. Actual receipt depends on completed verification, the published claim process and confirmed transfers. Unactivated devices earn nothing; this proposal applies no blanket 30% pre-activation payment factor or automatic later catch-up. No optional locking or staking reward multiplier is included in the schedule.','釋放指結算後按模型應成為可領取的金額，不等於已核驗的錢包入帳。實際到账以資格核驗、已公布的領取流程及轉帳確認為準。未啟用設備不產生獎勵；本方案不採用統一的啟用前 30% 發放折扣，亦不自動補發。下表不包含自願鎖定或質押獎勵加成。')}</p>
<h2 id="section-9">${t('4. 36-month per-device release schedule','4. 每台設備 36 個月釋放表')}</h2>
<p>${t('Illustration only: one fixed cohort of 5,000, 10,000 or 13,750 equal GEN1 devices participates continuously from program M1, with A = W = 1, no penalties, no prior balances and unchanged parameters. M1 starts on the reward-program effective date, not automatically at TGE or purchase. Late entrants join the then-current program month; a new purchase does not restart the annual emission curve.','條件測算：同一批固定 5,000、10,000 或 13,750 台同等 GEN1 設備，自計劃 M1 起持續參與，A = W = 1，無處罰、無前期餘額且參數不變。M1 以獎勵計劃生效日為起點，不自動等同 TGE 或購機日。後加入設備按當時計劃月份參與，購機不重新啟動年度發放曲線。')}</p>
<p><strong>${t('At M24: 20,363.64 MHA earned, 20,000.00 MHA released and 363.64 MHA still locked. At M36: 24,000.00 earned, 23,818.18 released and 181.82 still locked.','截至 M24：累計賺取 20,363.64 MHA、釋放 20,000.00 MHA、待解鎖 363.64 MHA。截至 M36：累計賺取 24,000.00 MHA、釋放 23,818.18 MHA、待解鎖 181.82 MHA。')}</strong></p>
<p>${t('The 20,000 MHA figure is a conditional model result, not a minimum entitlement, purchase return or fixed-income commitment. With A = 1 and W = 0.5 throughout, 24-month release is 12,000 MHA; with W = 0 it is 4,000 MHA. Displayed values are rounded to two decimals; totals use unrounded amounts.','20,000 MHA 為條件模型結果，不構成最低應得金額、購機回報或固定收益承諾。若全期 A = 1、W = 0.5，24 個月釋放為 12,000 MHA；若 W = 0，則為 4,000 MHA。表內數字顯示至小數點後兩位，合計以未四捨五入的數值計算。')}</p>
<h3 id="gen1-year-1">${t('Year 1 · M1–M12','第 1 年 · M1–M12')}</h3>${table(1,12,t('Year 1 release schedule','第 1 年釋放表'))}
<h3 id="gen1-year-2">${t('Year 2 · M13–M24','第 2 年 · M13–M24')}</h3>${table(13,24,t('Year 2 release schedule','第 2 年釋放表'))}
<h3 id="gen1-year-3">${t('Year 3 · M25–M36','第 3 年 · M25–M36')}</h3>${table(25,36,t('Year 3 release schedule','第 3 年釋放表'))}
<h3 id="gen1-vesting-tail">${t('M37–M38 · remaining release from the first 36 months','M37–M38 · 前 36 個月獎勵的尾款釋放')}</h3>
<p>${t('These two rows isolate vesting of rewards earned through M36. They exclude new year-four rewards and do not imply that mining ends at M36.','以下兩行僅追蹤 M36 以前已賺取獎勵的解鎖，不包含第 4 年新增獎勵，亦不表示挖礦於 M36 結束。')}</p>${table(37,38,t('Vesting tail only','僅列既有獎勵尾款'))}
<h2 id="section-10">${t('5. Eligibility and verification','5. 資格與核驗')}</h2>
<p>${t('Before activation, publish device registration, attestation and deduplication rules, availability sampling, accepted task types, reference benchmark (model, precision and hardware), quality thresholds, review/appeal procedures, claim timing and fees. One physical device must not earn duplicate rewards through multiple accounts. Shared networks alone do not prove abusive ownership. No tasks means no task reward.','啟用前須公布設備登記、認證與去重規則、可用性抽樣、認可任務類型、參考基準（模型、精度與硬件）、品質門檻、覆核與申訴程序、領取時程及費用。同一實體設備不得以多個帳戶重複領獎；共用網絡本身不構成違規證明。沒有有效任務即沒有任務獎勵。')}</p>
<p>${t('Reward rates and applicable limits must be known before tasks are accepted. Reject invalid evidence and review unsettled rewards under published procedures; this draft does not establish a right or technical ability to seize tokens already transferred to a user wallet. Any bonded-stake slashing would require separately disclosed terms and implementation.','任務接受前須明示獎勵標準與適用上限。無效證據應依公布程序排除，未結算獎勵可接受覆核；本草案不宣稱可直接扣回已轉至用戶錢包的代幣。任何質押罰沒須另有明確條款及相應技術實作。')}</p>
<h2 id="section-11">${t('6. Activation and parameter changes','6. 啟用與參數變更')}</h2>
<p>${t('Launch requires disclosed benchmarks, a tested settlement ledger, an executable claim/vesting mechanism, sufficient reserved budget and an effective-date announcement. Review device admission, workload and budget use quarterly. Changes to the baseline, reward split or reference workload require a dated notice, documented authorization and a future effective period; changes must not retroactively rewrite earned batches. Governance and timelocks are not represented as deployed until verified.','啟用須具備已披露的任務基準、經測試的結算帳本、可執行的領取／解鎖機制、足額預留預算及生效公告。每季檢視設備准入、任務量及預算使用。設備基準、獎勵比例或參考工作量變更須有附日期公告、授權紀錄及未來生效期間，不追溯重算已賺取批次；未經核驗，不將治理或時間鎖描述為已部署。')}</p>
<h2 id="section-12">${t('7. Public reporting and methodology','7. 公開披露與測算依據')}</h2>
<p>${t('Report eligible device counts, budget ceilings, availability and task rewards, unallocated reserve, earned batches, locked and claimable balances, actual transfers, rule version and exceptions. Budget, earned rewards, claimable rewards and on-chain transfers must remain separate measures.','分別披露合資格設備數、預算上限、可用性及任務獎勵、未分配儲備、已賺取批次、鎖定與可領取餘額、實際轉帳、規則版本及例外處理。預算、賺取、可領取與鏈上轉帳須分開統計。')}</p>
<p>${t('Budget and vesting inputs originate from the project GEN1 tokenomics model; the 13,750-device baseline was selected for this draft on 1 October 2026. The separation of availability and useful-work rewards draws on','預算與解鎖參數源於項目 GEN1 代幣模型；13,750 台設備基準於 2026 年 10 月 1 日選定納入本草案。可用性與有效任務分開計酬的設計參考')} <a href="https://github.com/rendernetwork/RNPs/blob/main/RNP-021.md">Render RNP-021</a>${t('. The 13,750 baseline and 20% / 80% split are MAGNE proposal parameters, not Render parameters or an endorsement. No token price or monetary return is assumed.','。13,750 台及 20%／80% 為 MAGNE 草案參數，不是 Render 的參數或背書。測算不假設代幣價格或貨幣收益。')}</p>
`;
}
const names=['tokenomics','tokenomics-changelog','tokenomics-announcement','tokenomics-zh'];
const archive=await fs.readFile('src/content/archive-v1/learning/tokenomics.html');
const record={archiveHash:hash(archive),baseline,rows,files:[]};
for(const locale of ['en','tc']){
 const base='src/content/'+(locale==='tc'?'whitepaper-tc':'whitepaper');const tc=locale==='tc';
 for(const name of names){
  const file=`${base}/learning/${name}.html`;const before=await fs.readFile(file,'utf8');
  await fs.writeFile(`${out}/before/${locale}-${name}.html`,before,{flag:'wx'});
  let html=before;
  if(name==='tokenomics'){
   const start=html.indexOf('<h2 id="allocation-1"'),end=html.indexOf('<h2 id="allocation-2"');assert.ok(start>0&&end>start);
   html=html.slice(0,start)+mining(tc)+html.slice(end);
   // Preserve all other allocation rules byte for byte.
   assert.equal(html.slice(html.indexOf('<h2 id="allocation-2"')),before.slice(end));
  }
  const zh=name==='tokenomics-zh'||tc;
  html=html.replaceAll('30 September 2026','1 October 2026').replaceAll('updated 30 September','updated 1 October').replaceAll('2026 年 9 月 30 日','2026 年 10 月 1 日').replaceAll('9 月 30 日更新','10 月 1 日更新');
  html=html.replaceAll('the other eight categories’ release rules remain unchanged','the seven categories outside Mining Nodes, Exchange Campaigns and Early Liquidity Market Makers retain their release rules')
   .replaceAll('the release rules of the other eight categories remain unchanged','the release rules of the seven other categories remain unchanged')
   .replaceAll('其餘八項釋放規則維持不變','挖礦節點、交易所活動及早期流動性做市商以外七項的釋放規則維持不變')
   .replaceAll('其餘八個類別的釋放規則維持不變','挖礦節點、交易所活動及早期流動性做市商以外七個類別的釋放規則維持不變')
   .replaceAll('Economic-rule changes are limited to Exchange Campaigns and Early Liquidity Market Makers.','Economic-rule proposals cover GEN1 Mining Nodes, Exchange Campaigns and Early Liquidity Market Makers.')
   .replaceAll('經濟規則變更僅涉及交易所活動及早期流動性做市商。','經濟規則草案涵蓋 GEN1 挖礦節點、交易所活動及早期流動性做市商。');
  const update=zh?`<h2 id="gen1-october-update">2026 年 10 月：GEN1 獎勵草案</h2><p>新增 13,750 台全額預算設備基準、設備不足時同比縮減總預算，以及擬議的 20% 可用性／80% 有效任務獎勵。總供應量、十項一級分配與 GEN1 400,000,000 MHA 子池上限維持不變。此為實質獎勵規則修訂草案，尚未生效；並非僅調整文字。舊版按 ECU 分完預算、額外鎖定／質押加成及重複在線扣減不適用於新版測算。</p><p>新增 36 個月逐月賺取、釋放與待解鎖表，以及 M37–M38 尾款。在固定同等設備數不超過基準、全期可用性與有效任務均達参考能力 100% 的假設下，M24 累計釋放 20,000 MHA，M36 累計釋放 23,818.18 MHA。這是條件測算，不是購機後保證到账；啟用條件及生效日須另行公告。</p><p><a href="${tc?'/tc':''}/learning/tokenomics#section-9">閱讀 36 個月釋放表及適用條件</a></p>`:`<h2 id="gen1-october-update">October 2026: GEN1 reward proposal</h2><p>Adds a 13,750-device full-budget baseline, proportional budget reduction below that baseline and a proposed 20% availability / 80% useful-work split. Total supply, all ten top-level allocations and the 400,000,000 MHA GEN1 ceiling remain unchanged. This is a substantive reward-rule proposal, not just an editorial clarification, and is not effective yet. The old pool-exhausting ECU formula, optional locking/staking boosts and repeated uptime deductions do not apply to the new illustration.</p><p>Adds 36 monthly earned, released and locked balances plus the M37–M38 vesting tail. For a fixed, equal-device cohort at or below the baseline, with full availability and 100% reference work throughout, cumulative release is 20,000 MHA at M24 and 23,818.18 MHA at M36. These are conditional calculations, not guaranteed receipts after purchase. Activation conditions and an effective date require a separate announcement.</p><p><a href="/learning/tokenomics#section-9">Read the 36-month schedule and conditions</a></p>`;
  if(name==='tokenomics')html=html.replace('<div class="token-facts">',`<p>${tc?'2026 年 10 月補充：本審核稿另納入 GEN1 獎勵機制及 36 個月釋放測算，詳見挖礦節點章節。':'October 2026 addition: this review draft also includes a GEN1 reward proposal and a 36-month release illustration in Mining Nodes.'}</p><div class="token-facts">`);
  else html=html.replace('<h2',update+'<h2');
  if(name==='tokenomics-announcement')html=html.replace('<footer',update+'<footer');
  if(name==='tokenomics-changelog')html=html.replace('Two execution-rule updates and dated post-TGE disclosures','GEN1 reward proposal, two execution-rule updates and dated post-TGE disclosures').replace('兩項執行規則更新及附日期的 TGE 後披露','GEN1 獎勵草案、兩項執行規則更新及附日期的 TGE 後披露');
  // Normalize Traditional Chinese in new text without changing financial content.
  html=html.replaceAll('实际到账','實際到帳').replaceAll('實際到账','實際到帳').replaceAll('保證到账','保證到帳').replaceAll('達参考能力','達參考能力');
  await fs.writeFile(file,html);record.files.push({file,before:hash(before),after:hash(html)});
 }
}
assert.equal(hash(await fs.readFile('src/content/archive-v1/learning/tokenomics.html')),record.archiveHash);
await fs.writeFile(out+'/calculation-checks.json',JSON.stringify(record,null,2));
console.log(JSON.stringify({baseline,month24:rows[23],month36:rows[35],tail:rows.slice(36),changed:record.files.length},null,2));
