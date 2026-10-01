import { withBasePath } from "@/lib/site-path";
import routes from "@/content/web3/routes.json";
import documents from "@/content/whitepaper/manifest.json";
import { WhitepaperDocument } from "@/components/whitepaper/WhitepaperDocument";
type Props = {params: Promise<{slug: string[]}>};
export function generateStaticParams() {return routes.map(r=>({slug:r.route.slice(1).split('/')}));}
export async function generateMetadata({params}: Props) {
  const {slug} = await params; const route='/'+slug.join('/');
  const page=routes.find(r=>r.route===route);
  const currentTitle=documents.find(d=>d.route===route)?.title;
  return {title:`${currentTitle || page?.title || "MAGNE.AI"} | Whitepaper v1.1`, alternates:{languages:{en:withBasePath(route),"zh-Hant":withBasePath("/tc"+route)}}};
}
export default async function DocumentPage({params}: Props) {const {slug}=await params;return <WhitepaperDocument route={'/'+slug.join('/')} />;}
