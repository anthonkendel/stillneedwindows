/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

/** Indexable pages. Personal result pages (/u/…) are deliberately left out. */
const PUBLIC_PAGES = ['/', '/how-it-works', '/privacy']

/**
 * Fills __SITE_URL__ in index.html and writes robots.txt and sitemap.xml,
 * so the domain is configured in one place (VITE_SITE_URL).
 */
function seo(siteUrl: string): Plugin {
  return {
    name: 'snw-seo',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        // /u/ pages are not blocked here on purpose: crawlers must be able to fetch them
        // to see their noindex header (vercel.json). Blocking would hide the noindex.
        source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
      const urls = PUBLIC_PAGES.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || 'https://stillneedwindows.com').replace(/\/$/, '')

  return {
    plugins: [vue(), tailwindcss(), seo(siteUrl)],
    build: {
      // Never inline fonts as data: URLs. The CSP only allows fonts from our own origin.
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    },
    server: {
      // In dev the Hono API runs separately (server/dev.ts) on port 8787.
      proxy: { '/api': 'http://localhost:8787' },
    },
    test: {
      include: ['shared/**/*.test.ts', 'server/**/*.test.ts', 'src/**/*.test.ts'],
    },
  }
})
