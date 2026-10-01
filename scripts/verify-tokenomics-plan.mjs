import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
const out='docs/tokenomics-plan-reconciliation-20260930';await fs.mkdir(out+'/screenshots',{recursive:true});
const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage();const checks=[];const errors=[];
p.on('pageerror',e=>errors.push(e.message));
const names=['tokenomics','tokenomics-changelog','tokenomics-announcement','tokenomics-zh'];
const expectedRows=[[40000000,20000000,0,60000000],[6250000,2000000,0,8250000],[2000000,0,500,2000500],[3000000,3000000,0,6000000],[51250000,25000000,500,76250500]];
for(const locale of ['en','tc']){
 const base='src/content/'+(locale==='tc'?'whitepaper-tc':'whitepaper');
 const html=await fs.readFile(base+'/learning/tokenomics.html','utf8');
 const before=await fs.readFile(`${out}/before/${locale}-tokenomics.html.bak`,'utf8');
 const rules=s=>s.slice(s.indexOf('<h2 id="allocation-1"'),s.indexOf('<h2 id="execution-snapshot"'));
 checks.push({type:'all ten rule bodies unchanged this turn',locale,ok:rules(html)===rules(before)});
 for(const width of [390,1440]){
  await p.setViewportSize({width,height:1000});
  for(const name of names){
   const url=`http://127.0.0.1:4173/${locale==='tc'?'tc/':''}learning/${name}`;
   const res=await p.goto(url,{waitUntil:'networkidle'});
   const data=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brokenAnchors:[...document.querySelectorAll('.wp-main a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),localLinks:[...document.querySelectorAll('.wp-article a')].map(a=>a.href).filter(u=>u.startsWith(location.origin))}));
   checks.push({locale,width,name,type:'page',ok:res.status()===200&&!data.overflow&&!data.brokenAnchors.length,...data});
   await p.screenshot({path:`${out}/screenshots/${locale}-${width}-${name}.png`});
   if(name==='tokenomics'){
    const evidence=await p.evaluate(()=>{
     const table=[...document.querySelectorAll('.wp-article table')].find(t=>t.querySelector('tbody')?.textContent.includes('Bitget'));
     const rows=[...table.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].slice(1).map(td=>Number(td.textContent.replaceAll(',',''))));
     const allocation=[...document.querySelectorAll('.wpf-allocations li')].map(li=>({percent:Number(li.querySelector('strong').textContent.replace('%','')),amount:Number(li.querySelector('small').textContent.replace(/[^0-9]/g,''))}));
     return {rows,allocation,text:document.querySelector('.wp-article').textContent,transactions:[...document.querySelectorAll('a[href*="bscscan.com/tx/"]')].map(a=>a.href),versionVisible:!!document.querySelector('.token-revision-notice')?.getBoundingClientRect().height,announcement:[...document.querySelectorAll('.wp-article a')].some(a=>a.href.includes('tokenomics-announcement'))};
    });
    checks.push({locale,width,type:'execution numbers and sums',ok:JSON.stringify(evidence.rows)===JSON.stringify(expectedRows)&&evidence.rows.slice(0,4).every(r=>r[0]+r[1]+r[2]===r[3])&&[0,1,2,3].every(col=>evidence.rows.slice(0,4).reduce((s,r)=>s+r[col],0)===evidence.rows[4][col])&&100000000-expectedRows[4][3]===23749500});
    checks.push({locale,width,type:'allocation sum',ok:evidence.allocation.length===10&&evidence.allocation.reduce((s,x)=>s+x.percent,0)===100&&evidence.allocation.reduce((s,x)=>s+x.amount,0)===10000000000});
    checks.push({locale,width,type:'version and announcement',ok:evidence.versionVisible&&evidence.announcement});
    checks.push({locale,width,type:'dated snapshot and reserve disclosures',ok:['76,250,500','23,749,500','700,000,000','1,635,000','40,000,000','124,568,474','2026-09-28 17:56:21 UTC'].every(x=>evidence.text.includes(x))});
    checks.push({locale,width,type:'LBank transaction links',ok:['0x0bf277abaea0fbcf27345ccfcf6940d5e0fa1c1fe475618c946da089889adcfa','0x77727368e71cba3936fa05eba28de27a10b45326564f366cd59f9c6f2c6c05a8'].every(hash=>evidence.transactions.includes('https://bscscan.com/tx/'+hash))});
    await p.locator('#execution-snapshot').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/screenshots/${locale}-${width}-execution.png`});
   }
  }
 }
 console.log(locale,'pages and figures checked');
}
const links=[...new Set(checks.flatMap(x=>x.localLinks??[]))];
for(const url of links){const r=await p.request.get(url);checks.push({type:'internal link',url,ok:r.status()===200});}
const archive=await fs.readFile('src/content/archive-v1/learning/tokenomics.html','utf8');
const current=await fs.readFile('src/content/whitepaper/learning/tokenomics.html','utf8');
const preservation=await p.evaluate(({archive,current})=>{
 const parse=s=>new DOMParser().parseFromString(s,'text/html');const a=parse(archive).querySelector('div.flex-1');const c=parse(current).body;
 const names=['Mining Nodes','Staking Nodes','Ecosystem / DAO Treasury','Team & Advisors','VC (Investors, Institutional/Private Round)','Early Supporters','Subscription / Public Sale（3%）','Equipment-Sale Agents'];
 const ids=['allocation-1','allocation-2','allocation-3','allocation-4','allocation-5','allocation-6','allocation-8','allocation-9'];
 const boundaries=new Set(['allocation-1','allocation-2','allocation-3','allocation-4','allocation-5','allocation-6','market-makers','allocation-8','allocation-9','exchange-campaigns']);
 const norm=s=>s.replace(/\s+/g,'');
 return names.map((name,i)=>{
  const old=[...a.querySelectorAll(':scope>h1')].find(h=>h.textContent.trim()===name);const now=c.querySelector('#'+ids[i]);
  if(!old||!now)return{name,ok:false,missing:true};
  let x=old.nextSibling,left='';while(x&&x.nodeName!=='H1'){left+=x.textContent;x=x.nextSibling;}
  let y=now.nextSibling,right='';while(y&&!boundaries.has(y.id)){right+=y.textContent;y=y.nextSibling;}
  return{name,ok:norm(left)===norm(right),oldLength:norm(left).length,currentLength:norm(right).length};
 });
},{archive,current});
checks.push(...preservation.map(x=>({type:'unchanged rule compared with v1.0',...x})));
for(const [file,hash]of Object.entries(JSON.parse(await fs.readFile(out+'/before-hashes.json','utf8')))){
 if(/^src\/content\/whitepaper(-tc)?[\\/]learning[\\/]tokenomics(-changelog|-announcement|-zh)?\.html$/.test(file))continue;
 if(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')!==hash)errors.push('Unexpected content change: '+file);
}
const report={checks,errors,passed:checks.every(x=>x.ok)&&!errors.length};await fs.writeFile(out+'/checks.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:checks.length,passed:report.passed,failed:checks.filter(x=>!x.ok),errors},null,2));await b.close();if(!report.passed)process.exitCode=1;
