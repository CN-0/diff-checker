import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { routes } from '../src/seo/routes.js'

const fontsDir = fileURLToPath(new URL('./fonts/', import.meta.url))
const regularFont = new URL('./fonts/Inter-Regular.ttf', import.meta.url)
const semiboldFont = new URL('./fonts/Inter-SemiBold.ttf', import.meta.url)

const FONT_FILES = [fileURLToPath(regularFont), fileURLToPath(semiboldFont)]

function xml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function headlineSize(text) {
  if (text.length > 28) return 56
  if (text.length > 22) return 64
  return 72
}

function chipsFor(route, allRoutes) {
  if (route.path === '/') {
    return allRoutes
      .filter((entry) => entry.path !== '/' && entry.sitemap !== false)
      .map((entry) => ({ label: entry.chip, accent: entry.accent }))
  }
  return (route.highlights ?? []).map((label) => ({ label, accent: route.accent }))
}

function pillWidth(label) {
  return Math.ceil(label.length * 13.2 + 36)
}

function renderPills(chips, y) {
  let x = 64
  const parts = []
  for (const chip of chips) {
    const width = pillWidth(chip.label)
    if (x + width > 1136) break
    parts.push(
      `<rect x="${x}" y="${y}" width="${width}" height="44" rx="22" fill="#12182b" stroke="${chip.accent}" stroke-width="2"/>`,
      `<text x="${x + width / 2}" y="${y + 29}" text-anchor="middle" fill="${chip.accent}" font-family="'Inter SemiBold'" font-size="20">${xml(chip.label)}</text>`,
    )
    x += width + 14
  }
  return parts.join('\n')
}

export function renderOgSvg(route, allRoutes = routes) {
  const headline = route.path === '/' ? 'Free online developer tools' : route.name
  const size = headlineSize(headline)
  const pills = renderPills(chipsFor(route, allRoutes), 430)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0b1020"/>
  <circle cx="1080" cy="90" r="340" fill="${route.accent}" opacity="0.20"/>
  <circle cx="1010" cy="560" r="200" fill="${route.accent}" opacity="0.12"/>
  <rect width="10" height="630" fill="${route.accent}"/>
  <g transform="translate(64 52) scale(0.68)">
    <rect width="100" height="100" rx="22" fill="#4f46e5"/>
    <path d="M31 28L12 50L31 72" stroke="#ffffff" stroke-width="8.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M69 28L88 50L69 72" stroke="#ffffff" stroke-width="8.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="61" y1="20" x2="39" y2="80" stroke="#ffffff" stroke-width="8.5" stroke-linecap="round"/>
  </g>
  <text x="152" y="96" fill="#f8fafc" font-family="'Inter SemiBold'" font-size="32">OpenUtils</text>
  <text x="1136" y="96" text-anchor="end" fill="#94a3b8" font-family="Inter" font-size="22">openutils.tech</text>
  <text x="64" y="210" fill="${route.accent}" font-family="'Inter SemiBold'" font-size="18" letter-spacing="2.4">${xml(route.eyebrow.toUpperCase())}</text>
  <text x="64" y="300" fill="#f8fafc" font-family="'Inter SemiBold'" font-size="${size}">${xml(headline)}</text>
  <text x="64" y="368" fill="#cbd5e1" font-family="Inter" font-size="28">${xml(route.imageTagline)}</text>
  ${pills}
  <rect y="548" width="1200" height="82" fill="#070b16"/>
  <circle cx="80" cy="589" r="6" fill="#34d399"/>
  <text x="98" y="596" fill="#e2e8f0" font-family="Inter" font-size="22">100% client-side</text>
  <text x="1136" y="596" text-anchor="end" fill="#94a3b8" font-family="Inter" font-size="22">No data leaves your browser</text>
</svg>`
}

export function renderOgPng(route, allRoutes = routes) {
  for (const file of FONT_FILES) {
    try {
      readFileSync(file)
    } catch {
      throw new Error(`OG image font is missing: ${file}`)
    }
  }
  const svg = renderOgSvg(route, allRoutes)
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'original' },
    font: {
      fontFiles: FONT_FILES,
      fontDirs: [fontsDir],
      loadSystemFonts: false,
      defaultFontFamily: 'Inter',
      sansSerifFamily: 'Inter',
    },
    textRendering: 1,
    shapeRendering: 2,
  })
  const rendered = resvg.render()
  if (rendered.width !== 1200 || rendered.height !== 630) {
    throw new Error(`OG image for ${route.path} rendered at ${rendered.width}x${rendered.height}, expected 1200x630`)
  }
  return rendered.asPng()
}
