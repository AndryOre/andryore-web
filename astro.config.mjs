import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import parityIntegration from './src/i18n/parity-integration'
import interactionIntegration from './src/scripts/interaction-integration'

export default defineConfig({
  site: 'https://andryore.dev',
  trailingSlash: 'always',
  prefetch: false,
  integrations: [react(), interactionIntegration(), parityIntegration()],
  build: { inlineStylesheets: 'never' },
  vite: { plugins: [tailwindcss()] },
})
