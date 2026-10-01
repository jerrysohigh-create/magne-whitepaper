import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const output = 'docs/code-figures-20260930';
const browser = await chromium.launch({channel:'msedge',headless:true});
const page = await browser.newPage();
const errors = [];
const checks = [];
page.on('pageerror', error => errors.push(error.message));
const routes = ['learning/what-is-magne','learning/tokenomics','solutions/hardware','learning/magne-dapp','networks/l1','networks/l2','learning/mha','solutions/connect','networks/explorer'];
await fs.mkdir(output + '/screenshots',{recursive:true});
for (const locale of ['en','tc']) {
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({width,height:1000});
    for (const route of routes) {
      const response = await page.goto(`http://127.0.0.1:4173/${locale === 'tc' ? 'tc/' : ''}${route}`,{waitUntil:'networkidle'});
      const data = await page.evaluate(() => {
        const figures = [...document.querySelectorAll('.wpf,.wpf-token,.wpf-product,.wpf-inline')];
        return {
          figures: figures.length,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          figureOverflow: figures.filter(e => e.scrollWidth > e.clientWidth + 2).map(e => e.dataset.figure || e.className),
          staleVisible: [...document.querySelectorAll('.wp-article img')].filter(e => e.src.includes('/full-site/') && !e.closest('details')).length,
          invalidAnchors: [...document.querySelectorAll('.wpf a[href^="#"]')].map(a=>a.hash.slice(1)).filter(id=>!document.getElementById(id)),
          referenceCount: document.querySelectorAll('.wpf-reference').length,
          referenceScreens: document.querySelectorAll('.wpf-reference img').length,
          percentages: [...document.querySelectorAll('.wpf-allocations li strong')].map(e=>Number(e.textContent.replace('%',''))),
          sourceTable: [...document.querySelectorAll('table')].find(t=>t.querySelectorAll('tbody tr').length === 10)?.innerText,
          lang: document.documentElement.lang,
          captions: [...document.querySelectorAll('.wpf')].every(f=>f.querySelector('figcaption')?.textContent.trim()),
        };
      });
      const ok = response.status() === 200 && data.figures > 0 && !data.overflow && !data.figureOverflow.length && !data.staleVisible && !data.invalidAnchors.length && data.captions;
      checks.push({locale,width,route,status:response.status(),ok,...data});
      if (!ok) console.log('FAIL',JSON.stringify(checks.at(-1)));
      if (width === 390 || width === 1440) {
        const target = route.endsWith('tokenomics') ? '.wpf[data-figure="allocation"]' : '.wpf,.wpf-token,.wpf-product';
        const figure = page.locator(target).first();
        await figure.scrollIntoViewIfNeeded();
        for (const img of await figure.locator('img').all()) await img.evaluate(e=>e.decode());
        await figure.screenshot({path:`${output}/screenshots/${locale}-${route.replace('/','-')}-${width}.png`});
      }
    }
    console.log(`${locale} ${width}: 9 routes checked`);
  }
}

await page.setViewportSize({width:390,height:1000});
for (const route of ['solutions/connect','networks/explorer']) {
  await page.goto(`http://127.0.0.1:4173/tc/${route}`,{waitUntil:'networkidle'});
  const reference = page.locator('.wpf-reference').first();
  await reference.locator('summary').focus();
  await page.keyboard.press('Enter');
  const open = await reference.evaluate(e=>e.open);
  for (const img of await reference.locator('img').all()) await img.evaluate(e=>e.decode());
  const linkedImages = await reference.locator('a').evaluateAll(links=>links.every(a=>a.href === a.querySelector('img')?.src));
  checks.push({route,interaction:'keyboard opens original screenshot',ok:open && linkedImages});
  await reference.screenshot({path:`${output}/screenshots/tc-${route.replace('/','-')}-expanded.png`});
  await page.keyboard.press('Enter');
  checks.push({route,interaction:'keyboard closes original screenshot',ok:!(await reference.evaluate(e=>e.open))});
}

await page.goto('http://127.0.0.1:4173/tc/learning/tokenomics',{waitUntil:'networkidle'});
await page.locator('.wpf-allocations a[href="#market-makers"]').click();
checks.push({interaction:'allocation link selects existing section',ok:new URL(page.url()).hash === '#market-makers'});
await page.locator('.wp-language a').filter({hasText:'EN'}).click();
checks.push({interaction:'language switch preserves allocation anchor',ok:new URL(page.url()).pathname === '/learning/tokenomics' && new URL(page.url()).hash === '#market-makers'});

await page.goto('http://127.0.0.1:4173/v1.0/solutions/hardware',{waitUntil:'networkidle'});
checks.push({route:'v1.0/solutions/hardware',ok:await page.locator('.wpf').count() === 0 && await page.locator('img[src*="Hardware02"]').count() > 0});
for (const record of JSON.parse((await fs.readFile(output+'/content-hashes-before.json','utf8')).replace(/^\uFEFF/,''))) {
  const actual = createHash('sha256').update(await fs.readFile(record.Path)).digest('hex').toUpperCase();
  if (actual !== record.Hash) errors.push('Changed source: '+record.Path);
}
const report = {checks,errors,passed:checks.every(x=>x.ok) && !errors.length};
await fs.writeFile(output+'/checks.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:checks.length,passed:report.passed,errors},null,2));
await browser.close();
if(!report.passed) process.exitCode = 1;
