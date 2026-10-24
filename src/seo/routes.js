/**
 * Public routes for OpenUtils.
 *
 * This list drives prerendered HTML, sitemap.xml, robots.txt, Open Graph
 * images, and the document head. To add a page:
 *   1. Append an object here. Set `sitemap: false` to omit it from sitemap.xml,
 *      and set `robots` (for example "noindex, nofollow") when it should not
 *      be indexed.
 *   2. Map its React component in the PAGES table in src/App.jsx.
 * The build then emits that route's HTML shell, social image, and sitemap entry.
 */

export const SITE_ORIGIN = 'https://openutils.tech'
export const SITE_NAME = 'OpenUtils'

export const routes = [
  {
    path: '/',
    slug: 'home',
    name: 'OpenUtils',
    chip: 'Tools',
    title: 'OpenUtils — Free Online Developer Tools',
    description:
      'Free browser tools for developers: text diff checker, JSON validator, YAML formatter, code cleaner, and time zone converter. No uploads and no accounts.',
    keywords:
      'openutils, online developer tools, text compare, diff checker, json validator, yaml validator, code cleaner, time zone converter, client-side',
    imageTagline: 'Diff, JSON, YAML, code, and time zones — private by design.',
    eyebrow: 'For developers',
    accent: '#818cf8',
    changefreq: 'weekly',
    priority: '1.0',
    features: [
      'Text diff checker',
      'JSON validator and formatter',
      'YAML validator and formatter',
      'Code cleaner',
      'Time zone converter',
      'Runs in the browser with no uploads',
    ],
  },
  {
    path: '/text-compare',
    slug: 'text-compare',
    name: 'Text Compare',
    chip: 'Diff',
    title: 'Text Compare — Free Online Diff Checker',
    description:
      'Compare two texts and highlight word-level differences instantly. Split view, inline view, and live mode. A free diff checker that never uploads your text.',
    keywords:
      'text compare, diff checker, text diff, compare two texts, word diff, online diff tool, side by side compare, text comparison',
    imageTagline: 'Word-level diff with split view, inline view, and live mode.',
    eyebrow: 'Diff checker',
    accent: '#818cf8',
    highlights: ['Word diff', 'Split view', 'Live mode', 'Offline'],
    changefreq: 'monthly',
    priority: '0.9',
    features: [
      'Side-by-side and inline diff',
      'Word-level change highlighting',
      'Live comparison mode',
      'File import and diff export',
      'Works offline in the browser',
    ],
  },
  {
    path: '/json-validator',
    slug: 'json-validator',
    name: 'JSON Validator',
    chip: 'JSON',
    title: 'JSON Validator — Free Online JSON Formatter',
    description:
      'Validate JSON, see the exact parse error, then format, minify, or sort keys. Free online JSON formatter and linter that runs only in your browser.',
    keywords:
      'json validator, json formatter, json linter, json beautifier, validate json, minify json, format json online, sort json keys',
    imageTagline: 'Validate, format, minify, and sort JSON in the browser.',
    eyebrow: 'JSON validator',
    accent: '#fbbf24',
    highlights: ['Validate', 'Format', 'Minify', 'Sort keys'],
    changefreq: 'monthly',
    priority: '0.8',
    features: [
      'Validate JSON with parse error location',
      'Format and minify',
      'Sort object keys',
      'Export to YAML, XML, and CSV',
      'Works offline in the browser',
    ],
  },
  {
    path: '/yaml-validator',
    slug: 'yaml-validator',
    name: 'YAML Validator',
    chip: 'YAML',
    title: 'YAML Validator — Free Online YAML Formatter',
    description:
      'Validate YAML with line and column errors, then format, minify, or sort keys. Free online YAML formatter and linter that never uploads your file.',
    keywords:
      'yaml validator, yaml formatter, yaml linter, validate yaml, format yaml online, yaml to json, minify yaml',
    imageTagline: 'Validate, format, and export YAML without uploading it.',
    eyebrow: 'YAML validator',
    accent: '#34d399',
    highlights: ['Validate', 'Format', 'Sort keys', 'Export'],
    changefreq: 'monthly',
    priority: '0.8',
    features: [
      'Validate YAML with line and column errors',
      'Format and minify',
      'Sort keys',
      'Export to JSON, XML, and CSV',
      'Works offline in the browser',
    ],
  },
  {
    path: '/code-cleaner',
    slug: 'code-cleaner',
    name: 'Code Cleaner',
    chip: 'Code',
    title: 'Code Cleaner — Strip Comments and Tidy Code Online',
    description:
      'Strip comments, blank lines, and trailing whitespace, and normalize indentation. Free online code cleaner for 20+ languages, entirely in your browser.',
    keywords:
      'code cleaner, remove comments from code, strip comments, delete comments online, trailing whitespace, normalize indentation',
    imageTagline: 'Strip comments and tidy source across 20+ languages.',
    eyebrow: 'Code cleaner',
    accent: '#c4b5fd',
    highlights: ['Strip comments', 'Trim space', 'Reindent', '20+ languages'],
    changefreq: 'monthly',
    priority: '0.8',
    features: [
      'Strip comments without touching strings',
      'Remove blank lines and trailing whitespace',
      'Normalize indentation',
      'Supports 20+ languages',
      'Works offline in the browser',
    ],
  },
  {
    path: '/time-converter',
    slug: 'time-converter',
    name: 'Time Zone Converter',
    navLabel: 'Time Converter',
    chip: 'Time',
    title: 'Time Zone Converter — Convert Times Across Timezones',
    description:
      'Convert a date and time across time zones instantly. 12- and 24-hour clocks, day-offset indicators, and cities worldwide. Free, and it stays in your browser.',
    keywords:
      'time zone converter, timezone converter, convert time zones, world clock, utc converter, time difference calculator',
    imageTagline: 'Convert a moment across cities, in 12- or 24-hour time.',
    eyebrow: 'Time zone converter',
    accent: '#38bdf8',
    highlights: ['Any timezone', '12/24-hour', 'Day offset', 'Offline'],
    changefreq: 'monthly',
    priority: '0.8',
    applicationCategory: 'UtilitiesApplication',
    features: [
      'Convert across IANA time zones',
      '12-hour and 24-hour clocks',
      'Day-offset indicators',
      'Cities worldwide plus full timezone search',
      'Works offline in the browser',
    ],
  },
  {
    path: '/verify',
    slug: 'verify',
    name: 'Verify it yourself',
    chip: 'Verify',
    title: 'Verify it yourself — OpenUtils privacy check',
    description:
      'Confirm OpenUtils never sends your text anywhere. Open the network log, read the Content-Security-Policy header, and use a tool while offline.',
    keywords:
      'verify openutils, content security policy, client-side tools, no data collection, offline pwa, privacy',
    imageTagline: 'Open the network log and see that nothing leaves your browser.',
    eyebrow: 'Privacy',
    accent: '#818cf8',
    highlights: ['Network tab', 'CSP header', 'Offline', 'No uploads'],
    changefreq: 'monthly',
    priority: '0.6',
    features: [
      'See every request stay on this site',
      'Read the Content-Security-Policy header',
      'Use the tools with the network off',
      'No account and no upload',
    ],
  },
]

