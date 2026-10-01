import fs from 'node:fs';
import path from 'node:path';
import { calculateGen1 } from '../../src/components/whitepaper/gen1-model.ts';

const dir=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?=[A-Z]:)/i,''));
const crawl=JSON.parse(fs.readFileSync(path.join(dir,'rendered.json'),'utf8'));
const issues=[];
function add(id,priority,kind,title,routes,problem,action,terms=[],sources=[]){issues.push({id,priority,kind,title,routes,problem,action,terms,sources});}
add('A01','P1','设计需确认','L1 共识、L2 出块与设备挖矿混在一起',
['/learning/what-is-magne','/learning/mha','/learning/pow','/learning/incentives','/networks/l1','/networks/l2','/solutions/hardware','/help/faqs','/help/glossary'],
'多章将 MAGNE L1 描述为 PoW；激励市场甚至称 M Hash L2 为 PoW 生态。FAQ 和术语表又采用验证者质押、CometBFT、单时隙最终性与 PoL。GEN1 的有效任务奖励也不能直接等同于链的出块共识。当前文本未说明这些机制分别属于哪条链、哪个版本及哪个阶段。',
'先由技术团队确认一张架构表：L1 共识、L2 排序与结算、设备任务验证、验证者奖励、PoL 分配。明确已实现／测试／设计中，再统一相关章节；不能直接批量把 PoW 替换成 PoS。',
['M Hash Layer2 PoW','CometBFT','區塊透過 PoW','單時隙最終確定性']);
add('A02','P1','确定存在矛盾','单代币声明与 mBGT 治理描述不一致',
['/learning/tokenomics','/learning/governance','/learning/gov-overview','/help/faqs','/help/glossary'],
'FAQ 明确回答“不采用双代币系统”，由 MHA 负责治理；Tokenomics 又把 mBGT 描述为效用与治理代币。治理章节没有解释投票权来源及其与 mBGT 的关系。',
'确认 mBGT 是否保留、能否转让、是否属于治理凭证及其供应规则；随后统一 FAQ、术语表和治理流程。不要在未确认时把 mBGT 删掉或默认新增流通代币。',
['mBGT','雙代幣','任何 $MHA 持有人']);
add('A03','P1','确定存在高风险表述','公售章节仍保留价格保底和交易所上市承诺',
['/learning/tokenomics'],
'Public Sale 原文仍写“全球前 10 大中心化交易所上市”“上市时价格不会低于该水平”；项目已进入 TGE 后披露阶段，但同节仍写正式预售将开放、上市前完成等未来时态。',
'按实际已发生的销售与上市记录重写。删除无依据的价格下限及交易所级别保证，区分历史销售条款与当前状态；不把历史承诺改写成新的承诺。',
['全球前 10','不會低於','正式預售']);
add('A04','P1','规则需对齐','公售归属安排存在多个口径',
['/learning/tokenomics'],
'同节出现“6 个月 cliff 后 24 个月线性”、第 7 个月释放 1/6 再将余款释放 24 个月，以及 TGE 解锁 20–50% 等比较表口径。读者无法判断哪一套适用于实际购买人，结束月份也可能不同。',
'只保留按销售批次确认的生效规则，逐项定义起算点、cliff、首次释放、后续期数及最后一期；通用行业比较表与项目实际条款分开，或删除。',
['1/6','20–50','24 個月']);
add('A05','P1','确定算例错误','激励市场佣金算例相差十倍',
['/learning/incentives'],
'给定 100 USDC / 10 MHA = 10 USDC/MHA，导入 1 MHA 的奖励对应 10 USDC，5% 佣金应为 0.5 USDC，余款 9.5 USDC；页面写成 5 和 95。另一个“新增 2,500 USDC”算例只按 2,500/11 计算，未处理原先 2,000 USDC 余额。',
'把佣金算例改成 0.5／9.5，或把导入量改为 10 MHA。将第二张表写清是“更新后总余额”还是新增存款；原余额未消耗且新增 2,500 时，应为 4,500/11≈409.09 MHA。',
['佣金分配','新增激勵']);
add('A06','P1','参数冲突与算例错误','Gas、区块时间和 TPS 不能同时成立',
['/learning/metrics','/networks/faucet','/help/faqs','/help/glossary'],
'L2 同时出现 100M 与 140M Gas、规划 150M，出块时间有 1 秒和 2 秒；100M Gas/秒与“标准转账 8,000+ TPS”不匹配。按每笔 21,000 Gas，理论满块上限约 4,761 笔/秒，尚未扣其他开销。费用页写使用量达到上限 50% 就涨 12.5%，但指标页的弹性系数 2、分母 8 下，50% 恰为目标值，基本费应不变。',
'从当前测试网配置／区块数据确定统一参数，标注日期和版本；TPS 改为附负载与测试方法的测量值或明确工程目标。修正基本费示例；固定美元费用改为带时间、MHA 价格与交易类型的估算。',
['140M','8000+','50%','出塊時間：約 2 秒'],
[['EIP-1559 规范','https://eips.ethereum.org/EIPS/eip-1559']]);
add('A07','P1','概念不清','发行、储备释放、减半与最终性缺乏分层定义',
['/learning/mha','/networks/l1','/learning/metrics','/help/faqs'],
'MHA 页有“先通胀、后减半”，L1 页有按区块高度和网络活动动态减半，Tokenomics 则采用固定总量、指定储备池和年度释放曲线。指标又把提款等待期和最终确定性合并成“7 天”，FAQ 写单时隙最终性。',
'说明哪些是已铸造储备的释放，哪些如存在则为链上增发；不同奖励池不能混用同一减半表。分别定义排序确认、L1 结算最终性和提款挑战期。MHA 页已有 BSC／自有网络阶段提示，应保留并进一步对齐具体机制。',
['先通脹','動態減半','提款／最終確定性']);
add('A08','P1','可复现的教程错误','开发教程变量、部署和测试步骤不一致',
['/developers/build-contract','/developers/launch-token','/developers/build-app'],
'设置 MAGICAL_RPC_URL 后使用 MAGNE_RPC_URL 或 MAGICAL_SEPOLIA_RPC_URL，会取到未定义变量。forge create 示例未加 --broadcast，而当前 Foundry 默认 dry run。代币教程将远程 testnet RPC 与 --broadcast 组合称为“本地 dry-run”；重命名 Counter.sol 后未同步改写初始测试中的导入和类名。应用教程还存在 calls.ts 路径与 @/calls 导入位置不清、Provider／网络配置步骤缺失。',
'固定工具版本，统一环境变量和目录结构；分开本地模拟、测试网广播、区块浏览器验证。补齐测试文件和前端 Provider 配置，在干净目录走通两条测试网教程后再发布。本轮没有运行这些广播命令。',
['MAGICAL_RPC_URL','MAGNE_RPC_URL','MAGICAL_SEPOLIA_RPC_URL','--broadcast'],
[['Foundry 部署文档','https://getfoundry.sh/forge/deploying/']]);
add('A09','P1','示例资产易混淆','发币教程创建了同名 Magic Hash / MHA',
['/developers/launch-token'],
'教学合约使用官方代币全名和符号、示例发行量 100 万枚，容易被误读为现行 MHA 合约或部署方法；文末还以更换 RPC 的方式描述主网部署。',
'示例更名为 Demo Token / DEMO，明确与正式 BSC MHA 无关。主网操作在网络配置正式公布前不写成可立即执行的步骤。',
['Magic Hash','主網']);
add('A10','P1','当前状态不一致','规划中的主网仍提供可复制的网络配置',
['/solutions/connect','/networks/explorer'],
'章节虽标“规划中”，仍引导复制主网 RPC 和 Chain ID 509；两处分别使用 HTTP :8500/:8600 与 HTTPS。W3 当前网络页标主网未上线、配置未发布。',
'测试网保留完整配置；主网只列状态和官方发布入口，等参数获确认后由同一数据源生成。不要让“规划中”的表格同时承担操作指引。',
['主網 RPC','Chain ID509'],
[['W3 Network','https://w3.magne.ai/network.html']]);
add('A11','P1','表述过度','硬件与安全章节有绝对安全承诺',
['/solutions/hardware','/solutions/security'],
'“所有交易均在芯片内签署，不受恶意软件攻击”“所有交易、合约及资金…不可篡改”等表述超出组件认证本身能证明的范围；EAL6、EAL2 又与里程碑中的 EAL6+、EAL2+ 写法不统一。',
'按实际支持的钱包、签名路径和威胁模型描述保护能力；明确 UTEE、N60、72B 各自认证对象与版本。保留已证实的硬件能力，去掉“所有／不受攻击／最高标准”等无限承诺。',
['不受惡意','EAL6','最高'],
[['MAGNE Security','https://www.magne.ai/en/security.html']]);
add('A12','P2','技术说明需补证','L2 架构、优化和 ZK 状态未能相互解释',
['/networks/l2','/solutions/opstack','/solutions/optimizations','/networks/faucet'],
'L2 页将系统缩写成 op-geth／op-node 两个组件；排序、batcher、状态提交、挑战者、数据可用性与结算角色没有完整展开。费用页写采用 ZK 证明，其他页却围绕 OP Stack 乐观架构；优化页给出缓存参数和 RPC 方法，但没有对应实现版本或性能证据。采用 OP Stack 也不自动意味着与其他 Rollup 已完成互通。',
'用一张实际部署架构图与组件表统一四章，标明仓库／commit、测试网络和计划功能；ZK、跨链互通、缓存优化分别标实际状态，不从框架潜力推导 MAGNE 已完成。',
['零知識','op-node','originStorage'],
[['OP Stack 推导规范','https://specs.optimism.io/protocol/derivation.html'],['OP Stack 故障证明','https://specs.optimism.io/fault-proof/']]);
add('A13','P2','实现状态需确认','治理的具体参数写成了现行制度',
['/learning/governance','/learning/gov-overview','/help/faqs'],
'章节列出 5/9 守护者、10,000 MHA 提案门槛、20% 法定票数、投票与时间锁参数，却没有将设计参数与已部署治理实例区分。与 Tokenomics 不将未经核验的时间锁写成已部署的口径不一致。',
'明确草案／已生效状态、投票权分母、提案与执行合约、升级权限和紧急权限。20% 门槛须以可参与投票的权重讨论可行性，不直接假定总发行量都可投票。',
['20%','10,000','守護者']);
add('A14','P2','重要进度遗漏','MAG1 首批交付与后续延迟尚未入文',
['/learning/milestone','/help/contact'],
'里程碑仍以“来源不足以确认批量出货完成”结束。你已确认首批生产完成并交付首批客户，剩余交付受 LPDDR4X 缺货与交期影响延至 12–1 月。现有正文缺少这两种状态的区分，联系页也没有交付问题入口说明。',
'增加“首批已交付（项目方确认）”和“后续批次延期”两个记录，注明更新时间、原因及订单查询方式；不把首批交付写成全部订单完成。发布前确认 12–1 月对应年份、开始发货还是完成交付，不虚构精确日期和台数。',
['不足以確認批量']);
add('A15','P2','既有未关闭问题','证书日期仍未完成来源对齐',
['/learning/milestone'],
'页面采用官网时间轴 CB 2025-12-11、UN38.3 2025-12-01。此前本地审核记录指出原文件日期分别为 2025-12-30、2025-12-11；本轮再次访问原 PDF 失败，故保留为未关闭的来源对齐问题，不把此前结论冒充本轮重新核验。EAL 的“原披露日期”也应明确是原文记录的事件日期，还是首次披露日期。',
'把证书签发／报告日期、官网时间轴节点和首次公开日期分栏；以原件确定签发日期，时间轴差异加简短注释。不要推定官网标注日期就是文件首次公开日。',
['2025-12-01','2025-12-11','原披露日期']);
add('A16','P2','计划与现状混写','设备、AI 和 DePIN 的功能状态需要明确',
['/learning/what-is-magne','/learning/magne-dapp','/solutions/poai-depin','/solutions/hardware'],
'概述和 PoAI 章节把设备算力、AI 训练、证明验证和奖励流程连续写成当前能力，部分文字使用数百万设备网络的叙述，但没有相应部署范围或活跃设备数据。dApp 虽已标“规划中”，仍需确认 Shin Getter Nexus 名称与目前 W3 产品体系的关系。',
'保留愿景，按当前硬件能力、测试功能、后续设计分段。对真实已运行功能给出可验证入口；没有设备统计证据时用目标描述，不推导现有网络规模。',
['數百萬','Shin Getter Nexus'],
[['AgentPay 当前功能状态','https://w3.magne.ai/agentpay.html']]);
add('A17','P2','章节内容错配','3.3 获取 MHA 路径实际放着另一篇“为何需要 L2”',
['/solutions/get-mha','/solutions/why-l2'],
'get-mha 与 why-l2 两条路径都是“为何需要 Layer2”正文，内容大量重叠，用户找不到对应的获取代币说明。',
'将 get-mha 改为获取与识别 MHA 指引，分别说明正式 BSC MHA、测试网 Gas 代币、官方合约验证与测试网水龙头；L2 原因只保留一章。',
['為何 MAGNE.AI 需要 Layer2','為何 Magne 需要 Layer2']);
add('A18','P2','确定维护遗漏','全文搜索索引未包含最新修订',
['/learning/tokenomics','/learning/tokenomics-changelog','/learning/tokenomics-zh','/learning/tokenomics-announcement'],
'正文已有“储备补回”“生态预算及历史支出补回”“尚未转账”，繁中 search.json 对应关键词却全部无匹配。用户能够阅读这些新规则，但无法用其核心词检索。',
'在内容生成／构建时同步正文、搜索索引和摘要，避免分别维护旧副本。修订记录主表及版本摘要也应列全生态预算和自愿激励，现有详细段落已写到，不必重复新增另一套规则。',
['生態預算及歷史支出補回','尚未轉帳']);
add('A19','P2','确定排版与翻译问题','教程残留原始 Markdown，章节编号仍有局部重复',
['/developers/build-app','/developers/launch-token','/solutions/poai-depin','/learning/tokenomics'],
'繁中应用教程把英文说明与原始 Markdown 代码围栏放入代码块；发币教程显示“4.4.1 0）先决条件”“4.4.2 1）建立项目”，新编号没有移除全角旧编号。PoAI 小标题还用原始 1./2. 编号；Tokenomics 的少量 **...** 标记未转换。部分正文从 H1 直接跳到 H3，不能简单把所有 H3（含图题）都编号。',
'清理旧的全角编号与 Markdown 残留，翻译正文说明并保留命令原文。按语义修复 H2/H3 层级，再同步目录；图题与业务项目 01–10 不当作文档层级编号。',
['0）先決條件','```','**']);
add('A20','P2','政策需明确','晚交付设备如何加入 GEN1，需要用户能看懂的规则',
['/learning/tokenomics'],
'当前公式已按全网月份、参与起始月和动态设备数量测算，这一点逻辑成立。尚需结合后续手机延期交付说明：迟加入设备是否从当时全网奖励阶段开始，是否有补偿，以及 GEN1 启用日期。否则用户容易把 M24 20,000 MHA 理解成任何购买日期起算都一样。',
'在 GEN1 启用条件旁写清全网 M1 与个人加入月的关系；如坚持全网时间轴，给出迟加入示例并链接现有计算器。补偿属于另行预算决策，不默认给每部手机重启 36 个月曲线。',
['起始月','20,000']);

