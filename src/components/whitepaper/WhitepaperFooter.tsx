"use client";

import Image from "next/image";
import { withBasePath } from "@/lib/site-path";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { localizeHref, type Locale } from "./i18n";

// Destinations verified against the official MAGNE.AI footer on 2026-09-30.
const socialLinks = [
  {label: "GitHub", href: "https://github.com/magne-ai"},
  {label: "X", href: "https://x.com/Magne_Ai"},
  {label: "Telegram", href: "https://t.me/MagneAI"},
  {label: "YouTube", href: "https://www.youtube.com/@MagneAI"},
  {label: "Discord", href: "https://discord.gg/tX2xRAkd"},
];

export function WhitepaperFooter({locale}: {locale: Locale}) {
  const t = (en: string, tc: string) => locale === "tc" ? tc : en;
  const mainSite = locale === "tc" ? "https://www.magne.ai/" : "https://www.magne.ai/en/";
  const privacyUrl = mainSite + "privacy-policy.html";
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState("");
  const closeDialog = () => {dialog.current?.close();};

  function clearLanguageRecord() {
    try {
      localStorage.removeItem("magne-whitepaper-language");
      setStatus(t("Your saved language record has been cleared. This page stays in the current language.", "已清除儲存的語言記錄。本頁維持目前語言。"));
    } catch {
      setStatus(t("Browser storage is unavailable. You can clear site data in your browser settings.", "無法存取瀏覽器儲存空間。您可在瀏覽器設定中清除此站資料。"));
    }
  }

  return <footer className="wp-footer wp-footer-expanded" id="site-footer" aria-label={t("Whitepaper footer", "白皮書頁尾")}>
    <div className="wp-footer-heading">
      <Link href={localizeHref("/", locale)} aria-label={t("MAGNE.AI Whitepaper home", "MAGNE.AI 白皮書首頁")}>
        <Image src={withBasePath("/whitepaper/magne-logo.png")} alt="MAGNE.AI" width={183} height={19} unoptimized />
      </Link>
      <span className="wp-eyebrow">{t("WHITEPAPER / v1.1 REVIEW DRAFT", "白皮書 / v1.1 審核稿")}</span>
    </div>
    <div className="wp-footer-grid">
      <nav aria-label={t("Reading resources", "閱讀資源")}>
        <h2 className="wp-eyebrow">{t("Read", "閱讀")}</h2>
        <Link href={localizeHref("/", locale)}>{t("Whitepaper overview", "白皮書概覽")}</Link>
        <Link href={localizeHref("/learning/tokenomics-changelog", locale)}>{t("Revision history", "修訂紀錄")}</Link>
        <Link href="/v1.0">{t("v1.0 archive", "v1.0 原版歸檔")}</Link>
      </nav>
      <nav aria-label={t("Official resources", "官方資源")}>
        <h2 className="wp-eyebrow">{t("Resources", "資源")}</h2>
        <a href={mainSite} target="_blank" rel="noopener noreferrer">MAGNE.AI <ArrowUpRight size={13} aria-hidden="true" /></a>
        <a href={locale === "tc" ? "https://w3.magne.ai/tc/" : "https://w3.magne.ai/"} target="_blank" rel="noopener noreferrer">{t("W3 ecosystem", "W3 生態")} <ArrowUpRight size={13} aria-hidden="true" /></a>
        <a href={mainSite + "media-kit.html"} target="_blank" rel="noopener noreferrer">{t("Media Kit", "媒體資源")} <ArrowUpRight size={13} aria-hidden="true" /></a>
      </nav>
      <nav className="wp-footer-follow" aria-label={t("Official social channels", "官方社群頻道")}>
        <h2 className="wp-eyebrow">{t("Follow MAGNE.AI", "關注 MAGNE.AI")}</h2>
        <div className="wp-social-links">{socialLinks.map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={13} aria-hidden="true" /></a>)}</div>
      </nav>
    </div>
    <div className="wp-footer-legal">
      <span>© {new Date().getFullYear()} MAGNE.AI. {t("All rights reserved.", "保留所有權利。")}</span>
      <div>
        <a href={privacyUrl} target="_blank" rel="noopener noreferrer">{t("Privacy Policy", "隱私政策")} <ArrowUpRight size={12} aria-hidden="true" /></a>
        <button ref={trigger} type="button" aria-haspopup="dialog" aria-controls="wp-cookie-dialog" onClick={() => {setStatus("");dialog.current?.showModal();}}>{t("Cookie information", "Cookie 說明")}</button>
      </div>
    </div>
    <dialog ref={dialog} id="wp-cookie-dialog" className="wp-cookie-dialog" aria-labelledby="wp-cookie-title" aria-describedby="wp-cookie-intro" onClose={() => trigger.current?.focus()} onClick={e => {if(e.target === e.currentTarget)closeDialog();}}>
      <div className="wp-cookie-content">
        <div className="wp-cookie-heading"><p className="wp-eyebrow">{t("PRIVACY / WHITEPAPER", "隱私 / 白皮書")}</p><button type="button" className="wp-cookie-close" onClick={closeDialog} aria-label={t("Close Cookie information", "關閉 Cookie 說明")}><X size={21} aria-hidden="true" /></button></div>
        <h2 id="wp-cookie-title">{t("Cookies & local storage", "Cookie 與本機儲存")}</h2>
        <p id="wp-cookie-intro">{t("This whitepaper currently uses no analytics or advertising cookies. Its social links do not embed third-party tracking widgets.", "本白皮書目前不使用分析或廣告 Cookie。社群連結亦不嵌入第三方追蹤元件。")}</p>
        <div className="wp-cookie-section"><h3>{t("Language record", "語言記錄")}</h3><p>{t("Switching languages saves the selected language in this browser. The page address determines the language you are reading. You can clear the saved record below without changing this page.", "切換語言時，所選語言會儲存在此瀏覽器。目前閱讀的語言由頁面網址決定。您可在下方清除儲存記錄，而不改變本頁語言。")}</p></div>
        <div className="wp-cookie-section"><h3>{t("External websites", "外部網站")}</h3><p>{t("The main website and social platforms manage their own cookies and privacy choices. This panel applies only to the whitepaper website.", "主站及社群平台各自管理其 Cookie 與隱私選擇。本面板僅適用於白皮書網站。")}</p><a href={privacyUrl} target="_blank" rel="noopener noreferrer">{t("Read MAGNE.AI Privacy Policy", "閱讀 MAGNE.AI 隱私政策")} <ArrowUpRight size={14} aria-hidden="true" /></a></div>
        <p role="status" aria-live="polite" className="wp-cookie-status">{status}</p>
        <div className="wp-cookie-actions"><button type="button" onClick={clearLanguageRecord}>{t("Clear language record", "清除語言記錄")}</button><button type="button" className="wp-cookie-done" onClick={closeDialog}>{t("Done", "完成")}</button></div>
      </div>
    </dialog>
  </footer>;
}
