# WEB3.MAGNE.AI 首页图片与发布文案初审

日期：2026-09-29（Asia/Shanghai）

**结论：技术复刻通过，不等于内容通过。当前首页不建议直接作为经审核的正式宣传页面发布。**

审核对象：本地 http://127.0.0.1:4173/。本轮重新截图并读取页面文字；未修改页面代码。上轮 `design-qa.md` 仅覆盖复刻、响应式及交互，不能作为真实性或法律合规背书。

这是发布前的事实依据及法律风险初审，不是某一法域的正式法律意见。尚未确定发行/运营主体、目标市场和产品销售状态，也未收到本轮相关测试报告、活动登记数据或最终 tokenomics；因此“证据未核验”不等于“事实必然虚假”。

## 审核步骤与状态

1. 整体定位与数据区：需改。页面把技术目标、规模宣称和无数据的统计框混在一起。
2. 性能、节点、安全、能效区：高优先级整改。定量指标和保证性措辞缺少本轮可核实依据。
3. 手机与支付区：高优先级整改。用户已指出图中手机不是真机图；概念视觉、5G宣传、支付入口的语义不一致。
4. 社区活动区：待核实。图片不能证明参与人数、开发者规模或活动归属。
5. 代币分配区：待核实。缺少版本、日期和获批依据。
6. 手机屏幕体验：基本可用，阅读需改。小字和图表可读性差；长英文大标题占据较多首屏。

## 逐项审查与建议

| 优先级 | 当前内容 | 具体问题 | 发布前处理 |
|---|---|---|---|
| 高 | 支付购物车上方的手机概念图 | 用户确认不是真机图；与5G硬件文案同屏会让人误认成实际产品外观/功能演示。不能仅凭画风断言其生成工具。 | 硬件区改用确认型号和使用权的实物照片；样机注明 prototype。若只保留支付概念视觉，在图旁明确标注概念示意，不用作硬件主图。 |
| 高 | `full 5G support`、`carrier compatibility across major regions`、`worldwide deployment` | 覆盖范围过宽，缺型号、频段、地区、运营商及认证条件。 | 删除笼统承诺；待型号、频段矩阵和认证/运营商测试核验后，按具体范围描述。不能由单份安全认证或委托加工材料推出全球运营商兼容。 |
| 高 | `ensures seamless network access and regulatory compliance` | 保证式网络体验及监管合规结论，无法由一般产品介绍证明。 | 删除保证，按地区、设备版本和运营商说明限制。加一句泛泛免责不能替代证据。 |
| 高 | `Join a community of millions`、`48,000 Developers`、`thousands of creators...` | 可量化规模主张；未注明定义、时间、去重和来源。 | 核验前移除数字及数量级，改为邀请式文案。真实数字需对应统计口径和日期。 |
| 高 | `400 milliseconds`、`thousands of transactions per second`、`less than $0.0025` | 缺链/网络、版本、测试区间、负载、计价条件；出块时间不等于最终确认时间。 | 核验前撤下具体指标；恢复时提供测试环境、方法、日期和报告链接，不把测试网指标作为生产承诺。 |
| 高 | `thousands of nodes ... independently`、`ensuring your data remains secure and censorship resistant` | 节点数不证明独立运营或去中心化；安全和抗审查表述近似结果保证。 | 用可核验的验证者集、共识及安全模型文档替代；删除结果保证。 |
| 高 | `Live data` 与 `...`/空指标并存 | 本地版本没有实时数据接入，却仍标注实时数据。是已确认的呈现矛盾。 | 删除 Live data；无数据时隐藏指标或明确 unavailable。将来接入后注明网络、时间戳、口径和来源。 |
| 中高 | `800+ New York Event`、`1,000+ Kuala Lumpur Event` | 缺活动名、日期、主办方、参加/签到口径。 | 核验前去掉人数；保留照片须核对活动归属及商用授权，增加准确图片说明。 |
| 中高 | `Energy Efficient`、`Net carbon impact`、`benchmark notes are available...` | 已有正文限定仍不能证实能效优势、碳影响或报告实际可提供性。 | 可改为中性的技术文档入口；没有测试/核算材料时去掉环境结果主张和“报告可提供”承诺。 |
| 中高 | Token Economics 图 | 缺版本/日期/适用代币标识、最终批准文件、锁仓/释放说明。百分比合计正确也不证明有效。 | 与最终白皮书/批准文件逐项核对；发布版本化链接和可读数据表。若未定稿，避免把图当成最终分配承诺。 |
| 中 | `Powering tools ... companies all around the world` | 暗示已经存在全球公司采用，当前没有案例或授权证据。 | 删除此句或换为不暗示采用规模的产品说明；具体客户案例应有可公开依据。 |
| 中 | `PAYMENTS ON MAGNE.AI` 与硬件段落混排 | 用户不能确定是购买硬件、生产支付服务、测试演示还是开发文档；本轮未核验落地页能力。 | 分开硬件和支付的叙述。CTA与落地页实际能力匹配；只有确认演示/测试状态后才标成 demo/testnet，不能猜。 |
| 中 | 页脚仅显示品牌管理信息 | 品牌名不能识别实际运营、销售或数据处理主体。 | 按目标市场/业务核对主体、联系方式、隐私及服务条款；不能仅凭截图判定缺项违法。 |

