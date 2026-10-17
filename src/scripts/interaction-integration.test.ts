import { describe, expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

import interactionIntegration from './interaction-integration'

interface Directive {
  name: string
  entrypoint: string | URL
}

type Setup = (options: {
  addClientDirective: (directive: Directive) => void
}) => void

describe('interactionIntegration', () => {
  test('registers the interaction client directive', () => {
    const registered: Directive[] = []
    const integration = interactionIntegration()
    const setup = integration.hooks['astro:config:setup'] as Setup
    setup({
      addClientDirective: (directive) => {
        registered.push(directive)
      },
    })

    expect(integration.name).toBe('client-interaction-directive')
    expect(registered).toHaveLength(1)
    expect(registered[0]?.name).toBe('interaction')
    expect(fileURLToPath(registered[0]?.entrypoint ?? '')).toEndWith(
      'src/scripts/hydrate-on-interaction.ts',
    )
  })
})
