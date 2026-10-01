import { chapterNumber } from "./navigation";

// Remove old heading ordinals, leaving dates, amounts and business identifiers intact.
function withoutOrdinal(title: string): string {
  return title.replace(/^\s*\d{1,2}[.)）．]\s*/, "");
}

export function numberDocument<T extends { id: string; title: string }>(html: string, route: string, toc: readonly T[]) {
  const chapter = chapterNumber(route);
  if (!chapter) return { html, toc: [...toc] };
  const numbers = new Map<string, string>();
  let section = 0;
  const numberedHtml = html.replace(/<h([12])\b([^>]*)>([\s\S]*?)<\/h\1>/g, (_match, level: string, attributes: string, title: string) => {
    const number = level === "1" ? chapter : `${chapter}.${++section}`;
    const id = /\bid="([^"]+)"/.exec(attributes)?.[1];
    if (id) numbers.set(id, number);
    return `<h${level}${attributes}><span class="wp-heading-number">${number}</span> ${withoutOrdinal(title)}</h${level}>`;
  });

  // Keep in-article navigation aligned without changing prose links or anchor IDs.
  const withNavigation = numberedHtml.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/g, nav =>
    nav.replace(/(<a\b[^>]*href="#([^"]+)"[^>]*>)([\s\S]*?)(<\/a>)/g, (match, open: string, id: string, title: string, close: string) => {
      const number = numbers.get(id);
      return number ? `${open}${number} ${withoutOrdinal(title)}${close}` : match;
    })
  );
  return {
    html: withNavigation,
    toc: toc.map(item => {
      const number = numbers.get(item.id);
      return number ? { ...item, title: `${number} ${withoutOrdinal(item.title)}` } : item;
    }),
  };
}
