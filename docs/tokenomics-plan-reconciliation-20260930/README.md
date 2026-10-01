# Tokenomics 修改建议落实核验

2026-09-30 · v1.1 本地审阅稿 · 未部署

依据用户提供的《WEB3.MAGNE.AI 白皮书 Tokenomics 修改计划》，对照当前正文与 v1.0 归档完成核验，并补齐版本披露。GitHub 仓库和 PR 按用户本轮回复留到最后处理，目前不创建仓库、不推送、不发布。

## 落实情况

| 建议事项 | 当前结果 |
|---|---|
| 100 亿总量、十项原分配 | 保留；数额合计 10,000,000,000 MHA，比例合计 100% |
| Exchange Campaigns 用途与执行规则 | 当前稿已覆盖 Listing、集成、活动、激励、初始流动性、测试及获批准市场支持；未使用储备不因时间自动解锁 |
| Exchange Campaigns 快照 | 保留 100,000,000 − 76,250,500 = 23,749,500 MHA |
| 四家交易所明细 | 行、列分别核对；相关费用 51,250,000，初始流动性 25,000,000，测试 500，合计 76,250,500 MHA |
| LBank 测试 | 两个交易哈希均链接 BscScan，同一路径的两段 500 MHA 仅计一次 |
| 7 亿做市储备 | 保留分配与比例；按原快照披露完整储备，项目报告尚无转出；不把交易所活动支出的 25,000,000 MHA 归入此储备 |
| DEX / CEX 分开 | 当前稿已分别列出 LP、时间锁/多签与 CEX 做市协议、独立路径、风险限制及启用公告要求 |
| Early Supporters | 原有章节及长期释放规则保留；活动说明独立列示 |
| 活动空投 | 1,635,000 MHA 标为上市前 Check-in 等空投；Season 1 待核验公告；Season 2 的 40,000,000 MHA 仍标为未转出及满足条件后执行 |
| 版本提示 | 本轮将顶部 v1.1 / September 2026 说明改为可见提示，保留审核稿身份 |
| 新旧对比与版本记录 | 保留六项新旧对照表；本轮新增版本日期/状态记录，区分规则修订、补充披露和阅读方式调整 |
| 原版归档 | `/v1.0/learning/tokenomics` 保留；原发布日期仍待确认，抓取归档日期不冒充原发布日期 |
| 双语与公告 | 英文、繁体 Tokenomics、修订记录、公告草稿与摘要同步；公告和正文双向链接 |
| 静态数据日期 | 仍为 2026-09-28 17:56:21 UTC、BSC 124,568,474；9 月 30 日草稿更新时间不会替换余额快照日期 |
| BSC 形态与迁移计划 | 保留用户此前确认的当前 BSC Token、后续 MAGNE L1 / M Hash L2 迁移说明，在版本记录中单列 |
| 合约和十个分配地址 | 保留此前完成的地址披露及复制/浏览器入口，不混入交易所公共热钱包余额 |

## 本轮实际修改

此次并非再次重写已落实的两项经济规则。本轮修改集中于：

1. 使 Tokenomics 顶部版本提示可见，更新页脚草稿日期为 2026-09-30。
2. 修订记录明确“仅两项经济规则变化”，并准确记录之前已做的 BSC 网络阶段说明、地址披露、双语代码图和折叠目录。
3. 公告草稿补齐执行快照、资金来源、供给不变及迁移计划，维持待审核状态。
4. 中文修订摘要不再声称完整白皮书仅有英文版，提供完整英文和繁体入口。
5. 刷新上述相关页面的搜索文本与目录。

修改文件：

- `src/content/whitepaper/learning/tokenomics.html`
- `src/content/whitepaper/learning/tokenomics-changelog.html`
- `src/content/whitepaper/learning/tokenomics-announcement.html`
- `src/content/whitepaper/learning/tokenomics-zh.html`
- `src/content/whitepaper-tc/learning/` 下同名四份文件
- 两种语言目录中的 `manifest.json` 与 `search.json`
- `src/app/tokenomics-reader.css` 及 `src/app/whitepaper.css`（版本提示样式与样式刷新）

首页、产品页面、MHA 独立章节、其他经济规则和归档原文均未在本轮修改。

## 核验与边界

`checks.json`：118 项核验通过，包括双语桌面/手机页面、内部链接、比例/数量合计、逐家交易所执行金额、两个 LBank 交易链接、版本说明可见性和归档保留。

本轮十项规则正文与修改前逐字比较一致；另外将英文版其余八项规则与 v1.0 原文作规范化文本逐项比较，八项全部一致。所有非本轮授权修改的正文/归档文件哈希保持不变。该比较不等于认可原白皮书所有商业与技术主张；此前完整初审中的其他问题仍按原清单待处理。

`npm run check` 通过（ESLint、TypeScript、131 页生产构建）。截图位于 `screenshots/`；`before/` 为本轮前八份正文备份。核验脚本为 `scripts/verify-tokenomics-plan.mjs`。

本轮核对的是用户指定的历史披露与页面实现，没有把 9 月 30 日实时余额更新进 9 月 28 日静态快照，也没有重新验证交易所私有协议、内部账户或法律状态。

## 审阅入口

- [Tokenomics v1.1](http://127.0.0.1:4173/tc/learning/tokenomics)
- [修订记录及新旧对照](http://127.0.0.1:4173/tc/learning/tokenomics-changelog)
- [公告草稿](http://127.0.0.1:4173/tc/learning/tokenomics-announcement)
- [原版归档](http://127.0.0.1:4173/v1.0/learning/tokenomics)

![手机版本提示](screenshots/tc-390-tokenomics.png)
![桌面修订记录](screenshots/tc-1440-tokenomics-changelog.png)
