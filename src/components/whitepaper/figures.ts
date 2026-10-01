/** Server-rendered, bilingual figures for v1.1 only. Captured source and v1.0 stay intact. */
type Locale = "en" | "tc";
type Translator = (en: string, tc: string) => string;
type Step = { title: string; detail: string; icon?: string };

const assetRoot = "/sites/web3-magne-ai-9982170f/shared/full-site/";
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const paths: Record<string, string> = {
  device: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4M11 19h2"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-4-4 3-3m-6 0 3-3"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/>',
  blocks: '<rect x="2" y="2" width="7" height="7"/><rect x="15" y="2" width="7" height="7"/><rect x="8.5" y="15" width="7" height="7"/><path d="M5.5 9v3h13V9m-6.5 3v3"/>',
  app: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7m-3.5-3.5v7"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>',
  wallet: '<path d="M20 8V4H5a3 3 0 0 0 0 6h16v11H5a3 3 0 0 1-3-3V7"/><path d="M21 13h-6v5h6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
};
function icon(name = "layers") {
  return `<svg class="wpf-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.layers}</svg>`;
}
function frame(id: string, eyebrow: string, title: string, body: string, caption: string, variant = "") {
  return `<figure class="wpf ${variant}" data-figure="${id}" aria-labelledby="wpf-${id}"><div class="wpf-heading"><span class="wpf-eyebrow">${escape(eyebrow)}</span><h3 id="wpf-${id}">${escape(title)}</h3></div>${body}<figcaption>${escape(caption)}</figcaption></figure>`;
}
function flow(steps: Step[], sequential = true) {
  return `<ol class="wpf-flow${sequential ? "" : " wpf-flow-parallel"}">${steps.map((step, i) => `<li><div class="wpf-step-mark"><span>${String(i + 1).padStart(2, "0")}</span>${icon(step.icon)}</div><strong>${escape(step.title)}</strong><p>${escape(step.detail)}</p></li>`).join("")}</ol>`;
}
function concept(t: Translator) {
  return t("Conceptual reading guide. Relationships and roles shown here describe the whitepaper design, not verified deployment status.", "概念閱讀圖：呈現白皮書中的設計角色與關係，不代表已驗證的部署狀態。");
}
function overview(t: Translator) {
  return frame("ecosystem", t("01 / ECOSYSTEM", "01 / 生態系統"), t("From the device to the network", "從裝置到網絡"),
    `<div class="wpf-system"><div class="wpf-system-edge">${icon("device")}<span>${t("DEVICE", "裝置")}</span><strong>MAGNE.AI Phone</strong><p>${t("On-device AI · User interaction", "端側 AI · 使用者操作")}</p></div><div class="wpf-system-link" aria-hidden="true">↔</div><div class="wpf-system-core"><div class="wpf-system-app">${icon("app")}<strong>${t("Applications & developer tools", "應用與開發者工具")}</strong></div><div class="wpf-system-networks"><div><span>L1</span><strong>MAGNE</strong><p>${t("Base network", "基礎網絡")}</p></div><div><span>L2</span><strong>M Hash</strong><p>${t("Application execution", "應用執行")}</p></div></div></div></div><div class="wpf-rail"><span>MHA</span><p>${t("Token allocation and release rules are documented in Tokenomics.", "代幣分配與釋放規則詳見代幣經濟章節。")}</p></div>`, concept(t));
}
function network(t: Translator, layer: 1 | 2, compact = false) {
  const name = layer === 1 ? "MAGNE L1" : "M Hash L2";
  if (compact) return `<aside class="wpf-inline">${icon("layers")}<strong>${name}</strong><span>${layer === 1 ? t("Base network · EVM compatibility", "基礎網絡 · EVM 相容性") : t("Application execution · OP Stack design", "應用執行 · OP Stack 設計")}</span></aside>`;
  const steps = layer === 1 ? [
    {title:t("Transaction", "交易"), detail:t("A wallet or application submits a request.", "錢包或應用提交請求。"), icon:"wallet"},
    {title:t("Execution", "執行"), detail:t("Contract logic reads and updates state.", "合約邏輯讀取並更新狀態。"), icon:"chip"},
    {title:t("Network record", "網絡紀錄"), detail:t("Blocks record transactions and resulting state.", "區塊記錄交易與執行後狀態。"), icon:"blocks"},
  ] : [
    {title:t("Application request", "應用請求"), detail:t("Users interact through wallets and applications.", "使用者透過錢包與應用操作。"), icon:"app"},
    {title:t("L2 execution", "L2 執行"), detail:t("Transaction processing within the L2 design.", "在 L2 設計中處理交易。"), icon:"chip"},
    {title:t("L1 interaction", "L1 互動"), detail:t("Publication and verification depend on the deployed configuration.", "提交與驗證方式取決於實際部署配置。"), icon:"layers"},
  ];
  return frame(`network-${layer}`, t("NETWORK / READING MAP", "網絡 / 閱讀圖"), name, flow(steps), concept(t));
}
function token(t: Translator) {
  return `<figure class="wpf-token" aria-label="${t("MHA supply overview", "MHA 供應概覽")}"><div class="wpf-token-symbol" aria-hidden="true">M<span>HA</span></div><div><span class="wpf-eyebrow">${t("TOTAL ALLOCATION", "分配總量")}</span><strong>10,000,000,000 <span>MHA</span></strong></div><figcaption>${t("Total allocation, not circulating supply.", "分配總量，不代表流通供應量。")}</figcaption></figure>`;
}

