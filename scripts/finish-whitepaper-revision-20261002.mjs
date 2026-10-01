import fs from 'node:fs';
import path from 'node:path';
import {parseHTML} from 'linkedom';
for(const locale of ['en','tc']){
 const tc=locale==='tc',base=`src/content/${tc?'whitepaper-tc':'whitepaper'}`;
 const f=base+'/developers/tools.html';
 const {document}=parseHTML('<html><body>'+fs.readFileSync(f,'utf8')+'</body></html>');
 const pre=document.querySelector('pre');
 const objects=[...document.querySelector('code').textContent.matchAll(/\{[^}]+\}/g)].map(m=>JSON.parse(m[0]));
 pre.outerHTML=objects.map((o,i)=>`<h3 id="network-json-${i}">${o['Network Name']}</h3><pre><code>${JSON.stringify(o,null,2)}</code></pre>`).join('');
 fs.writeFileSync(f,document.body.innerHTML);
 for(const file of ['learning/tokenomics.html','learning/tokenomics-changelog.html','learning/tokenomics-zh.html','learning/tokenomics-announcement.html']){
  let s=fs.readFileSync(base+'/'+file,'utf8');
  s=s.replaceAll('Draft updated 1 October 2026','Draft updated 2 October 2026').replaceAll('草稿更新於 2026 年 10 月 1 日','草稿更新於 2026 年 10 月 2 日').replaceAll('審核稿於 10 月 1 日','審核稿於 10 月 2 日');
  if(tc)s=s.replaceAll('设备','設備').replaceAll('核验','核驗').replaceAll('装置','裝置');
  fs.writeFileSync(base+'/'+file,s);
 }
}
const qa='docs/full-text-revision-20261002/examples';
// Publish source archives only: never dependencies, caches, compiler output or keys.
for(const name of ['contracts','app']){
 const source=qa+'/'+name,dest='public/whitepaper/examples/'+name;
 const allow=name==='contracts'?['package.json','package-lock.json','foundry.toml','src','test']:['package.json','package-lock.json','index.html','main.js'];
 fs.mkdirSync(dest,{recursive:true});
 for(const file of allow)fs.cpSync(path.join(source,file),path.join(dest,file),{recursive:true});
 const readme=name==='contracts'?`# Contract examples\n\nNode.js 24. Bash/WSL commands are used in the chapter.\n\nInstall in Bash/WSL with npm ci. For native Windows, upstream Foundry npm install scripts use POSIX syntax. Use:\n\n    npm ci --ignore-scripts\n    node node_modules/@foundry-rs/forge/postinstall.mjs forge\n    node node_modules/@foundry-rs/cast/postinstall.mjs cast\n    node node_modules/@foundry-rs/anvil/postinstall.mjs anvil\n    npm test\n\nOnly the localhost Anvil deployment uses an unlocked account. For testnets, use a dedicated encrypted keystore. No private keys are distributed.\n\nSolidity 0.8.30 and Paris are pinned example build settings, not a declaration of the current testnet fork.\n`:`# Web example\n\nNode.js 24. Run npm ci, npm run build, npm run dev.\nUse a Counter address from the matching testnet; this is not a live MAGNE deployment.\nThe app requests wallet approval for increment(). No keys or credentials are stored in the frontend.\n`;
 fs.writeFileSync(dest+'/README.md',readme);
}
console.log('Finalised tools examples, revision dates and public source-only downloads.');
