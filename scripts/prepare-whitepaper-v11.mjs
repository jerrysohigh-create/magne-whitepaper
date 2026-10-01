import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const root = process.cwd();
const backup = path.join(root, 'docs/redesign-plan/before-option-3');
try { await fs.access(backup); throw new Error('Backup already exists; preparation is intentionally one-shot.'); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
await fs.mkdir(backup, { recursive: true });
await fs.cp('src', path.join(backup, 'src'), { recursive: true });
await fs.copyFile('design-qa.md', path.join(backup, 'design-qa.md'));
const routes = JSON.parse(await fs.readFile('src/content/web3/routes.json', 'utf8'));
const original = routes.filter(r => !/tokenomics-(v1-0|changelog|zh|announcement)$/.test(r.route));
await fs.mkdir('src/content/archive-v1', { recursive: true });
const hashes = [];
for (const r of original.filter(r => r.file)) {
  const from = r.route === '/learning/tokenomics' ? 'docs/tokenomics-v11/before/tokenomics.html' : r.file;
  const html = await fs.readFile(from, 'utf8');
  const file = r.route.slice(1) + '.html';
  await fs.mkdir(path.dirname('src/content/archive-v1/' + file), { recursive: true });
  await fs.writeFile('src/content/archive-v1/' + file, html);
  hashes.push({ route:r.route, sha256:crypto.createHash('sha256').update(html).digest('hex') });
}
await fs.writeFile('src/content/archive-v1/routes.json', JSON.stringify(original, null, 2));
await fs.writeFile('docs/redesign-plan/archive-hashes.json', JSON.stringify(hashes, null, 2));
const browser = await chromium.launch({ channel:'msedge', headless:true });
const p = await browser.newPage();
await p.goto('http://127.0.0.1:4173/', {waitUntil:'networkidle'});
await fs.writeFile('src/content/archive-v1/home.html', await p.locator('main').innerHTML());
await fs.mkdir('src/content/whitepaper', { recursive:true });
const documents = [];
for (const r of routes.filter(r => r.file && !r.route.endsWith('tokenomics-v1-0'))) {
  await p.setContent(await fs.readFile(r.file, 'utf8'));
  const data = await p.evaluate(() => {
    const article = document.querySelector('.flex-1');
    if (!article) throw new Error('Article missing');
    article.querySelectorAll('aside').forEach(e=>e.remove());
    const toc=[];
    article.querySelectorAll('h1,h2,h3').forEach((h,i)=>{
      if (!h.id) h.id='section-'+i;
      if (i>0 && h.tagName==='H1') { const n=document.createElement('h2'); n.innerHTML=h.innerHTML;n.id=h.id;h.replaceWith(n);h=n; }
      if(i>0) toc.push({id:h.id,title:h.textContent.trim(),level:h.tagName});
    });
    article.querySelectorAll('*').forEach(e=>{
      if (e.closest('.katex')) return;
      if (e.hasAttribute('class')) {
        const keep=[...e.classList].filter(c=>c.startsWith('token-')||c==='table-wrap'||c==='overflow-x-auto');
        if(keep.length)e.className=keep.join(' ');else e.removeAttribute('class');
      }
      if(e.tagName!=='IMG'&&e.tagName!=='SVG'&&e.tagName!=='PATH')e.removeAttribute('style');
      if(e.tagName==='IMG'&&!e.getAttribute('alt'))e.setAttribute('alt','MAGNE.AI documentation illustration');
    });
    article.querySelectorAll('table').forEach(t=>{
      if(!t.parentElement.matches('.table-wrap,.overflow-x-auto')){const wrap=document.createElement('div');wrap.className='table-wrap';t.replaceWith(wrap);wrap.append(t);}
    });
    return {html:article.innerHTML,toc,text:article.textContent.replace(/\s+/g,' ').trim()};
  });
  const file=r.route.slice(1)+'.html';
  await fs.mkdir(path.dirname('src/content/whitepaper/'+file),{recursive:true});
  await fs.writeFile('src/content/whitepaper/'+file,data.html);
  documents.push({route:r.route,title:r.title,file,toc:data.toc,text:data.text});
}
await browser.close();
await fs.writeFile('src/content/whitepaper/manifest.json',JSON.stringify(documents,null,2));
await fs.writeFile('src/content/whitepaper/search.json',JSON.stringify(documents.map(({route,title,text})=>({route,title,text}))));
await fs.mkdir('public/whitepaper',{recursive:true});
const logo=await fetch('https://www.magne.ai/assets/images/magne-logo-black-wide.png');
if(!logo.ok)throw new Error('Logo unavailable');
await fs.writeFile('public/whitepaper/magne-logo.png',Buffer.from(await logo.arrayBuffer()));
await fs.copyFile('C:/Users/17303/.codex/generated_images/01a0e8ee-bc2e-7f20-9447-405f2443bf0c/exec-ddcad0e9-60e7-44a7-b350-95dea7663dd0.png','docs/redesign-plan/selected-option-3.png');
console.log(`Saved rollback snapshot; archived ${hashes.length} original articles; prepared ${documents.length} v1.1 documents.`);
