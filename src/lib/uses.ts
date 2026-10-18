import type { GlyphName } from './glyphs'
import { ICONS, type IconId } from './icons'

/** One Tools or Tech badge. */
export interface UsesBadge {
  name: string
  icon: IconId
  url?: string
}

/** A decorative icon of the floating field and where it sits. */
export interface FieldIcon {
  id: IconId
  placement: string
}

/**
 * The brand icons floating over the Uses title. The positions are literal
 * classes because the CSP forbids inline styles.
 */
export const FIELD_ICONS: readonly FieldIcon[] = [
  { id: 'typescript', placement: 'top-[8%] left-[6%]' },
  { id: 'bun', placement: 'top-[14%] left-[30%]' },
  { id: 'astro', placement: 'top-[6%] left-[56%]' },
  { id: 'react', placement: 'top-[18%] right-[8%]' },
  { id: 'docker', placement: 'top-[44%] left-[12%]' },
  { id: 'claude', placement: 'top-[48%] left-[44%]' },
  { id: 'tailwindcss', placement: 'top-[42%] right-[22%]' },
  { id: 'git', placement: 'bottom-[10%] left-[24%]' },
  { id: 'playwright', placement: 'bottom-[8%] left-[62%]' },
  { id: 'prisma', placement: 'bottom-[14%] right-[6%]' },
]

/** The Lucide glyphs of the Setup rows, in row order. */
export const SETUP_GLYPHS: readonly GlyphName[] = [
  'laptop',
  'mic',
  'camera',
  'mouse',
  'keyboard',
  'usb',
  'headphones',
]

/** A real colour token shown as a swatch of the This site Color tile. */
export interface SwatchToken {
  token: string
  bg: string
}

/** The six tokens of the Color tile; the classes follow the active theme. */
export const SWATCH_TOKENS: readonly SwatchToken[] = [
  { token: 'background', bg: 'bg-background' },
  { token: 'foreground', bg: 'bg-foreground' },
  { token: 'primary', bg: 'bg-primary' },
  { token: 'muted', bg: 'bg-muted' },
  { token: 'border', bg: 'bg-border' },
  { token: 'destructive', bg: 'bg-destructive' },
]

interface BadgeColor {
  hex: string
  bg: string
}

/**
 * Brand colour of each badge. The class is a literal because the CSP forbids
 * inline styles and Tailwind only emits classes it can read.
 */
export const BADGE_COLORS: Readonly<Partial<Record<IconId, BadgeColor>>> = {
  claude: { hex: '#d97757', bg: 'bg-[#d97757]' },
  orca: { hex: '#171717', bg: 'bg-[#171717]' },
  nushell: { hex: '#4e9a06', bg: 'bg-[#4e9a06]' },
  git: { hex: '#f05032', bg: 'bg-[#f05032]' },
  'github-actions': { hex: '#2088ff', bg: 'bg-[#2088ff]' },
  linear: { hex: '#5e6ad2', bg: 'bg-[#5e6ad2]' },
  docker: { hex: '#2496ed', bg: 'bg-[#2496ed]' },
  coolify: { hex: '#6b16ed', bg: 'bg-[#6b16ed]' },
  tailscale: { hex: '#242424', bg: 'bg-[#242424]' },
  cloudflare: { hex: '#f38020', bg: 'bg-[#f38020]' },
  chezmoi: { hex: '#4d4b4a', bg: 'bg-[#4d4b4a]' },
  bitwarden: { hex: '#175ddc', bg: 'bg-[#175ddc]' },
  mise: { hex: '#8b2252', bg: 'bg-[#8b2252]' },
  typescript: { hex: '#3178c6', bg: 'bg-[#3178c6]' },
  bun: { hex: '#fbf0df', bg: 'bg-[#fbf0df]' },
  astro: { hex: '#bc52ee', bg: 'bg-[#bc52ee]' },
  react: { hex: '#61dafb', bg: 'bg-[#61dafb]' },
  nextjs: { hex: '#000000', bg: 'bg-[#000000]' },
  hono: { hex: '#e36002', bg: 'bg-[#e36002]' },
  tailwindcss: { hex: '#06b6d4', bg: 'bg-[#06b6d4]' },
  'shadcn-ui': { hex: '#000000', bg: 'bg-[#000000]' },
  'base-ui': { hex: '#18181b', bg: 'bg-[#18181b]' },
  prisma: { hex: '#2d3748', bg: 'bg-[#2d3748]' },
  supabase: { hex: '#3fcf8e', bg: 'bg-[#3fcf8e]' },
  zod: { hex: '#3068b7', bg: 'bg-[#3068b7]' },
  tanstack: { hex: '#ece8d1', bg: 'bg-[#ece8d1]' },
  'better-auth': { hex: '#ffffff', bg: 'bg-[#ffffff]' },
  'trigger-dev': { hex: '#4ade80', bg: 'bg-[#4ade80]' },
  resend: { hex: '#000000', bg: 'bg-[#000000]' },
  posthog: { hex: '#f54e00', bg: 'bg-[#f54e00]' },
  dotenv: { hex: '#ecd53f', bg: 'bg-[#ecd53f]' },
  wxt: { hex: '#67d55e', bg: 'bg-[#67d55e]' },
  remotion: { hex: '#0b84f3', bg: 'bg-[#0b84f3]' },
  turborepo: { hex: '#ff1e56', bg: 'bg-[#ff1e56]' },
  playwright: { hex: '#2ead33', bg: 'bg-[#2ead33]' },
  eslint: { hex: '#4b32c3', bg: 'bg-[#4b32c3]' },
  prettier: { hex: '#f7b93e', bg: 'bg-[#f7b93e]' },
  knip: { hex: '#f56e0f', bg: 'bg-[#f56e0f]' },
}

