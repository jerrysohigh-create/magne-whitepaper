"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { withBasePath, withoutBasePath } from "@/lib/site-path";
export function ArchiveFrame({children}: {children: ReactNode}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rewrite = () => root.current?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
      const href = withoutBasePath(a.getAttribute('href') || '');
      if (/^\/(learning|developers|solutions|networks|help|community)(\/|$)/.test(href)) a.setAttribute('href', withBasePath('/v1.0'+href));
    });
    rewrite();
    const observer = new MutationObserver(rewrite);
    if(root.current) observer.observe(root.current,{subtree:true,childList:true});
    return () => observer.disconnect();
  },[]);
  return <div ref={root}>{children}</div>;
}
