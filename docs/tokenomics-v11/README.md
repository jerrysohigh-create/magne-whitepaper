# Tokenomics v1.1 可回退试改

本地白皮书入口： http://127.0.0.1:4173/learning/tokenomics

只替换 Exchange Campaigns 与 Early Liquidity Market Makers 两节，添加版本头、总量/TGE信息、页内目录、执行快照、活动澄清、中文修订说明、版本记录和公告草稿。保留其他八类原文；原始分配表未修改。沿用原深蓝配色与站点外框。所有数字是此前核验的 2026-09-28 17:56:21 UTC / BSC 124,568,474 快照，不代表现在的实时余额。

原版入口：`/learning/tokenomics-v1-0`，正文文件与试改前完全一致。新增原版、中文、修订记录、公告四个路由。没有发布正式站或进行整份白皮书法务审核。

备份：`before/tokenomics.html`、`before/routes.json`、`before/documents.css`。如需撤销这次试改，可运行 `scripts/rollback-tokenomics-v11.ps1`；它恢复这三个文件，保留新增草稿在磁盘上便于恢复。若试改后又修改过这三个文件，回退前应先比较差异，以免覆盖后续工作。

检查：`preservation-check.json` 记录其他八节原文一致；`browser-checks.json` 记录5个页面在1440/768/390宽度的15项检查，无整页溢出和失效目录锚点。桌面、手机首屏和执行表截图已目视检查。构建结果见本次运行输出。
