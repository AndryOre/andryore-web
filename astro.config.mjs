import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import interactionIntegration from './src/scripts/interaction-integration'
import { THEME_INIT_SCRIPT_HASH } from './src/scripts/theme-init'

export default defineConfig({
  site: 'https://andryore.dev',
  trailingSlash: 'always',
  prefetch: false,
  integrations: [react(), interactionIntegration()],
  security: {
    csp: { scriptDirective: { hashes: [THEME_INIT_SCRIPT_HASH] } },
  },
  build: { inlineStylesheets: 'never' },
  vite: { plugins: [tailwindcss()] },
})
