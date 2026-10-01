import assert from 'node:assert/strict';
import {calculateGen1} from '../src/components/whitepaper/gen1-model.ts';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const n of [5000,10000,13750,15000,20000,30000,50000]){
 const r=calculateGen1(Array(24).fill(n),1,1);close(r[23].releasedTotal,275000000/Math.max(n,13750));
 close(r[25].locked,0);close(r[25].releasedTotal,r[23].earnedTotal);
}
const full=calculateGen1(Array(36).fill(13750),1,1);close(full[35].earnedTotal,24000);close(full[35].releasedTotal,23818.1818181818);
close(calculateGen1(Array(24).fill(13750),1,.5)[23].releasedTotal,12000);
close(calculateGen1(Array(24).fill(13750),1,0)[23].releasedTotal,4000);
const dynamic=calculateGen1([...Array(12).fill(5000),...Array(12).fill(20000)],1,1);
close(dynamic[11].releasedTotal,full[11].releasedTotal);
close(dynamic[12].released, .6*(100000000/12/20000)+.4*(200000000/12/13750));
const absent=calculateGen1([13750,...Array(23).fill(0)],1,1);close(absent[1].earned,0);assert.ok(absent[1].released>0);close(absent[2].locked,0);
assert.ok(calculateGen1(Array(24).fill(0),0,0).every(r=>r.released===0));
for(const [n,a,w]of [[-1,1,1],[1.5,1,1],[Infinity,1,1],[13750,.5,1],[13750,NaN,0],[13750,1,-1]]) assert.throws(()=>calculateGen1(Array(24).fill(n),a,w));
console.log('PASS: baselines, growth, zero devices, retained vesting, partial work, 24/36 months and invalid inputs.');
const late=calculateGen1(Array(24).fill(13750),1,1,6);
assert.ok(late.slice(0,5).every(r=>r.earned===0&&r.released===0&&!r.participating));
close(late[5].earned,200000000/12/13750);close(late[5].released,.6*late[5].earned);
close(late[12].earned,100000000/12/13750);close(late[25].locked,0);
const lateGrowing=calculateGen1([...Array(12).fill(5000),...Array(12).fill(20000)],1,1,13);
close(lateGrowing[12].earned,100000000/12/20000);close(lateGrowing[12].released,.6*lateGrowing[12].earned);
const last=calculateGen1(Array(36).fill(13750),1,1,36);
close(last[35].earned,50000000/12/13750);close(last[37].releasedTotal,last[35].earned);
for(const start of [0,25,1.5,NaN])assert.throws(()=>calculateGen1(Array(24).fill(13750),1,1,start));
console.log('PASS: M6/M13/M36 joining, no pre-join accrual, global halving/ramp and complete vesting tail.');
