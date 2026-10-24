import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  SEO_END,
  SEO_START,
  assertRouteList,
  getRoute,
  headTags,
  injectSeo,
  renderRobotsTxt,
  renderSitemap,
  routes,
} from '../src/seo/routes.js'
import { renderOgPng } from './og-image.js'

function htmlFileFor(dist, route) {
  if (route.path === '/') return path.join(dist, 'index.html')
  return path.join(dist, route.path.slice(1), 'index.html')
}

function precacheUrl(route) {
  return route.path === '/' ? 'index.html' : route.path.slice(1)
}

function decode(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}

function readTitle(html) {
  const match = html.match(/<title>([^<]*)<\/title>/)
  if (!match) throw new Error('missing <title>')
  return decode(match[1])
}

function readCanonical(html) {
  const match = html.match(/<link rel="canonical" href="([^"]+)"/)
  if (!match) throw new Error('missing canonical')
  return decode(match[1])
}

function readMeta(html, attribute, key) {
  const re = new RegExp(`<meta ${attribute}="${key}" content="([^"]*)"`)
  const match = html.match(re)
  if (!match) throw new Error(`missing meta ${attribute}="${key}"`)
  return decode(match[1])
}

function pngSize(buffer) {
  const signature = buffer.toString('ascii', 1, 4)
  if (signature !== 'PNG') throw new Error('file is not a PNG')
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function assertPage(html, route, template) {
  const head = headTags(route)
  const checks = [
    ['title', readTitle(html), head.title],
    ['description', readMeta(html, 'name', 'description'), head.description],
    ['canonical', readCanonical(html), head.canonical],
    ['robots', readMeta(html, 'name', 'robots'), head.robots],
    ['og:url', readMeta(html, 'property', 'og:url'), head.canonical],
    ['og:title', readMeta(html, 'property', 'og:title'), head.title],
    ['og:description', readMeta(html, 'property', 'og:description'), head.description],
    ['og:image', readMeta(html, 'property', 'og:image'), head.image],
    ['og:image:width', readMeta(html, 'property', 'og:image:width'), '1200'],
    ['og:image:height', readMeta(html, 'property', 'og:image:height'), '630'],
    ['og:image:alt', readMeta(html, 'property', 'og:image:alt'), head.imageAlt],
    ['twitter:card', readMeta(html, 'name', 'twitter:card'), 'summary_large_image'],
    ['twitter:title', readMeta(html, 'name', 'twitter:title'), head.title],
    ['twitter:description', readMeta(html, 'name', 'twitter:description'), head.description],
    ['twitter:image', readMeta(html, 'name', 'twitter:image'), head.image],
    ['twitter:url', readMeta(html, 'name', 'twitter:url'), head.canonical],
  ]
  for (const [label, actual, expected] of checks) {
    if (actual !== expected) {
      throw new Error(`${route.path} ${label} is "${actual}", expected "${expected}"`)
    }
  }
  if (!html.includes(head.jsonLd['@type'])) {
    throw new Error(`${route.path} JSON-LD is missing @type ${head.jsonLd['@type']}`)
  }
  if (!html.includes(SEO_START) || !html.includes(SEO_END)) {
    throw new Error(`${route.path} dropped the seo markers`)
  }
  if (template.includes('fonts.googleapis.com') && !html.includes('fonts.googleapis.com')) {
    throw new Error(`${route.path} dropped the font stylesheet`)
  }
  if (template.includes('registerSW') && !html.includes('registerSW')) {
    throw new Error(`${route.path} dropped PWA registration`)
  }
  if (template.includes('manifest.webmanifest') && !html.includes('manifest.webmanifest')) {
    throw new Error(`${route.path} dropped the web manifest link`)
  }
  if (!html.includes('<div id="root">') || !html.includes('<script type="module"')) {
    throw new Error(`${route.path} is missing the SPA mount or its script`)
  }
}

function assertBuiltFiles(dist, template) {
  const titles = new Set()
  const descriptions = new Set()
  const canonicals = new Set()
  for (const route of routes) {
    if (route.prerender === false) continue
    const file = htmlFileFor(dist, route)
    if (!fs.existsSync(file)) throw new Error(`missing prerendered HTML for ${route.path}`)
    const html = fs.readFileSync(file, 'utf8')
    assertPage(html, route, template)
    titles.add(readTitle(html))
    descriptions.add(readMeta(html, 'name', 'description'))
    canonicals.add(readCanonical(html))

    const imageFile = path.join(dist, 'og', `${route.slug}.png`)
    if (!fs.existsSync(imageFile)) throw new Error(`missing OG image for ${route.path}`)
    const size = pngSize(fs.readFileSync(imageFile))
    if (size.width !== 1200 || size.height !== 630) {
      throw new Error(`OG image for ${route.path} is ${size.width}x${size.height}`)
    }
  }
  const rendered = routes.filter((route) => route.prerender !== false)
  if (titles.size !== rendered.length || descriptions.size !== rendered.length || canonicals.size !== rendered.length) {
    throw new Error('prerendered routes do not have unique titles, descriptions, and canonicals')
  }

  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
  const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8')
  if (!robots.includes('Sitemap: https://openutils.tech/sitemap.xml')) {
    throw new Error('robots.txt is missing the sitemap URL')
  }
  if (!robots.includes('Allow: /')) throw new Error('robots.txt does not allow crawling')
  for (const route of routes) {
    const loc = `<loc>${headTags(route).canonical}</loc>`
    const listed = sitemap.includes(loc)
    if (route.sitemap === false && listed) throw new Error(`${route.path} should not be in the sitemap`)
    if (route.sitemap !== false && route.prerender !== false && !listed) {
      throw new Error(`${route.path} is missing from sitemap.xml`)
    }
  }
}

function assertServiceWorker(dist) {
  const swPath = path.join(dist, 'sw.js')
  if (!fs.existsSync(swPath)) throw new Error('PWA service worker was not generated')
  const sw = fs.readFileSync(swPath, 'utf8')
  if (sw.includes('/og/') || sw.includes('"og/')) {
    throw new Error('service worker precaches Open Graph images')
  }
  for (const route of routes) {
    if (route.prerender === false) continue
    const url = precacheUrl(route)
    const revision = createHash('md5').update(fs.readFileSync(htmlFileFor(dist, route))).digest('hex')
    const patterns = [
      new RegExp(`url\\s*:\\s*"${url}"\\s*,\\s*revision\\s*:\\s*"${revision}"`),
      new RegExp(`revision\\s*:\\s*"${revision}"\\s*,\\s*url\\s*:\\s*"${url}"`),
    ]
    if (!patterns.some((pattern) => pattern.test(sw))) {
      throw new Error(`service worker is missing precache ${url} (${revision})`)
    }
  }
}

export function seoPrerenderPlugin() {
  assertRouteList()
  let command = 'serve'
  let distDir = ''

  return {
    name: 'openutils-seo-prerender',
    configResolved(config) {
      command = config.command
      distDir = path.resolve(config.root, config.build.outDir)
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return injectSeo(html, getRoute('/'))
      },
    },
    async writeBundle(options) {
      const dist = options.dir ? path.resolve(options.dir) : distDir
      const templatePath = path.join(dist, 'index.html')
      const template = fs.readFileSync(templatePath, 'utf8')
      if (!template.includes(SEO_START)) {
        throw new Error('built index.html is missing seo markers')
      }

      for (const route of routes) {
        if (route.prerender === false) continue
        const file = htmlFileFor(dist, route)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, injectSeo(template, route))

        const imageFile = path.join(dist, 'og', `${route.slug}.png`)
        fs.mkdirSync(path.dirname(imageFile), { recursive: true })
        fs.writeFileSync(imageFile, renderOgPng(route, routes))
      }

      fs.writeFileSync(path.join(dist, 'sitemap.xml'), renderSitemap(routes))
      fs.writeFileSync(path.join(dist, 'robots.txt'), renderRobotsTxt())
      assertBuiltFiles(dist, template)
    },
    closeBundle: {
      sequential: true,
      order: 'post',
      async handler(error) {
        if (error || command !== 'build') return
        assertServiceWorker(distDir)
      },
    },
  }
}
