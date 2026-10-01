import fs from 'node:fs/promises';
const root='src/content/';
for(const tc of [false,true]) {
 const path=root+(tc?'whitepaper-tc':'whitepaper')+'/learning/tokenomics.html';
 let s=await fs.readFile(path,'utf8');
 await fs.mkdir('docs/gen1-settlement-review',{recursive:true});
 await fs.writeFile(`docs/gen1-settlement-review/${tc?'tc':'en'}-before.html`,s);
 const replacements=tc?[
 ['總預算','基礎挖礦預算'],
 ['剩餘獎勵解鎖','剩餘解鎖'],
 ['下述獨立預算草案','<a href="#gen1-optional-incentives">自願激勵獨立預算草案</a>'],
 ['下文自願激勵另列預算','<a href="#gen1-optional-incentives">自願激勵</a>另列預算'],
 ['下表不包含自願鎖定或質押獎勵加成','<a href="#section-9">標準釋放表</a>不包含自願鎖定或質押獎勵加成'],
 ['合計釋放額度','合計獎勵核定預算'],
 ['預算包絡','預算上限'],
 ['改用途徑須確認','調整用途前，須確認'],
 ['最晚可延至 M48','到期日按實際鎖定執行日期及所選期限確定。M36 內執行的 12 個月鎖定可於 M48 到期；若執行延後，到期亦順延，M48 並非無條件的最終到期月份'],
 ['賺取與釋放的區別','核定、解鎖與實際到帳的區別'],
 ['Lᵢ,ₘ =','Uᵢ,ₘ ='],
 ['已賺取','已核定'],
 ['賺取','核定'],
 ]:[
 ['the total budget','the base mining budget'],
 ['separately budgeted proposal below','<a href="#gen1-optional-incentives">separately budgeted optional incentive proposal</a>'],
 ['The optional incentive below','The <a href="#gen1-optional-incentives">optional incentive</a>'],
 ['total release envelope','total reward-approval budget'],
 ['potentially through M48','with maturity determined by the actual execution date and chosen term. A 12-month lock executed within M36 can mature in M48; later execution moves maturity later, so M48 is not an unconditional final maturity month'],
 ['Earned versus released','Approved, unlocked and actually received'],
 ['Lᵢ,ₘ =','Uᵢ,ₘ ='],
 ];
 for(const [a,b]of replacements){if(!s.includes(a))throw Error('Missing '+a);s=s.replaceAll(a,b);}
 const timing=tc?
 '<p id="gen1-settlement-timing"><strong>時間口徑：</strong>獎勵所屬月記錄任務與基礎預算；核定日為資格及任務審核完成之日；可領取日須同時滿足核定與解鎖條件；實際到帳以轉帳確認為準。標準表與基礎測算器將首期 60% 歸入獎勵所屬月，僅表示按期完成結算時的模型解鎖額，不保證在該自然月內到帳。若核定延後，未核定部分不能提前領取；已到模型解鎖期的部分須待核定及領取流程完成。啟用公告須列明結算截止時間、時區、核定期限、領取日與延遲處理。M24 的 20,000 MHA 是此口徑下的條件測算，不是實際到帳承諾。</p>':
 '<p id="gen1-settlement-timing"><strong>Timing basis:</strong> the earning month records work and the base budget; approval occurs after eligibility and work review; claiming requires both approval and vesting; actual receipt requires a confirmed transfer. The standard table and base calculator assign the first 60% to the earning month as modeled vesting under timely settlement, not a promise of receipt within that calendar month. Delayed approval prevents early claiming; amounts already due under the model remain subject to approval and the claim process. The launch notice must specify cutoff times, time zone, approval deadlines, claim dates and delay handling. The M24 figure of 20,000 MHA is conditional on this timing basis, not a receipt commitment.</p>';
 s=s.replace('<h3 id="gen1-year-1">',timing+'<h3 id="gen1-year-1">');
 const segment=tc?
 '<p>月內新增或退出设备時，以資格變動時間切分互不重疊的子期間 j；各段時長比例 dⱼ = Δtⱼ / Tₘ，全月合計為 1。每段僅使用 Bₘ × dⱼ 的預算，Nⱼ 為該段合資格且去重的設備數。該設備未准入的段落獎勵為零；Nⱼ = 0 時該段新增獎勵為零。</p><p><code>Eᵢ,ₘ = Σⱼ [dⱼ × min(Bₘ / max(Nⱼ, 13,750), 10,000) × (0.20 × Aᵢ,ⱼ + 0.80 × Wᵢ,ⱼ)]</code></p><p>Aᵢ,ⱼ 與 Wᵢ,ⱼ 分別以該段完整時長及對應參考任務能力為分母，仍須滿足 0 ≤ Wᵢ,ⱼ ≤ Aᵢ,ⱼ ≤ 1。不得將全月比例再次套入分段公式而重複折算。參考能力換算、超標任務量的核驗／封頂方式及結算時區須在啟用前公布。基礎測算器僅支援每月設備數固定的情境，不計算月內分段；設備及已核定批次各自記帳，不以當前設備數重算歷史獎勵。</p>':
 '<p>Split a month into non-overlapping subperiods j at eligibility changes. Let dⱼ = Δtⱼ / Tₘ, summing to 1 over the month. Each segment uses only Bₘ × dⱼ of the budget; Nⱼ is its unique eligible device count. A device earns nothing before admission or after departure; Nⱼ = 0 produces no new rewards.</p><p><code>Eᵢ,ₘ = Σⱼ [dⱼ × min(Bₘ / max(Nⱼ, 13,750), 10,000) × (0.20 × Aᵢ,ⱼ + 0.80 × Wᵢ,ⱼ)]</code></p><p>Aᵢ,ⱼ and Wᵢ,ⱼ use the full segment duration and corresponding reference work capacity, with 0 ≤ Wᵢ,ⱼ ≤ Aᵢ,ⱼ ≤ 1. Do not reuse full-month fractions inside this formula and prorate twice. Reference-capacity conversion, validation/capping of above-reference work and the settlement time zone must be published before launch. The base calculator supports constant counts within each month, not intramonth segments. Track each device and approved batch separately; current counts must not recalculate historical rewards.</p>';
 s=s.replace(tc?/<p>設備中途加入或退出時[\s\S]*?<\/p>/:/<p>For changing cohorts[\s\S]*?<\/p>/,segment.replaceAll('设备','設備'));
 const batch=tc?
 '<p>每次報價批次須使用同一截止快照：B 為扣除其他批次有效預留及已核定額後、尚未分配予本批的可用預算；ΣQ 僅含本批尚未預留的有效申請，不重複納入既有報價。接受鎖定前須再次核驗所選獎勵尚未領取或用作其他承諾，並以不可重複執行的方式同步更新本金及預算帳本。激勵月份指額外獎勵核定月；基礎獎勵所屬月另行記錄，設備質押資格按基礎獎勵所屬期間核驗。M36 後不新增核定，逾期未接受報價的處理及執行截止日須在啟用前公布。</p>':
 '<p>Use one cutoff snapshot per quote batch. B is budget available to this batch after other batches’ valid reservations and approved awards; ΣQ includes only valid, not-yet-reserved requests in this batch, excluding existing quotes. Before executing a lock, recheck that the selected reward is unclaimed and uncommitted; update principal and budget ledgers atomically without duplicate execution. The incentive month means extra-award approval month; record the base earning month separately and assess device-staking eligibility over that earning period. No new approvals after M36; treatment of unaccepted expired quotes and execution deadlines must be published before launch.</p>';
 s=s.replace('<h3 id="gen1-lock-option">',batch+'<h3 id="gen1-lock-option">');
 await fs.writeFile(path,s);
}
