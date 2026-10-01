import type { Metadata } from "next";
import "../source.css";
import "../document-fonts.css";
import "../clone.css";
import "../documents.css";
import "../whitepaper.css";
export const metadata: Metadata = {
  title: "MAGNE.AI Whitepaper | v1.1 Review Draft",
  description: "Network architecture, token economics and implementation disclosures. MAGNE.AI Whitepaper v1.1 review draft, with the original v1.0 archive.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

