import { createPublicClient, createWalletClient, custom, defineChain, http, isAddress } from 'viem';
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
