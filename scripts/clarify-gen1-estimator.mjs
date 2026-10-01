import fs from 'node:fs/promises';
const path='src/components/whitepaper/Gen1IncentiveCalculator.tsx';
let s=await fs.readFile(path,'utf8');
await fs.writeFile('docs/gen1-settlement-review/Gen1IncentiveCalculator-before.tsx.txt',s);
const pairs=[
 ["Program month (1–48)","Extra-award approval month (1–48)"],
 ['計劃月份（1–48）','額外激勵核定月份（1–48）'],
 ['This month’s base reward (MHA)','Approved base reward for this batch (MHA)'],
 ['當月基礎獎勵（MHA）','本批已核定基礎獎勵（MHA）'],
 ['Other devices’ total requests (MHA)','Other unreserved requests in this batch (MHA)'],
 ['其他設備申請額合計（MHA）','本批其他未預留申請額（MHA）'],
 ['Compare both; take the higher request','Submit both; use the higher request (not a return comparison)'],
 ['比較兩者，申請額取較高值','同時申請，取較高申請額（非收益比較）'],
 ['Scenario inputs, not live balances or a binding quote. Copy one month’s base reward from the calculator above. This estimates one batch only; it does not add a bonus automatically to every month or change the standard schedule.', 'Scenario inputs, not live balances or a binding quote. Enter one approved base-reward batch; future work cannot be approved in advance. The month selects the extra-award approval budget, not the earning month or lock execution date. This estimates one batch only, not a multi-month return comparison.'],
 ['以下均為情境輸入，不是即時餘額或有效報價。可將上方基礎測算表某一月的獎勵填入。本工具僅計算一批獎勵，不自動替所有月份加成，亦不改動標準表。','以下均為情境輸入，不是即時餘額或有效報價。請填入一批已核定基礎獎勵，不可預先核定未完成的任務。月份用於選擇額外激勵核定預算，不是基礎獎勵所屬月或鎖定執行日。本工具僅計算一批獎勵，不是多月收益比較。'],
 ['Assume a separate 3,000 MHA stake already qualifies for this month (effective from the following settlement month after staking).','Assume a separate 3,000 MHA stake qualifies throughout the base reward’s earning period (eligibility starts in the settlement month following deposit).'],
 ['假設另有 3,000 MHA 質押已符合本月資格（完成質押後的下一結算月起計入）。','假設另有 3,000 MHA 質押在本批基礎獎勵所屬期間全程符合資格（完成質押後的下一結算月起計入）。'],
 ['Locking replaces normal vesting only for the selected base portion. That principal returns in full at the end of the chosen term; it is not extra income. The monthly illustration assumes execution at the start of the selected month; exact dates follow the accepted quote. Each batch receives a bonus once. Future mining rewards and return of the separate staking principal are excluded.', 'The columns use separate time origins: normal base vesting is indexed to the earning month and requires approval before claiming; the extra award starts in its approval month; the lock term starts at actual execution. +0 denotes each column’s own origin, not one common calendar month. Rows must not be summed as same-month receipts. Selected principal returns once at maturity and is not extra income. Exact dates follow the accepted quote; future rewards and separate stake-principal returns are excluded.'],
 ['僅被選中的基礎獎勵改採自願鎖定，到期一次釋放本金；本金返還不是額外收益。本月度示例假設於所選月份月初執行，實際日期以接受的報價為準。每批僅計一次激勵，不包含未來挖礦獎勵或另行質押本金的返還。','各欄分別起算：基礎正常解鎖按獎勵所屬月編排，且須核定後才可領取；額外激勵自核定月起算；鎖定期限自實際執行日起算。+0 表示各欄自己的起點，不代表同一自然月，各行不能相加作為當月到帳。所選本金到期一次返還，不是額外收益。實際日期以接受的報價為準；不含未來獎勵及另行質押本金返還。'],
 ["t('Program month','計劃月份')","t('Months from each origin','距各自起點（月）')"],
 ["t('Normal base release','基礎獎勵正常解鎖')","t('Base · earning month origin','基礎解鎖 · 所屬月起算')"],
 ["t('Voluntary principal release','自願鎖定本金釋放')","t('Principal · execution date origin','鎖定本金 · 執行日起算')"],
 ["t('Extra reward release','額外獎勵解鎖')","t('Extra · approval month origin','額外激勵 · 核定月起算')"],
 ['<th scope="row">M{r.month}</th>','<th scope="row">+{r.month-Number(fields.month)}</th>'],
 ];
for(const[a,b]of pairs){if(!s.includes(a))throw Error(a);s=s.replaceAll(a,b);}
await fs.writeFile(path,s);
const basePath='src/components/whitepaper/Gen1Calculator.tsx';
let base=await fs.readFile(basePath,'utf8');
await fs.writeFile('docs/gen1-settlement-review/Gen1Calculator-before.tsx.txt',base);
base=base.replace('<div className="gen1-inputs">',`<p>{t('Amounts use the model’s earning-month vesting schedule and assume timely settlement. Approval is required before claiming; delayed approval can delay actual availability. These are not wallet receipts.', '金額按獎勵所屬月的模型解鎖表計算，假設按期結算；核定前不可領取，核定延後可能推遲實際可領取時間。這些數值不是錢包到帳紀錄。')} <a href="#gen1-settlement-timing">{t('Settlement timing','查看結算時間口徑')}</a></p><div className="gen1-inputs">`);
await fs.writeFile(basePath,base);
const testPath='scripts/verify-gen1-incentives.mjs';
let test=await fs.readFile(testPath,'utf8');
test=test.replace('assert.match(last,/M15/);','assert.match(last,/\\+12/);');
await fs.writeFile(testPath,test);