## 建议英文改写（审核草案，未上线）

以下优先使用可直接从文档入口验证的中性表达，避免把无证据数字改成同样无证据的“领先”“高性能”。

### 首页标题

> Explore MAGNE.AI’s hardware and Web3 ecosystem.

正文：

> Explore product information, network documentation, and developer resources.

按钮：`VIEW DOCUMENTATION` / `EXPLORE HARDWARE`。使用前分别核对真实目标页面。

### 社区区

> Connect with the MAGNE.AI community.

活动照片先展示确认过的活动名称/日期；在人数核验完成前不保留 48,000、800+、1,000+ 等数字。

### 网络区

标题可改为 `Network documentation`，分别链接 `Network configuration`、`Transaction fees`、`Validation and security`。不在首页新造性能目标。

### 手机区

若决定以硬件为主题，标题可用 `Explore MAGNE.AI hardware`，正文：

> Review the specifications and availability information for the relevant device model. Network compatibility depends on the device variant, supported bands, carrier, and region.

这是限制性草案；仍须有对应型号页。图片优先是真机实拍，保持原比例；不能把外观渲染图重新命名为“实拍”。

若暂时只能使用当前概念图，邻近标注：

> Concept illustration. Not a photograph of a MAGNE.AI device.

这只能澄清图片性质，不能补救旁边未经证实的产品能力主张。

### 底部邀请

> Explore the documentation and connect with the MAGNE.AI community.

替代“成千上万开发者已在使用”等未核验采用率表述。

## 法务判断依据与边界

对于美国市场，FTC 要求客观广告主张在发布前已有合理依据，且覆盖明示和合理隐含的含义；真实图片与夸大配文的组合也需一并评估。此原则支持本报告优先审查规模、性能、兼容性和保证性陈述；不是断言美国法必然适用于当前网站。

来源：[FTC Advertising Substantiation Policy](https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation)。

若面向英国消费者涉及受规管的加密资产推广，还需单独审查推广路径及适用规则，不能仅靠一句 Not financial advice。当前尚未判定该首页是否构成具体受规管金融推广，也未审核购买流程。

来源：[ASA/CAP cryptoasset guidance](https://www.asa.org.uk/advice-online/financial-products-and-services-cryptoassets.html)。

正式放行还需：运营/销售主体、目标国家、硬件型号/阶段、已开放能力清单、指标证据、获批 tokenomics。由对应法域律师确认最终适用规则及文案。

## 截图证据

### 1. 首页整体：内容需改

![当前首页](D:/magne.ai/web3-clone/docs/audit-homepage/01-homepage.png)

### 2. 性能与验证节点：高优先级

![性能主张](D:/magne.ai/web3-clone/docs/audit-homepage/02-performance.png)

### 3. 手机与支付：高优先级

![手机概念图和全球合规文案](D:/magne.ai/web3-clone/docs/audit-homepage/03-phone.png)

### 4. 社区规模：待核实

![社区图片和数字](D:/magne.ai/web3-clone/docs/audit-homepage/04-community.png)

### 5. Tokenomics：待核实

![代币分配图](D:/magne.ai/web3-clone/docs/audit-homepage/05-token.png)

### 6. 移动端：阅读需改

![移动端首页](D:/magne.ai/web3-clone/docs/audit-homepage/06-mobile.png)

文字密度、浅色小字和图表文字在手机上存在阅读风险；图表只用图片展示，不能靠缩放替代可访问的数据表。本轮未做完整读屏、对比度计算或支付流程测试，不宣称无障碍合规。

## 下一步顺序

1. 确定硬件区使用的真机照片与对应型号，或先撤下概念手机图。
2. 撤下未经核验的数字、保证性合规/安全措辞及 Live data 标签。
3. 用中性文档/产品入口文案补齐内容，并确认各 CTA 落地页状态。
4. 将来仅凭已核验、有日期/口径的证据恢复具体主张。

页面源文件未修改；本文件为审核建议，不表示已经完成改版或律师签核。

