# Tokenomics 二级目录、折叠规则与地址披露

2026-09-30 · 本地 v1.1 参考方案 · EN / 繁体中文

## 当前方案

页面按概览、MHA 合约、地址登记、分配规则和执行披露组织。分配规则有十个二级目录项；每项默认收起，摘要显示编号、名称、数量及比例。展开后显示对应 BSC 储备地址和完整原有规则；挖矿等较长章节增加内部索引。

分配图、目录、地址类别链接和带旧子节锚点的链接，均会展开所需类别。可同时打开多个类别，也可全部展开/收合。打印时临时展开全部规则，结束后恢复阅读状态。手机端沿用页面目录及纵向列表。

MHA 合约和十个主要分配地址完整显示，支持复制与 BscScan 跳转。原始分配数额、比例、释放规则及 2026-09-28 执行快照保持原样。

## 地址依据

来源：[W3 Supply Evidence](https://w3.magne.ai/mha-supply.html) 和 [Supply API](https://w3.magne.ai/api/v1/mha/supply)。原始响应保存为 `supply-source.json`；其返回元数据为 2026-09-30T08:57:02.693Z、区块 124880405。本轮采用地址与项目披露分类，不把这份 API 的当前余额覆盖到白皮书的历史快照。

MHA 当前 BSC 合约：`0x37c563cdf4606d4302abb395cdb94e79d31233ed`。

| 白皮书类别 | API category | BSC 披露储备地址 |
|---|---|---|
| Mining Nodes | mining | `0xaAa2ec1f5bd840754e7459fd848D681bC50D62e8` |
| Staking Nodes | staking | `0x999A665B14D33B947813ea1a6525c9C377DBE196` |
| Ecosystem / DAO | ecosystem | `0x888F2F895aCf7E068e5eFF76Ae7E7ec7CC337cDD` |
| Team & Advisors | team | `0x777031eb97880cee836ce508b2d24dc66f898358` |
| VC | vc | `0x66660077B39DbF0c6225289Fa6c6a4BF4b1C9417` |
| Early Supporters | user-airdrop | `0x222EB7Dca28C875115dE21055881E3008df822c4` |
| Early Liquidity Market Makers | market-making-reserve | `0x3337e8082646Df644179db3834b3ACc19bc55eFf` |
| Subscription / Public Sale | public-sale | `0x555d2527752c41c6bdb8166fd6e00d34997be1dd` |
| Equipment-Sale Agents | equipment-agents | `0x4442ff4eae58dc9dbbe318b284b001b3967478fd` |
| Exchange Campaigns | exchange-allocation | `0x1117dA6F04376588A94a7B7fDC070607d0ad649C` |

Early Supporters 按现有白皮书活动说明对应 `user-airdrop` 储备，页面保留 API 中“用户空投储备”的名称说明。表内为项目披露的钱包分类，未把这些地址称为归属合约或时间锁合约；未采用 API 的四个交易所混合托管观察地址。

## 本轮新增的网络阶段说明

根据用户补充，MHA 当前以 BSC Token 形式存在，后续迁往自有 MAGNE L1 与 L2 体系。英文与繁体 MHA 概览和 Tokenomics 引言已同步说明：

> MHA 目前以 BNB Smart Chain（BSC）上的代幣形式發行與流轉。本白皮書披露的 BSC 合約地址，對應 MHA 現階段的代幣形態。
>
> 項目計劃在 MAGNE L1 主網與 M Hash L2 網絡具備相應條件後，推進 MHA 向自有網絡體系的遷移與整合。遷移方式、適用網絡、時間安排及持有人需要採取的操作，將另行公告。

MHA 概览还说明后续 Gas、区块奖励、减半描述属于自有网络规划，不能当作已在当前 BSC 合约实现的功能。迁移比例、流程和时间未由本次编辑决定。此前审计识别的 mBGT、共识等设计冲突仍需独立核对；本轮没有替项目决定这些机制。

## 维护与回退

- 地址数据：`src/content/whitepaper/allocation-addresses.json`。
- 目录和折叠呈现：`src/components/whitepaper/tokenomics.ts`。
- 样式：`src/app/tokenomics-reader.css`。
- 锚点、复制、展开及打印逻辑：`DocumentInteractions.tsx`，仅对存在 `.wp-allocation` 的页面启用折叠行为。
- 网络阶段原文：EN/TC 的 `learning/mha.html` 与 `learning/tokenomics.html`；对应搜索文本同步更新。
- 回退备份位于 `before/`。仅需撤销 Tokenomics 的呈现转换、相关样式接入及本次阶段文案，不必更动 v1.0。

## 验证

`checks.json` 记录双语、320/390/768/1440px、二级目录、十项折叠、键盘展开、批量展开/收合、复制、图表与旧锚点跳转、语言切换和打印恢复检查。逐条比对十个地址与保存的官方响应；校验未授权正文和 v1.0 文件未改动，并比较两份 Tokenomics 的全部分配规则原文未变。

新增网络阶段文案只涉及四份正文，校验另行允许并检查；不能把本轮描述为“全部正文一字未改”。页面与构建结果以检查文件和实际命令输出为准。

![折叠规则及二级目录](screenshots/tc-rules-in-page.png)
![展开后的质押部分](screenshots/tc-staking-expanded.png)

[本地折叠方案](http://127.0.0.1:4173/tc/learning/tokenomics#allocation-rules) · [地址清单](http://127.0.0.1:4173/tc/learning/tokenomics#allocation-addresses)
