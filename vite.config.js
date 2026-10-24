import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const vercelConfig = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'))

// Full SHA when Vercel (or git) provides one, so the footer can link to the exact commit.
// The footer renders the first 7 characters. "dev" means neither source was available.
function resolveGitCommit() {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA?.trim()
  if (fromVercel) return fromVercel
  try {
    const sha = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (sha) return sha
  } catch {
    // git is not available (some CI images omit the .git directory)
  }
  return 'dev'
}

function headersFromVercel() {
  const headers = {}
  for (const group of vercelConfig.headers ?? []) {
    for (const header of group.headers ?? []) {
      headers[header.key] = header.value
    }
  }
  return headers
}

// script-src is 'self' with no hash and no 'unsafe-inline'. JSON-LD blocks are data
// (type application/ld+json), so each prerendered page can carry its own block.
// An executable inline script would be blocked in the browser and fails the build.
function assertNoExecutableInlineScripts() {
  return {
    name: 'assert-no-executable-inline-scripts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)
        for (const match of scripts) {
          const attrs = match[1]
          if (!match[2].trim()) continue
          const type = /type\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase()
          if (type === 'application/ld+json' || type === 'application/json') continue
          throw new Error(
            `Executable inline script (type ${type || 'classic'}) is not allowed under script-src 'self'. Use an external file, or type="application/ld+json" for data.`
          )
        }
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __GIT_COMMIT__: JSON.stringify(resolveGitCommit()),
  },
  plugins: [
    react(),
    assertNoExecutableInlineScripts(),
    VitePWA({
      registerType: 'autoUpdate',
      // External registerSW.js. The default "auto" mode already does this unless the
      // app imports virtual:pwa-register; pin it so an inline registration script
      // cannot appear and break script-src.
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Text Compare',
        short_name: 'TextDiff',
        description: 'Compare two texts and highlight differences instantly. 100% offline — no data leaves your browser.',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        // injectRegister is not "auto", so the plugin would otherwise skip these.
        // They let an update take over the open tab and make offline work on the next load.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  preview: {
    headers: headersFromVercel(),
  },
})
