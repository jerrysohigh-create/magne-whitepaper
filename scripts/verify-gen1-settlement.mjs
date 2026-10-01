import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
for(const tc of [false,true]){
 const before=await fs.readFile(`docs/gen1-settlement-review/${tc?'tc':'en'}-before.html`,'utf8');
 const after=await fs.readFile(`src/content/${tc?'whitepaper-tc':'whitepaper'}/learning/tokenomics.html`,'utf8');
 const rows=s=>[...s.matchAll(/<tr data-gen1-month="\d+">.*?<\/tr>/g)].map(x=>x[0]);
 assert.equal(rows(after).length,38);assert.deepEqual(rows(after),rows(before));
 assert.equal(after.slice(after.indexOf('<h2 id="allocation-2">')),before.slice(before.indexOf('<h2 id="allocation-2">')));
 assert.ok(after.includes('id="gen1-settlement-timing"'));
 assert.ok(after.includes('Uᵢ,ₘ ='));assert.ok(!after.includes('Lᵢ,ₘ ='));
}
// Independent examples of the published intramonth rule (full participation).
const B=200e6/12;
const segment=(share,count,a=1,w=1)=>count===0?0:share*Math.min(B/Math.max(count,13750),10000)*(.2*a+.8*w);
const full=segment(1,13750);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
close(segment(.5,5000)+segment(.5,10000),full);
close(segment(.5,5000)+segment(.5,27500),full*.75);
close(segment(.5,0)+segment(.5,13750),full*.5);
close(segment(.5,13750,.5,.25)*2,full*.3);
console.log('PASS: 38 schedule rows per locale unchanged, other allocations unchanged, timing anchors and symbols, segmented count/eligibility examples.');
