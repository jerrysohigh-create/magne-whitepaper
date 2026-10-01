import Link from "next/link";
export function CommunityStats() {
  return (
    <section className="resource-intro">
      <h2>Explore the ecosystem.</h2>
      <div className="resource-links">
        <Link href="/learning/what-is-magne">Project overview <span aria-hidden="true">↗</span></Link>
        <Link href="/developers/net-config">Network configuration <span aria-hidden="true">↗</span></Link>
        <Link href="https://github.com/magne-ai" target="_blank" rel="noopener noreferrer">Developer repositories <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
