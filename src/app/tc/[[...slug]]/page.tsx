import documents from "@/content/whitepaper-tc/manifest.json";
import routes from "@/content/web3/routes.json";
import { WhitepaperHome } from "@/components/whitepaper/WhitepaperHome";
import { WhitepaperDocument } from "@/components/whitepaper/WhitepaperDocument";
type Props = {params: Promise<{slug?: string[]}>};
export function generateStaticParams(){return [{slug:[]},...routes.map(r=>({slug:r.route.slice(1).split('/')}))];}
export async function generateMetadata({params}:Props){
  const {slug}=await params;const route=slug?.length?'/'+slug.join('/'):'/';
  const page=documents.find(d=>d.route===route);
  return {title:page?`${page.title} | 白皮書 v1.1`:"MAGNE.AI 白皮書 | v1.1 審核稿",alternates:{languages:{en:route,"zh-Hant":route==='/'?'/tc/':'/tc'+route}}};
}
export default async function ChinesePage({params}:Props){
  const {slug}=await params;
  return slug?.length ? <WhitepaperDocument route={'/'+slug.join('/')} locale="tc" /> : <WhitepaperHome locale="tc" />;
}
