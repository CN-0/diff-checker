import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { assertCspSafeHtml } from './scripts/csp-html.js'
import { seoPrerenderPlugin } from './scripts/seo-plugin.js'

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

function htmlFilesIn(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) htmlFilesIn(full, found)
    else if (entry.name.endsWith('.html')) found.push(full)
  }
  return found
}

// Runs on the built template and again on every prerendered route shell.
// Per-route HTML is written in a later plugin's writeBundle, so the second
// pass waits until closeBundle, after those files exist.
function assertNoExecutableInlineScripts() {
  let outDir = ''
  return {
    name: 'assert-no-executable-inline-scripts',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir)
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        assertCspSafeHtml(html, 'index.html')
      },
    },
    closeBundle: {
      sequential: true,
      order: 'post',
      handler(error) {
        if (error) return
        const files = htmlFilesIn(outDir)
        if (files.length === 0) {
          throw new Error(`No built HTML shells in ${outDir}`)
        }
        for (const file of files) {
          assertCspSafeHtml(readFileSync(file, 'utf8'), file)
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
    seoPrerenderPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      // External registerSW.js. The default "auto" mode already does this unless the
      // app imports virtual:pwa-register; pin it so an inline registration script
      // cannot appear and break script-src.
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'OpenUtils',
        short_name: 'OpenUtils',
        description: 'Free online developer tools that run entirely in your browser. No data leaves your device.',
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
        globIgnores: ['**/node_modules/**/*', 'og/**', '**/og/**'],
        navigateFallback: 'index.html',
        // injectRegister is not "auto", so the plugin would otherwise skip these.
        // They let an update take over the open tab and make offline work on the next load.
        skipWaiting: true,
        clientsClaim: true,
        // Serve each prerendered route from its own HTML, including offline.
        manifestTransforms: [
          (entries) => ({
            manifest: entries.map((entry) => {
              const suffix = '/index.html'
              if (entry.url.endsWith(suffix)) {
                return { ...entry, url: entry.url.slice(0, -suffix.length) }
              }
              return entry
            }),
          }),
        ],
      },
    }),
  ],
  preview: {
    headers: headersFromVercel(),
  },
})
