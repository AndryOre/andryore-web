const config = {
  '*.{ts,tsx,mjs}': [
    'eslint --fix --max-warnings=0 --cache --cache-strategy content',
    'bunx --bun prettier --write --cache',
  ],
  '*.{js,jsx,astro,json,json5,md,mdx,css,scss,yml,yaml}': [
    'bunx --bun prettier --write --cache',
  ],
}

export default config