export const allocation = [
  {en:"Mining Nodes",tc:"挖礦節點",percent:30,anchor:"allocation-1"},
  {en:"Staking Nodes",tc:"質押節點",percent:15,anchor:"allocation-2"},
  {en:"Ecosystem / DAO",tc:"生態系統 / DAO",percent:15,anchor:"allocation-3"},
  {en:"Team & Advisors",tc:"團隊與顧問",percent:10,anchor:"allocation-4"},
  {en:"VC",tc:"創投機構",percent:10,anchor:"allocation-5"},
  {en:"Early Supporters",tc:"早期支持者",percent:8,anchor:"allocation-6"},
  {en:"Early Liquidity Market Makers",tc:"早期流動性做市商",percent:7,anchor:"market-makers"},
  {en:"Subscription / Public Sale",tc:"認購 / 公開銷售",percent:3,anchor:"allocation-8"},
  {en:"Equipment-Sale Agents",tc:"設備銷售代理",percent:1,anchor:"allocation-9"},
  {en:"Exchange Campaigns",tc:"交易所活動",percent:1,anchor:"exchange-campaigns"},
] as const;

function allocationChart(t: Translator) {
  let offset = 0;
  const bars = allocation.map((a, i) => {
    const x = offset * 10; offset += a.percent;
    return `<rect class="wpf-color-${i}" x="${x}" y="0" width="${a.percent * 10}" height="64"/>`;
  }).join("");
  const rows = allocation.map((a, i) => `<li><a href="#${a.anchor}"><span class="wpf-allocation-number">${String(i + 1).padStart(2, "0")}</span><span class="wpf-allocation-name">${escape(t(a.en, a.tc))}<small>${(a.percent * 100_000_000).toLocaleString("en-US")} MHA</small></span><strong>${a.percent}%</strong><svg class="wpf-allocation-meter" viewBox="0 0 1000 3" preserveAspectRatio="none" aria-hidden="true"><rect width="1000" height="3" class="wpf-meter-track"/><rect width="${a.percent * 10}" height="3" class="wpf-color-${i}"/></svg></a></li>`).join("");
  return frame("allocation", t("MHA / SUPPLY DISTRIBUTION", "MHA / 供應分配"), t("One supply. Ten allocations.", "一個總量，十項分配。"), `<div class="wpf-allocation-total"><strong>10<span>B</span></strong><div><b>MHA</b><span>${t("10,000,000,000 total", "總量 100 億")}</span></div><span class="wpf-status">${t("Allocation unchanged", "分配比例不變")}</span></div><svg class="wpf-allocation-bar" viewBox="0 0 1000 64" preserveAspectRatio="none" aria-hidden="true">${bars}</svg><ol class="wpf-allocations">${rows}</ol>`, t("Source: the allocation table above. Bars share the same scale; select a category to read its rules. Allocation does not equal unlocked or circulating supply.", "來源：上方分配表。各橫條使用相同比例尺；選取類別可閱讀規則。分配額不等於已解鎖或流通供應量。"));
}
function hardware(t: Translator, index: number) {
  if (index === 0) return `<figure class="wpf-product"><img src="/sites/web3-magne-ai-9982170f/root-8a5edab2/mag1-white-official.webp" width="2314" height="1724" alt="${t("Official MAG1 product rendering, front, rear and side views", "MAG1 官方產品渲染圖：正面、背面與側面")}" loading="lazy"/><figcaption><span>MAG1</span>${t("Official product rendering · MAGNE.AI media kit", "官方產品渲染圖 · MAGNE.AI 媒體資料")}</figcaption></figure>`;
  if (index === 1) return frame("device-roles", t("HARDWARE / FUNCTIONAL MAP", "硬件 / 功能圖"), t("Three roles inside the device", "裝置中的三種角色"), flow([
    {title:t("On-device AI", "端側 AI"),detail:t("Local computation and application workloads.", "本機運算與應用工作負載。"),icon:"chip"},
    {title:t("Key protection", "金鑰保護"),detail:t("Secure components for sensitive cryptographic operations.", "由安全元件處理敏感密碼學操作。"),icon:"key"},
    {title:t("Network access", "網絡存取"),detail:t("Wallet and application interfaces to the network.", "透過錢包與應用介面存取網絡。"),icon:"layers"},
  ], false), t("Functional overview, not a hardware specification sheet. Performance, component configuration and availability depend on the device version.", "功能概覽，不是硬件規格表。效能、元件配置與可用功能以具體裝置版本為準。"));
  if (index === 2) return frame("secure-signing", t("N60 / CONCEPTUAL SIGNING PATH", "N60 / 簽署路徑示意"), t("Keep the key separate from the request", "將金鑰與外部請求分開"),
    `<div class="wpf-signing"><div class="wpf-signing-request">${icon("app")}<strong>${t("Application", "應用程式")}</strong><span>${t("Signing request", "簽署請求")}</span></div><div class="wpf-signing-arrow" aria-hidden="true">⇄</div><div class="wpf-secure-zone"><span class="wpf-zone-label">${t("SECURE COMPONENT", "安全元件")}</span>${icon("key")}<strong>${t("Protected key", "受保護金鑰")}</strong><span>${t("Cryptographic operation", "密碼學操作")}</span></div></div><div class="wpf-rail"><span>${t("OUTPUT", "輸出")}</span><p>${t("Return a signature; do not export the private key.", "回傳簽章；不匯出私鑰。")}</p></div>`, t("Illustrative security boundary described in this chapter, not a chip wiring diagram or certification. Actual protection depends on implementation and device configuration.", "本章安全邊界的概念示意，不是晶片接線圖或認證證明。實際保護取決於實作與裝置配置。"));
  if (index === 3) return frame("secure-element", t("72B / KEY PROTECTION", "72B / 金鑰保護"), t("A dedicated boundary for sensitive operations", "敏感操作的獨立保護邊界"), `<div class="wpf-boundary"><span class="wpf-zone-label">${t("SECURE ELEMENT", "安全元件")}</span>${flow([
    {title:t("Key storage", "金鑰儲存"),detail:t("Protect sensitive key material.", "保護敏感金鑰資料。"),icon:"key"},
    {title:t("Cryptographic operations", "密碼學操作"),detail:t("Perform authorised operations inside the boundary.", "在保護邊界內執行獲授權操作。"),icon:"chip"},
    {title:t("Result", "運算結果"),detail:t("Expose the permitted result to the application.", "向應用提供允許輸出的結果。"),icon:"check"},
  ])}</div>`, t("Component role illustration. Certification level, retention and endurance figures require the applicable component documentation; they are not established by this diagram.", "元件角色示意。認證等級、保存年限及耐用度須依適用元件文件確認，本圖不構成證明。"));
  return frame("tee", t("TEE / EXECUTION BOUNDARIES", "TEE / 執行邊界"), t("Separate everyday apps from sensitive execution", "分隔一般應用與敏感執行環境"), `<div class="wpf-worlds"><div class="wpf-world"><span class="wpf-zone-label">${t("NORMAL ENVIRONMENT", "一般執行環境")}</span>${icon("app")}<strong>${t("Applications & OS", "應用與作業系統")}</strong><p>${t("User interaction and ordinary application logic.", "使用者操作與一般應用邏輯。")}</p></div><div class="wpf-world wpf-world-trusted"><span class="wpf-zone-label">${t("TRUSTED ENVIRONMENT", "可信執行環境")}</span>${icon("shield")}<strong>TEE</strong><p>${t("Isolated execution for designated sensitive operations.", "隔離執行指定的敏感操作。")}</p></div></div><div class="wpf-foundation">${icon("chip")}<span>${t("Hardware-supported isolation", "硬件支援的隔離機制")}</span></div>`, t("Conceptual separation, not a physical chip layout. TEE and a secure element are different protection mechanisms. Certification scope is specific to the evaluated component and version.", "概念分隔圖，不是實體晶片配置圖。TEE 與安全元件屬不同保護機制；認證範圍以受評估元件及版本為準。"));
}
function dapp(t: Translator) {
  return frame("dapp", t("APPLICATIONS / IN PLANNING", "應用 / 規劃中"), "Shin Getter Nexus", `<div class="wpf-hub"><div class="wpf-hub-entry">${icon("device")}<strong>${t("Users & developers", "使用者與開發者")}</strong></div><div class="wpf-hub-core">${icon("app")}<strong>DApp Hub</strong><span>${t("Proposed shared entry point", "擬議的統一入口")}</span></div><div class="wpf-hub-destinations"><span>${t("Applications", "應用")}</span><span>${t("Tools", "工具")}</span><span>${t("Services", "服務")}</span></div></div>`, t("Planned product concept. This is an information map, not a screenshot of a released application.", "規劃中的產品概念。此圖為資訊關係圖，並非已發布應用的畫面。"));
}

