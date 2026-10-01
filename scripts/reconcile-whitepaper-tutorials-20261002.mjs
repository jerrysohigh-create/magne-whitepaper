import fs from 'node:fs';
import {p,h,code,link,doc} from './reconcile-whitepaper-full-20261002.mjs';
const out='public/whitepaper/examples';
fs.mkdirSync(out+'/contracts/src',{recursive:true});fs.mkdirSync(out+'/contracts/test',{recursive:true});fs.mkdirSync(out+'/app',{recursive:true});
const counter=`// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
contract Counter {
    uint256 public number;
    function increment() external { number += 1; }
}
`;
const token=`// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract DemoToken is ERC20 {
    constructor(address recipient) ERC20("Demo Token", "DEMO") {
        _mint(recipient, 1_000_000 * 10 ** decimals());
    }
}
`;
const test=`// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {Counter} from "../src/Counter.sol";
import {DemoToken} from "../src/DemoToken.sol";
contract ExamplesTest {
    function testCounter() public {
        Counter c = new Counter();
        require(c.number() == 0, "initial value");
        c.increment(); c.increment();
        require(c.number() == 2, "two increments");
    }
    function testDemoSupplyAndTransfer() public {
        DemoToken d = new DemoToken(address(this));
        uint256 supply = 1_000_000 * 10 ** d.decimals();
        require(d.totalSupply() == supply, "supply");
        require(d.balanceOf(address(this)) == supply, "recipient");
        d.transfer(address(0xBEEF), 100 ether);
        require(d.balanceOf(address(0xBEEF)) == 100 ether, "transfer");
        require(d.balanceOf(address(this)) == supply - 100 ether, "sender");
        require(d.totalSupply() == supply, "no extra issuance");
    }
}
`;
const foundry=`[profile.default]
src = "src"
test = "test"
out = "out"
libs = ["node_modules"]
solc = "0.8.30"
evm_version = "paris"
remappings = ["@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/"]
`;
const cpkg={name:'magne-whitepaper-contract-examples',private:true,version:'1.0.0',scripts:{build:'forge build',test:'forge test',anvil:'anvil'},devDependencies:{'@foundry-rs/forge':'1.7.1','@foundry-rs/cast':'1.7.1','@foundry-rs/anvil':'1.7.1','@openzeppelin/contracts':'5.6.1'}};
for(const [name,text]of Object.entries({'src/Counter.sol':counter,'src/DemoToken.sol':token,'test/Examples.t.sol':test,'foundry.toml':foundry,'package.json':JSON.stringify(cpkg,null,2)}))fs.writeFileSync(out+'/contracts/'+name,text);
const apkg={name:'magne-whitepaper-app-example',private:true,version:'1.0.0',type:'module',scripts:{dev:'vite --host 127.0.0.1',build:'vite build'},dependencies:{viem:'2.57.2'},devDependencies:{vite:'8.3.2'}};
const index=`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MAGNE testnet counter example</title>
<body><main>
<h1>MAGNE testnet counter</h1><p>Demo only. Select your testnet and use a deployed Counter from this tutorial.</p>
<label>Network <select id="network"><option value="20250810">MAGNE L1 testnet</option><option value="20250827">M Hash L2 testnet</option></select></label>
<label>Counter address <input id="contract" placeholder="0x…" autocomplete="off"></label>
<button id="read">Read counter</button><button id="connect">Connect wallet</button><button id="increment">Increment (wallet approval)</button>
<p id="output" role="status" aria-live="polite">Ready. No transaction sent.</p>
</main><script type="module" src="/main.js"></script></body></html>`;
const app=`import { createPublicClient, createWalletClient, custom, defineChain, http, isAddress } from 'viem';
const networks = {
  20250810: defineChain({ id: 20250810, name: 'MAGNE L1 Testnet', nativeCurrency: { name: 'Test MHA', symbol: 'MHA', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.magicalhash.com'] } }, testnet: true }),
  20250827: defineChain({ id: 20250827, name: 'M Hash L2 Testnet', nativeCurrency: { name: 'Test MHA', symbol: 'MHA', decimals: 18 }, rpcUrls: { default: { http: ['https://l2-rpc.testnet.magicalhash.com'] } }, testnet: true }),
};
const abi = [
  { type: 'function', name: 'number', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'increment', inputs: [], outputs: [], stateMutability: 'nonpayable' },
];
const output = document.querySelector('#output');
const select = document.querySelector('#network');
const field = document.querySelector('#contract');
function clients() {
  const chain = networks[Number(select.value)];
  const publicClient = createPublicClient({ chain, transport: http() });
  return { chain, publicClient };
}
function contractAddress() {
  const address = field.value.trim();
  if (!isAddress(address)) throw new Error('Enter the deployed Counter address for the selected network.');
  return address;
}
async function wallet(chain) {
  if (!window.ethereum) throw new Error('Install an EIP-1193 browser wallet first.');
  const client = createWalletClient({ chain, transport: custom(window.ethereum) });
  const [account] = await client.requestAddresses();
  if (!account) throw new Error('No wallet account selected.');
  if (await client.getChainId() !== chain.id) throw new Error('Switch the wallet to the selected testnet, then retry.');
  return { client, account };
}
let busy = false;
async function run(action) {
  if (busy) return;
  busy = true;
  document.querySelectorAll('button, input, select').forEach(e => e.disabled = true);
  output.textContent = 'Working…';
  try { await action(); } catch (error) { output.textContent = error.shortMessage || error.message || String(error); }
  finally { busy = false; document.querySelectorAll('button, input, select').forEach(e => e.disabled = false); }
}
document.querySelector('#read').onclick = () => run(async () => {
  const { publicClient } = clients();
  const value = await publicClient.readContract({ address: contractAddress(), abi, functionName: 'number' });
  output.textContent = 'Counter: ' + value.toString();
});
document.querySelector('#connect').onclick = () => run(async () => {
  const { chain } = clients();
  const { account } = await wallet(chain);
  output.textContent = 'Connected on ' + chain.name + ': ' + account;
});
document.querySelector('#increment').onclick = () => run(async () => {
  const address = contractAddress();
  const { chain, publicClient } = clients();
  const { client, account } = await wallet(chain);
  const { request } = await publicClient.simulateContract({ address, abi, functionName: 'increment', account });
  const hash = await client.writeContract(request);
  output.textContent = 'Submitted: ' + hash + '. Waiting for receipt…';
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (receipt.status !== 'success') throw new Error('Transaction reverted: ' + hash);
  output.textContent = 'Included in a testnet block: ' + hash;
});
`;
for(const [name,text]of Object.entries({'package.json':JSON.stringify(apkg,null,2),'index.html':index,'main.js':app}))fs.writeFileSync(out+'/app/'+name,text);
const shell=`npm install
npm run build
npm test`;
const network=`# Select ONE network in Bash / WSL:
export MAGNE_RPC_URL="https://rpc.testnet.magicalhash.com"
export MAGNE_CHAIN_ID="20250810"
# For L2 instead:
# export MAGNE_RPC_URL="https://l2-rpc.testnet.magicalhash.com"
# export MAGNE_CHAIN_ID="20250827"
npx cast chain-id --rpc-url "$MAGNE_RPC_URL"`;
const deploy=`npx cast wallet import magne-test --interactive
npx forge create src/Counter.sol:Counter --rpc-url "$MAGNE_RPC_URL" --account magne-test --broadcast
# Replace with the address printed after deployment:
export COUNTER_ADDRESS="0xYOUR_DEPLOYED_COUNTER_ADDRESS"
npx cast call "$COUNTER_ADDRESS" "number()(uint256)" --rpc-url "$MAGNE_RPC_URL"`;
for(const l of ['en','tc']){
 const tc=l==='tc',t=(en,zh)=>tc?zh:en;
 const download=p(`<a href="/whitepaper/examples/contracts.zip" download>${t('Download complete contract examples','下載完整合約範例')}</a>`);
 const env=p(t('Examples use Bash/WSL shell syntax, Node.js 24, Foundry 1.7.1, Solidity 0.8.30 (Paris EVM target) and OpenZeppelin Contracts 5.6.1. Use the pinned package and lockfile in the download. Paris is a compatibility target for the example, not a claim about the current network fork.','範例採 Bash／WSL 指令、Node.js 24、Foundry 1.7.1、Solidity 0.8.30（Paris EVM 目標）及 OpenZeppelin Contracts 5.6.1，請使用下載中的固定版本及 lockfile。Paris 是範例相容性目標，不代表現行網絡分叉設定。'));
 doc(l,'/developers/build-contract',t('Build and deploy a test contract','建立與部署測試合約'),env+download+h('section-1',t('Build locally','本地編譯'))+p(t('Extract the archive, enter its contracts folder and run:','解壓縮後進入 contracts 資料夾並執行：'))+code(shell)+p('src/Counter.sol')+code(counter)+h('section-2',t('Local execution only','只在本地執行'))+p(t('Start the local node in one terminal:','在一個終端啟動本地節點：'))+code('npm run anvil')+p(t('In a second terminal in the same folder, deploy using Anvil’s unlocked development account. This sends only to localhost:','在同一資料夾的第二個終端，使用 Anvil 已解鎖的開發帳戶部署。此步驟只發送至 localhost：'))+code('npx forge create src/Counter.sol:Counter --rpc-url http://127.0.0.1:8545 --unlocked --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast')+h('section-3',t('Choose a testnet','選擇測試網'))+code(network)+p(t('Confirm the returned chain ID equals the selected value. Stop on a mismatch. Obtain test gas from the official faucet using a dedicated test account.','確認回傳 Chain ID 與所選值相同；不符時停止。使用專用測試帳戶，向官方水龍頭取得測試 Gas。'))+h('section-4',t('Explicit testnet deployment','明確執行測試網部署'))+p(t('Import the test account interactively into an encrypted keystore. The command with --broadcast submits a real testnet transaction and spends test gas; without that flag forge create is a dry run. Never place keys in frontend files or source control.','以互動方式將測試帳戶匯入加密金鑰庫。帶 --broadcast 的指令會提交真正的測試網交易並使用測試 Gas；forge create 沒有該旗標時屬 dry run。不要把金鑰放在前端檔案或版本庫。'))+code(deploy)+h('section-5',t('Verify the result','核對結果'))+p(t('Check the receipt, chain ID, deployed bytecode and initial counter value in the selected testnet. A command example is not proof of deployment. Explorer source verification depends on that explorer’s supported verifier and API; use its instructions rather than an invented chain alias.','在所選測試網核對回執、Chain ID、已部署 bytecode 及初始計數值。命令範例不是部署證明。瀏覽器原始碼驗證取決於其支援的驗證器及 API，請按該瀏覽器指引操作，不使用虛構的鏈別名。'))+p('<a href="https://getfoundry.sh/forge/deploying/">Foundry deployment reference</a> · '+link(l,'/developers/net-config',t('Network configuration','網絡配置'))));
 doc(l,'/developers/launch-token',t('Create a demo ERC-20 token','建立示範 ERC-20 代幣'),p(t('This tutorial creates Demo Token (DEMO) with an initial supply of 1,000,000 tokens. It does not deploy, replace or mint official Magic Hash (MHA).','本教學建立初始供應量 1,000,000 枚的 Demo Token（DEMO），不部署、取代或鑄造正式 Magic Hash（MHA）。'))+env+download+h('section-1',t('Complete project structure','完整項目結構'))+code('contracts/\n  package.json\n  package-lock.json\n  foundry.toml\n  src/Counter.sol\n  src/DemoToken.sol\n  test/Examples.t.sol')+p(t('The Counter example remains in place. No file is renamed while leaving stale imports in the tests.','保留 Counter 範例，不透過重新命名檔案留下失效測試匯入。'))+h('section-2','src/DemoToken.sol')+code(token)+h('section-3',t('Build and test','編譯與測試'))+code(shell)+p(t('The included tests cover the initial supply, recipient allocation, transfer balances and preservation of total supply.','隨附測試涵蓋初始供應、接收者配置、轉帳餘額及總供應保持不變。'))+code(test)+h('section-4',t('Deploy locally','本地部署'))+p(t('Start Anvil as in the previous chapter, then run this against localhost only:','按上一章啟動 Anvil，再僅向 localhost 執行：'))+code('npx forge create src/DemoToken.sol:DemoToken --rpc-url http://127.0.0.1:8545 --unlocked --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast --constructor-args 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')+h('section-5',t('Optional testnet deployment','可選測試網部署'))+p(t('After local tests, select the RPC and verify its chain ID as in the previous chapter. Import a dedicated test account and replace the recipient placeholder with its public address. This command broadcasts to the selected testnet.','本地測試後，按上一章選擇 RPC 並核對 Chain ID。匯入專用測試帳戶，把接收者佔位文字替換成公開地址；此指令會向所選測試網廣播。'))+code('export DEMO_RECIPIENT="0xYOUR_TEST_RECIPIENT_ADDRESS"\nnpx forge create src/DemoToken.sol:DemoToken --rpc-url "$MAGNE_RPC_URL" --account magne-test --broadcast --constructor-args "$DEMO_RECIPIENT"')+p(t('Record the contract and transaction on the correct network. Mainnet deployment is outside this example; published mainnet configuration is required before any production guide applies.','在正確網絡記錄合約與交易。此範例不涵蓋主網部署；正式操作指引須待主網配置公布。')));
 doc(l,'/developers/build-app',t('Build a testnet web application','建立測試網網頁應用'),p(t('This small Vite + viem application reads a deployed Counter and can request an increment through the user’s browser wallet. It uses an explicit custom-chain definition; no OnchainKit or hidden provider setup is assumed.','此 Vite＋viem 小型應用讀取已部署的 Counter，並可透過使用者瀏覽器錢包要求增加計數。範例明確定義自訂網絡，不依賴 OnchainKit 或未列出的 Provider 設定。'))+p('<a href="/whitepaper/examples/app.zip" download>'+t('Download complete web example','下載完整網頁範例')+'</a>')+h('section-1',t('Requirements and files','環境與檔案'))+p(t('Node.js 24, Vite 8.3.2 and viem 2.57.2. Extract the archive and enter the app folder. Use an EIP-1193 browser wallet configured for the selected testnet, with test gas and the Counter address deployed in the previous chapter.','使用 Node.js 24、Vite 8.3.2 及 viem 2.57.2。解壓縮並進入 app 資料夾。準備支援 EIP-1193 的瀏覽器錢包、所選測試網設定、測試 Gas 及上一章部署的 Counter 地址。'))+code('npm ci\nnpm run build\nnpm run dev')+h('section-2','package.json')+code(JSON.stringify(apkg,null,2))+h('section-3','index.html')+code(index)+h('section-4','main.js')+code(app)+h('section-5',t('Exercise the flow','操作流程'))+p(t('Choose L1 or L2, enter its Counter address and read the current value. Connect the wallet, check the account and network, then request Increment. The app simulates the call, asks the wallet to sign, and waits for the transaction receipt. Rejection, a wrong network and RPC errors are shown without recording success.','選擇 L1 或 L2、填入該網絡的 Counter 地址並讀取數值。連接錢包，核對帳戶與網絡後要求 Increment。應用先模擬呼叫，再請錢包簽署並等待交易回執；拒絕、網絡不符及 RPC 錯誤均顯示錯誤，不記作成功。'))+h('section-6',t('Deployment scope','部署範圍'))+p(t('A successful receipt shows inclusion in a testnet block, not production settlement finality. Browser builds contain public configuration only. Private keys remain in the wallet; no key is entered into this app.','成功回執表示納入測試網區塊，不代表正式結算最終確定。瀏覽器組建只包含公開配置；私鑰留在錢包，不輸入此應用。'))+p('<a href="https://viem.sh/docs/clients/wallet">viem Wallet Client</a> · '+link(l,'/developers/net-config',t('Testnet parameters','測試網參數'))));
}
console.log('Generated bilingual tutorials and complete pinned example projects.');
