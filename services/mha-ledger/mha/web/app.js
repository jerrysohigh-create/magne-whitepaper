// Same design system as the user's local MS2 page; MHA data/coverage remain independent.
const state = { status: null, track: "history", address: "", transferOffset: 0, holderOffset: 0,
  transferLimit: 15, holderLimit: 10, transferRequest: 0, holderRequest: 0, refreshing: false };
const $ = selector => document.querySelector(selector);
const CONTRACT = "0x37c563cdf4606d4302abb395cdb94e79d31233ed";
const integerFormat = new Intl.NumberFormat("zh-CN");
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const shortAddress = (value, head = 6, tail = 4) => value ? `${value.slice(0, head)}…${value.slice(-tail)}` : "—";
const bsc = (path, value) => `https://bscscan.com/${path}/${encodeURIComponent(value)}`;
const setText = (selector, value) => { $(selector).textContent = value; };

// Amount text is formatted without floating point. Full 18-decimal amounts stay in titles.
function exactToken(value, digits = 6) {
  if (value == null || !/^\d+(\.\d+)?$/.test(String(value))) return "—";
  const [whole, fraction = ""] = String(value).split(".");
  const kept = fraction.slice(0, digits).replace(/0+$/, "");
  const omitted = /[1-9]/.test(fraction.slice(digits));
  return `${integerFormat.format(BigInt(whole))}${kept ? "." + kept : ""}${omitted ? "…" : ""}`;
}

function compactToken(value) {
  if (value == null || !/^\d+(\.\d+)?$/.test(String(value))) return "—";
  const whole = BigInt(String(value).split(".")[0]);
  const divisor = whole >= 100000000n ? 100000000n : whole >= 100000n ? 10000n : 1n;
  if (divisor === 1n) return exactToken(value);
  const scaled = whole * 100n / divisor;
  const decimal = String(scaled % 100n).padStart(2, "0").replace(/0+$/, "");
  const approximate = whole % (divisor / 100n) !== 0n || /[1-9]/.test(String(value).split(".")[1] || "");
  return `${approximate ? "≈" : ""}${integerFormat.format(scaled / 100n)}${decimal ? "." + decimal : ""}${divisor === 100000000n ? "亿" : "万"}`;
}

function rawAmount(value) {
  const digits = BigInt(value).toString().padStart(19, "0");
  return `${digits.slice(0, -18)}.${digits.slice(-18)}`;
}

function formatInteger(value) { return value == null ? "—" : integerFormat.format(BigInt(value)); }
function formatTime(value, withDate = true) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {month: withDate ? "2-digit" : undefined,
    day: withDate ? "2-digit" : undefined, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false}).format(new Date(value));
}
function relativeTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "无记录";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  return seconds < 10 ? "刚刚" : seconds < 60 ? `${seconds} 秒前` : seconds < 3600 ? `${Math.floor(seconds / 60)} 分钟前` : `${Math.floor(seconds / 3600)} 小时前`;
}

