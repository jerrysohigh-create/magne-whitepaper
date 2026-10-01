import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { WhitepaperShell } from "@/components/whitepaper/WhitepaperShell";
import { chapters, chapterNumber } from "@/components/whitepaper/navigation";
import { translate, localizeHref, type Locale } from "./i18n";
export function WhitepaperHome({locale = "en"}: {locale?: Locale}) {
  const t = (text: string) => translate(text,locale);
  const href = (path: string) => localizeHref(path,locale);
  return <WhitepaperShell locale={locale} home toc={[{id:'overview',title:t('Overview')},{id:'chapters',title:t('Chapters')},{id:'revision-notes',title:t('Revision notes')}]}>
    <section className="wp-home-intro" id="overview">
      <p className="wp-eyebrow wp-breadcrumb">{t("WHITEPAPER")} <span>/</span> {t("Overview")}</p>
      <h1>MAGNE.AI<br />{t("Whitepaper")}</h1>
      <p className="wp-subtitle">{t("A reference for the MAGNE.AI ecosystem.")}</p>
      <p className="wp-description">{t("Network architecture, token economics and implementation disclosures.")}</p>
      <Link className="wp-primary" href={href("/learning/what-is-magne")}>{t("Read v1.1")} <ArrowRight size={19} aria-hidden="true" /></Link>
    </section>
    <section className="wp-chapters" id="chapters" aria-labelledby="chapters-heading">
      <h2 className="wp-eyebrow" id="chapters-heading">{t("Explore the whitepaper contents")}</h2>
      {chapters.map(chapter => <Link className="wp-chapter" key={chapter.href} href={href(chapter.href)}><span className="wp-chapter-number">{chapterNumber(chapter.href)}</span><div><h3>{t(chapter.title)}</h3><p>{t(chapter.description)}</p></div><ArrowRight size={19} aria-hidden="true" /></Link>)}
    </section>
    <section id="revision-notes" className="wp-revision"><FileText size={25} aria-hidden="true" /><div><h2>{t("Version 1.1")} <span>|</span> {t("Revision scope")}</h2><p>{t("Updated Exchange Campaigns and liquidity implementation rules.")}<br /> {t("Total supply and top-level allocations unchanged.")}</p></div><Link href={href("/learning/tokenomics-changelog")}>{t("What changed")} <ArrowRight size={17} aria-hidden="true" /></Link></section>
  </WhitepaperShell>;
}