const optional={
 '/learning/team-execution':'没有发现与本次计算或网络配置直接冲突的错误。团队介绍仍偏职能描述；可补职责归属和联系入口，真实人员信息以获授权披露为准。',
 '/developers/net-config':'两条测试网 Chain ID 与 W3 Network 页面一致；本轮没有核验 RPC 的完整运行质量。建议作为其他章节网络参数的唯一数据源。',
 '/developers/tools':'未发现与当前测试网参数直接冲突。可将两条网络 JSON 示例拆成独立代码块，并统一版本与网络配置来源。',
 '/community/twitter':'官方社区入口型页面，本轮未发现正文逻辑错误；可继续保留，不必为凑章节长度增加内容。',
 '/community/telegram':'官方社区入口型页面，本轮未发现正文逻辑错误；群组可用性与管理状态未逐一验证。'
};
const routeMap=new Map(crawl.all.map(r=>[(r.lang==='tc'?'/tc':'')+r.route,r]));
const crossRouteErrors=[];
for(const r of crawl.all)for(const l of r.links){if(!l.href?.startsWith('/')||l.href.startsWith('//'))continue;const u=new URL(l.href,'http://127.0.0.1:4173');const t=routeMap.get(u.pathname);if(t&&u.hash&&!t.ids.includes(decodeURIComponent(u.hash.slice(1))))crossRouteErrors.push({from:r.route,lang:r.lang,to:l.href});}
const checks={pages:crawl.all.length,statusErrors:crawl.all.filter(r=>r.status!==200),pageErrors:crawl.errors,localAnchorErrors:crawl.all.flatMap(r=>r.brokenAnchors),crossRouteAnchorErrors:crossRouteErrors,duplicateIds:crawl.all.filter(r=>new Set(r.ids).size!==r.ids.length).map(r=>r.route),scenarios:[5000,13750,27500].map(count=>{const rows=calculateGen1(Array(36).fill(count),1,1);return{count,m24:rows[23].releasedTotal,m36:rows[35].releasedTotal,m38:rows[37].releasedTotal}})};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const tc=crawl.all.filter(r=>r.lang==='tc').sort((a,b)=>a.headings[0].text.localeCompare(b.headings[0].text,'en',{numeric:true}));
const evidence=i=>i.routes.flatMap(route=>{const r=tc.find(x=>x.route===route);const term=i.terms.find(t=>r?.text.includes(t));if(!term)return[];const at=r.text.indexOf(term);return[{route,text:r.text.slice(Math.max(0,at-50),at+180)}]}).slice(0,3);
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MAGNE 白皮书 v1.1 全文章节审核 · 2026-10-02</title><style>
*{box-sizing:border-box;overflow-wrap:anywhere}body{margin:0;background:#f3f4f6;color:#18232d;font:16px/1.75 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1160px;margin:auto;padding:44px 24px}h1{font-size:34px;line-height:1.3}h2{font-size:25px;margin:44px 0 18px}h3{font-size:21px;margin:10px 0}p{margin:12px 0}.meta{color:#5b6572}.intro,.issue{background:white;border:1px solid #dfe4e9;border-radius:12px;padding:24px;margin:18px 0}.issue{scroll-margin-top:20px}.pill{display:inline-block;font-size:13px;font-weight:700;border-radius:4px;background:#fff0e9;color:#98360c;padding:2px 8px;margin-right:8px}.P2{background:#eef2ff;color:#314ea1}a{color:#155bae;text-underline-offset:3px}.chapter-links{font-size:14px;display:flex;gap:6px 14px;flex-wrap:wrap}blockquote{font-size:14px;border-left:3px solid #b6c4d4;margin:14px 0;padding:8px 14px;background:#f7f9fb;color:#485666}.table{overflow:auto}table{border-collapse:collapse;width:100%;min-width:760px;background:#fff;font-size:14px}td,th{border:1px solid #dde3e8;padding:13px;text-align:left;vertical-align:top}th{background:#e9eef4}td:first-child{min-width:210px}.small{font-size:13px;color:#637080}strong{font-weight:700}.ok{color:#126744}nav{display:flex;gap:18px;flex-wrap:wrap}@media(max-width:600px){main{padding:25px 14px}h1{font-size:28px}.issue,.intro{padding:18px}}@media print{body{background:#fff}main{padding:0}a{color:inherit}.issue{break-inside:avoid}nav{display:none}}
</style><main><div class="meta">内容审核 · 2026 年 10 月 2 日 · 本地 v1.1 草稿</div><h1>36 个章节，72 个中英文页面<br>全文校对与逻辑审核</h1><div class="intro"><p><strong>结论：主要问题是跨章节技术口径、历史销售条款和教程准确性，并非重新推翻已经确定的分配方案。</strong>本轮只审核并保存报告，没有修改白皮书正文。</p><p>共整理 ${issues.length} 组问题。P1 为发布前优先处理；P2 为应同步修订或明确的事项。“需确认”表示文本确有冲突，但不能据此代替技术／业务团队决定最终制度。</p><nav><a href="#priority">详细问题</a><a href="#inventory">全部章节清单</a><a href="#passed">通过的核对</a><a href="#sequence">修改顺序</a><a href="#scope">范围与证据</a></nav></div>
<h2 id="priority">逐项问题与修改建议</h2>${issues.map(i=>`<section class="issue" id="${i.id}"><span class="pill ${i.priority}">${i.priority} · ${i.id}</span><span class="meta">${esc(i.kind)}</span><h3>${esc(i.title)}</h3><div class="chapter-links">${i.routes.map(route=>{const r=tc.find(x=>x.route===route);return`<a href="http://127.0.0.1:4173/tc${route}">${esc(r?.headings[0].text??route)}</a>`}).join('')}</div><p>${esc(i.problem)}</p><p><strong>建议：</strong>${esc(i.action)}</p>${evidence(i).map(e=>`<blockquote>${esc(e.text)}…<br><span class="small">本地繁中正文摘录：${esc(e.route)}</span></blockquote>`).join('')}${i.sources.length?`<p class="small">核对依据：${i.sources.map(([t,u])=>`<a href="${u}">${esc(t)}</a>`).join(' · ')}</p>`:''}</section>`).join('')}
<h2 id="inventory">全部 36 章检查清单</h2><p>以下列出繁中入口；对应英文页面也纳入本轮读取。相同技术错误通常需要双语同步修正，不能只更新译文。</p><div class="table"><table><thead><tr><th>章节</th><th>结果／问题组</th><th>处理重点</th></tr></thead><tbody>${tc.map(r=>{const matches=issues.filter(i=>i.routes.includes(r.route));return`<tr><td><a href="http://127.0.0.1:4173/tc${r.route}">${esc(r.headings[0].text)}</a></td><td>${matches.length?matches.map(i=>`<a href="#${i.id}">${i.priority} ${i.id}</a>`).join(' · '):'未发现明显正文矛盾'}</td><td>${esc(optional[r.route]??matches.map(i=>i.title).join('；'))}</td></tr>`}).join('')}</tbody></table></div>
<h2 id="passed">已经核对、无需推翻的部分</h2><div class="intro"><ul><li>72 个文档页面响应均为 200；采集时未发现页面运行错误、重复 ID、页内锚点失效，或已采集文档之间的跨页锚点失效。</li><li>GEN1 基准 13,750 台、前 36 月基准预算 3.3 亿枚、自愿激励上限 1,700 万枚的算术相符；两者合计 3.47 亿，小于 GEN1 4 亿上限。这不是对后续所有年度预算执行的验证。</li><li>固定同等设备数 5,000 或 13,750、从全网 M1 参与、可用性及有效任务系数均为 100%、无自愿锁定：M24 累计基础释放 20,000；M36 为 23,818.18；尾款释放至 M38 合计 24,000 MHA。固定 27,500 台时对应数值减半。条件变化不能直接沿用该结果。</li><li>DAO 15 亿／48 月 = 每月 3,125 万；年度拨付上限 1.5 亿属于另一道预算约束，两者不矛盾。按上限用完整个池至少跨 10 个预算年度，不应误写成 48 个月全部对外花完。</li><li>历史空投 1,635,000 MHA 补回明确为拟议且尚未转账；修订说明已包含该内容。保留历史快照日期是正确做法，不能拿草稿更新时间冒充余额更新时间。</li><li>主章顺序已按“什么是 MAGNE.AI”在 dApp 之前排列；主章编号已存在。剩余问题是旧小节编号和语义层级，而非整套编号缺失。</li></ul></div>
<h2 id="sequence">建议修改顺序</h2><ol><li><strong>先改确定错误：</strong>佣金算例、Gas 示例、重复章节、教程变量及流程、原始 Markdown、重复编号和搜索索引。</li><li><strong>再定技术主口径：</strong>L1／L2／设备奖励的边界、mBGT、治理、发行与释放。形成一份确认后的参数表，再同步相关章节。</li><li><strong>同步商业披露：</strong>历史公售条款、首批交付与后续延期、证书日期、GEN1 晚加入规则。</li><li><strong>最后双语和版本回归：</strong>中英文、计算器说明、图表、搜索、修订记录统一核对；v1.0 归档保留原文。</li></ol>
<h2 id="scope">范围与证据边界</h2><p>本轮读取实际渲染正文和源文件，复核关键计算与开发示例，并查阅 W3 Network、AgentPay、MAGNE Security、EIP-1559、Foundry 和 OP Stack 一手资料。不是全面链上状态审计、智能合约审计或律师法律意见；没有广播交易、核验全部外链、验证所有证书原件或实测项目声称的 TPS。未将存在页面视作功能已投产。</p><p>CB／UN38.3 问题引用此前本地审核记录，本轮原 PDF 获取失败，已明确标为待关闭。交付信息来自你本次会话确认，不虚构外部证明或数量。</p><p class="small">可复核数据：同目录 rendered.json（72 页文本、标题及链接快照）、checks.json（结构与计算核对）、issues.json（问题登记）。本报告不自动修改正文或改变已确认的经济参数。</p></main></html>`;
fs.writeFileSync(path.join(dir,'review.html'),html);
fs.writeFileSync(path.join(dir,'issues.json'),JSON.stringify(issues,null,2));
fs.writeFileSync(path.join(dir,'checks.json'),JSON.stringify(checks,null,2));
console.log(JSON.stringify({issues:issues.length,chapters:tc.length,pages:checks.pages,structuralErrors:checks.statusErrors.length+checks.pageErrors.length+checks.localAnchorErrors.length+crossRouteErrors.length+checks.duplicateIds.length,report:path.join(dir,'review.html')}));
