import { spawnSync } from 'node:child_process';
import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/magne-whitepaper';
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, GITHUB_PAGES: 'true', NEXT_PUBLIC_BASE_PATH: basePath },
});
if (result.status !== 0) process.exit(result.status || 1);

// CSS public URLs are not automatically prefixed by Next.js basePath.
async function rebaseCss(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await rebaseCss(file);
    else if (file.endsWith('.css')) {
      const source = await readFile(file, 'utf8');
      await writeFile(file, source.replace(/url\((["']?)(\/(?!\/)[^\s)"']+)\1\)/g,
        (match, quote, url) => url.startsWith(basePath + '/') ? match : `url(${quote}${basePath}${url}${quote})`));
    }
  }
}
await rebaseCss('out');
// Next 16.3 on Windows emits nested segment files, while the client requests
// dot-separated names. Add the equivalent flat files; Linux exports are a no-op.
async function flattenSegments(directory, segmentRoot = null) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) {
      await flattenSegments(file, segmentRoot || (item.name.startsWith('__next.') ? directory : null));
    } else if (segmentRoot && item.name.endsWith('.txt')) {
      const flatName = path.relative(segmentRoot, file).split(path.sep).join('.');
      await copyFile(file, path.join(segmentRoot, flatName));
    }
  }
}
await flattenSegments('out');
// Static hosting has no HTTP redirect handler. Keep legacy category URLs usable.
const redirects = [];
for (const [prefix, source] of [['', 'web3'], ['/tc', 'web3'], ['/v1.0', 'archive-v1']]) {
  const routes = JSON.parse(await readFile(`src/content/${source}/routes.json`, 'utf8'));
  for (const route of routes) if (route.redirect) redirects.push([prefix + route.route, prefix + route.redirect]);
}
for (const prefix of ['', '/tc']) redirects.push([prefix + '/learning/tokenomics-v1-0', '/v1.0/learning/tokenomics']);
for (const [from, to] of redirects) {
  const target = basePath + to + '/';
  const directory = path.join('out', from);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><title>Continue to whitepaper</title></head><body><a href="${target}">Continue to whitepaper</a><script>location.replace(${JSON.stringify(target)} + location.search + location.hash)</script></body></html>`);
}
await writeFile('out/.nojekyll', '');
console.log(`GitHub Pages export ready at out/ (base path: ${basePath})`);
