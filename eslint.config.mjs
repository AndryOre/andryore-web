import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'
import astro from 'eslint-plugin-astro'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import unicorn from 'eslint-plugin-unicorn'
import { defineConfig, globalIgnores } from 'eslint/config'

import localPlugin from './eslint-rules/index.mjs'

const ASTRO_FILES = ['**/*.astro']

/**
 * The recommended `eslint-comments` rules, with `require-description` turned
 * on so every `eslint-disable*` comment must say why.
 */
const eslintCommentsRules = {
  ...eslintComments.configs.recommended.rules,
  '@eslint-community/eslint-comments/require-description': 'error',
}

/**
 * ESLint lints `.astro` files and nothing else. Every other file is linted by
 * Oxlint (`oxlint.config.ts`), which cannot see the template of an Astro
 * component because JS plugins do not run on it yet.
 *
 * Exit condition: once oxc#23207 lets Oxlint JS plugins see the Astro
 * template, move these rules into `oxlint.config.ts`, delete this file and
 * the `eslint` and `eslint-plugin-astro` dependencies, and make
 * `bun run lint` Oxlint only.
 *
 * The `.astro` rule set is exactly: `astro/recommended`, `jsx-a11y`
 * recommended, `unicorn` recommended with this repo's overrides (including the
 * four formatting rules `eslint-config-prettier` used to switch off),
 * `local/no-non-doc-comments` and the `eslint-comments` rules. No rule here
 * needs type information, so the parser gets no `project`.
 */
export default defineConfig([
  { files: ASTRO_FILES, extends: [jsxA11y.flatConfigs.recommended] },
  { files: ASTRO_FILES, extends: [unicorn.configs.recommended] },
  {
    files: ASTRO_FILES,
    rules: {
      'unicorn/no-null': 'off',
      'unicorn/empty-brace-spaces': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/number-literal-case': ['off', { hexadecimalValue: 'uppercase' }],
      'unicorn/template-indent': 'off',
      'unicorn/name-replacements': [
        'error',
        {
          allowList: {
            env: true,
            utils: true,
            props: true,
            Props: true,
            ref: true,
            Ref: true,
            doc: true,
            docs: true,
          },
        },
      ],
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/single-line-block-comment-style': 'off',
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
      'unicorn/filename-case': [
        'error',
        { cases: { kebabCase: true, pascalCase: true } },
      ],
    },
  },
  ...astro.configs.recommended,
  {
    files: ASTRO_FILES,
    plugins: {
      local: localPlugin,
      '@eslint-community/eslint-comments': eslintComments,
    },
    rules: {
      ...eslintCommentsRules,
      'local/no-non-doc-comments': 'error',
    },
  },
  {
    files: ['src/pages/**/*.astro'],
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          cases: { kebabCase: true, pascalCase: true },
          ignore: [
            String.raw`^\[\.{3}[a-z][a-zA-Z0-9]*\]\.astro$`,
            String.raw`^\[[a-z][a-zA-Z0-9]*\]\.astro$`,
            String.raw`^\([a-z][a-z0-9-]*\)$`,
          ],
        },
      ],
    },
  },
  globalIgnores([
    '**/.astro/**',
    '**/dist/**',
    '**/coverage/**',
    '.claude/**',
    '.agents/**',
    '.forge/**',
  ]),
])
