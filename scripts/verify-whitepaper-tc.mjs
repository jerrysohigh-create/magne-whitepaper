import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='docs/localization-tc/qa';await fs.mkdir(out,{recursive:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const docs=JSON.parse(await fs.readFile('src/content/whitepaper/manifest.json','utf8'));
const tc=JSON.parse(await fs.readFile('src/content/whitepaper-tc/manifest.json','utf8'));
assert.deepEqual(tc.map(d=>d.route),docs.map(d=>d.route));
const b=await chromium.launch({channel:'msedge',headless:true});
const ctx=await b.newContext({permissions:['clipboard-read','clipboard-write'],viewport:{width:1440,height:1024}});
const p=await ctx.newPage();const errors=[];const routes=[];const passed=[];
const interactionsOnly=process.argv.includes('--interactions');
p.on('pageerror',e=>errors.push(e.message));
const go=async route=>{const r=await p.goto('http://127.0.0.1:4173'+route,{waitUntil:'networkidle'});assert.equal(r.status(),200,route);};
try {
 const parse=async html=>{await p.setContent(html);return p.evaluate(()=>({
  ids:[...document.querySelectorAll('[id]')].map(e=>e.id),
  code:[...document.querySelectorAll('code')].map(e=>e.textContent),
  addresses:[...new Set(document.body.innerHTML.match(/0x[a-fA-F0-9]{40}\b/g))].sort(),
  formula:[...document.querySelectorAll('.katex annotation')].map(e=>e.textContent).filter(s=>!['MHA” (e.g., 10 USDC/','MHA, and a miner with 5% commission directs 1','USDC for'].includes(s.trim())),
  links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href').replace(/^\/tc(?=\/|$)/,'').replace('/v1.0/learning/tokenomics','/learning/tokenomics-v1-0')),
 }));};
 for(const d of docs){
  const en=await fs.readFile('src/content/whitepaper/'+d.file,'utf8');
  const before=await fs.readFile('docs/localization-tc/before/src/content/whitepaper/'+d.file,'utf8');
  assert.equal(hash(en),hash(before),'English source changed: '+d.file);
  const chinese=await fs.readFile('src/content/whitepaper-tc/'+d.file,'utf8');
  const [source,translation]=[await parse(en),await parse(chinese)];
  for(const key of Object.keys(source))assert.deepEqual(translation[key],source[key],d.route+' protected '+key);
 }
 for(const h of JSON.parse(await fs.readFile('docs/redesign-plan/archive-hashes.json','utf8')))assert.equal(hash(await fs.readFile('src/content/archive-v1'+h.route+'.html')),h.sha256,h.route);
 passed.push('36 English source files and 33 v1.0 hashes unchanged; all translated IDs, code, real equations, addresses and links match');
 if(!interactionsOnly)for(const width of [1440,390]){
  await p.setViewportSize({width,height:width===390?844:1024});
  for(const prefix of ['', '/tc'])for(const route of ['/',...docs.map(d=>d.route)]){
   const path=prefix+route;await go(path);
   const state=await p.evaluate(()=>({lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),anchors:[...document.querySelectorAll('.wp-site a[href^="#"]')].filter(a=>!document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.hash),escapedLinks:[...document.querySelectorAll('.wp-site a[href]')].filter(a=>/^\/(learning|developers|solutions|networks|help|community)(\/|$)/.test(a.getAttribute('href'))&&!a.closest('.wp-language')).map(a=>a.getAttribute('href'))}));
   assert.equal(state.lang,prefix?'zh-Hant':'en',path);assert.equal(state.overflow,false,path+' overflow');assert.deepEqual(state.brokenImages,[],path+' images');assert.deepEqual(state.anchors,[],path+' anchors');if(prefix)assert.deepEqual(state.escapedLinks,[],path+' language escaped');
   routes.push({path,width,lang:state.lang,status:200});
   if(prefix&&['/','/learning/tokenomics','/developers/build-contract'].includes(route))await p.screenshot({path:`${out}/${route==='/'?'home':route.slice(1).replaceAll('/','-')}-${width}.png`,fullPage:route==='/'});
  }
  console.log(`Passed ${width}px English and Traditional Chinese routes`);
 }
 if(!interactionsOnly)await fs.writeFile(out+'/routes.json',JSON.stringify({routes,errors},null,2));
 else {const prior=JSON.parse(await fs.readFile(out+'/routes.json','utf8'));routes.push(...prior.routes);assert.deepEqual(prior.errors,[]);}
 await p.setViewportSize({width:1440,height:1024});
 await go('/learning/tokenomics?view=review#execution-snapshot');
 await p.locator('.wp-language a[lang="zh-Hant"]').click();await p.waitForURL('**/tc/learning/tokenomics?view=review#execution-snapshot');
 assert.equal(await p.locator('html').getAttribute('lang'),'zh-Hant');
 await p.locator('.wp-language a[lang="en"]').click();await p.waitForURL('**/learning/tokenomics?view=review#execution-snapshot');
 assert.equal(await p.locator('html').getAttribute('lang'),'en');passed.push('Language switch preserves deep chapter, query and section in both directions');
 await go('/tc/');await p.getByRole('link',{name:'閱讀 v1.1',exact:true}).click();await p.waitForURL('**/tc/learning/what-is-magne');
 await p.getByRole('searchbox').fill('代幣經濟');await p.getByRole('searchbox').press('ArrowDown');await p.keyboard.press('Enter');await p.waitForURL('**/tc/learning/tokenomics');
 await p.getByRole('searchbox').fill('zzzzunfindablezz');assert(await p.getByText('找不到符合的章節').isVisible());await p.keyboard.press('Escape');
 passed.push('Chinese primary journey, full-text keyboard search and empty state');
 for(const value of ['10,000,000,000','76,250,500','23,749,500','700,000,000','51,250,000','25,000,000','1,635,000','40,000,000','124,568,474','2026 年 9 月 17 日','2026-09-28','17:56:21'])assert((await p.locator('.wp-article').innerText()).includes(value),'Missing '+value);
 await go('/tc/developers/build-contract');const code=await p.locator('.wp-article code').first().textContent();await p.locator('button[data-action="copy"]').first().click();await p.waitForFunction(()=>document.querySelector('[role="status"]').textContent.includes('已複製'));assert.equal((await p.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),code.replace(/\r\n/g,'\n'));
 await go('/tc/developers/net-config');await p.locator('button[data-action="add-network"]').first().click();await p.waitForFunction(()=>document.querySelector('[role="status"]').textContent.includes('未偵測到相容錢包'));passed.push('Exact clipboard content, Chinese copy and no-wallet feedback; Tokenomics fixed values/dates');
 await p.setViewportSize({width:390,height:844});await go('/tc/');await p.getByRole('button',{name:'開啟章節目錄'}).click();await p.keyboard.press('Escape');assert(await p.getByRole('button',{name:'開啟章節目錄'}).evaluate(e=>e===document.activeElement));
 await p.getByRole('button',{name:'開啟章節目錄'}).click();await p.locator('#wp-mobile-menu').getByRole('link',{name:'MHA 代幣經濟',exact:true}).click();await p.waitForURL('**/tc/learning/tokenomics');assert.equal(await p.locator('#wp-mobile-menu').evaluate(e=>e.open),false);passed.push('Chinese mobile directory navigation, dismissal and focus');
 for(const width of [320,390,768,1024,1154,1440]){
  await p.setViewportSize({width,height:900});
  for(const route of ['/','/tc/','/tc/learning/tokenomics','/tc/developers/build-contract']){
   await go(route);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' '+width);
   for(const lang of ['en','zh-Hant'])assert(await p.locator(`.wp-language a[lang="${lang}"]`).isVisible());
  }
  await go('/tc/');await p.screenshot({path:`${out}/header-${width}.png`});
 }
 passed.push('24 responsive checks at six widths; EN and Traditional Chinese switch always visible');
 for(const r of JSON.parse(await fs.readFile('src/content/web3/routes.json','utf8')).filter(r=>r.redirect)){await go('/tc'+r.route);assert.equal(new URL(p.url()).pathname,'/tc'+r.redirect);}
 await go('/tc/learning/tokenomics-v1-0');assert.equal(new URL(p.url()).pathname,'/v1.0/learning/tokenomics');
 await go('/tc/');await p.getByRole('link',{name:'v1.0 原版',exact:true}).click();await p.waitForURL('**/v1.0');assert.equal(await p.locator('html').getAttribute('lang'),'en');passed.push('Six Chinese category redirects and original v1.0 entry');
 assert.deepEqual(errors,[]);await fs.writeFile(out+'/checks.json',JSON.stringify({routes,passed,errors},null,2));console.log(JSON.stringify({routes:routes.length,passed,errors},null,2));
} finally {await b.close();}
