import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import interactionIntegration from './src/scripts/interaction-integration'

export default defineConfig({
  site: 'https://andryore.dev',
  trailingSlash: 'always',
  prefetch: false,
  integrations: [react(), interactionIntegration()],
  build: { inlineStylesheets: 'never' },
  vite: { plugins: [tailwindcss()] },
})