export function normalizePath(pathname) {
  if (!pathname) return '/'
  const path = String(pathname).split('?')[0].split('#')[0]
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path || '/'
}

export function absoluteUrl(pathname) {
  const path = normalizePath(pathname)
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`
}

export function ogImagePath(route) {
  return `/og/${route.slug}.png`
}

export function getRoute(pathname) {
  const path = normalizePath(pathname)
  return routes.find((route) => route.path === path) ?? null
}

export function headTags(route) {
  const url = absoluteUrl(route.path)
  const image = absoluteUrl(ogImagePath(route))
  const imageAlt = `${route.name} — ${route.imageTagline}`
  return {
    title: route.title,
    description: route.description,
    keywords: route.keywords,
    robots: route.robots ?? 'index, follow',
    canonical: url,
    siteName: SITE_NAME,
    image,
    imageAlt,
    imageWidth: '1200',
    imageHeight: '630',
    jsonLd: buildJsonLd(route),
  }
}

function buildJsonLd(route) {
  if (route.path === '/') {
    const items = routes.filter((entry) => entry.path !== '/' && entry.sitemap !== false)
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: route.description,
      inLanguage: 'en',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: items.map((entry, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: entry.name,
          url: absoluteUrl(entry.path),
        })),
      },
    }
  }

  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: route.name,
    url: absoluteUrl(route.path),
    description: route.description,
    applicationCategory: route.applicationCategory ?? 'DeveloperApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled',
    inLanguage: 'en',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
  }
  if (route.features?.length) data.featureList = route.features
  return data
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export const SEO_START = '<!-- seo:start -->'
export const SEO_END = '<!-- seo:end -->'

export function renderSeoBlock(route) {
  const head = headTags(route)
  const json = JSON.stringify(head.jsonLd, null, 2).replace(/</g, '\\u003c')
  const meta = [
    ['name', 'description', head.description],
    ['name', 'keywords', head.keywords],
    ['name', 'author', SITE_NAME],
    ['name', 'robots', head.robots],
    ['property', 'og:type', 'website'],
    ['property', 'og:url', head.canonical],
    ['property', 'og:site_name', head.siteName],
    ['property', 'og:title', head.title],
    ['property', 'og:description', head.description],
    ['property', 'og:image', head.image],
    ['property', 'og:image:type', 'image/png'],
    ['property', 'og:image:width', head.imageWidth],
    ['property', 'og:image:height', head.imageHeight],
    ['property', 'og:image:alt', head.imageAlt],
    ['property', 'og:locale', 'en_US'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:url', head.canonical],
    ['name', 'twitter:title', head.title],
    ['name', 'twitter:description', head.description],
    ['name', 'twitter:image', head.image],
    ['name', 'twitter:image:alt', head.imageAlt],
  ]
  const tags = meta
    .map(([attribute, key, content]) => `    <meta ${attribute}="${key}" content="${escapeHtml(content)}" />`)
    .join('\n')
  return [
    `    <title>${escapeHtml(head.title)}</title>`,
    tags,
    `    <link rel="canonical" href="${escapeHtml(head.canonical)}" />`,
    '    <script type="application/ld+json">',
    json,
    '    </script>',
  ].join('\n')
}

export function injectSeo(html, route = getRoute('/')) {
  const start = html.indexOf(SEO_START)
  const end = html.indexOf(SEO_END)
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `index.html is missing ${SEO_START} / ${SEO_END} markers. Keep them around the per-route head tags.`,
    )
  }
  return `${html.slice(0, start + SEO_START.length)}\n${renderSeoBlock(route)}\n    ${html.slice(end)}`
}

export function renderSitemap(entries = routes, lastmod = new Date().toISOString().slice(0, 10)) {
  const urls = entries
    .filter((route) => route.sitemap !== false && route.prerender !== false)
    .map((route) => {
      const loc = escapeHtml(absoluteUrl(route.path))
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${route.changefreq ?? 'monthly'}</changefreq>`,
        `    <priority>${route.priority ?? '0.5'}</priority>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function renderRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
}

export function assertRouteList(entries = routes) {
  const seen = {
    path: new Set(),
    slug: new Set(),
    title: new Set(),
    description: new Set(),
  }
  if (!entries.some((route) => route.path === '/')) {
    throw new Error('routes must include the homepage path "/"')
  }
  for (const route of entries) {
    if (!route.path?.startsWith('/') || (route.path.length > 1 && route.path.endsWith('/'))) {
      throw new Error(`Route path must start with / and omit a trailing slash: ${route.path}`)
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route.slug ?? '')) {
      throw new Error(`Route slug must be lowercase kebab-case: ${route.slug}`)
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(route.accent ?? '')) {
      throw new Error(`Route ${route.path} needs a #rrggbb accent`)
    }
    for (const field of ['name', 'title', 'description', 'keywords', 'imageTagline', 'eyebrow', 'chip']) {
      if (!route[field] || !String(route[field]).trim()) {
        throw new Error(`Route ${route.path} is missing ${field}`)
      }
    }
    if (route.title.length > 70) {
      throw new Error(`Title for ${route.path} is ${route.title.length} characters (max 70)`)
    }
    if (route.description.length < 80 || route.description.length > 170) {
      throw new Error(
        `Description for ${route.path} is ${route.description.length} characters (expected 80–170)`,
      )
    }
    if (route.imageTagline.length > 78) {
      throw new Error(`imageTagline for ${route.path} is too long for the social image`)
    }
    for (const key of Object.keys(seen)) {
      if (seen[key].has(route[key])) throw new Error(`Duplicate ${key}: ${route[key]}`)
      seen[key].add(route[key])
    }
    const head = headTags(route)
    if (head.canonical !== absoluteUrl(route.path)) {
      throw new Error(`Canonical mismatch for ${route.path}`)
    }
  }
}
