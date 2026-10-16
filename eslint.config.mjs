import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'
import prettierConfig from 'eslint-config-prettier'
import astro from 'eslint-plugin-astro'
import jsdoc from 'eslint-plugin-jsdoc'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import unicorn from 'eslint-plugin-unicorn'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

import localPlugin from './eslint-rules/index.mjs'

/**
 * `eslint-plugin-jsdoc`'s TypeScript-flavored recommended rules, with
 * `require-jsdoc` turned off (only non-obvious exports are documented) and
 * `informative-docs` turned on (rejects JSDoc that just restates the
 * declaration's name).
 */
const jsdocRules = {
  ...jsdoc.configs['flat/recommended-typescript-error'].rules,
  'jsdoc/require-jsdoc': 'off',
  'jsdoc/informative-docs': 'error',
}

/**
 * The recommended `eslint-comments` rules, with `require-description` turned
 * on so every `eslint-disable*` comment must say why.
 */
const eslintCommentsRules = {
  ...eslintComments.configs.recommended.rules,
  '@eslint-community/eslint-comments/require-description': 'error',
}

/**
 * Flags an un-awaited `.rejects`/`.resolves` matcher statement. bun-types types
 * them as synchronous, so `no-floating-promises` cannot see the missing
 * `await` and a failing assertion would never be reported.
 */
export const UNAWAITED_ASYNC_MATCHER_SELECTORS = [
  `ExpressionStatement > CallExpression[callee.object.property.name=/^(rejects|resolves)$/]`,
  `ExpressionStatement > CallExpression[callee.object.object.property.name=/^(rejects|resolves)$/]`,
].map((selector) => ({
  selector,
  message:
    "bun-types types `.rejects`/`.resolves` as synchronous matchers, so `@typescript-eslint/no-floating-promises` can't see an un-awaited one and a failing assertion is never reported. Prefix the statement with `await` or return it.",
}))

export default defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  jsxA11y.flatConfigs.recommended,
  unicorn.configs.recommended,
  {
    rules: {
      'unicorn/no-null': 'off',
      'unicorn/name-replacements': [
        'error',
        {
          allowList: {
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
  {
    files: ['**/*.config.{ts,mjs}'],
    rules: { 'unicorn/no-top-level-side-effects': 'off' },
  },
  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
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
    files: ['**/*.astro/*.{ts,js}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { parserOptions: { projectService: false } },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...UNAWAITED_ASYNC_MATCHER_SELECTORS],
    },
  },
  {
    files: ['**/*.{ts,tsx,mjs}'],
    plugins: {
      jsdoc: jsdoc.configs['flat/recommended-typescript-error'].plugins.jsdoc,
      local: localPlugin,
      '@eslint-community/eslint-comments': eslintComments,
    },
    rules: {
      ...jsdocRules,
      ...eslintCommentsRules,
      'local/no-non-doc-comments': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
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
  {
    files: ['.github/ISSUE_TEMPLATE/**'],
    rules: { 'unicorn/filename-case': 'off' },
  },
  prettierConfig,
  globalIgnores([
    '**/.astro/**',
    '**/dist/**',
    '**/coverage/**',
    '.claude/**',
    '.agents/**',
    '.forge/**',
  ]),
])
