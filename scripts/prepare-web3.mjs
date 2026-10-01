import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const origin='https://web3.magne.ai';
const site='web3-magne-ai-'+crypto.createHash('sha256').update(origin).digest('hex').slice(0,8);
const key='root-'+crypto.createHash('sha256').update('/').digest('hex').slice(0,8);
const ns=`sites/${site}/${key}`;
const research=`docs/research/${site}/${key}`;
const components=`src/components/${ns}`;
for(const dir of [`public/${ns}`,research,components,`${research}/components`]) await fs.mkdir(dir,{recursive:true});
await fs.writeFile('docs/research/output-plan.md',`# Output plan\nSource: ${origin}/\nDestination: /\nApp root: D:/magne.ai/web3-clone\nNamespace: ${ns}\nOnly untouched scaffold page.tsx is replaced. Other source-site links go to original public URLs. No backend/data simulation.\n`);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(origin,{waitUntil:'networkidle'});
const menus={desktop:{},mobile:{}};
for(const name of ['LEARNING','DEVELOPERS','SOLUTIONS','NETWORKS','HELP','COMMUNITY']){
 await page.locator('header nav a').filter({hasText:name}).hover();
 await page.waitForTimeout(200);
 menus.desktop[name]=await page.locator('header').evaluate(e=>e.outerHTML);
 await page.screenshot({path:`docs/design-references/web3/desktop-${name.toLowerCase()}.png`});
}
await page.mouse.move(0,700);
await page.setViewportSize({width:390,height:844});
await page.getByRole('button',{name:'Open Menu'}).click();
for(const name of ['LEARNING','DEVELOPERS','SOLUTIONS','NETWORKS','HELP','COMMUNITY']){
 await page.locator('header button').filter({hasText:name}).click();
 await page.waitForTimeout(150);
 menus.mobile[name]=await page.locator('header').evaluate(e=>e.outerHTML);
 await page.screenshot({path:`docs/design-references/web3/mobile-${name.toLowerCase()}.png`});
}
await fs.writeFile(`${research}/menus.json`,JSON.stringify(menus,null,2));
await page.getByRole('button',{name:'Open Menu'}).click();
await page.setViewportSize({width:1440,height:900});
await page.evaluate(()=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=0;});scrollTo(0,0);});
const source=JSON.parse(await fs.readFile('docs/research/web3/source-1440.json','utf8'));
const cssURLs=source.css.filter(s=>s.href&&!s.href.includes('489b77')).map(s=>s.href);
let css=''; const manifest=JSON.parse(await fs.readFile(`${research}/asset-manifest.json`,'utf8').catch(()=>'[]'));const mapping=JSON.parse(await fs.readFile(`${research}/asset-map.json`,'utf8').catch(()=>'{}'));
async function download(url){
 if(mapping[url])return mapping[url];
 if(url.startsWith('data:'))return url;
 const u=new URL(url); const path=u.searchParams.get('url')||u.pathname;
 const name=path.split('/').pop();
 const filename=crypto.createHash('sha256').update(url).digest('hex').slice(0,8)+'-'+name;
 const response=await page.request.get(url);
 if(!response.ok())throw new Error(`Asset ${response.status()} ${url}`);
 await fs.writeFile(`public/${ns}/${filename}`,await response.body());
 mapping[url]=`/${ns}/${filename}`;manifest.push({source:url,local:mapping[url]});return mapping[url];
}
for(const url of cssURLs){
 let text=await (await page.request.get(url)).text();
 const urls=[...text.matchAll(/url\(([^)]+)\)/g)];
 for(const match of urls){const val=match[1].replace(/^["']|["']$/g,'');if(val.startsWith('data:'))continue;const full=new URL(val,url).href;const local=await download(full);text=text.split(match[0]).join(`url("${local}")`);}
 css+=text+'\n';
}
css+=(await page.locator('style').allTextContents()).join('\n');
const imgs=await page.locator('img').evaluateAll(els=>els.map(e=>e.currentSrc||e.src));
for(const url of [...new Set(imgs)])await download(url);
await fs.writeFile(`${research}/asset-manifest.json`,JSON.stringify(manifest,null,2));
await fs.writeFile(`${research}/asset-map.json`,JSON.stringify(mapping,null,2));
const result=await page.evaluate(({mapping,origin})=>{
 const css=[];let idx=0;
 const attrs={class:'className',for:'htmlFor',tabindex:'tabIndex',viewbox:'viewBox','stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin','fill-rule':'fillRule','clip-rule':'clipRule','stroke-miterlimit':'strokeMiterlimit',crossorigin:'crossOrigin',fetchpriority:'fetchPriority'};
 function convert(node){
  if(node.nodeType===3)return `{${JSON.stringify(node.textContent)}}`;
  if(node.nodeType!==1||['SCRIPT','STYLE','LINK'].includes(node.tagName))return '';
  if(node.tagName==='IMG'){node.src=mapping[node.currentSrc||node.src];node.removeAttribute('srcset');node.removeAttribute('sizes');}
  if(node.tagName==='A'&&node.getAttribute('href')?.startsWith('/'))node.href=origin+node.getAttribute('href');
  if(node.tagName==='A'&&node.target==='_blank')node.rel='noopener noreferrer';
  if(node.hasAttribute('style')){const c='captured-'+idx++;css.push(`.${c}{${node.getAttribute('style')}}`);node.classList.add(c);node.removeAttribute('style');}
  const tag=node.tagName.toLowerCase();
  const attributes=[...node.attributes].filter(a=>!['data-nimg'].includes(a.name)&&!a.name.startsWith('on')).map(a=>`${attrs[a.name]||a.name}={${JSON.stringify(a.value)}}`).join(' ');
  return ['img','br','hr','input','source'].includes(tag)?`<${tag} ${attributes} />`:`<${tag} ${attributes}>${[...node.childNodes].map(convert).join('')}</${tag}>`;
 }
 const main=document.querySelector('.min-h-screen');
 const sections=[...main.children].filter(e=>e.tagName!=='STYLE').map(e=>({text:e.textContent.slice(0,100),html:e.outerHTML,jsx:convert(e),styles:[...e.querySelectorAll('h1,h2,h3,p')].map(x=>({text:x.textContent,css:getComputedStyle(x).cssText,fontSize:getComputedStyle(x).fontSize,lineHeight:getComputedStyle(x).lineHeight}))}));
 return {sections,header:convert(document.querySelector('header')),footer:convert(document.querySelector('footer')),css:css.join('\n')};
},{mapping,origin});
const names=['Hero','CommunityStats','Adoption','Growth','CommunityHeading','CommunityGallery','JoinCommunity','TokenEconomics'];
console.log(result.sections.map((s,i)=>({i,text:s.text})));
if(result.sections.length!==names.length)throw new Error('Unexpected topology');
const generated=[];
for(let i=0;i<names.length;i++){
 const name=names[i];const s=result.sections[i];
 await fs.writeFile(`${components}/${name}.tsx`,`/* eslint-disable @next/next/no-img-element */\n// Exact source DOM and locally archived assets; see docs/research output plan.\nexport function ${name}(){return (${s.jsx});}\n`);
 await fs.writeFile(`${research}/components/${name}.spec.md`,`# ${name}\nSource: ${origin}/\nDestination: ${components}/${name}.tsx\nScreenshot: docs/design-references/web3/source-1440.png and source-390.png\nStyles: archived source CSS in src/app/source.css; full computed measurements in docs/research/web3/source-{width}.json\n\n${JSON.stringify(s.styles,null,2)}\n\n## Exact source DOM\n${s.html}\n`);
 generated.push(name);
}
await fs.writeFile(`${components}/HeaderStatic.tsx`,`/* eslint-disable @next/next/no-img-element */\nexport function HeaderStatic(){return (${result.header});}\n`);
await fs.writeFile(`${components}/Footer.tsx`,`/* eslint-disable @next/next/no-img-element */\nexport function Footer(){return (${result.footer});}\n`);
await fs.writeFile(`${research}/components/Header.spec.md`, `# Header\nExact closed JSX in HeaderStatic.tsx. Desktop hover and mobile expanded states in menus.json. Screenshots docs/design-references/web3/{desktop,mobile}-{menu}.png.\n`);
await fs.writeFile(`${research}/components/Footer.spec.md`, `# Footer\nStatic exact captured DOM in Footer.tsx. Links preserve source destinations. Measurements docs/research/web3/source-1440.json and source-390.json.\n`);
await fs.writeFile('src/app/source.css',css+'\n'+result.css+'\n');
await fs.writeFile(`${research}/generated.json`,JSON.stringify({components,ns,research,names:generated},null,2));
console.log({components,assets:manifest.length});
await browser.close();