function referenceImages(sources: string[], t: Translator, label: string) {
  return `<details class="wpf-reference"><summary>${t("View original screenshots", "查看原始截圖")} <span>${sources.length}</span></summary><p>${t("Historical reference from the original whitepaper. Wallet UI and network information may have changed. Open an image to inspect it at full size.", "原白皮書中的歷史參考畫面；錢包介面及網絡資訊可能已變更。選取圖片可查看完整原圖。")}</p><div class="wpf-reference-images">${sources.map((src, i) => `<a href="${escape(src)}" target="_blank" rel="noopener noreferrer"><img src="${escape(src)}" loading="lazy" alt="${escape(label)} — ${t("historical screenshot", "歷史截圖")} ${i + 1}"/><span>${t("Open full image", "開啟完整原圖")} ${i + 1} ↗</span></a>`).join("")}</div></details>`;
}
function walletGuide(t: Translator, first: number, sources: string[]) {
  const groups: Record<number, [string, string, Step[]]> = {
    0: [t("Install the wallet", "安裝錢包"), t("Use the wallet publisher’s official download page.", "使用錢包發行者的官方下載頁面。"), [
      {title:t("Official source", "官方來源"),detail:"metamask.io",icon:"search"},
      {title:t("Install", "安裝"),detail:t("Select the extension for your browser.", "選取適用於瀏覽器的擴充功能。"),icon:"wallet"},
      {title:t("Open wallet", "開啟錢包"),detail:t("Complete the wallet’s own setup process.", "完成錢包本身的設定流程。"),icon:"check"}]],
    1: [t("Open the L1 testnet explorer", "開啟 L1 測試網瀏覽器"), "MAGNE L1 Testnet", []],
    2: [t("Review the L1 request in your wallet", "在錢包檢查 L1 請求"), "MAGNE L1 Testnet", []],
    3: [t("Check the active L1 network", "檢查目前的 L1 網絡"), "MAGNE L1 Testnet", []],
    4: [t("Open the L2 testnet explorer", "開啟 L2 測試網瀏覽器"), "M Hash L2 Testnet", []],
    5: [t("Review the L2 request in your wallet", "在錢包檢查 L2 請求"), "M Hash L2 Testnet", []],
    6: [t("Check the active L2 network", "檢查目前的 L2 網絡"), "M Hash L2 Testnet", []],
    7: [t("Open network settings", "開啟網絡設定"), t("Wallet → Networks → Add network", "錢包 → 網絡 → 新增網絡"), []],
    9: [t("Enter the network details", "填入網絡資料"), t("Use the testnet configuration table above.", "使用上方的測試網配置表。"), []],
    11: [t("Review before saving", "儲存前核對"), t("Check the RPC URL, chain ID and explorer URL.", "核對 RPC 網址、Chain ID 及瀏覽器網址。"), []],
    13: [t("Confirm the selected network", "確認已選取的網絡"), t("Select the testnet you intend to use.", "選取你準備使用的測試網。"), []],
  };
  const [title, detail, steps] = groups[first];
  const body = steps.length ? flow(steps) : `<div class="wpf-guide-step">${icon(first === 9 ? "layers" : first === 11 || first === 13 ? "check" : "wallet")}<div><strong>${escape(detail)}</strong><p>${t("Instruction diagram · Confirm changes in the actual wallet.", "操作示意 · 請在實際錢包中確認變更。")}</p></div></div>`;
  return frame(`wallet-${first}`, t("WALLET / TESTNET GUIDE", "錢包 / 測試網指引"), title, body, t("Button names and layout vary by wallet version. This diagram does not connect a wallet or submit a transaction.", "按鈕名稱與配置依錢包版本而異。本圖不會連接錢包或提交交易。"), "wpf-guide") + referenceImages(sources, t, title);
}
function explorer(t: Translator, layer: number, sources: string[]) {
  return frame(`explorer-${layer}`, t("EXPLORER / READING GUIDE", "區塊瀏覽器 / 閱讀指引"), layer === 1 ? "MAGNE L1 Testnet" : "M Hash L2 Testnet", `<div class="wpf-explorer-query">${icon("search")}<span>${t("Transaction hash · Address · Block number", "交易雜湊 · 地址 · 區塊編號")}</span></div>${flow([
    {title:t("Transactions", "交易"),detail:t("Inspect the result, sender, recipient and fee.", "查看結果、發送方、接收方及費用。"),icon:"layers"},
    {title:t("Addresses", "地址"),detail:t("Read the balance and transaction history on this network.", "閱讀此網絡上的餘額與交易紀錄。"),icon:"wallet"},
    {title:t("Blocks", "區塊"),detail:t("Inspect block contents and timestamps.", "查看區塊內容與時間戳記。"),icon:"blocks"},
  ], false)}`, t("A guide to reading an explorer, not a live dashboard. No live transaction, balance or throughput data is shown.", "區塊瀏覽器閱讀指引，並非即時儀表板；本圖未展示即時交易、餘額或吞吐量。")) + referenceImages(sources, t, `L${layer}`);
}

