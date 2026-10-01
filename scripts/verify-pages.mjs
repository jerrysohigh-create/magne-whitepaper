import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = '/magne-whitepaper';
const root = path.resolve('out');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(base + '/')) { res.writeHead(404).end(); return; }
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname.slice(base.length)));
    assert.ok(file === root || file.startsWith(root + path.sep));
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' + url.search }).end(); return; }
      file = path.join(file, 'index.html');
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = process.env.PAGES_URL || `http://127.0.0.1:${server.address().port}${base}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => {
    if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  for (const route of ['/', '/tc/', '/v1.0/', '/v1.0/learning/tokenomics/', '/tc/learning/', '/tc/developers/build-app/', '/tc/learning/tokenomics-v1-0/']) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('body').innerText().then(t => t.length > 100), true, route);
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(async image => {
        image.loading = 'eager';
        await image.decode().catch(() => {});
      }));
    });
    const problems = await page.evaluate(base => ({
      links: [...document.querySelectorAll('a[href],img[src],link[href]')].map(e => e.getAttribute(e.tagName === 'IMG' ? 'src' : 'href')).filter(h => h?.startsWith('/') && !h.startsWith('//') && !h.startsWith(base + '/')),
      images: [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src),
    }), base);
    assert.deepEqual(problems, { links: [], images: [] }, route);
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin + '/tc/learning/tokenomics/#gen1-calculator', { waitUntil: 'networkidle' });
    await page.locator('#gen1-calculator').waitFor({ state: 'visible' });
    await page.locator('#gen1-calculator .gen1-inputs input').first().fill('20000');
    assert.match(await page.locator('[data-gen1-result="released"]').innerText(), /13,750.00/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('.wp-language a', { hasText: 'EN' }).click();
    await page.waitForURL(origin + '/learning/tokenomics/**');
    await page.locator('#gen1-calculator').waitFor({ state: 'visible' });
    assert.equal(new URL(page.url()).hash, '#gen1-calculator');
  }
  await page.goto(origin + '/tc/', { waitUntil: 'networkidle' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('input[type="search"]').fill('代幣');
  await page.locator('.wp-search-results a').first().click();
  await page.waitForURL(/\/magne-whitepaper\/tc\/learning\//);
  assert.deepEqual(errors, []);
  console.log('PASS: Pages assets, bilingual navigation, search, archive, redirects, calculator and mobile layout.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
