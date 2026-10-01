export type IncentiveInput = {
  month: number; base: number; lockShare: number; term: number;
  method: 'lock' | 'stake' | 'compare'; stakeEligible: boolean;
  otherRequests: number; monthlyAvailable: number; programRemaining: number;
};
export function calculateIncentive(p: IncentiveInput) {
  if (![p.month,p.base,p.lockShare,p.term,p.otherRequests,p.monthlyAvailable,p.programRemaining].every(Number.isFinite) ||
    !Number.isInteger(p.month) || p.month<1 || p.month>48 || p.base<0 || p.base>10000 || p.lockShare<0 || p.lockShare>1 ||
    ![6,9,12].includes(p.term) || !['lock','stake','compare'].includes(p.method) || typeof p.stakeEligible!=='boolean' ||
    p.otherRequests<0 || p.otherRequests>1e12 || p.monthlyAvailable<0 || p.monthlyAvailable>500000 || p.programRemaining<0 || p.programRemaining>17000000) throw Error('Invalid incentive scenario');
  const active=p.month>=3&&p.month<=36;
  const lockRequest=p.base*p.lockShare*({6:.1,9:.15,12:.2}[p.term]!);
  const stakeRequest=p.stakeEligible?p.base*.1:0;
  // Ties select staking, avoiding an unnecessary additional reward lock.
  const selected=p.method==='compare'?(lockRequest>stakeRequest?'lock':'stake'):p.method;
  const request=active?(selected==='lock'?lockRequest:stakeRequest):0;
  const totalRequests=p.otherRequests+request;
  const budget=active?Math.min(500000,p.monthlyAvailable,p.programRemaining):0;
  const factor=totalRequests>0?Math.min(1,budget/totalRequests):0;
  const bonus=request*factor;
  const locked=selected==='lock'&&bonus>0?p.base*p.lockShare:0;
  const normal=p.base-locked;
  const schedule=Array.from({length:locked>0?p.term+1:3},(_,offset)=>{
    const share=[.6,.2,.2][offset]??0;
    return {month:p.month+offset,baseReleased:normal*share,lockReleased:locked>0&&offset===p.term?locked:0,bonusReleased:bonus*share};
  });
  return {active,selected,request,totalRequests,budget,factor,bonus,locked,normal,schedule};
}
