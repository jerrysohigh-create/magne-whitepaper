# 网管交付：白皮书 + 云端独立 MHA 账本

交付仓库：`jerrysohigh-create/magne-whitepaper`。通过 Pull Request 审核、合并 main 后，由网管拉取部署。GitHub 保存代码；BSC 采集、SQLite 和 HTTP 服务在云端运行。GitHub Pages 继续作为静态预览，不运行采集器，也默认不显示账本入口。

## 服务及访问路径

| 服务 | 职责 | 持久化 |
| --- | --- | --- |
| whitepaper | Next.js standalone，英文／繁体白皮书 | 无账本数据 |
| ledger-worker | 直接访问 BSC RPC、终局日志回放、余额重建及对账 | `runtime/ledger` |
| ledger-api | 只读查询及原有账本界面 | 使用同一账本，SQL 只读连接 |
| gateway | `/` → 白皮书；`/mha/` → 账本 | 无 |

白皮书页脚在此云端构建中显示账本入口。账本保持现有简体中文界面，包含余额排行、流水、地址筛选、分页、自动刷新和健康状态；不是新建的用途／审批业务系统。

不依赖 HW-03 或笔记本持续在线。两个后台服务只有一个数据库写入者；API 与数据库端口不暴露公网。现有站点的 HTTPS 网关反代本机 `127.0.0.1:8080`，而不是开放 Docker 端口到所有网卡。TLS、域名及外网访问控制由网管在现有入口配置。

## 1. 拉取及构建

需要支持 Compose v2 的 Docker、Python 3.12（仅本机备份工具需要）、持续联网和本地持久磁盘。先按当前数据库、增长量及备份保留量评估空间；构建也需要临时空间。不要把 SQLite 文件放到网络共享盘。

以下 Linux 命令假定代码位于 `/srv/magne-whitepaper`；路径可由网管调整。

```sh
git clone https://github.com/jerrysohigh-create/magne-whitepaper.git /srv/magne-whitepaper
cd /srv/magne-whitepaper
git switch main
git pull --ff-only
git rev-parse HEAD  # 记录部署提交，便于回退
cd deploy/cloud
cp .env.example .env  # 仅首次执行；后续更新保留现有配置
chmod 600 .env
docker compose config --quiet
docker compose build
mkdir -p runtime/ledger backups import
sudo chown 10001:10001 runtime/ledger backups
```

`.env` 中可替换 RPC 节点，实时和历史节点池不可重复提供商；保留现有请求间隔、冷却及 Retry-After 规则。公开节点可能限流，生产吞吐量需实测。私有节点密钥只能存在服务器配置中。

## 2. 从现有账本生成一致性快照

在源机器运行，不停止现有采集器。使用 SQLite 在线备份，包含已提交 WAL。不能只复制运行中的 `mha.sqlite3`。

```powershell
# Windows 源机器示例；从本仓库根目录执行，输出放在仓库外。
& D:\magne-ledgers\runtime\python.exe deploy/cloud/snapshot.py backup D:\magne-ledgers\apps\mha-ledger\data\mha.sqlite3 D:\mha-cloud-migration
```

或在 HW-03 上用 Python 3.12 执行同一个 `snapshot.py backup <源数据库> <备份目录>`。

输出为时间命名的 `.sqlite3` 和 `.sqlite3.manifest.json`，后者记录 SHA-256、合约、检查点和转账数。二者通过受控文件传输送到云端 `deploy/cloud/import/`，分别命名 `mha.sqlite3` 与 `mha.sqlite3.manifest.json`。不要上传 GitHub、PR 附件或公开下载目录。

## 3. 空目录恢复，再启动

首次部署时 worker/API 都不能已在运行。恢复工具只接受空目标，拒绝覆盖已有数据库、WAL、SHM 或写锁；校验 SHA-256、SQLite 完整性、BSC MHA 合约及检查点。已停机异常快照须先查明原因。

```sh
cd /srv/magne-whitepaper/deploy/cloud
docker compose --profile tools run --rm restore
docker compose up -d whitepaper ledger-worker ledger-api gateway
docker compose ps
curl -fsS http://127.0.0.1:8080/mha/v1/status
curl -i http://127.0.0.1:8080/mha/healthz
curl -i http://127.0.0.1:8080/mha/livez
```

`/v1/status` 返回 200 只证明能读取，**不代表已追平**。保留原有健康判定：`/healthz` 在落后、心跳过期、全地址对账过期/失败时返回 503；`/livez` 只反映近期采集，不证明完整历史可用。至少观察两轮检查点推进，再核对总量、储备余额和关键退款。核验后才把域名入口切过来。

若没有快照，可先 `docker compose run --rm ledger-worker python -m mha init` 建账，再启动历史回放；这会重新采集，不能把空库当最新账本。优先迁入现有快照。

## 4. 绑定现有 HTTPS 入口

网管在现有 `web3.magne.ai` 的 HTTPS server 中将请求转发至 `http://127.0.0.1:8080`，保留 Host 和转发头。先在测试域名验证 `/`、`/tc`、`/mha/`、`/mha/v1/status`、地址过滤与分页；不要覆盖现有证书配置。gateway 自己不申请或持有证书。

本套服务对外账本请求只放行读取，设有限流与超时。返回最新数据库快照，不用旧 JSON 冒充实时响应。API 出错时，已打开的页面保留内存中的旧值并显示“数据待刷新”；首次访问无法读取时会显示不可用。**此版没有跨机器自动接管或冷启动离线快照页面**。同机备份不等于容灾，须安排异机备份；后续可再加入独立备用服务器。

## 5. 每日备份、更新与回退

备份可与 worker 同时运行：

```sh
cd /srv/magne-whitepaper/deploy/cloud
docker compose --profile tools run --rm backup
```

网管应把此命令接入既有每日任务系统，检查退出码；将 `.sqlite3` 和 `.manifest.json` 成对传到异机存储，保留多代并定期做恢复演练。此包不自动添加定时任务、删除旧备份或上传第三方存储。监控磁盘、备份年龄、worker 停机、同步延迟与全地址对账状态；完整性异常应人工检查，不能清空数据库后掩盖。

更新前保存部署提交和配置，执行备份，然后：

```sh
cd /srv/magne-whitepaper
git pull --ff-only origin main
cd deploy/cloud
docker compose config --quiet
docker compose build
docker compose up -d
```

`runtime/ledger`、`backups`、`import`、`.env` 均不随 Git 更新。不要运行 `docker compose down -v`。服务重启会从已有检查点继续。应用回退到记录的旧提交并重建；如未来有 schema 迁移，先确认旧程序兼容性。数据库恢复应停服务、完整保留旧数据目录，并在新空目录执行 restore，绝不在运行库上覆盖。

## 验收范围

部署包包含源码、测试、Compose、网关、备份恢复工具及操作说明；不包含账本数据或密钥。Python/JS 测试验证采集算法和界面逻辑，Docker 构建与网关烟测在 PR 的 Cloud package 工作流中执行。生产服务器、证书、RPC 配额和真实快照导入仍须网管验收；CI 的合成数据库不代表链上全量审计。
