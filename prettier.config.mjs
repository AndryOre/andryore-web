/**
 * This repository's Prettier configuration: single quotes, no semicolons,
 * always-wrapped prose, plus import sorting via plugin.
 */
const config = {
  trailingComma: 'all',
  semi: false,
  tabWidth: 2,
  singleQuote: true,
  printWidth: 80,
  proseWrap: 'always',
  endOfLine: 'lf',
  arrowParens: 'always',
  plugins: [
    'prettier-plugin-astro',
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  tailwindStylesheet: './src/styles/global.css',
  tailwindFunctions: ['cn', 'cva', 'clsx'],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
  importOrder: [
    '^astro(:.*)?$',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/(.*)$',
    '',
    '^[./]',
  ],
}

export default config
