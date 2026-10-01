import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import routes from "@/content/web3/routes.json";
import englishDocuments from "@/content/whitepaper/manifest.json";
import chineseDocuments from "@/content/whitepaper-tc/manifest.json";
import { translate, localizeHref, type Locale } from "./i18n";
import { WhitepaperShell } from "@/components/whitepaper/WhitepaperShell";
import { categoryLabels, orderDocumentChapters, chapterNumber } from "@/components/whitepaper/navigation";
import { numberDocument } from "./document-numbering";
import { DocumentInteractions } from "@/components/sites/web3-magne-ai-9982170f/shared/DocumentInteractions";
import { renderWhitepaperFigures } from "./figures";
import { renderTokenomics, tokenomicsToc } from "./tokenomics";
export async function WhitepaperDocument({route, locale = "en"}: {route: string; locale?: Locale}) {
  const t = (text: string) => translate(text,locale);
  const href = (path: string) => localizeHref(path,locale);
  const documents = orderDocumentChapters(locale === "tc" ? chineseDocuments : englishDocuments);
  const slug = route.slice(1).split('/');
  if(route === '/learning/tokenomics-v1-0') redirect('/v1.0/learning/tokenomics');
  const old = routes.find(item => item.route === route);
  if(old?.redirect) redirect(href(old.redirect));
  const index = documents.findIndex(item => item.route === route);
  const page = documents[index];
  if(!page) notFound();
  const html = locale === "tc"
    ? await fs.readFile(path.join(process.cwd(), "src/content/whitepaper-tc", page.file), "utf8")
    : await fs.readFile(path.join(process.cwd(), "src/content/whitepaper", page.file), "utf8");
  const previous = documents[index-1]; const next = documents[index+1];
  const isTokenomics = route === "/learning/tokenomics";
  const sourceToc = isTokenomics ? tokenomicsToc(locale) : page.toc;
  const illustratedHtml = renderWhitepaperFigures(html, route, locale);
  const renderedHtml = isTokenomics ? renderTokenomics(illustratedHtml, locale) : illustratedHtml;
  const { html: documentHtml, toc } = numberDocument(renderedHtml, route, sourceToc);
  return <WhitepaperShell key={locale+route} toc={toc} locale={locale}>
    <p className="wp-eyebrow wp-breadcrumb"><Link href={href("/")}>{t("WHITEPAPER")}</Link><span>/</span>{t(categoryLabels[slug[0]])}</p>
    <div className="wp-article-meta">{t("VERSION 1.1")} <span>{t("REVIEW DRAFT")}</span></div>
    {!!toc.length && <details className="wp-mobile-toc"><summary>{t("On this page")}</summary><nav>{toc.map(item => <a key={item.id} className={`${"nested" in item && item.nested ? "wp-toc-nested" : ""}${"miningChild" in item && item.miningChild ? " wp-mining-toc" : ""}`} href={'#'+item.id}>{item.title}</a>)}</nav></details>}
    <article className="wp-article"><DocumentInteractions html={documentHtml} locale={locale} /></article>
    <nav className="wp-prev-next" aria-label={t("Chapter pagination")}>{previous ? <Link href={href(previous.route)}><ArrowLeft size={18} /><span><small>{t("Previous chapter")}</small>{chapterNumber(previous.route)} {previous.title}</span></Link> : <Link href={href("/")}><ArrowLeft size={18} />{t("Whitepaper overview")}</Link>}{next && <Link href={href(next.route)}><span><small>{t("Next chapter")}</small>{chapterNumber(next.route)} {next.title}</span><ArrowRight size={18} /></Link>}</nav>
  </WhitepaperShell>;
}
