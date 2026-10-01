"use client";
import { useState } from 'react';
import { calculateIncentive, type IncentiveInput } from './gen1-incentive-model';

export function Gen1IncentiveCalculator({locale}:{locale:'en'|'tc'}) {
  const t=(en:string,tc:string)=>locale==='tc'?tc:en;
  const [fields,setFields]=useState({month:'3',base:'1000',lockShare:'100',otherRequests:'1999800',monthlyAvailable:'500000',programRemaining:'17000000'});
  const [term,setTerm]=useState(12);
  const [method,setMethod]=useState<IncentiveInput['method']>('lock');
  const [stakeEligible,setStakeEligible]=useState(false);
  const labels:Record<keyof typeof fields,string>={month:t('Extra-award approval month (1–48)','額外激勵核定月份（1–48）'),base:t('Approved base reward for this batch (MHA)','本批已核定基礎獎勵（MHA）'),lockShare:t('Base reward selected for locking (%)','選擇鎖定的基礎獎勵比例（%）'),otherRequests:t('Other unreserved requests in this batch (MHA)','本批其他未預留申請額（MHA）'),monthlyAvailable:t('Remaining monthly incentive budget (MHA)','當月剩餘激勵預算（MHA）'),programRemaining:t('Remaining approved program budget (MHA)','本計劃剩餘已批准預算（MHA）')};
  let result:ReturnType<typeof calculateIncentive>|undefined;
  try {if(Object.values(fields).some(v=>v.trim()===''))throw Error(); result=calculateIncentive({month:Number(fields.month),base:Number(fields.base),lockShare:Number(fields.lockShare)/100,otherRequests:Number(fields.otherRequests),monthlyAvailable:Number(fields.monthlyAvailable),programRemaining:Number(fields.programRemaining),term,method,stakeEligible});}catch{ /* Invalid inputs suppress calculated outputs. */ }
  const fmt=(v:number)=>v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  return <section className="gen1-calculator" id="gen1-incentive-calculator" aria-labelledby="gen1-incentive-title">
    <p className="wp-eyebrow">GEN1 / {t('OPTIONAL INCENTIVE DRAFT','自願激勵草案')}</p>
    <h3 id="gen1-incentive-title">{t('Estimate one reward batch','單月鎖定／質押激勵測算')}</h3>
    <p>{t('Scenario inputs, not live balances or a binding quote. Enter one approved base-reward batch; future work cannot be approved in advance. The month selects the extra-award approval budget, not the earning month or lock execution date. This estimates one batch only, not a multi-month return comparison.', '以下均為情境輸入，不是即時餘額或有效報價。請填入一批已核定基礎獎勵，不可預先核定未完成的任務。月份用於選擇額外激勵核定預算，不是基礎獎勵所屬月或鎖定執行日。本工具僅計算一批獎勵，不是多月收益比較。')}</p>
    <p><a href="#gen1-optional-incentives">{t('Read proposed funding and participation rules','閱讀擬議預算來源與參與規則')}</a></p>
    <div className="gen1-inputs">
      <label>{t('Incentive option','激勵選項')}<select value={method} onChange={e=>setMethod(e.target.value as IncentiveInput['method'])}><option value="lock">{t('Voluntary locking','自願鎖定')}</option><option value="stake">{t('Device staking','設備質押')}</option><option value="compare">{t('Submit both; use the higher request (not a return comparison)','同時申請，取較高申請額（非收益比較）')}</option></select></label>
      <label>{t('Voluntary lock term','自願鎖定期限')}<select value={term} onChange={e=>setTerm(Number(e.target.value))}>{[6,9,12].map(n=><option key={n} value={n}>{n} {t('months','個月')}</option>)}</select></label>
      {(Object.keys(fields) as (keyof typeof fields)[]).map(key=><label key={key}>{labels[key]}<input data-incentive-field={key} type="number" min="0" step={key==='month'?'1':'any'} value={fields[key]} onChange={e=>setFields(prev=>({...prev,[key]:e.target.value}))}/></label>)}
    </div>
    <label className="gen1-stake-check"><input type="checkbox" checked={stakeEligible} onChange={e=>setStakeEligible(e.target.checked)}/>{t('Assume a separate 3,000 MHA stake qualifies throughout the base reward’s earning period (eligibility starts in the settlement month following deposit).','假設另有 3,000 MHA 質押在本批基礎獎勵所屬期間全程符合資格（完成質押後的下一結算月起計入）。')}</label>
    <p>{t('Other requests exclude this device and must already apply the higher-of-two rule per device. The default values are an example. Availability of funding must be verified before launch. Ties select staking. Staking principal is separate from reward income and is not included in the table.', '其他申請額不含本設備，且須先逐台取鎖定／質押兩者較高值。預設值僅為範例，啟用前須核實資金。兩者相等時選質押。質押本金與獎勵收入分開，不列入下表。')}</p>
    <div role="status" aria-live="polite" aria-atomic="true">
      {!result?<p className="gen1-error">{t('Complete valid inputs: integer month 1–48; base 0–10,000; lock 0–100%; other requests 0–1 trillion; monthly budget 0–500,000; program remainder 0–17,000,000.','請填入有效數值：整數月份 1–48；基礎獎勵 0–10,000；鎖定比例 0–100%；其他申請額 0–1 兆；當月預算 0–500,000；計劃餘額 0–17,000,000。')}</p>:<>
        <p>{!result.active?t('Outside proposed M3–M36: no new incentive award.','不在擬議 M3–M36 期間：不核定新增激勵。'):result.bonus===0?t('No extra reward under these inputs; no voluntary reward lock is modeled.','本情境無額外獎勵，不模擬執行自願獎勵鎖定。'):t(`Selected: ${result.selected}. These figures assume acceptance of the final quote.`,`採用：${result.selected==='lock'?'自願鎖定':'設備質押'}。以下假設用戶接受最終報價。`)}</p>
        <dl className="gen1-results">{[[t('Request ceiling','個人申請額上限'),result.request,'request'],[t('Estimated extra reward','預計額外獎勵'),result.bonus,'bonus'],[t('Voluntarily locked principal','自願鎖定本金'),result.locked,'locked']].map(([label,value,key])=><div key={key}><dt>{label}</dt><dd data-incentive-result={key}>{fmt(Number(value))}<small>MHA</small></dd></div>)}</dl>
        <p>{t('Budget proration factor','預算分配係數')}：{fmt(result.factor*100)}%。{t('A 10% / 15% / 20% rate is a request ceiling, not a guaranteed bonus.','10%／15%／20% 是申請額計算上限，並非保證加發比例。')}</p>
      </>}
    </div>
    {result&&<details className="gen1-output"><summary>{t('View this batch’s release schedule','查看本批次釋放表')}</summary><p>{t('The columns use separate time origins: normal base vesting is indexed to the earning month and requires approval before claiming; the extra award starts in its approval month; the lock term starts at actual execution. +0 denotes each column’s own origin, not one common calendar month. Rows must not be summed as same-month receipts. Selected principal returns once at maturity and is not extra income. Exact dates follow the accepted quote; future rewards and separate stake-principal returns are excluded.', '各欄分別起算：基礎正常解鎖按獎勵所屬月編排，且須核定後才可領取；額外激勵自核定月起算；鎖定期限自實際執行日起算。+0 表示各欄自己的起點，不代表同一自然月，各行不能相加作為當月到帳。所選本金到期一次返還，不是額外收益。實際日期以接受的報價為準；不含未來獎勵及另行質押本金返還。')}</p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label={t('Optional incentive batch schedule','自願激勵批次釋放表')}><table><thead><tr>{[t('Months from each origin','距各自起點（月）'),t('Base · earning month origin','基礎解鎖 · 所屬月起算'),t('Principal · execution date origin','鎖定本金 · 執行日起算'),t('Extra · approval month origin','額外激勵 · 核定月起算')].map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{result.schedule.map(r=><tr key={r.month}><th scope="row">+{r.month-Number(fields.month)}</th><td>{fmt(r.baseReleased)}</td><td>{fmt(r.lockReleased)}</td><td>{fmt(r.bonusReleased)}</td></tr>)}</tbody></table></div>
    </details>}
  </section>;
}
