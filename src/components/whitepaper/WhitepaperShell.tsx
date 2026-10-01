"use client";
import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "@/lib/site-path";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Search, Menu, X, ChevronDown } from "lucide-react";
import englishIndex from "@/content/whitepaper/search.json";
import chineseIndex from "@/content/whitepaper-tc/search.json";
import { translate, localizeHref, originalPath, type Locale } from "./i18n";
import { categoryLabels, primaryGroups, orderDocumentChapters, chapterNumber } from "./navigation";
import { WhitepaperFooter } from "./WhitepaperFooter";
export type TocItem = { id: string; title: string; level?: string; nested?: boolean; miningChild?: boolean };

function Directory({ close, locale }: { close?: () => void; locale: Locale }) {
  const pathname = originalPath(usePathname());
  const t = (text: string) => translate(text, locale);
  const href = (path: string) => localizeHref(path, locale);
  const searchIndex = orderDocumentChapters(locale === "tc" ? chineseIndex : englishIndex);
  return <nav aria-label={t("Whitepaper chapters")}>
    <div className="wp-version">{t("VERSION 1.1")}<span>{t("REVIEW DRAFT")}</span></div>
    {primaryGroups.map(group => <div className="wp-nav-group" key={group.title}>
      <p className="wp-eyebrow">{t(group.title)}</p>
      {group.links.map(link => <Link key={link.href} href={href(link.href)} onClick={close} aria-current={pathname === link.href ? "page" : undefined}>{t(link.title)}</Link>)}
    </div>)}
    <details className="wp-all-chapters" open={searchIndex.some(d => d.route === pathname) && !primaryGroups.some(g => g.links.some(l => l.href === pathname))}>
      <summary>{t("All chapters")} <ChevronDown size={14} aria-hidden="true" /></summary>
      {Object.entries(categoryLabels).map(([category, label], categoryIndex) => <div className="wp-nav-group" key={category}>
        <p className="wp-eyebrow wp-numbered-heading"><span className="wp-directory-number">{categoryIndex + 1}</span><span>{t(label)}</span></p>
        {searchIndex.filter(d => d.route.startsWith('/' + category + '/')).map(d => <Link className="wp-numbered-link" href={href(d.route)} key={d.route} onClick={close} aria-current={pathname === d.route ? "page" : undefined}><span className="wp-directory-number">{chapterNumber(d.route)}</span><span>{d.title}</span></Link>)}
      </div>)}
    </details>
    <div className="wp-sidebar-footer"><a href={locale === "tc" ? "https://www.magne.ai/" : "https://www.magne.ai/en/"} target="_blank" rel="noreferrer">MAGNE.AI <ArrowRight size={13} /></a><a href={locale === "tc" ? "https://w3.magne.ai/tc/" : "https://w3.magne.ai/"} target="_blank" rel="noreferrer">{t("W3 ecosystem")} <ArrowRight size={13} /></a></div>
  </nav>;
}
function DocumentSearch({locale}: {locale: Locale}) {
  const t = (text: string) => translate(text, locale);
  const href = (path: string) => localizeHref(path, locale);
  const searchIndex = orderDocumentChapters(locale === "tc" ? chineseIndex : englishIndex);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = terms.length ? searchIndex.filter(d => terms.every(t => (d.title + " " + d.text).toLowerCase().includes(t))).sort((a,b) => Number(b.title.toLowerCase().includes(query.toLowerCase())) - Number(a.title.toLowerCase().includes(query.toLowerCase()))).slice(0, 8) : [];
  return <div className="wp-search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} onKeyDown={e => { if (e.key === "Escape") {setOpen(false); input.current?.focus();} if (e.key === "ArrowDown" && e.target === input.current) {e.preventDefault(); e.currentTarget.querySelector<HTMLAnchorElement>('.wp-search-results a')?.focus();} }}>
    <Search size={18} aria-hidden="true" />
    <input ref={input} aria-label={t("Search whitepaper")} type="search" placeholder={t("Search whitepaper")} value={query} onFocus={() => setOpen(true)} onChange={e => {setQuery(e.target.value); setOpen(true);}} aria-controls={open && query.trim() ? "whitepaper-search-results" : undefined} autoComplete="off" />
    {open && query.trim() && <div className="wp-search-results" id="whitepaper-search-results">
      <p className="wp-eyebrow" role="status">{matches.length ? (locale === "tc" ? `找到 ${matches.length} 個章節` : `${matches.length} matching chapters`) : t("No matching chapters")}</p>
      {!matches.length && <p>{t("Try “tokenomics”, “testnet” or “governance”.")}</p>}
      {matches.map(d => <Link key={d.route} href={href(d.route)} onClick={() => {setOpen(false);setQuery("");}}><strong>{chapterNumber(d.route)} {d.title}</strong><span>{t(categoryLabels[d.route.split('/')[1]])}</span><ArrowRight size={16} /></Link>)}
    </div>}
  </div>;
}
export function WhitepaperShell({ children, toc = [], home = false, locale = "en" }: { children: ReactNode; toc?: TocItem[]; home?: boolean; locale?: Locale }) {
  const t = (text: string) => translate(text, locale);
  const href = (path: string) => localizeHref(path, locale);
  const pathname = originalPath(usePathname());
  const menu = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(toc[0]?.id);
  useEffect(() => {
    const update = () => {
      const visible = toc.filter(t => { const element = document.getElementById(t.id); return element && element.getClientRects().length > 0 && element.getBoundingClientRect().top <= 180; });
      setActiveSection(visible.at(-1)?.id ?? toc[0]?.id);
    };
    window.addEventListener('scroll', update, {passive:true});
    const frame = requestAnimationFrame(update);
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(frame); };
  }, [toc]);
  const closeMenu = () => {menu.current?.close(); setMenuOpen(false); menuButton.current?.focus();};
  return <div className={`wp-site ${locale === "tc" ? "wp-tc" : ""}`} lang={locale === "tc" ? "zh-Hant" : "en"}>
    <a className="wp-skip" href="#wp-main">{t("Skip to content")}</a>
    <header className="wp-header">
      <Link className="wp-brand" href={href("/")} aria-label={t("MAGNE.AI Whitepaper home")}><Image src={withBasePath("/whitepaper/magne-logo.png")} alt="MAGNE.AI" width={228} height={23} unoptimized priority /><span>{t("WHITEPAPER")}</span></Link>
      <DocumentSearch locale={locale} />
      <nav className="wp-language" aria-label={locale === "tc" ? "語言" : "Language"}>{(["en", "tc"] as const).map(lang => <a key={lang} href={withBasePath(localizeHref(pathname,lang))} lang={lang === "tc" ? "zh-Hant" : "en"} hrefLang={lang === "tc" ? "zh-Hant" : "en"} aria-current={locale === lang ? "true" : undefined} onClick={event => { event.currentTarget.href = withBasePath(localizeHref(pathname,lang)) + window.location.search + window.location.hash; try {localStorage.setItem("magne-whitepaper-language",lang);} catch { /* Navigation works even if storage is unavailable. */ } }}>{lang === "en" ? "EN" : "繁體中文"}</a>)}</nav>
      <Link className="wp-archive-link" href="/v1.0">{t("v1.0 Original")} <ArrowRight size={16} aria-hidden="true" /></Link>
      <button className="wp-menu-button" ref={menuButton} type="button" aria-label={t("Open chapter navigation")} aria-controls="wp-mobile-menu" aria-expanded={menuOpen} onClick={() => {menu.current?.showModal();setMenuOpen(true);}}><Menu size={23} /></button>
    </header>
    <aside className="wp-sidebar"><Directory locale={locale} /></aside>
    <dialog id="wp-mobile-menu" className="wp-mobile-menu" ref={menu} onClose={() => setMenuOpen(false)} onClick={e => {if(e.target===e.currentTarget)closeMenu();}}>
      <div className="wp-menu-inner"><div className="wp-menu-heading">{t("WHITEPAPER")} <button type="button" aria-label={t("Close chapter navigation")} onClick={closeMenu}><X size={22} /></button></div><Directory close={closeMenu} locale={locale} /></div>
    </dialog>
    <main id="wp-main" tabIndex={-1} className={`wp-main ${home ? 'wp-home' : 'wp-reading'}`}>
      <div className="wp-mobile-version wp-eyebrow">{t("VERSION 1.1")} · {t("REVIEW DRAFT")}</div>
      {children}
      <WhitepaperFooter locale={locale} />
    </main>
    {!!toc.length && <aside className="wp-page-toc"><p className="wp-eyebrow">{t("On this page")}</p><nav aria-label={t("On this page")}>{toc.map(t => <a key={t.id} href={'#'+t.id} className={`${activeSection === t.id ? 'wp-toc-first' : ''}${t.nested ? ' wp-toc-nested' : ''}${t.miningChild ? ' wp-mining-toc' : ''}`} aria-current={activeSection === t.id ? 'location' : undefined}>{t.title}</a>)}</nav></aside>}
  </div>;
}