const WHITE = '#ffffff'
const INK = '#0a0a0a'
const MINIMUM_CONTRAST = 4.5

function channel(value: number): number {
  const scaled = value / 255
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16)
  const red = channel((value >> 16) & 255)
  const green = channel((value >> 8) & 255)
  const blue = channel(value & 255)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/**
 * WCAG contrast ratio of two colours.
 * @param first A `#rrggbb` colour.
 * @param second A `#rrggbb` colour.
 * @returns The ratio, from 1 to 21.
 */
export function contrastRatio(first: string, second: string): number {
  const firstLuminance = luminance(first)
  const secondLuminance = luminance(second)
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

/** The classes and measured contrast of one badge. */
export interface BadgeStyle {
  hex: string
  bg: string
  text: string
  logo: string
  ratio: number
}

/**
 * Picks the badge text and logo tone: white unless the brand colour is too
 * light for 4.5:1, then dark.
 * @param id An icon id that has a badge colour.
 * @returns Literal Tailwind classes for the background, text and logo.
 */
export function badgeStyle(id: IconId): BadgeStyle {
  const color = BADGE_COLORS[id]
  if (color === undefined) throw new Error(`No badge colour for icon "${id}"`)
  const white = contrastRatio(color.hex, WHITE)
  const ink = contrastRatio(color.hex, INK)
  if (white >= MINIMUM_CONTRAST || white >= ink) {
    return {
      ...color,
      text: 'text-white',
      logo: 'brightness-0 invert',
      ratio: white,
    }
  }
  return {
    ...color,
    text: 'text-neutral-950',
    logo: 'brightness-0',
    ratio: ink,
  }
}

/**
 * Narrows a content string to an icon id.
 * @param id The `icon` field of a content row.
 * @returns The same id, typed.
 */
export function badgeIconId(id: string): IconId {
  if (!Object.hasOwn(ICONS, id)) throw new Error(`Unknown icon id "${id}"`)
  return id as IconId
}

const FLOAT_CLASSES = ['uses-float-6', 'uses-float-7', 'uses-float-8'] as const

/**
 * Float animation of the icon at `index`. The three floats last 6, 7 and 8
 * seconds so neighbouring icons never move in step.
 * @param index Position of the icon in the field.
 * @returns A literal `uses-float-N` class the stylesheet defines.
 */
export function floatClass(index: number): (typeof FLOAT_CLASSES)[number] {
  const step = Math.max(0, Math.floor(index))
  return FLOAT_CLASSES[step % FLOAT_CLASSES.length] ?? 'uses-float-6'
}
