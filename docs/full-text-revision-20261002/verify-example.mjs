import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const rpc='http://127.0.0.1:18545';
// Redirect the example's public RPC calls to our isolated local Anvil.
await page.route('https://rpc.testnet.magicalhash.com/**',async route=>{
 const result=await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:route.request().postData()});
 await route.fulfill({status:200,contentType:'application/json',body:await result.text()});
});
await page.addInitScript(()=>{
 window.testWrongChain=false;
 window.ethereum={request:async ({method,params})=>{
  if(method==='eth_chainId'&&window.testWrongChain)return '0x1';
  const res=await fetch('http://127.0.0.1:18545',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:method==='eth_requestAccounts'?'eth_accounts':method,params:params??[]})});
  const data=await res.json();if(data.error)throw Error(data.error.message);return data.result;
 }};
});
await page.goto('http://127.0.0.1:4174');
await page.locator('#read').click();await page.locator('#output').filter({hasText:'Enter the deployed'}).waitFor();
await page.locator('#contract').fill('0x5FbDB2315678afecb367f032d93F642f64180aa3');
await page.locator('#read').click();await page.locator('#output').filter({hasText:'Counter: 0'}).waitFor();
await page.locator('#connect').click();await page.locator('#output').filter({hasText:'Connected on MAGNE L1 Testnet'}).waitFor();
await page.locator('#increment').click();await page.locator('#output').filter({hasText:'Included in a testnet block'}).waitFor({timeout:30000});
await page.locator('#read').click();await page.locator('#output').filter({hasText:'Counter: 1'}).waitFor();
await page.evaluate(()=>{window.testWrongChain=true});
await page.locator('#increment').click();await page.locator('#output').filter({hasText:'Switch the wallet'}).waitFor();
await page.evaluate(()=>{delete window.ethereum});
await page.locator('#connect').click();await page.locator('#output').filter({hasText:'Install an EIP-1193'}).waitFor();
const result={environment:'Isolated local Anvil, chain ID 20250810; no public-network transaction',checks:['invalid address','read 0','connect','simulate and send local increment','receipt and read 1','wrong chain rejected','missing provider handled'],errors};
fs.writeFileSync('docs/full-text-revision-20261002/example-checks.json',JSON.stringify(result,null,2));
await browser.close();console.log(JSON.stringify(result));if(errors.length)process.exitCode=1;
