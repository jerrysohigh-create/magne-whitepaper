from pathlib import Path
p=Path('src/app/[...slug]/page.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('import documents from "@/content/whitepaper/manifest.json";','import englishDocuments from "@/content/whitepaper/manifest.json";\nimport chineseDocuments from "@/content/whitepaper-tc/manifest.json";\nimport { translate, localizeHref, type Locale } from "./i18n";')
start=s.index('type Props ='); end=s.index('  const old = routes.find')
s=s[:start]+'''export async function WhitepaperDocument({route, locale = "en"}: {route: string; locale?: Locale}) {
  const t = (text: string) => translate(text,locale);
  const href = (path: string) => localizeHref(path,locale);
  const documents = locale === "tc" ? chineseDocuments : englishDocuments;
  const slug = route.slice(1).split('/');
  if(route === '/learning/tokenomics-v1-0') redirect('/v1.0/learning/tokenomics');
'''+s[end:]
s=s.replace('redirect(old.redirect)','redirect(href(old.redirect))').replace('"src/content/whitepaper", page.file','locale === "tc" ? "src/content/whitepaper-tc" : "src/content/whitepaper", page.file')
s=s.replace('<WhitepaperShell key={route} toc={page.toc}>','<WhitepaperShell key={locale+route} toc={page.toc} locale={locale}>').replace('<Link href="/">WHITEPAPER</Link>','<Link href={href("/")}>{t("WHITEPAPER")}</Link>').replace('{categoryLabels[slug[0]]}','{t(categoryLabels[slug[0]])}')
s=s.replace('>VERSION 1.1 <span>REVIEW DRAFT</span>','>{t("VERSION 1.1")} <span>{t("REVIEW DRAFT")}</span>').replace('<summary>On this page</summary>','<summary>{t("On this page")}</summary>').replace('<DocumentInteractions html={html} />','<DocumentInteractions html={html} locale={locale} />')
s=s.replace('aria-label="Chapter pagination"','aria-label={t("Chapter pagination")}').replace('href={previous.route}','href={href(previous.route)}').replace('href={next.route}','href={href(next.route)}').replace('<small>Previous chapter</small>','<small>{t("Previous chapter")}</small>').replace('<small>Next chapter</small>','<small>{t("Next chapter")}</small>').replace('<Link href="/"><ArrowLeft size={18} />Whitepaper overview</Link>','<Link href={href("/")}><ArrowLeft size={18} />{t("Whitepaper overview")}</Link>')
Path('src/components/whitepaper/WhitepaperDocument.tsx').write_text(s,encoding='utf-8')
p.write_text('''import routes from "@/content/web3/routes.json";
import { WhitepaperDocument } from "@/components/whitepaper/WhitepaperDocument";
type Props = {params: Promise<{slug: string[]}>};
export function generateStaticParams() {return routes.map(r=>({slug:r.route.slice(1).split('/')}));}
export async function generateMetadata({params}: Props) {
  const {slug} = await params; const route='/'+slug.join('/');
  const page=routes.find(r=>r.route===route);
  return {title:`${page?.title || "MAGNE.AI"} | Whitepaper v1.1`, alternates:{languages:{en:route,"zh-Hant":"/tc"+route}}};
}
export default async function DocumentPage({params}: Props) {const {slug}=await params;return <WhitepaperDocument route={'/'+slug.join('/')} />;}
''',encoding='utf-8')
