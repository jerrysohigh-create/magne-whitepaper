import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/tokenomics-navigation-20260930';
const copy={
 en:{
  current:'MHA is currently issued and transferred as a token on BNB Smart Chain (BSC). The BSC contract disclosed in this whitepaper identifies its current token form.',
  future:'The project plans to migrate and integrate MHA into the MAGNE L1 mainnet and M Hash L2 network as those networks become ready. The migration method, applicable networks, schedule and any actions required of holders will be announced separately.',
  scope:'The descriptions below of gas, block rewards and halving concern the planned MAGNE network design. They do not describe features already implemented by the current BSC token contract.',
  design:'In the proposed MAGNE network design, MHA is intended to serve as gas for transactions, staking collateral for validator security, and a base currency for governance and ecosystem incentives via PoL. mBGT is described as the utility and governance token used to coordinate validator emissions and participate in protocol-level voting.',
 },
 tc:{
  current:'MHA 目前以 BNB Smart Chain（BSC）上的代幣形式發行與流轉。本白皮書披露的 BSC 合約地址，對應 MHA 現階段的代幣形態。',
  future:'項目計劃在 MAGNE L1 主網與 M Hash L2 網絡具備相應條件後，推進 MHA 向自有網絡體系的遷移與整合。遷移方式、適用網絡、時間安排及持有人需要採取的操作，將另行公告。',
  scope:'下文有關 Gas、區塊獎勵及減半的說明，屬 MAGNE 自有網絡的規劃設計，不代表這些機制已在現階段的 BSC 代幣合約上實現。',
  design:'在 MAGNE 自有網絡的規劃設計中，MHA 擬用於交易 Gas、驗證者安全質押，以及透過 PoL 支援治理與生態激勵。設計稿另將 mBGT 描述為協調驗證者獎勵發放及參與協議層投票的效用與治理代幣。',
 }
};
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
for(const locale of ['en','tc']){
 const base='src/content/'+(locale==='tc'?'whitepaper-tc':'whitepaper');
 const c=copy[locale];
 const manifest=JSON.parse(await fs.readFile(base+'/manifest.json','utf8'));
 for(const route of ['/learning/mha','/learning/tokenomics']){
  const file=base+route+'.html';let html=await fs.readFile(file,'utf8');
  if(html.includes(c.current))throw Error('Clarification already applied');
  await fs.copyFile(file,`${out}/before/${locale}-${route.split('/').at(-1)}.html.bak`);
  if(route.endsWith('/mha')){
   html=html.replace(/(<h1[^>]*>[\s\S]*?<\/h1>\s*)<p>[\s\S]*?<\/p>/,`$1<p>${c.current}</p><p>${c.future}</p><aside class="wp-mha-stage-note"><strong>${locale==='tc'?'網絡階段說明':'Network stage'}</strong><p>${c.scope}</p></aside>`);
  }else{
   const paragraph=locale==='en'?/<p>MHA is the native token[\s\S]*?<\/p>/:/<p>MHA 是 MAGNE Layer1[\s\S]*?<\/p>/;
   if(!paragraph.test(html))throw Error('Current-form paragraph not found: '+locale);
   html=html.replace(paragraph,`<p>${c.current}</p><p>${c.future}</p><p>${c.design}</p>`);
  }
  await fs.writeFile(file,html);
  await page.setContent(html);
  const text=await page.evaluate(()=>document.body.textContent.replace(/\s+/g,' ').trim());
  manifest.find(d=>d.route===route).text=text;
 }
 await fs.writeFile(base+'/manifest.json',JSON.stringify(manifest,null,2));
 await fs.writeFile(base+'/search.json',JSON.stringify(manifest.map(({route,title,text})=>({route,title,text}))));
}
await browser.close();
console.log('Clarified current BSC form and planned migration in four EN/TC documents; refreshed search text.');