async function api(path, allowUnready = false) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(path.replace(/^\//, ""), {cache: "no-store", signal: controller.signal});
    if (!response.ok && !(allowUnready && response.status === 503)) throw new Error(`接口返回 ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}
function toast(message, kind = "error") {
  const el = $("#toast"); el.textContent = message; el.classList.toggle("success", kind === "success"); el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 5000);
}
function setCheck(selector, text, status) {
  const el = $(selector); el.textContent = text; el.className = status === true ? "good" : status === false ? "bad" : "warning";
}

function updateStatus(data, fullHealth, liveHealth) {
  if (data.token?.contract !== CONTRACT || data.token?.chain_id !== 56) throw new Error("接口不是已核验的 MHA 主网账本");
  state.status = data;
  const progress = Math.max(0, Math.min(100, Number(data.history_coverage?.percent ?? 0)));
  const cursor = data.cursor?.number;
  const live = data.live || {};
  const fullReady = fullHealth.healthy === true && !data.halted;
  const liveReady = liveHealth.healthy === true && !data.halted;
  const historyCaughtUp = data.complete_history && Number(data.history_coverage?.remaining_blocks) <= 50;
  const historyFollowing = data.complete_history && Number(data.history_coverage?.remaining_blocks) <= 1000 && !data.last_error;
  setText("#totalSupply", compactToken(data.balance_sum_mha));
  $("#totalSupply").title = `${data.balance_sum_mha} MHA，历史检查点 #${cursor}`;
  setText("#supplyRaw", `${exactToken(data.balance_sum_mha, 18)} MHA`);
  $("#supplyRaw").title = `${data.balance_sum_mha} MHA，不等同于流通量`;
  setText("#transferCount", formatInteger(data.finalized_transfers));
  setText("#rawLogCount", `${formatInteger(data.raw_logs)} 条原始日志`);
  setText("#holderCount", formatInteger(data.positive_balance_addresses));
  setText("#cursorBlock", `#${formatInteger(cursor)}`);
  setText("#targetBlock", `目标 #${formatInteger(data.network?.finalized)}`);
  setText("#progressText", `${progress.toFixed(2)}%`);
  $("#progressBar").style.width = `${progress}%`;
  const pill = $("#syncPill");
  pill.classList.toggle("error", !liveReady);
  pill.lastElementChild.textContent = fullReady ? "账本就绪 · 实时采集" : liveReady ? historyFollowing ? data.audit_progress ? "实时采集 · 对账中" : "实时采集 · 增量追赶" : "实时采集 · 历史补账" : "近期采集需检查";
  pill.title = `全量账本：${fullReady ? "就绪" : "未就绪"}；近期采集：${liveReady ? "正常" : "需检查"}`;
  setText("#healthValue", `${progress.toFixed(1)}%`);
  $("#healthRing").style.setProperty("--score", progress);
  const badge = $("#healthScore");
  badge.textContent = data.halted ? "已停机" : fullReady ? "已就绪" : data.last_error ? "回放待恢复" : historyFollowing ? data.audit_progress ? "对账中" : "增量追赶" : "历史回放中";
  badge.className = "health-score" + (data.halted ? " bad" : fullReady ? "" : " warning");
  setCheck("#checkWorker", liveReady ? `正常 · 落后 ${formatInteger(live.lag_blocks)} 块` : live.last_error ? "节点异常" : "等待或落后", liveReady);
  setCheck("#checkAlerts", historyCaughtUp ? "已追近终局头" : historyFollowing ? "增量追赶中" : "仍在补账", historyCaughtUp ? true : null);
  $("#checkAlerts").title = `历史检查点距本轮终局头 ${formatInteger(data.history_coverage?.remaining_blocks)} 块；百分比是显示精度，不代替精确区块差。`;
  const audit = data.full_audit;
  const auditAge = audit?.checked_at ? (Date.now() - new Date(audit.checked_at).getTime()) / 1000 : Infinity;
  const auditFresh = audit?.status === "passed" && auditAge <= 86490;
  const activeAudit = data.audit_progress;
  const auditPercent = activeAudit ? (100 * activeAudit.addresses_checked / Math.max(1, activeAudit.addresses_known)).toFixed(1) : null;
  setCheck("#checkHeartbeat", activeAudit ? `对账中 · ${auditPercent}%` : !audit ? "尚未执行" : audit.status !== "passed" ? "对账失败" : auditFresh ? "已通过" : "等待复核", activeAudit ? null : !audit ? null : audit.status === "failed" ? false : auditFresh ? true : null);
  $("#checkHeartbeat").title = activeAudit ? `检查点 #${activeAudit.block_number}：${formatInteger(activeAudit.addresses_checked)} / ${formatInteger(activeAudit.addresses_known)} 个地址，断点进度已保存` : "";
  const note = data.halted ? `账本已停机：${data.last_error || "完整性异常"}` : fullReady ? "历史追平且校验通过。当前仅记录终局事件。" : data.last_error ? "历史 RPC 待恢复；近期采集独立运行。尚不能作为完整账本使用。" : "历史覆盖不等于账本就绪；历史追平后还需全地址对账。";
  setText("#readinessNote", `${note} 未解决告警 ${formatInteger(data.unresolved_alerts)} 项。`);
  $("#readinessNote").title = data.last_error || data.audit_last_error || "";
  const openGaps = (live.gaps || []).filter(gap => !gap.covered_by_history).length;
  setText("#liveCoverage", `近期覆盖 #${formatInteger(live.started_from)}–#${formatInteger(live.cursor?.number)} · ${formatInteger(live.finalized_transfers)} 笔转账 · ${openGaps} 个待历史补齐缺口`);
  setText("#lastUpdated", `页面更新：${formatTime(new Date().toISOString())} · 最近采集 ${relativeTime(live.last_commit_at)}`);
}

function drawChart(items) {
  const svg = $("#activityChart"), empty = $("#chartEmpty");
  if (!items.length) {
    svg.innerHTML = ""; empty.classList.remove("hidden"); empty.textContent = "已覆盖历史区间内暂无转账记录"; return;
  }
  empty.classList.add("hidden");
  const values = items.slice().reverse().map(item => BigInt(item.value_raw));
  const groups = [], size = Math.max(1, Math.ceil(values.length / 24));
  for (let i = 0; i < values.length; i += size) groups.push(values.slice(i, i + size).reduce((a,b) => a + b, 0n));
  const max = groups.reduce((a,b) => a > b ? a : b, 1n);
  const x = i => groups.length === 1 ? 387 : 42 + i / (groups.length - 1) * 690;
  const y = value => 184 - Number(value * 1000000n / max) / 1000000 * 145;
  const points = groups.map((v,i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  let grid = "";
  for (let i = 0; i < 5; i++) {
    const gy = 39 + i * 36.25;
    grid += `<line class="chart-grid" x1="42" y1="${gy}" x2="732" y2="${gy}"/><text class="chart-label" x="4" y="${gy + 3}">${escapeHTML(compactToken(rawAmount(max * BigInt(4 - i) / 4n)))}</text>`;
  }
  const dots = groups.map((v,i) => `<circle class="chart-dot" cx="${x(i)}" cy="${y(v)}" r="${i === groups.length - 1 ? 4 : 2}"><title>事件金额合计 ${escapeHTML(rawAmount(v))} MHA</title></circle>`).join("");
  svg.innerHTML = `<defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c9f442" stop-opacity=".18"/><stop offset="100%" stop-color="#c9f442" stop-opacity="0"/></linearGradient></defs>${grid}<polygon class="chart-area" points="${x(0)},184 ${points} ${x(groups.length-1)},184"/><polyline class="chart-line" points="${points}"/>${dots}<text class="chart-label" x="42" y="211">较早事件</text><text class="chart-label" x="682" y="211">最新事件</text>`;
  svg.setAttribute("aria-label", `已回放最近 ${items.length} 笔转账，含铸币/销毁。按事件序号分组，不代表时间趋势。`);
}

function transferRow(item) {
  const date = new Date(item.block_time);
  const datePart = Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
  const special = /^0x0{40}$/.test(item.from_address) ? " · 铸币" : /^0x0{40}$/.test(item.to_address) ? " · 销毁" : "";
  return `<tr><td><span class="time-main">${escapeHTML(datePart)}</span><span class="time-sub">${escapeHTML(formatTime(item.block_time,false))}${special}</span></td>
    <td><a class="address" href="${bsc("address",item.from_address)}" target="_blank" rel="noopener" title="${escapeHTML(item.from_address)}">${escapeHTML(shortAddress(item.from_address))}</a></td>
    <td class="arrow-cell">→</td><td><a class="address" href="${bsc("address",item.to_address)}" target="_blank" rel="noopener" title="${escapeHTML(item.to_address)}">${escapeHTML(shortAddress(item.to_address))}</a></td>
    <td class="amount" title="${escapeHTML(item.amount_mha)} MHA">${exactToken(item.amount_mha)} <small>MHA</small></td><td>#${formatInteger(item.block_number)}</td>
    <td><a class="tx-link" href="${bsc("tx",item.tx_hash)}" target="_blank" rel="noopener" title="在 BscScan 查看" aria-label="在 BscScan 查看交易 ${escapeHTML(shortAddress(item.tx_hash))}">↗</a></td></tr>`;
}

async function loadTransfers(updateChart = false) {
  const request = ++state.transferRequest;
  const {track, address, transferOffset: offset, transferLimit: limit} = state;
  $("#transferPrev").disabled = true; $("#transferNext").disabled = true;
  const params = new URLSearchParams({limit: limit + 1, offset});
  if (address) params.set("address", address);
  const data = await api(`${track === "live" ? "/v1/live/transfers" : "/v1/transfers"}?${params}`);
  if (request !== state.transferRequest) return;
  const items = data.items.slice(0, limit);
  const emptyText = track === "live" ? "近期已覆盖区间暂无匹配转账；不代表历史无交易。" : "已回放区间内没有匹配记录；未覆盖历史不在结果内。";
  $("#transferRows").innerHTML = items.length ? items.map(transferRow).join("") : `<tr><td colspan="7" class="loading-cell">${emptyText}</td></tr>`;
  setText("#transferScope", `${track === "live" ? "近期终局观察" : "历史回放前缀"} · 截至 #${formatInteger(data.cursor?.number)}`);
  setText("#transferRange", items.length ? `显示 ${offset + 1}–${offset + items.length} 条` : "本页无记录");
  $("#transferPrev").disabled = offset === 0;
  $("#transferNext").disabled = data.items.length <= limit;
  if (updateChart) drawChart((await api("/v1/transfers?limit=100")).items);
}

async function loadHolders() {
  const request = ++state.holderRequest, offset = state.holderOffset, limit = state.holderLimit;
  $("#holderPrev").disabled = true; $("#holderNext").disabled = true;
  const data = await api(`/v1/holders?limit=${limit + 1}&offset=${offset}`);
  if (request !== state.holderRequest) return;
  const items = data.items.slice(0, limit);
  const comparable = data.cursor?.number === state.status?.cursor?.number;
  const total = comparable ? BigInt(state.status?.balance_sum_raw || "0") : 0n;
  $("#holderList").innerHTML = items.map((item,index) => {
    const basis = total > 0n ? BigInt(item.balance_raw) * 10000n / total : null;
    const percent = basis === null ? null : Math.min(100, Number(basis) / 100);
    return `<div class="holder-row"><span class="rank">${offset + index + 1}</span><div class="holder-main"><a class="holder-address" href="${bsc("address",item.address)}" target="_blank" rel="noopener" title="${escapeHTML(item.address)}">${escapeHTML(item.address)}</a><div class="share-track"><i style="width:${percent ?? 0}%"></i></div></div><div class="holder-value"><strong title="${escapeHTML(item.balance_mha)} MHA">${compactToken(item.balance_mha)}</strong><small>${percent === null ? "占比待刷新" : percent.toFixed(2) + "%"} · MHA</small></div></div>`;
  }).join("") || '<div class="loading-cell">历史回放前缀中暂无正余额地址，不代表当前无人持币。</div>';
  setText("#holderScope", `历史快照 #${formatInteger(data.cursor?.number)} · 非当前持仓`);
  setText("#holderRange", items.length ? `第 ${offset + 1}–${offset + items.length} 名` : "暂无已重建账户");
  $("#holderPrev").disabled = offset === 0; $("#holderNext").disabled = data.items.length <= limit;
}

async function refresh(showFeedback = false) {
  if (state.refreshing) return;
  state.refreshing = true;
  const button = $("#refreshButton"); button.disabled = true; button.classList.add("spinning"); button.setAttribute("aria-busy","true");
  try {
    const [data, full, live] = await Promise.all([api("/v1/status"),api("/healthz",true),api("/livez",true)]);
    updateStatus(data, full, live);
    await Promise.all([loadTransfers(true), loadHolders()]);
    if (showFeedback) toast("MHA 账本数据已刷新", "success");
  } catch (error) {
    $("#syncPill").classList.add("error"); $("#syncPill").lastElementChild.textContent = "连接失败 · 数据待刷新";
    setText("#healthScore","状态不可确认"); $("#healthScore").className = "health-score bad";
    toast(`读取账本失败，已有数值为上次快照：${error.message}`);
  } finally { state.refreshing = false; button.disabled = false; button.classList.remove("spinning"); button.setAttribute("aria-busy","false"); }
}

async function runAction(action) { try { await action(); } catch (error) { toast(`读取失败：${error.message}`); } }
function closeMenu() { document.body.classList.remove("menu-open"); $("#menuButton").setAttribute("aria-expanded","false"); }
$("#refreshButton").addEventListener("click",()=>refresh(true));
$("#menuButton").addEventListener("click",()=>{
  const open = document.body.classList.toggle("menu-open"); $("#menuButton").setAttribute("aria-expanded",String(open));
});
document.addEventListener("keydown",event=>{ if (event.key === "Escape") closeMenu(); });
document.querySelectorAll(".nav-item").forEach(item=>item.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(link=>link.classList.toggle("active",link===item)); closeMenu();
}));
for (const [id,track] of [["#historyTab","history"],["#liveTab","live"]]) $(id).addEventListener("click",()=>runAction(async()=>{
  state.track = track; state.transferOffset = 0;
  for (const [button,value] of [["#historyTab","history"],["#liveTab","live"]]) {
    $(button).classList.toggle("selected", value===track); $(button).setAttribute("aria-pressed",String(value===track));
  }
  await loadTransfers();
}));
$("#addressSearch").addEventListener("submit",event=>{
  event.preventDefault(); const value = $("#addressInput").value.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(value)) { $("#addressInput").setAttribute("aria-invalid","true"); toast("请输入完整、有效的钱包地址"); return; }
  $("#addressInput").removeAttribute("aria-invalid"); state.address = value; state.transferOffset = 0;
  $("#activeFilter").classList.remove("hidden"); $("#activeFilter span").textContent = `正在筛选：${shortAddress(value,10,8)}`;
  runAction(()=>loadTransfers());
});
$("#clearFilter").addEventListener("click",()=>runAction(async()=>{
  state.address=""; state.transferOffset=0; $("#addressInput").value=""; $("#addressInput").removeAttribute("aria-invalid");
  $("#activeFilter").classList.add("hidden"); await loadTransfers();
}));
for (const [id,key,direction,load] of [["#transferPrev","transferOffset",-1,loadTransfers],["#transferNext","transferOffset",1,loadTransfers],["#holderPrev","holderOffset",-1,loadHolders],["#holderNext","holderOffset",1,loadHolders]]) $(id).addEventListener("click",()=>runAction(async()=>{
  state[key] = Math.max(0,state[key] + direction * (key === "transferOffset" ? state.transferLimit : state.holderLimit)); await load();
}));
refresh();
setInterval(()=>{ if (!document.hidden) refresh(); },15000);
document.addEventListener("visibilitychange",()=>{ if (!document.hidden) refresh(); });
