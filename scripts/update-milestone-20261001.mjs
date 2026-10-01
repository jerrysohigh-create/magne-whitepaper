import fs from 'node:fs/promises';
const sources={
 progress:['MAGNE.AI · Progress','https://www.magne.ai/en/progress.html'],
 root:['ROOTDATA · MAGNE.AI','https://www.rootdata.com/projects/detail/MAGNEAI?k=MjA3NjY%3D'],
 compliance:['MAG1 · Compliance','https://www.magne.ai/en/compliance.html'],
 ce:['MAG1 · CE','https://www.magne.ai/en/ce-lookup.html'],
 fcc:['MAG1 · FCC','https://www.magne.ai/en/fcc-lookup.html'],
 cp:['MAG1 · Prop 65','https://www.magne.ai/en/cp65-lookup.html'],
 a1:['Beosin · 202603131847','https://www.beosin.com/audits/Magne.AI_202603131847.pdf'],
 a2:['Beosin · 202603181600','https://www.beosin.com/audits/Magne.AI_202603181600.pdf'],
 network:['W3 · Network','https://w3.magne.ai/network.html'],
 agent:['W3 · AgentPay','https://w3.magne.ai/agentpay.html'],
 box:['W3 · AI BOX','https://w3.magne.ai/ai-box.html'],
 s1:['W3 · Season 1','https://w3.magne.ai/season-1.html'],
 s2:['W3 · Season 2','https://w3.magne.ai/season-2.html'],
 og:['W3 · Public Sale OG','https://w3.magne.ai/public-sale-og.html'],
 kucoin:['KuCoin · MHA listing','https://www.kucoin.com/announcement/en-world-premiere-magne-ai-mha-listed-on-kucoin'],
 bitget:['Bitget · MHA listing','https://www.bitget.com/support/articles/12560603895256'],
 mexc:['MEXC · MHA listing','https://www.mexc.com/ja-JP/announcements/article/first-in-market-17827791538572'],
 lbank:['LBank · MHA listing','https://www.lbank.com/hi/support/articles/2099819086971142144'],
};
// Dates are event/public-record dates; conflicts remain explicit rather than silently resolved.
const groups=[
 {id:'section-1',title:['MAG1 · Hardware and compliance','MAG1 · 硬件與合規'],rows:[
 ['2025-11-04',['GMS disclosure','GMS 公開記錄'],['Published record','公開記錄'],['Widevine L1 references are in the device passport; this is not a new device-wide security certification.','Widevine L1 參考資料見裝置護照；不延伸為整機安全等級認證。'],['progress','compliance']],
 ['2025-12-01',['UN38.3 record','UN38.3 運輸測試記錄'],['Published record','公開記錄'],['Transport documentation is indexed by the official site.','官網已提供運輸測試資料入口。'],['progress','compliance']],
 ['2025-12-03',['GSMA TAC','GSMA TAC 核發記錄'],['Published record','公開記錄'],['MAG1 · TAC 01681300.','MAG1 · TAC 01681300。'],['progress','compliance']],
 ['2025-12-11',['CB battery safety record','CB 電池安全記錄'],['Published record','公開記錄'],['IEC 62133-2 scope follows the certificate.','IEC 62133-2 適用範圍以證書為準。'],['progress','compliance']],
 ['2025-12-25',['PRE EVT · P0 acceptance','PRE EVT · P0 階段驗收'],['Company disclosure','公司披露'],['Controlled evidence.','支持文件受控查閱。'],['progress']],
 ['2026-01-07',['EVT trial production started','EVT 試產啟動'],['Company disclosure','公司披露'],['Stage record.','階段記錄。'],['progress']],
 ['2026-02-03',['EVT · P1 acceptance','EVT · P1 階段驗收'],['Company disclosure','公司披露'],['Controlled evidence.','支持文件受控查閱。'],['progress']],
 ['2026-04-07',['Prop 65 report record','Prop 65 測試報告記錄'],['Published report','報告公開'],['Chemical testing scope follows the report, not a blanket regulatory approval.','屬化學物質測試報告，不概括為監管全面批准。'],['progress','cp']],
 ['2026-05-24',['FCC public record','FCC 公開記錄'],['Documents published','資料公開'],['FCC ID 2BVCPGC603606; chronology date, not every report’s issue date.','FCC ID 2BVCPGC603606；此為時間軸公開節點，不代表每份報告的簽發日。'],['progress','fcc']],
 ['2026-07-02',['CE documents published','CE 資料公開'],['Documents published','資料公開'],['Type-examination and supporting documents are available. Scope is configuration-specific.','型式檢驗及支持文件可查；適用範圍以配置及原文件為準。'],['progress','ce']],
 ['2026-07-03',['PVT · P2 acceptance','PVT · P2 階段驗收'],['Company disclosure','公司披露'],['Does not establish shipments.','不等同已完成批量出貨。'],['progress']],
 ]},
 {id:'section-2',title:['Networks and contract security','網絡與合約安全'],rows:[
 ['2025-09-09',['L1 / L2 code publication','L1／L2 程式碼公開'],['Public record','公開記錄'],['Open-source milestone.','開源節點。'],['progress','root']],
 ['2025-10-12',['M Hash L2 explorer','M Hash L2 測試網瀏覽器'],['Testnet','測試網'],['Chain ID 20250827; the ID is not a launch date.','Chain ID 20250827；編號不是上線日期。'],['progress','network']],
 ['2025-10-20',['MAGNE L1 explorer','MAGNE L1 測試網瀏覽器'],['Testnet','測試網'],['Chain ID 20250810; no mainnet completion claim.','Chain ID 20250810；不表示主網已完成。'],['progress','network']],
 ['2026-03-13',['Beosin business-contract report','Beosin 業務合約審計報告'],['Report published','報告公開'],['Report 202603131847 identifies the reviewed BNB Chain code and findings; it is not an L1/L2 audit.','報告 202603131847 列明受審 BNB Chain 程式碼及發現事項；不是 L1／L2 主網審計。'],['a1']],
 ['2026-03-18',['Beosin token / NFT report','Beosin 代幣／NFT 合約審計報告'],['Report published','報告公開'],['Report 202603181600 covers specified MHAToken / MagneNFT code. The report alone does not prove equivalence to later deployments or new v1.1 rules.','報告 202603181600 涵蓋指定 MHAToken／MagneNFT 程式碼；不能單凭該報告認定後續部署或新版 1.1 規則已受審。'],['a2']],
 ]},
 {id:'section-3',title:['Company, financing and MHA','公司、融資與 MHA'],rows:[
 ['2025-07-20',['MYBW Launch Night','MYBW Launch Night'],['Public event record','公開活動記錄'],['Product introduction.','產品公開亮相。'],['progress','root']],
 ['2025-08-24',['New York · AI / RWA event','紐約 · AI／RWA 活動'],['Public event record','公開活動記錄'],['Community event.','社群交流。'],['progress','root']],
 ['2025-08-26',['US$10M strategic round','1,000 萬美元策略融資'],['Company disclosure','公司披露'],['Funding announcement; not an audited cash balance.','融資公告，不是經審計現金餘額。'],['progress','root']],
 ['2026-01-22',['Philadelphia · RWA event','費城 · RWA 活動'],['Public event record','公開活動記錄'],['Public engagement.','公開交流。'],['progress','root']],
 ['2026-03-06 / 03-13',['MHA legal opinion record','MHA 法律意見記錄'],['Date reconciliation','日期待對齊'],['Official site: 6 March; ROOTDATA: 13 March. Original under controlled review; no blanket legal-status conclusion reproduced here.','官網列 3 月 6 日，ROOTDATA 列 3 月 13 日。原件受控查閱；本頁不重述全面法律定性。'],['compliance','root']],
 ['2026-07-12',['WebX Tokyo event','WebX 東京活動'],['Public event record','公開活動記錄'],['Participation record.','參與記錄。'],['progress','root']],
 ['2026-07-22 / 08-05',['Additional US$2.64M round','新增 264 萬美元融資'],['Company disclosure · date reconciliation','公司披露 · 日期待對齊'],['Official chronology: 22 July; ROOTDATA: 5 August. One round, not two; cumulative disclosed financing US$12.64M.','官網時間軸列 7 月 22 日，ROOTDATA 列 8 月 5 日。同一輪不重複計算；累計披露融資 1,264 萬美元。'],['progress','root']],
 ['2026-09-02',['MHA BSC deployment entry','MHA BSC 部署登記'],['ROOTDATA entry','ROOTDATA 收錄'],['Date is from the event calendar; deployment transaction timestamp was not independently reverified in this update. Current BSC contract is linked in Tokenomics.','日期依事件日曆收錄；本次未重新獨立核驗部署交易時間戳。現行 BSC 合約見代幣經濟頁。'],['root']],
 ['2026-09-17 · 12:00 UTC',['MHA/USDT listing milestone','MHA／USDT 上市節點'],['Exchange announcements','交易所公告'],['Bitget, KuCoin, MEXC and LBank specify this trading start. BSC token trading does not establish MAGNE L1/L2 mainnet launch.','Bitget、KuCoin、MEXC、LBank 公告均列此交易啟動時間。BSC 代幣交易不等同 MAGNE L1／L2 主網上線。'],['bitget','kucoin','mexc','lbank']],
 ]},
 {id:'section-4',title:['Community and product disclosures','社群與產品資料公開'],rows:[
 ['2026-04-20',['Season 1 campaign and dashboard','Season 1 活動與面板'],['Launch record','啟動記錄'],['Campaign launch and dashboard are grouped as one milestone.','活動與面板合併記錄，不重複計作兩次啟動。'],['progress','s1']],
 ['2026-07-06',['Season 1 campaign close','Season 1 活動結束'],['Campaign archive','活動歸檔'],['Campaign closure is separate from delivery and reward settlement.','活動結束不等同手機已全部交付或獎勵已結算。'],['progress','s1']],
 ['2026-07-10',['Season 2 launch','Season 2 活動啟動'],['Launch record','啟動記錄'],['1,600 phones is campaign configuration, not a verified active-device count.','1,600 台是活動配置，不是已核驗活躍設備數。'],['progress','s2']],
 ['2026-08-21–27',['MAG1 specifications, viewer and W3 preview','MAG1 規格、結構查看器與 W3 預覽'],['Public pages · dates differ','頁面公開 · 日期有差異'],['Primary site and ROOTDATA assign different dates to this group of releases; see reconciliation notes below. Publication does not establish commercial delivery.','官網與 ROOTDATA 對這組發布的日期不同，見下方校對說明；資料公開不等同商業交付。'],['progress','root']],
 ['2026-08',['AI BOX roadmap and controlled test matrix','AI BOX 路線圖與受控測試矩陣'],['Conditional POC','有條件 POC'],['Public page distinguishes measured examples from engineering targets. A first sample is shown; Gate 0 remains in progress and Gate 1 validation is next. No mass-production conclusion.','公開頁區分受控測試與工程目標；已展示首台工程樣機，Gate 0 仍進行中，下一步為 Gate 1 驗證，不作量產結論。'],['box','root']],
 ['2026-09-08',['Public Sale OG conversion disclosure','Public Sale OG 轉換安排披露'],['Rules published','規則公開'],['Choice to retain rights or convert to MS2; publication is not proof that all conversions, claims or the final Season 2 settlement are complete.','可保留原權益或選擇轉換 MS2；規則公開不代表全部轉換、領取或 Season 2 最終結算已完成。'],['og']],
 ]},
];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const out='docs/milestone-update-20261001';await fs.mkdir(out,{recursive:true});
await fs.writeFile(out+'/evidence-register.json',JSON.stringify({checked:'2026-10-01',sources,groups},null,2));
for(const tc of [false,true]){
 const t=(en,zh)=>tc?zh:en;const txt=p=>esc(p[tc?1:0]);
 const links=keys=>keys.map(k=>`<a href="${esc(sources[k][1])}">${esc(sources[k][0])}</a>`).join(' · ');
 let html=`<h1 id="section-0">${t('Milestones and current status','里程碑與目前進度')}</h1><p class="token-lead">${t('Public-record review · 1 October 2026','公開記錄核對 · 2026 年 10 月 1 日')}</p><p>${t('Milestones are ordered within each topic. Event dates, report dates and publication dates are distinguished; unresolved source differences are retained. Company disclosures, public reports and test environments are labeled separately.','各主題內按時間排序，區分事件日期、報告日期與公開日期；來源未一致之處保留差異。公司披露、公開報告及測試環境分別標示。')}</p><nav class="token-version-links" aria-label="${t('Milestone sections','里程碑章節')}">${groups.map(g=>`<a href="#${g.id}">${txt(g.title)}</a>`).join('')}<a href="#next-stage">${t('Next stages','下一階段')}</a><a href="#date-notes">${t('Date notes','日期校對')}</a></nav>`;
 for(const g of groups){html+=`<h2 id="${g.id}">${txt(g.title)}</h2><div class="table-wrap" role="region" tabindex="0" aria-label="${txt(g.title)}"><table><caption>${txt(g.title)}</caption><thead><tr>${[t('Date / record window','日期／記錄期間'),t('Milestone','里程碑'),t('Status / source','狀態／來源')].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${g.rows.map(([d,event,status,note,keys])=>`<tr><th scope="row">${esc(d)}</th><td><strong>${txt(event)}</strong><p>${txt(note)}</p></td><td>${txt(status)}<p>${links(keys)}</p></td></tr>`).join('')}</tbody></table></div>`;}
 html+=`<h2 id="next-stage">${t('Next stages · completion not established','下一階段 · 不列作已完成')}</h2><ul><li><strong>MAG1：</strong>${t('P2 acceptance is company-disclosed. The old June–August delivery/ramp windows are historical targets; public sources reviewed here do not establish completed mass shipment. Update against batch acceptance and delivery records.','P2 驗收已有公司披露；舊版 6–8 月交付／爬坡窗口屬歷史目標，本次查閱來源不足以確認批量出貨完成，後續以批次驗收及交付記錄更新。')}</li><li><strong>MAGNE L1 / M Hash L2：</strong>${t('Public resources remain labeled testnet. Mainnet, production settlement and token migration require their own launch records; BSC listing does not satisfy those milestones.','公開資源仍標示測試網；主網、生產結算及代幣遷移須各自有啟用記錄，BSC 上市不代替這些節點。')} ${links(['network'])}</li><li><strong>AgentPay：</strong>${t('Sandbox and testnet evidence are available. This page does not mark production payments as launched.','沙盒及測試網證據可查，本頁不將生產支付列為已上線。')} ${links(['agent'])}</li><li><strong>AI BOX：</strong>${t('First sample disclosed; specification freeze and three-prototype validation remain engineering gates.','已披露首台樣機；規格凍結及三台原型驗證仍須完成工程驗收。')} ${links(['box'])}</li><li><strong>${t('Whitepaper v1.1','白皮書 v1.1')}：</strong>${t('GEN1 incentives and ecosystem reimbursement remain review proposals; publication of this local draft is not execution.','GEN1 激勵及生態預算補回仍屬審核草案；本地草稿更新不代表已執行。')} <a href="${tc?'/tc':''}/learning/tokenomics">${t('Tokenomics status','代幣經濟執行狀態')}</a></li></ul>`;
 html+=`<h2 id="date-notes">${t('Date reconciliation and historical records','日期校對與歷史記錄')}</h2><ul><li>${t('GMS, UN38.3, CB, Prop 65 and FCC use the current official public chronology instead of the April draft’s dates. These are public-record milestones; original document dates and scopes remain controlling. CE is now a published-document milestone.','GMS、UN38.3、CB、Prop 65、FCC 改採目前官網公開時間軸節點，取代 4 月舊稿日期；原文件日期與適用範圍仍為依據。CE 已更新為資料公開節點。')}</li><li>${t('Legal opinion: official record 6 March versus ROOTDATA 13 March. Additional financing: official record 22 July versus ROOTDATA 5 August. No assumption that either pair proves separate events.','法律意見：官網 3 月 6 日、ROOTDATA 3 月 13 日；新增融資：官網 7 月 22 日、ROOTDATA 8 月 5 日。不假設兩種日期代表兩個不同事件。')}</li><li>${t('August releases: the official chronology groups W3 preview on 21 August and specifications, AI BOX, monitoring, viewer and registry on 22 August. ROOTDATA lists preview on 22 August and those releases across 23–27 August. The date window is retained pending original release timestamps.','8 月發布：官網將 W3 預覽列於 21 日，規格、AI BOX、監控、查看器與登記冊列於 22 日；ROOTDATA 將預覽列於 22 日，其餘分列於 23–27 日。本頁保留期間，待原始發布時間戳對齊。')}</li><li>${t('The old August 2025 network dates matched chain identifiers and are no longer presented as verified launch dates. October explorer milestones and the current testnet boundary are used instead.','舊稿 2025 年 8 月網絡日期與 Chain ID 對應，不再據此斷言上線日期；改列 10 月瀏覽器公開節點及現有測試網狀態。')}</li><li>${t('UTEE EAL2+ and HyperSeed component EAL6+ references remain in the security evidence index. They do not establish equivalent certification for the whole MAG1 device; old component dates and NDA-only contract details are not independently reverified here.','UTEE EAL2+ 及 HyperSeed 元件 EAL6+ 參考資料仍由安全證據索引提供，不延伸為 MAG1 整機同等認證；舊稿元件日期及 NDA 合約細節本次未獨立核驗。')} ${links(['compliance'])}</li></ul><p>${links(['progress','root'])}</p><p><a href="/v1.0/learning/milestone">${t('Read the preserved v1.0 milestone page','查閱保留的 v1.0 里程碑頁')}</a></p><footer class="token-footnote">${t('Reviewed 1 October 2026 · Source links support their stated scope. No live participation, revenue, price or shipment counts are inferred.','核對日期：2026 年 10 月 1 日 · 來源僅支持所標示範圍，不據此推導即時參與人數、收入、價格或出貨量。')}</footer>`;
 const path=`src/content/${tc?'whitepaper-tc':'whitepaper'}/learning/milestone.html`;
 await fs.writeFile(`${out}/${tc?'tc':'en'}-before.html`,await fs.readFile(path,'utf8'),{flag:'wx'});
 await fs.writeFile(path,html.replaceAll('單凭','單憑'));
}
console.log(`Updated both locales with ${groups.reduce((n,g)=>n+g.rows.length,0)} milestones, source links, date reconciliations and pending stages.`);
