import addresses from "@/content/whitepaper/allocation-addresses.json";
import { allocation } from "./figures";

type Locale = "en" | "tc";
type Translate = (en: string, tc: string) => string;
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]!);
const categories = ["mining", "staking", "ecosystem", "team", "vc", "user-airdrop", "market-making-reserve", "public-sale", "equipment-agents", "exchange-allocation"];
function reserve(index: number) {
  const entry = addresses.records.find(item => item.category === categories[index]);
  if (!entry) throw new Error(`Missing allocation address: ${categories[index]}`);
  return entry;
}
function addressLine(value: string, t: Translate, contract = false) {
  const url = `https://bscscan.com/token/${addresses.contract}${contract ? "" : `?a=${value}`}`;
  return `<div class="wp-address-line"><code>${escape(value)}</code><div class="wp-address-actions"><button type="button" data-action="copy-address" data-address="${escape(value)}" aria-label="${t("Copy address", "複製地址")} ${escape(value)}">${t("Copy", "複製")}</button><a href="${url}" target="_blank" rel="noopener noreferrer">BscScan ↗</a></div></div>`;
}
function contractPanel(t: Translate) {
  return `<section class="wp-token-contract" aria-labelledby="token-contract"><div class="wp-token-panel-heading"><div><span class="wpf-eyebrow">MHA / BNB SMART CHAIN</span><h2 id="token-contract">${t("Token contract", "代幣合約")}</h2></div><span class="wp-token-chain">BSC · 56</span></div>${addressLine(addresses.contract,t,true)}<p>${t("BNB Smart Chain token contract · 18 decimals. Allocation reserve wallets are listed below.", "BNB Smart Chain 代幣合約 · 18 位小數。各項分配的儲備錢包列於下方。")}</p></section><nav class="wp-token-jumps" aria-label="${t("Tokenomics sections", "代幣經濟章節")}"><a href="#wpf-allocation">${t("Distribution", "分配圖")}</a><a href="#allocation-addresses">${t("10 reserve addresses", "十項儲備地址")}</a><a href="#allocation-rules">${t("Allocation & release rules", "分配與釋放規則")}</a><a href="#execution-snapshot">${t("Execution disclosure", "執行披露")}</a></nav>`;
}
function addressRegister(t: Translate) {
  const rows = allocation.map((item,index) => {
    const wallet = reserve(index);
    return `<li><div class="wp-address-category"><span>${String(index+1).padStart(2,"0")}</span><a href="#${item.anchor}">${escape(t(item.en,item.tc))}</a><strong>${item.percent}%</strong></div>${addressLine(wallet.address,t)}${index===5 ? `<p class="wp-address-alias">${t("Source label: User airdrop reserve; the reserve referenced under Early Supporters and campaign disclosure.", "來源名稱：用戶空投儲備；對應早期支持者與活動披露中的儲備。")}</p>` : ""}</li>`;
  }).join("");
  return `<section class="wp-address-register" aria-labelledby="allocation-addresses"><div class="wp-token-panel-heading"><div><span class="wpf-eyebrow">MHA / ADDRESS REGISTER</span><h2 id="allocation-addresses">${t("Ten allocations. Ten reserve addresses.", "十項分配，十個儲備地址。")}</h2></div><span class="wp-token-chain">BNB Smart Chain</span></div><p>${t("Project-disclosed allocation reserve wallets, separate from the token contract and pooled exchange custody wallets. An address alone does not establish vesting or a lock-up.", "項目披露的分配儲備錢包，與代幣合約及交易所混合託管錢包分開列示。地址本身不構成歸屬或鎖定證明。")}</p><ol class="wp-address-list">${rows}</ol><p class="wp-address-provenance">${t("Source", "來源")}：<a href="${addresses.sourcePage}" target="_blank" rel="noopener noreferrer">W3 ${t("Supply Evidence","供應量披露")}</a> / <a href="${addresses.source}" target="_blank" rel="noopener noreferrer">API</a> · ${t("Address register checked", "地址登記核對於")} <time datetime="${addresses.checkedAt}">${addresses.checkedAt.slice(0,10)}</time> · ${t("Execution balances retain their original dated snapshot.", "執行餘額維持原有日期快照。")}</p></section>`;
}
export function tokenomicsToc(locale: Locale) {
  const t: Translate = (en,tc) => locale==='tc'?tc:en;
  return [
    {id:"allocation",title:t("Overview","概覽")},
    {id:"token-contract",title:t("MHA contract","MHA 合約")},
    {id:"allocation-addresses",title:t("Reserve addresses","儲備地址總覽")},
    {id:"allocation-rules",title:t("Allocation & release","分配與釋放規則")},
    ...allocation.flatMap((item,index)=>[
      {id:item.anchor,title:`${String(index+1).padStart(2,"0")} ${t(item.en,item.tc)}`,nested:true},
      ...(index===0?[
        {id:"gen1-reading-guide",title:t("Base rules","基礎規則"),nested:true,miningChild:true},
        {id:"gen1-calculator",title:t("Base estimate","基礎測算"),nested:true,miningChild:true},
        {id:"section-9",title:t("Standard schedule","標準釋放表"),nested:true,miningChild:true},
        {id:"gen1-optional-incentives",title:t("Optional incentives","自願參與激勵"),nested:true,miningChild:true},
      ]:[]),
    ]),
    {id:"execution-snapshot",title:t("Execution disclosure","執行披露")},
    {id:"campaign-notes",title:t("Campaign clarification","活動說明")},
  ];
}
export function renderTokenomics(html: string, locale: Locale): string {
  const t: Translate = (en,tc) => locale==='tc'?tc:en;
  html = html.replace(/(<h2 id="section-9">[\s\S]*?<\/h2>)/, `$1<p><a href="#gen1-calculator">${t("Above 13,750 devices or different participation conditions? Calculate your schedule →", "超過 13,750 台，或參與條件不同？測算對應釋放表 →")}</a></p>`);
  const marker = (id: string) => new RegExp(`<h2\\b[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/h2>`);
  const boundaries = [...allocation.map(item=>item.anchor),"execution-snapshot"].map(id=>{
    const match = marker(id).exec(html);
    if(!match) throw new Error(`Tokenomics section not found: ${id}`);
    return {id,start:match.index,end:match.index+match[0].length};
  });
  if(boundaries.some((boundary,i)=>i>0 && boundary.start<=boundaries[i-1].start)) throw new Error("Tokenomics sections out of order");
  const groups = allocation.map((item,index)=>{
    const wallet=reserve(index);
    const body = html.slice(boundaries[index].end,boundaries[index+1].start);
    const nested = [...body.matchAll(/<h[23]\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h[23]>/g)].map(m=>({id:m[1],title:m[2].replace(/<[^>]+>/g,"")}));
    const sections = index===0 ? [
      {id:"gen1-reading-guide",title:t("Base rules","基礎規則")},
      {id:"gen1-calculator",title:t("Base reward calculator","基礎獎勵測算")},
      {id:"section-9",title:t("Standard release schedule","標準釋放表")},
      {id:"gen1-optional-incentives",title:t("Optional participation incentives","自願參與激勵")},
      {id:"gen1-technical-details",title:t("Formulas and execution details","公式與執行細則")},
    ] : nested;
    const menu = sections.length ? `<nav class="wp-allocation-subnav" aria-label="${t("In this allocation", "本項目內容")}">${sections.map(h=>`<a href="#${h.id}">${h.title}</a>`).join("")}</nav>` : "";
    const content = body.replace(/<(\/?)h3\b/g,"<$1h4").replace(/<(\/?)h2\b/g,"<$1h3");
    return `<details class="wp-allocation" id="${item.anchor}"><summary><span class="wp-allocation-number">${String(index+1).padStart(2,"0")}</span><span class="wp-allocation-title"><span role="heading" aria-level="3">${escape(t(item.en,item.tc))}</span><small>${(item.percent*100_000_000).toLocaleString("en-US")} MHA</small></span><strong class="wp-allocation-percent">${item.percent}%</strong><span class="wp-allocation-toggle" aria-hidden="true">+</span></summary><div class="wp-allocation-body"><div class="wp-allocation-wallet"><span class="wpf-eyebrow">${t("DISCLOSED RESERVE / BSC", "披露儲備 / BSC")}</span>${addressLine(wallet.address,t)}${index===5?`<p>${t("Source label: User airdrop reserve.", "來源名稱：用戶空投儲備。")}</p>`:""}</div>${menu}${content}</div></details>`;
  }).join("");
  const controls = `<section class="wp-allocation-sections" aria-labelledby="allocation-rules"><div class="wp-token-rules-heading"><div><span class="wpf-eyebrow">MHA / ALLOCATION RULES</span><h2 id="allocation-rules">${t("Allocation & release rules", "分配與釋放規則")}</h2><p>${t("Open a category to read its purpose, release rules and detailed conditions.", "展開類別，閱讀用途、釋放規則及詳細條件。")}</p></div><div class="wp-allocation-controls"><button type="button" data-action="allocations-expand">${t("Expand all", "全部展開")}</button><button type="button" data-action="allocations-collapse">${t("Collapse all", "全部收合")}</button></div></div>${groups}</section>`;
  let overview = html.slice(0,boundaries[0].start).replace(marker("allocation"),match=>match+contractPanel(t));
  overview = overview.replace(/<div class="overflow-x-auto"><table>[\s\S]*?<\/table><\/div>/g,table=>(table.match(/<tr>/g)?.length===11) ? `<details class="wp-allocation-table"><summary>${t("View the full allocation table", "查看完整分配表")}</summary>${table}</details>` : table);
  return overview+addressRegister(t)+controls+html.slice(boundaries[10].start);
}
