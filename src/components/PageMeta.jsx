import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRoute, headTags } from '../seo/routes';

function upsertMeta(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function applyHead(route) {
  const head = headTags(route);
  document.title = head.title;
  upsertMeta('name', 'description', head.description);
  upsertMeta('name', 'keywords', head.keywords);
  upsertMeta('name', 'author', head.siteName);
  upsertMeta('name', 'robots', head.robots);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:url', head.canonical);
  upsertMeta('property', 'og:site_name', head.siteName);
  upsertMeta('property', 'og:title', head.title);
  upsertMeta('property', 'og:description', head.description);
  upsertMeta('property', 'og:image', head.image);
  upsertMeta('property', 'og:image:type', 'image/png');
  upsertMeta('property', 'og:image:width', head.imageWidth);
  upsertMeta('property', 'og:image:height', head.imageHeight);
  upsertMeta('property', 'og:image:alt', head.imageAlt);
  upsertMeta('property', 'og:locale', 'en_US');
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:url', head.canonical);
  upsertMeta('name', 'twitter:title', head.title);
  upsertMeta('name', 'twitter:description', head.description);
  upsertMeta('name', 'twitter:image', head.image);
  upsertMeta('name', 'twitter:image:alt', head.imageAlt);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = head.canonical;

  let jsonLd = document.head.querySelector('script[type="application/ld+json"]');
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    document.head.appendChild(jsonLd);
  }
  jsonLd.textContent = JSON.stringify(head.jsonLd);
}

export default function PageMeta() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const route = getRoute(pathname);
    if (route) applyHead(route);
  }, [pathname]);

  return null;
}
