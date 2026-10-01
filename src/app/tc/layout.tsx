import { withBasePath } from "@/lib/site-path";
import type { Metadata } from "next";
import "../source.css";
import "../document-fonts.css";
import "../clone.css";
import "../documents.css";
import "../whitepaper-figures.css";
import "../tokenomics-reader.css";
import "../whitepaper.css";
export const metadata: Metadata = {
  title: "MAGNE.AI 白皮書 | v1.1 審核稿",
  description: "網絡架構、代幣經濟與執行披露。MAGNE.AI 白皮書 v1.1 繁體中文版，附 v1.0 原版歸檔入口。",
  robots: {index:false,follow:false},
  alternates: {languages:{en:withBasePath("/"),"zh-Hant":withBasePath("/tc/")}},
};
export default function ChineseLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-Hant"><body className="antialiased">{children}</body></html>;
}
