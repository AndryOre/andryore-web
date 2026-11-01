import { describe, expect, test } from 'bun:test'
import path from 'node:path'
import { ESLint } from 'eslint'

import oxlintConfig from '../oxlint.config'
import {
  ESLINT_PATH_BLOCKS,
  NATIVE_PORTS,
  OXLINT_BASE_RULES,
  OXLINT_IGNORE_PATTERNS,
  OXLINT_JS_PLUGINS,
  OXLINT_OVERRIDES,
  toOxlintRuleId,
} from './oxlint-rules.mjs'

const REPO_ROOT = path.resolve(import.meta.dirname, '..')

const REPRESENTATIVE_FILES = [
  'src/lib/about.ts',
  'src/lib/about.test.ts',
  'src/components/Dock.tsx',
  'src/components/ui/button.tsx',
  'eslint-rules/index.mjs',
  'astro.config.mjs',
]

const SEVERITY: Record<string, number> = { off: 0, warn: 1, error: 2 }

function normalizeValue(value: unknown): unknown[] {
  const parts: unknown[] = Array.isArray(value) ? (value as unknown[]) : [value]
  const [severity, ...options] = parts
  return [
    typeof severity === 'string' ? SEVERITY[severity] : severity,
    ...options,
  ]
}

function isEnabled(value: unknown): boolean {
  return normalizeValue(value)[0] !== 0
}

function matchesAny(file: string, globs: readonly string[]): boolean {
  return globs.some((glob) => new Bun.Glob(glob).match(file))
}

/**
 * The rules Oxlint enables for a file: the base rules, then every matching
 * override in order, a later value replacing an earlier one.
 * @param file A repo-relative path.
 * @returns The enabled rules with numeric severities.
 */
function resolveOxlintRules(file: string): Map<string, unknown[]> {
  const resolved: Record<string, unknown> = { ...OXLINT_BASE_RULES }
  for (const override of OXLINT_OVERRIDES) {
    if (matchesAny(file, override.files))
      Object.assign(resolved, override.rules)
  }
  return new Map(
    Object.entries(resolved)
      .filter(([, value]) => isEnabled(value))
      .map(([ruleId, value]) => [ruleId, normalizeValue(value)]),
  )
}

async function resolveEslintRules(
  file: string,
): Promise<Map<string, unknown[]>> {
  const eslint = new ESLint({ cwd: REPO_ROOT })
  const config = (await eslint.calculateConfigForFile(file)) as {
    rules: Record<string, unknown>
  }
  return new Map(
    Object.entries(config.rules)
      .filter(([, value]) => isEnabled(value))
      .map(([ruleId, value]) => [ruleId, normalizeValue(value)]),
  )
}

describe('Oxlint enforces exactly the rules ESLint applies to each representative file', () => {
  for (const file of REPRESENTATIVE_FILES) {
    test(file, async () => {
      const eslintRules = await resolveEslintRules(file)
      const oxlintRules = resolveOxlintRules(file)
      const expectedSeverities = Object.fromEntries(
        [...eslintRules].map(([ruleId, value]) => [
          toOxlintRuleId(ruleId),
          value[0],
        ]),
      )
      const severities = Object.fromEntries(
        [...oxlintRules].map(([ruleId, value]) => [ruleId, value[0]]),
      )
      expect(severities).toEqual(expectedSeverities)
      for (const [ruleId, eslintValue] of eslintRules) {
        const options = oxlintRules.get(toOxlintRuleId(ruleId))?.slice(1) ?? []
        for (const [index, option] of options.entries()) {
          const effective = eslintValue[index + 1]
          if (typeof option === 'object' && option !== null) {
            expect(effective).toMatchObject(option)
          } else {
            expect(effective).toEqual(option)
          }
        }
      }
    })
  }
})

describe('toOxlintRuleId', () => {
  test('sends type-aware typescript-eslint rules to tsgolint', () => {
    expect(toOxlintRuleId('@typescript-eslint/no-floating-promises')).toBe(
      'typescript/no-floating-promises',
    )
  })

  test('uses a proven native port', () => {
    expect(toOxlintRuleId('@typescript-eslint/consistent-type-imports')).toBe(
      'typescript/consistent-type-imports',
    )
    expect(toOxlintRuleId('prefer-const')).toBe('prefer-const')
  })

  test('runs a rule without a proven native port on its original engine', () => {
    expect(toOxlintRuleId('unicorn/prefer-ternary')).toBe(
      'unicorn-js/prefer-ternary',
    )
    expect(toOxlintRuleId('no-restricted-syntax')).toBe(
      'eslint-js/no-restricted-syntax',
    )
    expect(toOxlintRuleId('@typescript-eslint/no-unused-vars')).toBe(
      'typescript-js/no-unused-vars',
    )
  })

  test('sends the misreporting eslint-comments rules to the local ports', () => {
    expect(
      toOxlintRuleId('@eslint-community/eslint-comments/require-description'),
    ).toBe('local/require-description')
    expect(
      toOxlintRuleId('@eslint-community/eslint-comments/no-duplicate-disable'),
    ).toBe('eslint-comments-js/no-duplicate-disable')
  })

  test('rejects a rule from an unmapped plugin', () => {
    expect(() => toOxlintRuleId('react/jsx-key')).toThrow(
      'No Oxlint engine is mapped',
    )
  })
})

describe('the Oxlint config', () => {
  test('reports unused disable directives as errors', () => {
    expect(oxlintConfig.options.reportUnusedDisableDirectives).toBe('error')
  })

  test('loads every JS plugin a rule id names', () => {
    const loaded = new Set(
      OXLINT_JS_PLUGINS.map((plugin) =>
        typeof plugin === 'string' ? plugin : plugin.name,
      ),
    )
    const native = new Set(['typescript', 'unicorn', 'jsx-a11y'])
    const ruleIds = [OXLINT_BASE_RULES, ...OXLINT_OVERRIDES.map((o) => o.rules)]
      .flatMap((rules) => Object.keys(rules ?? {}))
      .filter((ruleId) => ruleId.includes('/'))
    for (const ruleId of ruleIds) {
      const plugin = ruleId.slice(0, ruleId.lastIndexOf('/'))
      expect(loaded.has(plugin) || native.has(plugin)).toBe(true)
    }
  })

  test('maps every native port to a native plugin the config enables', () => {
    const enabled = new Set<string>(oxlintConfig.plugins)
    for (const nativeId of NATIVE_PORTS.values()) {
      const plugin = nativeId.includes('/')
        ? nativeId.slice(0, nativeId.lastIndexOf('/'))
        : 'eslint'
      expect(enabled.has(plugin)).toBe(true)
    }
  })

  test('ports the single-source policy blocks', () => {
    const testBlock = ESLINT_PATH_BLOCKS.find((block) =>
      block.files.includes('**/*.test.ts'),
    )
    expect(testBlock?.rules['no-restricted-syntax']).toBeArray()
    const uiBlock = OXLINT_OVERRIDES.find((override) =>
      override.files.includes('src/components/ui/**'),
    )
    expect(uiBlock?.rules).toEqual({ 'shadcn/no-restyle': 'off' })
  })

  test('leaves .astro files to ESLint and keeps its global ignores', () => {
    expect(OXLINT_IGNORE_PATTERNS).toContain('**/*.astro')
    expect(OXLINT_IGNORE_PATTERNS).toContain('parity/fixtures/**')
    expect(OXLINT_IGNORE_PATTERNS).toContain('.forge/**')
  })
})
