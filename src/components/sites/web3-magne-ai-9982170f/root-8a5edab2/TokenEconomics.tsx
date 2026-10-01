import Link from "next/link";
export function TokenEconomics() {
  return (
    <section className="token-documentation" id="whitepaper">
      <h2>MAGNE.AI Whitepaper.</h2>
      <p>Read the v1.1 revision draft, or refer to the original v1.0 whitepaper.</p>
      <div className="whitepaper-versions">
        <Link className="whitepaper-current" href="/learning/tokenomics">WHITEPAPER v1.1 <span aria-hidden="true">↗</span></Link>
        <Link href="/learning/tokenomics-v1-0">ORIGINAL WHITEPAPER v1.0 <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
