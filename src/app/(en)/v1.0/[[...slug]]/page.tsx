import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import routes from "@/content/archive-v1/routes.json";
import { Header } from "@/components/sites/web3-magne-ai-9982170f/root-8a5edab2/Header";
import { Footer } from "@/components/sites/web3-magne-ai-9982170f/root-8a5edab2/Footer";
import { DocumentInteractions } from "@/components/sites/web3-magne-ai-9982170f/shared/DocumentInteractions";
import { ArchiveFrame } from "@/components/whitepaper/ArchiveFrame";
import { categoryLabels } from "@/components/whitepaper/navigation";
type Props = {params: Promise<{slug?: string[]}>};
export const metadata = {title: "MAGNE.AI Whitepaper v1.0 | Original Archive"};
export function generateStaticParams(){return [{slug:[]},...routes.map(r=>({slug:r.route.slice(1).split('/')}))];}
export default async function ArchivePage({params}: Props) {
  const {slug} = await params;
  const route = slug?.length ? '/'+slug.join('/') : null;
  const page = route ? routes.find(r=>r.route===route) : null;
  if(route&&!page)notFound();
  if(page?.redirect)redirect('/v1.0'+page.redirect);
  const html=page?.file ? (await fs.readFile(path.join(process.cwd(),'src/content/archive-v1',page.route.slice(1)+'.html'),'utf8')).replace(/href="\/(learning|developers|solutions|networks|help|community)(?=\/|")/g,'href="/v1.0/$1') : null;
  return <ArchiveFrame><div className="archive-banner"><span>WHITEPAPER v1.0 · ORIGINAL ARCHIVE</span><Link href="/">Return to v1.1</Link></div><Header /><main>
    {html ? <><div className="archive-banner"><Link href="/v1.0">All v1.0 chapters</Link><span>Historical content · preserved for reference</span></div><DocumentInteractions html={html}/></> : <div className="archive-index"><p>MAGNE.AI WHITEPAPER / ORIGINAL EDITION</p><h1>Whitepaper v1.0</h1><p>The original whitepaper chapters, preserved as a historical reference. This archive retains the original text and figures. For the current review draft and revision disclosures, read v1.1.</p>{Object.entries(categoryLabels).map(([category,label])=><section key={category}><h2>{label}</h2><ul>{routes.filter(r=>r.file&&r.route.startsWith('/'+category+'/')).map(r=><li key={r.route}><Link href={'/v1.0'+r.route}>{r.title}</Link></li>)}</ul></section>)}</div>}
  </main><Footer /></ArchiveFrame>;
}
