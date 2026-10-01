# WEB3.MAGNE.AI 整站本地编辑版

> **当前版本已升级为 v1.1 双语白皮书。** 下文保留最初克隆阶段的记录；当前编辑入口见 [WHITEPAPER-V1.1-EDITING.md](WHITEPAPER-V1.1-EDITING.md)。英文正文在 `src/content/whitepaper/`，繁体正文在 `src/content/whitepaper-tc/`，界面翻译在 `src/components/whitepaper/i18n.ts`。修改后运行 `node scripts/sync-whitepaper-content.mjs` 刷新两种语言的目录与搜索。繁体预览：http://127.0.0.1:4173/tc/。

预览：http://127.0.0.1:4173/

覆盖本次浏览器递归检查发现的全部公开同域页面：34 个独立页面（含首页），6 个栏目入口跳转。学习/白皮书、开发者、解决方案、网络、帮助、社区均可本地访问。逐页清单见 [FULL-SITE-MAP.md](FULL-SITE-MAP.md)。原站没有可用 sitemap，未声称复制不可见、未链接或需登录的页面。

## 修改正文

每篇内页是一个独立 HTML 内容文件，可直接用编辑器修改文字、图片路径、列表和表格。保留标签结构，保存后刷新本地浏览器即可。HTML 中包含原侧栏布局；不需要修改抓取脚本。

- 白皮书：`src/content/web3/learning/tokenomics.html`
- 项目介绍：`src/content/web3/learning/what-is-magne.html`
- 里程碑：`src/content/web3/learning/milestone.html`
- 网络配置：`src/content/web3/developers/net-config.html`
- FAQ：`src/content/web3/help/faqs.html`
- 联系信息：`src/content/web3/help/contact.html`

这里的 Tokenomics 保留原站内容，便于在完整站点中编辑新版。之前的 v1.1 修订草稿仍单独保留在 `D:/magne.ai/tokenomics-v1.1/`，没有擅自覆盖原白皮书。

## 修改共享部分

- 首页：`src/app/page.tsx`，对应模块在 `src/components/sites/web3-magne-ai-9982170f/root-8a5edab2/`。
- 顶栏和手机菜单：上述目录的 `Header.tsx`。
- 页脚：上述目录的 `Footer.tsx`。
- 内页复制/钱包交互：`src/components/sites/web3-magne-ai-9982170f/shared/DocumentInteractions.tsx`。
- 内页布局补充：`src/app/documents.css`；首页改动：`src/app/clone.css`。
- 原站样式：`src/app/source.css`；本地字体和数学排版：`src/app/document-fonts.css`。
- 路由清单与栏目跳转：`src/content/web3/routes.json`。
- 图片/字体：`public/sites/web3-magne-ai-9982170f/`。

首页保留已确认的官方透明手机 PNG 和文案修订。内页正文以原站快照为基线；这次复刻不代表原文已通过法务或事实审核。

## 启动与检查

在本目录运行：

```powershell
npm.cmd install
npm.cmd run dev -- --hostname 127.0.0.1 --port 4173
```

发布前检查：`npm.cmd run check`。生产构建后正文修改需要重新 build；开发预览保存后刷新即可。

不要为了改文案重新运行抓取脚本。`prepare-full-site.mjs` 对已存在的内容文件采用保留策略；原版快照和 DOM 在 `docs/research/full-site/`，不会随普通编辑覆盖。

## 交付边界与原站问题

这是可编辑、可构建的前端重建，未取得原站私有源代码或后台数据库。原站公开同域导航已本地化；RPC、区块浏览器、水龙头、支付站、主站、社交平台等其他域名保留外链。钱包仅在用户点击时发起网络切换/添加请求；QA 使用模拟 provider，不操作真实钱包。

原站有几处既存问题，原文保留以便新版统一处理：

- `/solutions/get-mha` 实际展示 Layer2 说明。
- `/networks/faucet` 实际展示 Gas and Fees。
- 部分 L2 RPC/Explorer 链接的显示文字与实际 href 不一致；见 `docs/research/full-site/route-audit-probes.json`。

未发布正式站、未推送 GitHub。可先在本地改完，再审阅发布。
