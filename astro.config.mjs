import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import parityIntegration from './src/i18n/parity-integration'
import interactionIntegration from './src/scripts/interaction-integration'
import { THEME_INIT_SCRIPT_HASH } from './src/scripts/theme-init'

export default defineConfig({
  site: 'https://andryore.dev',
  trailingSlash: 'always',
  prefetch: false,
  integrations: [react(), interactionIntegration(), parityIntegration()],
  security: {
    csp: { scriptDirective: { hashes: [THEME_INIT_SCRIPT_HASH] } },
  },
  markdown: { syntaxHighlight: false },
  build: { inlineStylesheets: 'never' },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
})
