import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const SITE_URL = "https://devlink.co.ke";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function setOrCreateMeta(attrName: string, attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOrCreateLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Per-page SEO hook — updates <title>, meta description, canonical,
 * Open Graph, and Twitter Card tags on every route change.
 * Google does execute JS, so this is fully indexed.
 */
export function useSEO({ title, description, canonical, ogImage, noIndex = false }: SEOOptions) {
  useEffect(() => {
    const fullTitle = /devlink/i.test(title) ? title : `${title} | Devlink`;
    document.title = fullTitle;

    const url = canonical ?? `${SITE_URL}${window.location.pathname}`;
    const image = ogImage ?? DEFAULT_OG_IMAGE;

    // Primary
    setOrCreateMeta("name", "description", description);
    setOrCreateMeta("name", "robots",
      noIndex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
    );
    setOrCreateLink("canonical", url);

    // Open Graph
    setOrCreateMeta("property", "og:title", fullTitle);
    setOrCreateMeta("property", "og:description", description);
    setOrCreateMeta("property", "og:url", url);
    setOrCreateMeta("property", "og:image", image);

    // Twitter / X
    setOrCreateMeta("name", "twitter:title", fullTitle);
    setOrCreateMeta("name", "twitter:description", description);
    setOrCreateMeta("name", "twitter:image", image);
  }, [title, description, canonical, ogImage, noIndex]);
}
