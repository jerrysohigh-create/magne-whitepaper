const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Native links and public assets need the prefix; next/link adds it itself. */
export function withBasePath(url: string): string {
  if (!basePath || !url.startsWith("/") || url.startsWith("//") ||
      url === basePath || url.startsWith(basePath + "/")) return url;
  return basePath + url;
}

export function withoutBasePath(url: string): string {
  return basePath && (url === basePath || url.startsWith(basePath + "/"))
    ? url.slice(basePath.length) || "/" : url;
}

/** Rebase rendered document links without altering the preserved source text. */
export function withDocumentBasePath(html: string): string {
  return html.replace(/\b(href|src|poster)=(['"])(\/(?!\/)[^'"<>]*)\2/g,
    (_, attr, quote, url) => `${attr}=${quote}${withBasePath(url)}${quote}`);
}
