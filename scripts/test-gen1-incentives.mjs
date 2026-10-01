import assert from 'node:assert/strict';
import {calculateIncentive} from '../src/components/whitepaper/gen1-incentive-model.ts';
const p={month:3,base:1000,lockShare:1,term:12,method:'lock',stakeEligible:false,otherRequests:1999800,monthlyAvailable:500000,programRemaining:17000000};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const run=x=>calculateIncentive({...p,...x});
const a=run({});near(a.request,200);near(a.bonus,50);near(a.locked,1000);near(a.schedule[0].bonusReleased,30);near(a.schedule[12].lockReleased,1000);assert.equal(a.schedule[12].month,15);
for(const result of [a,run({method:'stake',stakeEligible:true}),run({lockShare:.4,term:9,otherRequests:0,monthlyAvailable:50}),run({programRemaining:0}),run({month:36})]){
 near(result.schedule.reduce((s,r)=>s+r.baseReleased+r.lockReleased,0),p.base);
 near(result.schedule.reduce((s,r)=>s+r.bonusReleased,0),result.bonus);
 assert.ok(result.bonus<=result.request&&result.bonus<=result.budget);
}
const tie=run({method:'compare',stakeEligible:true,lockShare:.5});assert.equal(tie.selected,'stake');near(tie.request,100);near(tie.locked,0);
near(run({otherRequests:0}).bonus,200);near(run({otherRequests:0,programRemaining:30}).bonus,30);
for(const month of [1,2,37,48]){const r=run({month});near(r.bonus,0);near(r.locked,0);}
near(run({method:'stake'}).bonus,0);near(run({base:0}).bonus,0);near(run({programRemaining:0}).bonus,0);
const crowd=run({base:200000000/12/13750,otherRequests:(200000000/12/13750*.2)*9999});near(crowd.bonus,50);
for(const patch of [{base:-1},{base:10001},{lockShare:1.1},{otherRequests:-1},{term:7},{month:2.5},{monthlyAvailable:500001},{programRemaining:17000001},{base:NaN}])assert.throws(()=>run(patch));
near(34*500000,17000000);near(185000000+106000000+56000000,347000000);near(380000000+17000000,397000000);
console.log('PASS: budget proration, ties, eligibility, partial locks, principal/bonus conservation, 10k example, program boundaries, reserve limits.');
