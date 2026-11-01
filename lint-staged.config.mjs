const config = {
  '*.{ts,tsx,mjs,astro}': [
    'eslint --fix --max-warnings=0 --no-warn-ignored --cache --cache-strategy content',
    'oxfmt --no-error-on-unmatched-pattern',
  ],
  '*.{js,jsx,astro,json,json5,md,mdx,css,scss,yml,yaml}': [
    'oxfmt --no-error-on-unmatched-pattern',
  ],
}

export default config