const walletFiles = ["177d72cc3549-connect.png","db30a5515d19-connect01.png","f28e0e434acf-connect02.png","7d604aa7e46e-connect03.png","6a6f9c97fdf8-connect04.png","72ecff6c1b2d-connect05.png","16208a7f6eb4-connect06.png","5556d159664f-connect07.png","dd8a0949504a-connect08.png","a39dd0d54974-connect09.png","67685ba37068-connect10.png","072cebb4173b-connect11.png","e1327ccaec9f-connect12.png","3e0aefe46955-connect13.png","c28228772648-connect14.png"];
const hardwareFiles = ["9b5b6fb817a8-pg.png","71ac8d8be3bd-Hardware01.png","2959ff813478-Hardware02.png","3b8267fa1b4c-Hardware03.png","8868149de808-Hardware04.png"];

export function renderWhitepaperFigures(html: string, route: string, locale: Locale): string {
  const t: Translator = (en, tc) => locale === "tc" ? tc : en;
  // Only replace image-only wrappers with known assets. Never rewrite arbitrary source HTML.
  return html.replace(/<(p|div)(?:\s[^>]*)?>\s*((?:<img\b[^>]*>\s*)+)<\/\1>/g, (original: string, _tag: string, images: string) => {
    const sources = [...images.matchAll(/\bsrc="([^"]+)"/g)].map(match => match[1]);
    if (!sources.length || sources.some(src => !src.startsWith(assetRoot))) return original;
    const name = sources[0].slice(assetRoot.length);
    if (route === "/learning/what-is-magne") {
      if (name === "a999b92c4166-ma.png") return overview(t);
      if (name === "fa7535017809-l1.png") return network(t, 1, true);
      if (name === "2ecf186c865b-l2.png") return network(t, 2, true);
    }
    if ((route === "/learning/mha" || route === "/learning/tokenomics") && name === "2b5d720ea4b7-mha.png") return token(t);
    if (route === "/learning/tokenomics" && name === "737a46138f49-token.png") return allocationChart(t);
    if (route === "/solutions/hardware" && hardwareFiles.includes(name)) return hardware(t, hardwareFiles.indexOf(name));
    if (route === "/learning/magne-dapp" && name === "eed88537d54c-dapp.png") return dapp(t);
    if (route === "/networks/l1" && name === "db4ba7abcd9a-m-l1.png") return network(t, 1);
    if (route === "/networks/l2" && name === "6d14d021aeed-m-l2.png") return network(t, 2);
    if (route === "/solutions/connect" && walletFiles.includes(name)) return walletGuide(t, walletFiles.indexOf(name), sources);
    if (route === "/networks/explorer" && name === "88b2276ec935-Explorer-l1.png") return explorer(t, 1, sources);
    if (route === "/networks/explorer" && name === "48add81c2176-Explorer-l2.png") return explorer(t, 2, sources);
    return original;
  });
}
