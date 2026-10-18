import { createHash } from 'node:crypto'

/**
 * The plain-JavaScript script inlined in `<head>` before first paint. It
 * mirrors `src/lib/theme.ts` (a parity test keeps them aligned), applies the
 * stored choice, and keeps Auto live by re-applying on a system change or a
 * change from another tab.
 */
export const THEME_INIT_SCRIPT = `(function(){var key='theme',root=document.documentElement,query=matchMedia('(prefers-color-scheme: dark)');function read(){try{var value=localStorage.getItem(key);return value==='light'||value==='dark'?value:'auto'}catch(error){return'auto'}}function apply(){var preference=read(),theme=preference==='auto'?(query.matches?'dark':'light'):preference,metas=document.querySelectorAll('meta[name="theme-color"][data-theme-color]');root.classList.toggle('dark',theme==='dark');for(var index=0;index<metas.length;index++){metas[index].media=metas[index].dataset.themeColor===theme?'all':'not all'}}apply();query.addEventListener('change',apply);addEventListener('storage',apply)})()`

/**
 * The CSP source expression for an inline script (ADR 0010, ADR 0012).
 * @param source The exact script text that is inlined.
 * @returns The `sha256-…` value as it appears in `script-src`, without quotes.
 */
export function scriptHash(source: string): string {
  return `sha256-${createHash('sha256').update(source).digest('base64')}`
}

export const THEME_INIT_SCRIPT_HASH = scriptHash(THEME_INIT_SCRIPT)
