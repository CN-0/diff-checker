import { createHash } from 'node:crypto'
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

// The JSON-LD block in index.html is the only inline script. Its hash is pinned in
// vercel.json so script-src can stay strict. Fail the build if the two drift.
function assertJsonLdCspHash() {
  const csp = vercelConfig.headers
    ?.flatMap((group) => group.headers ?? [])
    .find((header) => header.key === 'Content-Security-Policy')
    ?.value

  return {
    name: 'assert-jsonld-csp-hash',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
        if (!match) {
          throw new Error('index.html is missing the JSON-LD script the CSP hash allowlists.')
        }
        const hash = createHash('sha256').update(match[1]).digest('base64')
        const token = `'sha256-${hash}'`
        if (!csp?.includes(token)) {
          throw new Error(
            `JSON-LD CSP hash is ${token} but vercel.json Content-Security-Policy does not include it.`
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
    assertJsonLdCspHash(),
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
