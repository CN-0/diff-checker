// script-src is 'self' with no hash and no 'unsafe-inline'.
// JSON-LD is data (type application/ld+json), so each prerendered page can
// carry its own block. An executable inline script, or a Google Fonts host,
// fails the build.

const GOOGLE_FONTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/i

export function assertCspSafeHtml(html, label = 'HTML') {
  if (GOOGLE_FONTS.test(html)) {
    throw new Error(
      `${label} references Google Fonts (fonts.googleapis.com or fonts.gstatic.com). Self-host the font instead.`,
    )
  }
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)
  for (const match of scripts) {
    const attrs = match[1]
    if (!match[2].trim()) continue
    const type = /type\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase()
    if (type === 'application/ld+json' || type === 'application/json') continue
    throw new Error(
      `${label} has an executable inline script (type ${type || 'classic'}). script-src is 'self'. Use an external file, or type="application/ld+json" for data.`,
    )
  }
}
