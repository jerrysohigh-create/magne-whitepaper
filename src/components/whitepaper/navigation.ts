import chapterIndex from "@/content/whitepaper/search.json";

export function orderChapters<T extends { route: string }>(documents: readonly T[]): T[] {
  const ordered = [...documents];
  const overview = ordered.findIndex(item => item.route === "/learning/what-is-magne");
  const dapp = ordered.findIndex(item => item.route === "/learning/magne-dapp");
  if (overview > dapp && dapp >= 0) {
    const [entry] = ordered.splice(overview, 1);
    ordered.splice(dapp, 0, entry);
  }
  return ordered;
}

export const chapters = [
  { title: "Overview", href: "/learning/what-is-magne", description: "Purpose, scope and key elements of the MAGNE.AI ecosystem." },
  { title: "Network Architecture", href: "/networks/l1", description: "System design, core components and network operation." },
  { title: "MHA Tokenomics", href: "/learning/tokenomics", description: "Allocation, release rules and post-TGE execution disclosures." },
  { title: "Governance", href: "/learning/governance", description: "Governance structure, participants and processes." },
  { title: "Developer Guides", href: "/developers/tools", description: "Technical resources, integration guides and references." },
];
export const primaryGroups = [
  { title: "Start here", links: [{ title: "Overview", href: "/" }] },
  { title: "The ecosystem", links: chapters.slice(1, 4) },
  { title: "Resources", links: [chapters[4], { title: "Revision disclosures", href: "/learning/tokenomics-changelog" }] },
];
export const categoryLabels: Record<string, string> = { learning: "Learning & economics", networks: "Networks", solutions: "Architecture & solutions", developers: "Developer guides", help: "Help & reference", community: "Community" };

// One route-based numbering scheme for both languages and every document surface.
export const chapterDirectory = Object.keys(categoryLabels).flatMap((category, groupIndex) =>
  orderChapters(chapterIndex)
    .filter(document => document.route.startsWith(`/${category}/`))
    .map((document, index) => ({ route: document.route, number: `${groupIndex + 1}.${index + 1}` }))
);

export function chapterNumber(route: string): string {
  return chapterDirectory.find(document => document.route === route)?.number ?? "";
}

export function orderDocumentChapters<T extends { route: string }>(documents: readonly T[]): T[] {
  return chapterDirectory.flatMap(entry => {
    const document = documents.find(item => item.route === entry.route);
    return document ? [document] : [];
  });
}
