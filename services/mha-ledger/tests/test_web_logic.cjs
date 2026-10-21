const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, {textContent:'',className:'',title:'',lastElementChild:{textContent:''},
    style:{setProperty(){}},classList:{toggle(){},add(){},remove(){}},attributes:{},
    setAttribute(key,value){this.attributes[key]=value;}});
  return elements.get(selector);
}
const context = vm.createContext({document:{querySelector:element},setTimeout,clearTimeout,AbortController,URLSearchParams});
const script = fs.readFileSync(path.join(__dirname,'../mha/web/app.js'),'utf8');
vm.runInContext(script.slice(0,script.indexOf('$("#refreshButton").addEventListener')),context);
assert.equal(vm.runInContext('exactToken("10000000000.000000000000000001",18)',context),'10,000,000,000.000000000000000001');
assert.equal(vm.runInContext('exactToken("1.123456789123456789")',context),'1.123456…');
assert.equal(vm.runInContext('compactToken("10000000000.000000000000000000")',context),'100亿');
assert.equal(vm.runInContext('exactToken(null)',context),'—');
assert.equal(vm.runInContext('exactToken("not-data")',context),'—');
assert.equal(vm.runInContext('rawAmount("1")',context),'0.000000000000000001');
assert.equal(vm.runInContext('escapeHTML("<script>")',context),'&lt;script&gt;');
const data = {token:{contract:'0x37c563cdf4606d4302abb395cdb94e79d31233ed',chain_id:56},
  balance_sum_mha:'10000000000.000000000000000000',cursor:{number:10},network:{finalized:100},
  history_coverage:{percent:10},live:{lag_blocks:0,started_from:90,cursor:{number:100},finalized_transfers:0,gaps:[]},
  finalized_transfers:1,raw_logs:1,positive_balance_addresses:1,complete_history:false,full_audit:null,unresolved_alerts:0};
context.fixture = data;
vm.runInContext('updateStatus(fixture,{healthy:false},{healthy:true})',context);
assert.equal(element('#healthScore').textContent,'历史回放中');
assert.equal(element('#checkHeartbeat').textContent,'尚未执行');
assert.match(element('#syncPill').lastElementChild.textContent,/实时采集 · 历史补账/);
assert.match(element('#readinessNote').textContent,/历史追平后还需全地址对账/);
assert.throws(()=>vm.runInContext('updateStatus({...fixture,token:{chain_id:1}}, {}, {})',context),/不是已核验/);
vm.runInContext('updateStatus({...fixture,complete_history:true,history_coverage:{percent:96,remaining_blocks:5000},audit_progress:{block_number:10,addresses_checked:9,addresses_known:100},live:{...fixture.live,gaps:[{covered_by_history:true},{covered_by_history:false}]}},{healthy:false},{healthy:true})',context);
assert.equal(element('#checkAlerts').textContent,'仍在补账');
assert.equal(element('#healthScore').textContent,'历史回放中');
assert.equal(element('#checkHeartbeat').textContent,'对账中 · 9.0%');
assert.match(element('#checkHeartbeat').title,/9 \/ 100/);
assert.match(element('#liveCoverage').textContent,/1 个待历史补齐缺口/);
vm.runInContext('updateStatus({...fixture,complete_history:true,history_coverage:{percent:99.999,remaining_blocks:100}},{healthy:false},{healthy:true})',context);
assert.equal(element('#checkAlerts').textContent,'增量追赶中');
assert.match(element('#checkAlerts').title,/100 块/);
// Fixtures exist only in the test VM, never in the served dashboard or ledger.
async function checkAsyncStates() {
  const mint = {block_time:'2026-08-31T07:52:15Z',from_address:'0x'+'0'.repeat(40),
    to_address:'0x2598825231f9aff0018c407b46e8e50facf082d7',amount_mha:'1.000000000000000001',
    value_raw:'1000000000000000001',block_number:10,tx_hash:'0x'+'a'.repeat(64)};
  let responseItems = Array.from({length:16},()=>mint);
  let lastPath = '';
  context.fetch = async url => {lastPath=url; return {ok:true,json:async()=>({items:responseItems,cursor:{number:10}})};};
  await vm.runInContext('loadTransfers()',context);
  assert.equal(element('#transferNext').disabled,false);
  assert.equal(element('#transferPrev').disabled,true);
  assert.equal(element('#transferRange').textContent,'显示 1–15 条');
  assert.match(lastPath,/limit=16&offset=0/);
  responseItems=[mint];
  await vm.runInContext('state.transferOffset=15; loadTransfers()',context);
  assert.equal(element('#transferNext').disabled,true);
  assert.equal(element('#transferPrev').disabled,false);
  assert.equal(element('#transferRange').textContent,'显示 16–16 条');
  responseItems=[];
  await vm.runInContext('state.track="live"; state.transferOffset=0; loadTransfers()',context);
  assert.match(lastPath,/^v1\/live\/transfers/);
  assert.match(element('#transferRows').innerHTML,/不代表历史无交易/);
  assert.equal(element('#transferNext').disabled,true);
  const holder={address:mint.to_address,balance_raw:'1',balance_mha:'0.000000000000000001'};
  responseItems=Array.from({length:11},()=>holder);
  await vm.runInContext('loadHolders()',context);
  assert.equal(element('#holderNext').disabled,false);
  assert.equal(element('#holderPrev').disabled,true);
  assert.equal(element('#holderRange').textContent,'第 1–10 名');
  responseItems=[holder];
  await vm.runInContext('state.holderOffset=10; loadHolders()',context);
  assert.equal(element('#holderNext').disabled,true);
  assert.equal(element('#holderPrev').disabled,false);
  assert.equal(element('#holderRange').textContent,'第 11–11 名');
  context.fetch = async()=>{throw new Error('test offline');};
  await vm.runInContext('refresh()',context);
  assert.equal(element('#healthScore').textContent,'状态不可确认');
  assert.equal(element('#totalSupply').textContent,'100亿');
  assert.match(element('#toast').textContent,/已有数值为上次快照/);
  assert.equal(element('#refreshButton').disabled,false);
  assert.equal(element('#refreshButton').attributes['aria-busy'],'false');
  context.fetch=async url=>({ok:url!='healthz',status:url==='healthz'?503:200,json:async()=>
    url==='v1/status'?data:url==='healthz'?{healthy:false}:url==='livez'?{healthy:true}:{items:[],cursor:{number:10}}});
  await vm.runInContext('refresh(true)',context);
  assert.equal(element('#healthScore').textContent,'历史回放中');
  assert.equal(element('#toast').textContent,'MHA 账本数据已刷新');
  assert.equal(element('#refreshButton').disabled,false);
  vm.runInContext('clearTimeout(toast.timer)',context);
  console.log('Frontend logic: 43 assertions passed (precision, coverage, audit progress, pagination, failure/recovery)');
}
checkAsyncStates().catch(error=>{console.error(error);process.exitCode=1;});
