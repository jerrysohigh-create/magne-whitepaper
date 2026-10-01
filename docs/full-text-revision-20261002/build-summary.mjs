import fs from 'node:fs';
import {parseHTML} from 'linkedom';
const base='docs/full-text-revision-20261002';
const issues=JSON.parse(fs.readFileSync('docs/full-text-audit-20261002/issues.json','utf8'));
const resolutions={
A01:'已分开 L1 共识、L2 排序与 GEN1 任务奖励；最终共识实现仍待技术确认。',
A02:'已取消互相冲突的单／双代币定论；mBGT 是否保留及投票权关系仍待确认。',
A03:'已移除价格保底与交易所排名保证，按 TGE 后阶段整理公售说明。',
A04:'已并列保存两种历史归属口径，明确未定稿且不改变已有权益；须按销售批次确认。',
A05:'已修正 0.5／9.5 USDC 佣金算例，并区分新增存款与更新后总余额。',
A06:'已撤下互相冲突的现行参数断言与无日期竞品对比；保留标明假设的 Gas／TPS 算例。真实配置与性能仍需版本化证据。',
A07:'已区分储备释放与新增发行、区块纳入与结算及提款，保留固定总量和现有池规则。',
A08:'已重写完整教程和固定版本示例；本地编译、合约测试、网页读写流程通过。没有向公开测试网广播。',
A09:'示例币已更名 Demo Token／DEMO，明确与正式 MHA 无关。',
A10:'已移除未公布的主网 RPC／Chain ID 操作表，保留测试网配置。',
A11:'已限定签名路径与认证范围，去掉无限安全承诺；EAL2+／EAL6+ 与官方组件口径一致。',
A12:'已列出 L2 组件职责、技术依赖和优化验收证据，未证实的优化维持方案状态。',
A13:'治理参数、守护者及权限已标明设计状态，未宣称已经部署。',
A14:'已加入项目确认的首批交付和后续内存供货延期；12–1 月窗口的准确年份及起止含义待订单公告确认。',
A15:'已说明时间轴节点与证书签发日不同，保留原件日期待对齐事项；本轮未完成原件重新获取。',
A16:'已区分装置能力、AI 任务设计、dApp 规划与实际网络状态，去除现有数百万设备等未经支持的断言。',
A17:'获取 MHA 章节已重写为正式合约识别、BSC 与测试资产区别及获取入口。',
A18:'中英文目录与全文搜索已同步，构建前自动从正文生成，使用静态 HTML 解析器，不依赖浏览器。',
A19:'已修正全角旧编号、原始 Markdown、正文层级及繁中教程；两组网络 JSON 分块展示。',
A20:'已明确全网 M1、个人加入月与晚交付的关系，不重新起算每台设备曲线；补偿安排未擅自增加。'
};
const pending=['L1 最终共识、验证者准入与最终确定性规格','mBGT 是否保留及与 MHA 的投票权关系','各公售批次的实际归属条款','12–1 月交付窗口的年份与开始／完成含义','CB、UN38.3 原件日期，以及现行网络参数和性能测量证据'];
const changed=[];
const text=html=>parseHTML('<html><body>'+html+'</body></html>').document.body.textContent.replace(/\s+/g,' ').trim();
for(const locale of ['en','tc']){
 const dir=`src/content/${locale==='tc'?'whitepaper-tc':'whitepaper'}`;
 for(const d of JSON.parse(fs.readFileSync(dir+'/manifest.json','utf8'))){
  if(text(fs.readFileSync(dir+'/'+d.file,'utf8'))!==text(fs.readFileSync(base+'/before/'+dir+'/'+d.file,'utf8')))changed.push({locale,route:d.route,title:d.title});
 }
}
const result={date:'2026-10-02',changed,pending,resolutions,scope:'Local v1.1 only; v1.0 retained; no on-chain transfer or external publication',verification:{productionBuildPages:131,documentPages:72,viewports:144,solidityTests:2,exampleFlow:'Local Anvil only',searchHits:4,calculatorFilesUnchanged:true}};
fs.writeFileSync(base+'/resolution.json',JSON.stringify(result,null,2));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
fs.writeFileSync(base+'/changes.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>白皮书全文修订记录</title><style>body{max-width:1000px;margin:40px auto;padding:0 22px;font:16px/1.85 system-ui;color:#243146}h1{line-height:1.3}h2{margin-top:35px}section{padding:18px 0;border-bottom:1px solid #dce1e8}a{color:#a61934}small{color:#627088}li{margin:6px 0}p{overflow-wrap:anywhere}</style><h1>白皮书 v1.1 · 全文修订记录</h1><p>2026 年 10 月 2 日 · ${changed.length} 个语言页面正文更新，涉及 ${new Set(changed.map(d=>d.route)).size} 个章节。其余章节完成检查及索引同步。</p><p>本轮已修正确定错误，将未确认设计明确区分。100 亿总量、十项分配、13,750 台基准、GEN1 两个计算器、生態预算限制及历史快照保持原有口径；v1.0 保留。</p><p><a href="http://127.0.0.1:4173/tc/learning/tokenomics#allocation-8">查看公售章节</a> · <a href="http://127.0.0.1:4173/tc/learning/milestone#mag1-delivery">查看交付更新</a> · <a href="http://127.0.0.1:4173/tc/developers/build-contract">查看新教程</a></p><h2>20 组审核项的处理状态</h2>${issues.map(i=>`<section><small>${i.id}</small><h3>${esc(i.title)}</h3><p>${esc(resolutions[i.id])}</p></section>`).join('')}<h2>仍须确认的事实或制度</h2><ul>${pending.map(s=>`<li>${s}</li>`).join('')}</ul><p>这些事项已在正文明确标注，不以编辑决定替代项目的技术或合同决定。</p><h2>验证</h2><ul><li>生产构建 131 页通过；72 个中英文文档、144 次桌面／手机检查无结构问题。</li><li>搜索“尚未轉帳”可返回四个相关页面；目录、跨页锚点和两份示例下载正常。</li><li>GEN1 基础与自愿激励测试通过，四个计算器／模型文件与修改前的 SHA-256 一致。</li><li>Solidity 两项测试通过；网页示例构建通过，并在本地 Anvil 验证读取、授权调用、回执、错误网络及缺少钱包处理。没有向公开链广播交易。</li><li>最后调整的团队标题、质押设计状态和交付表手机排版另行检查通过。</li></ul><h2>修改前备份</h2><p>同目录 before/src/content 保存原中英文正文；before/src/components/whitepaper 保存原白皮书组件。回退时只恢复需要的文件，再运行 npm run build；不要重置整个工作区。</p></html>`);
console.log(JSON.stringify({changedLanguagePages:changed.length,chapters:new Set(changed.map(d=>d.route)).size,pending:pending.length}));
